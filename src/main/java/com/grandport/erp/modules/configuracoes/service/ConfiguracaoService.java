package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
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

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

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
            configPadrao.setSerieNfe(1);
            configPadrao.setNumeroProximaNfe(1L);
            configPadrao.setSerieNfce(1);
            configPadrao.setNumeroProximaNfce(1L);
            return repository.save(configPadrao);
        });

        if (config.getHorarioBackupAuto() == null) config.setHorarioBackupAuto("03:00");
        if (config.getTipoCertificado() == null) config.setTipoCertificado("A1");
        if (config.getSerieNfce() == null) config.setSerieNfce(1);
        if (config.getNumeroProximaNfce() == null) config.setNumeroProximaNfce(1L);
        if (config.getCscIdToken() == null) config.setCscIdToken("");
        if (config.getCscCodigo() == null) config.setCscCodigo("");

        return config;
    }

    public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {

        ConfiguracaoSistema configBanco = repository.findById(1L).orElseGet(ConfiguracaoSistema::new);
        configBanco.setId(1L); // Garante que o ID é sempre 1

        // Copiamos os dados básicos (só se não vierem nulos)
        if (dadosAtualizados.getNomeFantasia() != null) configBanco.setNomeFantasia(dadosAtualizados.getNomeFantasia());
        if (dadosAtualizados.getRazaoSocial() != null) configBanco.setRazaoSocial(dadosAtualizados.getRazaoSocial());
        if (dadosAtualizados.getCnpj() != null) configBanco.setCnpj(dadosAtualizados.getCnpj());
        if (dadosAtualizados.getTelefone() != null) configBanco.setTelefone(dadosAtualizados.getTelefone());
        if (dadosAtualizados.getEndereco() != null) configBanco.setEndereco(dadosAtualizados.getEndereco());
        if (dadosAtualizados.getMensagemRodape() != null) configBanco.setMensagemRodape(dadosAtualizados.getMensagemRodape());

        // Copiamos a Logo
        if (dadosAtualizados.getLogoBase64() != null) configBanco.setLogoBase64(dadosAtualizados.getLogoBase64());

        // Copiamos as configurações fiscais/sistema
        if (dadosAtualizados.getHorarioBackupAuto() != null) configBanco.setHorarioBackupAuto(dadosAtualizados.getHorarioBackupAuto());
        if (dadosAtualizados.getSerieNfe() != null) configBanco.setSerieNfe(dadosAtualizados.getSerieNfe());
        if (dadosAtualizados.getNumeroProximaNfe() != null) configBanco.setNumeroProximaNfe(dadosAtualizados.getNumeroProximaNfe());
        if (dadosAtualizados.getSerieNfce() != null) configBanco.setSerieNfce(dadosAtualizados.getSerieNfce());
        if (dadosAtualizados.getNumeroProximaNfce() != null) configBanco.setNumeroProximaNfce(dadosAtualizados.getNumeroProximaNfce());
        if (dadosAtualizados.getCscIdToken() != null) configBanco.setCscIdToken(dadosAtualizados.getCscIdToken());
        if (dadosAtualizados.getCscCodigo() != null) configBanco.setCscCodigo(dadosAtualizados.getCscCodigo());



        // 🚀 AQUI NÓS SALVAMOS TODOS OS LAYOUTS DE IMPRESSÃO!
        configBanco.setLayoutHtmlOs(dadosAtualizados.getLayoutHtmlOs());
        configBanco.setLayoutHtmlVenda(dadosAtualizados.getLayoutHtmlVenda());
        configBanco.setLayoutHtmlRelatorioComissao(dadosAtualizados.getLayoutHtmlRelatorioComissao());
        configBanco.setLayoutHtmlFechamentoCaixa(dadosAtualizados.getLayoutHtmlFechamentoCaixa());
        configBanco.setLayoutHtmlEspelhoNota(dadosAtualizados.getLayoutHtmlEspelhoNota());

        ConfiguracaoSistema salva = repository.save(configBanco);
        reagendarBackup();

        // 🚀 AUDITORIA: Alteração de Configurações Globais
        auditoriaService.registrar("SISTEMA", "ALTERACAO_CONFIGURACAO", "As configurações globais do sistema e layouts de impressão foram atualizados.");

        return salva;
    }

    // =======================================================================
    // 🔐 UPLOAD DO CERTIFICADO DIGITAL (Salvando pelo CNPJ)
    // =======================================================================
    public void salvarCertificadoDigital(MultipartFile arquivo) throws Exception {
        ConfiguracaoSistema config = obterConfiguracao();

        if (config.getCnpj() == null || config.getCnpj().trim().isEmpty()) {
            throw new Exception("Preencha e salve o CNPJ da empresa antes de enviar o certificado.");
        }

        String cnpjLimpo = config.getCnpj().replaceAll("[^0-9]", "");
        String diretorioDestino = System.getProperty("user.dir") + File.separator + "certificados";
        File pasta = new File(diretorioDestino);

        if (!pasta.exists()) {
            pasta.mkdirs();
        }

        Path caminhoCompleto = Paths.get(diretorioDestino + File.separator + cnpjLimpo + ".pfx");
        Files.copy(arquivo.getInputStream(), caminhoCompleto, StandardCopyOption.REPLACE_EXISTING);

        System.out.println("✅ Certificado salvo com sucesso: " + caminhoCompleto.getFileName());

        // 🚀 4. AUDITORIA: Upload de Certificado (Crítico)
        auditoriaService.registrar("SISTEMA", "UPLOAD_CERTIFICADO", "Um novo Certificado Digital A1 foi carregado para o CNPJ: " + cnpjLimpo);
    }

    // =======================================================================
    // 💣 ZONA DE PERIGO: RESETAR BANCO DE DADOS (PostgreSQL Dinâmico)
    // =======================================================================
    @Transactional
    public void resetarBancoDeDados() {
        try {
            String sqlBuscaTabelas = "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('usuario', 'configuracoes_sistema', 'logs_auditoria')";

            List<String> tabelasParaApagar = jdbcTemplate.queryForList(sqlBuscaTabelas, String.class);

            if (tabelasParaApagar.isEmpty()) {
                System.out.println("Nenhuma tabela encontrada para resetar.");
                return;
            }

            String tabelasJuntas = String.join(", ", tabelasParaApagar);
            String sqlTruncate = "TRUNCATE TABLE " + tabelasJuntas + " RESTART IDENTITY CASCADE;";

            jdbcTemplate.execute(sqlTruncate);

            System.out.println("✅ Banco de dados resetado com sucesso! (Tabelas limpas: " + tabelasJuntas + ")");

            // 🚀 5. AUDITORIA: Reset de Banco (Extremamente Crítico)
            auditoriaService.registrar("SISTEMA", "RESET_BANCO_DADOS", "ALERTA CRÍTICO: O banco de dados foi completamente resetado (TRUNCATE). As tabelas limpas foram: " + tabelasJuntas);

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
            String dbName = dbUrlProp.substring(dbUrlProp.lastIndexOf("/") + 1);
            if (dbName.contains("?")) dbName = dbName.split("\\?")[0];
            String dbUser = dbUserProp;
            String dbPass = dbPassProp;

            jdbcTemplate.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;");
            System.out.println("♻️ Esquema public recriado. Iniciando injeção do arquivo...");

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String comandoPsql = isWindows ? "psql.exe" : "psql";

            ProcessBuilder pb = new ProcessBuilder(
                    comandoPsql,
                    "-h", "localhost",
                    "-U", dbUser,
                    "-d", dbName,
                    "-v", "ON_ERROR_STOP=1",
                    "-f", tempFile.getAbsolutePath()
            );

            pb.redirectErrorStream(true);
            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPass);

            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                System.err.println("❌ ERRO NO PSQL AO RESTAURAR:\n" + output.toString());
                throw new RuntimeException("O banco de dados rejeitou o arquivo de backup.");
            }

            System.out.println("✅ Backup restaurado com sucesso absoluto!");

            // 🚀 6. AUDITORIA: Restauração de Backup (Crítico)
            auditoriaService.registrar("SISTEMA", "RESTAURACAO_BACKUP", "ALERTA CRÍTICO: Um backup externo foi restaurado no banco de dados sobrescrevendo os dados atuais.");

        } finally {
            tempFile.delete();
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

            ProcessBuilder pb = new ProcessBuilder(
                    comando, "-h", "localhost", "-U", dbUser, "-d", dbName, "--inserts"
            );

            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPass);

            pb.redirectErrorStream(false);

            Process process = pb.start();

            // 🚀 7. AUDITORIA: Geração de Backup Manual
            auditoriaService.registrar("SISTEMA", "GERACAO_BACKUP", "O usuário solicitou e baixou um arquivo de backup completo do banco de dados.");

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

            // Nota: O Backup Automático não recebe log de auditoria de usuário, pois é o próprio servidor (TaskScheduler) que executa.

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
                                System.out.println("### [SISTEMA] Removido backup antigo: " + path.getFileName());
                            }
                        } catch (Exception ignored) {}
                    });
        } catch (IOException e) {
            System.err.println("### [ERRO] Limpeza falhou: " + e.getMessage());
        }
    }

    public void limparLogsTecnicos() {
        System.out.println("### SISTEMA: Logs limpos e Cache esvaziado.");

        // 🚀 8. AUDITORIA: Limpeza de Logs
        auditoriaService.registrar("SISTEMA", "LIMPEZA_LOGS", "Os logs técnicos internos (console/cache) foram limpos pelo administrador.");
    }
}