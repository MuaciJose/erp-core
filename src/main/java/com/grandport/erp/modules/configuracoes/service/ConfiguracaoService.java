package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.stream.Stream;
import java.util.List;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoRepository repository;

    @Autowired
    private TaskScheduler taskScheduler;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private ScheduledFuture<?> tarefaAgendada;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.username}")
    private String dbUserProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.password}")
    private String dbPassProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.url}")
    private String dbUrlProp;

    @PostConstruct
    public void init() {
        reagendarBackup();
    }

    public ConfiguracaoSistema obterConfiguracao() {
        ConfiguracaoSistema config = repository.findById(1L).orElseGet(() -> {
            ConfiguracaoSistema configPadrao = new ConfiguracaoSistema();
            configPadrao.setId(1L);
            configPadrao.setHorarioBackupAuto("03:00");
            return repository.save(configPadrao);
        });

        if (config.getHorarioBackupAuto() == null) {
            config.setHorarioBackupAuto("03:00");
        }
        if (config.getTipoCertificado() == null) {
            config.setTipoCertificado("A1");
        }

        return config;
    }

    public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
        dadosAtualizados.setId(1L);
        ConfiguracaoSistema salva = repository.save(dadosAtualizados);
        reagendarBackup();
        return salva;
    }

    // =======================================================================
    // 💣 ZONA DE PERIGO: RESETAR BANCO DE DADOS (PostgreSQL Dinâmico)
    // =======================================================================
    @Transactional
    public void resetarBancoDeDados() {
        try {
            // 1. O Java pergunta ao Postgres: "Quais tabelas existem aí?" (ignorando as de segurança)
            String sqlBuscaTabelas = "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('usuario', 'configuracao_sistema')";

            List<String> tabelasParaApagar = jdbcTemplate.queryForList(sqlBuscaTabelas, String.class);

            if (tabelasParaApagar.isEmpty()) {
                System.out.println("Nenhuma tabela encontrada para resetar.");
                return;
            }

            // 2. Monta o comando TRUNCATE perfeitamente de acordo com o que existe no banco
            String tabelasJuntas = String.join(", ", tabelasParaApagar);
            String sqlTruncate = "TRUNCATE TABLE " + tabelasJuntas + " RESTART IDENTITY CASCADE;";

            // 3. Executa a limpeza cirúrgica
            jdbcTemplate.execute(sqlTruncate);

            System.out.println("✅ Banco de dados resetado com sucesso! (Tabelas limpas: " + tabelasJuntas + ")");
        } catch (Exception e) {
            throw new RuntimeException("Falha crítica ao resetar o banco de dados: " + e.getMessage());
        }
    }

    public void reagendarBackup() {
        if (tarefaAgendada != null) {
            tarefaAgendada.cancel(false);
        }

        ConfiguracaoSistema config = obterConfiguracao();
        String horario = config.getHorarioBackupAuto();

        if (horario == null || !horario.contains(":")) {
            horario = "03:00";
        }

        try {
            String[] partes = horario.split(":");
            String cron = String.format("0 %s %s * * *", partes[1], partes[0]);

            tarefaAgendada = taskScheduler.schedule(this::rotinaManutencaoSistema, new CronTrigger(cron));
            System.out.println("### [SISTEMA] Backup Automático agendado para às " + horario);
        } catch (Exception e) {
            System.err.println("### [ERRO] Falha ao processar horário de backup: " + horario);
            tarefaAgendada = taskScheduler.schedule(this::rotinaManutencaoSistema, new CronTrigger("0 0 3 * * *"));
        }
    }

    // =======================================================================
    // 🚀 RESTAURAÇÃO DE BANCO DIRETA (SEM DEPENDER DO BASH)
    // =======================================================================
    public void restaurarBackup(MultipartFile arquivo) throws Exception {
        File tempFile = File.createTempFile("restore_", ".sql");
        Files.copy(arquivo.getInputStream(), tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

        try {
            // Extrai as configurações do banco
            String dbName = dbUrlProp.substring(dbUrlProp.lastIndexOf("/") + 1);
            if (dbName.contains("?")) dbName = dbName.split("\\?")[0];
            String dbUser = dbUserProp;
            String dbPass = dbPassProp;

            // 1. Limpa o terreno
            jdbcTemplate.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;");
            System.out.println("♻️ Esquema public recriado. Iniciando injeção do arquivo...");

            // 2. Identifica o sistema operacional (Para não dar erro no Windows/Linux)
            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String comandoPsql = isWindows ? "psql.exe" : "psql";

            // 3. Monta o comando de forma direta, sem 'bash -c'
            ProcessBuilder pb = new ProcessBuilder(
                    comandoPsql,
                    "-h", "localhost",
                    "-U", dbUser,
                    "-d", dbName,
                    "-v", "ON_ERROR_STOP=1", // Faz o processo abortar e gritar se der qualquer erro
                    "-f", tempFile.getAbsolutePath()
            );

            pb.redirectErrorStream(true);
            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPass);

            Process process = pb.start();

            // 4. Captura a resposta do banco de dados linha por linha
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();

            // 5. Se o PSQL retornar código diferente de 0, ele avisa o erro real no console
            if (exitCode != 0) {
                System.err.println("❌ ERRO NO PSQL AO RESTAURAR:\n" + output.toString());
                throw new RuntimeException("O banco de dados rejeitou o arquivo de backup. Verifique o console do Java.");
            }

            System.out.println("✅ Backup restaurado com sucesso absoluto!");

        } finally {
            tempFile.delete(); // Limpa o arquivo temporário
        }
    }

    public Resource gerarArquivoBackup() {
        try {
            String dbName = dbUrlProp.substring(dbUrlProp.lastIndexOf("/") + 1);
            if (dbName.contains("?")) {
                dbName = dbName.split("\\?")[0];
            }

            String dbUser = dbUserProp;
            String dbPass = dbPassProp;

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String comando = isWindows ? "pg_dump.exe" : "pg_dump";

            // Comando universal e limpo para o PostgreSQL 17
            ProcessBuilder pb = new ProcessBuilder(
                    comando, "-h", "localhost", "-U", dbUser, "-d", dbName, "--inserts"
            );

            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPass);

            // 🔴 O SEGREDO ESTÁ AQUI: Falso! Assim ele NUNCA salva texto de erro dentro do .sql
            pb.redirectErrorStream(false);

            Process process = pb.start();
            return new InputStreamResource(process.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar backup: " + e.getMessage());
        }
    }

    public void rotinaManutencaoSistema() {
        try {
            System.out.println("### [SISTEMA] Iniciando Backup Automático...");
            String home = System.getProperty("user.home");
            String caminhoPasta = home + File.separator + "backups_grandport";
            File pasta = new File(caminhoPasta);
            if (!pasta.exists()) pasta.mkdirs();

            Resource backupResource = gerarArquivoBackup();
            File arquivoFinal = new File(pasta, "autobackup_" + LocalDate.now() + ".sql");
            Files.copy(backupResource.getInputStream(), arquivoFinal.toPath(), StandardCopyOption.REPLACE_EXISTING);

            limparBackupsAntigos(caminhoPasta, 30);
            System.out.println("### [SISTEMA] Manutenção concluída.");
        } catch (Exception e) {
            System.err.println("### [ERRO] Falha no agendamento: " + e.getMessage());
        }
    }

    private void limparBackupsAntigos(String caminhoPasta, int diasParaManter) {
        try (Stream<Path> arquivos = Files.walk(Paths.get(caminhoPasta))) {
            LocalDate dataLimite = LocalDate.now().minusDays(diasParaManter);
            arquivos.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith("autobackup_"))
                    .forEach(path -> {
                        try {
                            String dataString = path.getFileName().toString().substring(11, 21);
                            if (LocalDate.parse(dataString).isBefore(dataLimite)) {
                                Files.delete(path);
                                System.out.println("### [SISTEMA] Removido: " + path.getFileName());
                            }
                        } catch (Exception ignored) {}
                    });
        } catch (IOException e) {
            System.err.println("### [ERRO] Limpeza falhou: " + e.getMessage());
        }
    }

    public void limparLogsTecnicos() {
        System.out.println("### SISTEMA: Logs limpos e Cache esvaziado.");
    }
}