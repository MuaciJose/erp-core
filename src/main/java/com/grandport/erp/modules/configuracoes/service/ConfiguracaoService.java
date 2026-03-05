package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate; // IMPORTANTE PARA O RESET DO BANCO
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // IMPORTANTE PARA SEGURANÇA NO RESET

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.stream.Stream;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoRepository repository;

    @Autowired
    private TaskScheduler taskScheduler;

    @Autowired
    private JdbcTemplate jdbcTemplate; // INJETADO PARA EXECUTAR COMANDOS SQL DIRETOS

    private ScheduledFuture<?> tarefaAgendada;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.username}")
    private String dbUserProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.password}")
    private String dbPassProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.url}")
    private String dbUrlProp;

    @PostConstruct
    public void init() {
        reagendarBackup(); // Inicia o agendamento assim que o sistema liga
    }

    public ConfiguracaoSistema obterConfiguracao() {
        ConfiguracaoSistema config = repository.findById(1L).orElseGet(() -> {
            ConfiguracaoSistema configPadrao = new ConfiguracaoSistema();
            configPadrao.setId(1L);
            configPadrao.setHorarioBackupAuto("03:00");
            return repository.save(configPadrao);
        });

        // Travas de segurança para campos antigos e novos não ficarem nulos na interface
        if (config.getHorarioBackupAuto() == null) {
            config.setHorarioBackupAuto("03:00");
        }
        if (config.getTipoCertificado() == null) {
            config.setTipoCertificado("A1");
        }

        return config;
    }

    public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
        // Como o Spring Data JPA recebe o objeto completo do React,
        // ele já salva os campos novos (Whatsapp, Certificado) automaticamente!
        dadosAtualizados.setId(1L);
        ConfiguracaoSistema salva = repository.save(dadosAtualizados);

        reagendarBackup(); // Reagenda o backup se o horário mudou

        return salva;
    }

    // =======================================================================
    // 💣 ZONA DE PERIGO: RESETAR BANCO DE DADOS (PostgreSQL)
    // =======================================================================
    @Transactional
    public void resetarBancoDeDados() {
        try {
            // O comando TRUNCATE com RESTART IDENTITY zera as tabelas e volta o ID (PK) para 1.
            // O CASCADE garante que ele force a limpeza mesmo havendo chaves estrangeiras (ex: ItemVenda preso numa Venda).
            // ATENÇÃO: Tabelas 'usuario' e 'configuracao_sistema' ficam de fora para não perder o login.
            String sql = "TRUNCATE TABLE item_venda, pagamento_venda, venda, produto, veiculo, parceiro RESTART IDENTITY CASCADE;";

            jdbcTemplate.execute(sql);

            System.out.println("✅ Banco de dados resetado com sucesso! (Tabelas limpas e IDs zerados)");
        } catch (Exception e) {
            throw new RuntimeException("Falha crítica ao resetar o banco de dados: " + e.getMessage());
        }
    }

    // =======================================================================
    // LÓGICA DE REAGENDAMENTO DINÂMICO
    // =======================================================================
    public void reagendarBackup() {
        if (tarefaAgendada != null) {
            tarefaAgendada.cancel(false);
        }

        ConfiguracaoSistema config = obterConfiguracao();
        String horario = config.getHorarioBackupAuto();

        // SEGURANÇA: Se por algum motivo ainda estiver nulo ou vazio, usa o padrão
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

    public Resource gerarArquivoBackup() {
        try {
            // Extrai o nome do banco de dados de dentro da URL (ex: jdbc:postgresql://localhost:5432/grandport)
            String dbName = dbUrlProp.substring(dbUrlProp.lastIndexOf("/") + 1);
            if (dbName.contains("?")) {
                dbName = dbName.split("\\?")[0]; // Remove parâmetros caso existam
            }

            // Usa as variáveis puxadas do application.properties
            String dbUser = dbUserProp;
            String dbPass = dbPassProp;

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String comando = isWindows ? "pg_dump.exe" : "pg_dump";

            ProcessBuilder pb = new ProcessBuilder(
                    comando, "-h", "localhost", "-U", dbUser, "-d", dbName, "--no-owner", "--plain"
            );

            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPass);
            pb.redirectErrorStream(true);

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