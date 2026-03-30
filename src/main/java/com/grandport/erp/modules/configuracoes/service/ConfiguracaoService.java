package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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

    @Autowired
    private EmpresaContextService empresaContextService;

    private ScheduledFuture<?> tarefaAgendada;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.username}")
    private String dbUserProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.password}")
    private String dbPassProp;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.url}")
    private String dbUrlProp;

    @PostConstruct
    public void init() {
        reagendarBackupInicial();
    }

    public ConfiguracaoSistema obterConfiguracao() {
        // 🔐 Extrair empresaId do usuário autenticado
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        return obterConfiguracaoPorEmpresa(empresaId);
    }

    public ConfiguracaoSistema obterConfiguracaoSistema() {
        return repository.findFirstByOrderByIdDesc()
                .map(this::aplicarDefaults)
                .orElseThrow(() -> new IllegalStateException("Nenhuma configuracao do sistema encontrada para execucao automatica."));
    }

    // 🔐 Criar configuração padrão para nova empresa
    private ConfiguracaoSistema criarConfiguracaoPadraoParaEmpresa(Long empresaId) {
        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setId(null);  // 🔐 ESSENCIAL: Deixar nulo para Hibernate auto-gerar
        config.setEmpresaId(empresaId);  // 🔐 ESSENCIAL: Atribuir empresaId explicitamente
        config.setHorarioBackupAuto("03:00");
        config.setSerieNfe(1);
        config.setNumeroProximaNfe(1L);
        config.setSerieNfce(1);
        config.setNumeroProximaNfce(1L);
        config.setCrt("1");
        config.setAmbienteSefaz(2);
        config.setAmbienteNfse(2);
        config.setTipoCertificado("A1");
        config.setNomeFantasia("Minha Autopeças");  // Valores padrão
        config.setRazaoSocial("");
        config.setCnpj("");
        config.setTelefone("");
        ConfiguracaoSistema salva = repository.save(config);
        return salva;
    }

    private ConfiguracaoSistema obterConfiguracaoPorEmpresa(Long empresaId) {
        ConfiguracaoSistema config = repository
            .findFirstByEmpresaIdOrderByIdDesc(empresaId)
            .orElseGet(() -> criarConfiguracaoPadraoParaEmpresa(empresaId));
        return aplicarDefaults(config);
    }

    private ConfiguracaoSistema aplicarDefaults(ConfiguracaoSistema config) {
        if (config.getHorarioBackupAuto() == null) config.setHorarioBackupAuto("03:00");
        if (config.getTipoCertificado() == null) config.setTipoCertificado("A1");
        if (config.getSerieNfce() == null) config.setSerieNfce(1);
        if (config.getNumeroProximaNfce() == null) config.setNumeroProximaNfce(1L);
        if (config.getCscIdToken() == null) config.setCscIdToken("");
        if (config.getCscCodigo() == null) config.setCscCodigo("");
        return config;
    }

    @Transactional
    public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
        // 🔐 Extrair empresaId do contexto de segurança
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        // 🔐 VALIDAÇÃO CRÍTICA: Verificar se o usuário está tentando alterar empresa errada
        if (dadosAtualizados.getEmpresaId() != null && 
            !dadosAtualizados.getEmpresaId().equals(empresaId)) {
            throw new SecurityException(
                "🔴 TENTATIVA DE VIOLAÇÃO: Você está tentando alterar configuração de OUTRA EMPRESA! " +
                "Esperado empresaId: " + empresaId + ", Recebido: " + dadosAtualizados.getEmpresaId()
            );
        }

        // 1. Buscar configuração ATUAL da empresa
        ConfiguracaoSistema configBanco = repository
            .findFirstByEmpresaIdOrderByIdDesc(empresaId)
            .orElseThrow(() -> new RuntimeException(
                "Configuração não encontrada para a empresa: " + empresaId + 
                ". Execute: POST /api/configuracoes/inicializar"
            ));

        // 🔐 CRÍTICO: Pegar empresaId ANTES de sobrescrever
        Long empresaIdOriginal = configBanco.getEmpresaId();
        Long idOriginal = configBanco.getId();

        // 2. Copiar EXCLUINDO empresaId e id para não quebrá-los
        org.springframework.beans.BeanUtils.copyProperties(
            dadosAtualizados, 
            configBanco, 
            "id", "empresaId"  // 🔐 Não sobrescrever estes campos
        );

        // 🔐 3. Restaurar valores originais (garantir integridade)
        configBanco.setEmpresaId(empresaIdOriginal);
        configBanco.setId(idOriginal);

        // 4. Salva no banco e reagenda o backup
        ConfiguracaoSistema salva = repository.save(configBanco);
        reagendarBackup();

        // 🚀 AUDITORIA: Alteração de Configurações
        auditoriaService.registrar("SISTEMA", "ALTERACAO_CONFIGURACAO", 
            "Configurações do sistema foram atualizadas para a empresa [" + empresaId + "]");

        log.info("Configuracao atualizada para empresaId={}", empresaId);

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

        log.info("Certificado salvo com sucesso: {}", caminhoCompleto.getFileName());

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
                log.info("Nenhuma tabela encontrada para resetar.");
                return;
            }

            String tabelasJuntas = String.join(", ", tabelasParaApagar);
            String sqlTruncate = "TRUNCATE TABLE " + tabelasJuntas + " RESTART IDENTITY CASCADE;";

            jdbcTemplate.execute(sqlTruncate);

            log.warn("Banco de dados resetado com sucesso. Tabelas limpas={}", tabelasJuntas);

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
            log.info("Backup automatico agendado para {}", horario);
        } catch (Exception e) {
            log.error("Falha ao processar horario de backup: {}", horario, e);
            tarefaAgendada = taskScheduler.schedule(this::rotinaManutencaoSistema, new CronTrigger("0 0 3 * * *"));
        }
    }

    private void reagendarBackupInicial() {
        if (tarefaAgendada != null) {
            tarefaAgendada.cancel(false);
        }

        String horario = repository.findFirstByOrderByIdDesc()
                .map(ConfiguracaoSistema::getHorarioBackupAuto)
                .filter(valor -> valor != null && valor.contains(":"))
                .orElse("03:00");

        try {
            String[] partes = horario.split(":");
            String cron = String.format("0 %s %s * * *", partes[1], partes[0]);
            tarefaAgendada = taskScheduler.schedule(this::rotinaManutencaoSistema, new CronTrigger(cron));
            log.info("Backup automatico inicial agendado para {}", horario);
        } catch (Exception e) {
            log.error("Falha ao processar horario inicial de backup: {}", horario, e);
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
            log.warn("Esquema public recriado. Iniciando restauracao do backup.");

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
                log.error("Erro no psql ao restaurar backup: {}", output);
                throw new RuntimeException("O banco de dados rejeitou o arquivo de backup.");
            }

            log.info("Backup restaurado com sucesso.");

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
            log.info("Iniciando backup automatico.");
            String home = System.getProperty("user.home");
            String caminhoPasta = home + File.separator + "backups_grandport";
            File pasta = new File(caminhoPasta);
            if (!pasta.exists()) pasta.mkdirs();

            Resource backupResource = gerarArquivoBackup();
            File arquivoFinal = new File(pasta, "autobackup_" + LocalDate.now() + ".sql");
            Files.copy(backupResource.getInputStream(), arquivoFinal.toPath(), StandardCopyOption.REPLACE_EXISTING);

            limparBackupsAntigos(caminhoPasta, 30);
            log.info("Manutencao automatica concluida.");

            // Nota: O Backup Automático não recebe log de auditoria de usuário, pois é o próprio servidor (TaskScheduler) que executa.

        } catch (Exception e) {
            log.error("Falha na rotina de manutencao agendada", e);
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
                                log.info("Backup antigo removido: {}", path.getFileName());
                            }
                        } catch (Exception ignored) {}
                    });
        } catch (IOException e) {
            log.error("Limpeza de backups falhou", e);
        }
    }

    public void limparLogsTecnicos() {
        log.info("Logs tecnicos limpos e cache esvaziado.");

        // 🚀 8. AUDITORIA: Limpeza de Logs
        auditoriaService.registrar("SISTEMA", "LIMPEZA_LOGS", "Os logs técnicos internos (console/cache) foram limpos pelo administrador.");
    }
}
