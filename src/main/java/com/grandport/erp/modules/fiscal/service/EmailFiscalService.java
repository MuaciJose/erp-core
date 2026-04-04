package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.util.List;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class EmailFiscalService {

    private static final Logger log = LoggerFactory.getLogger(EmailFiscalService.class);

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private DanfeService danfeService;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    // =========================================================================
    // 🚀 O "MOTOR" DO E-MAIL: CRIA A CONEXÃO USANDO OS DADOS DO BANCO
    // =========================================================================
    private JavaMailSenderImpl criarMailSenderDinamico(ConfiguracaoSistema config) throws Exception {
        if (config.getEmailRemetente() == null || config.getSenhaEmailRemetente() == null || config.getEmailRemetente().isEmpty()) {
            throw new Exception("O e-mail ou senha de aplicativo não foram configurados na aba Integrações.");
        }

        JavaMailSenderImpl mailSenderDinamico = new JavaMailSenderImpl();

        // Se o host não estiver preenchido, usa o do Gmail como padrão
        String host = (config.getSmtpHost() != null && !config.getSmtpHost().isEmpty()) ? config.getSmtpHost() : "smtp.gmail.com";
        Integer port = (config.getSmtpPort() != null) ? config.getSmtpPort() : 587;

        mailSenderDinamico.setHost(host);
        mailSenderDinamico.setPort(port);
        mailSenderDinamico.setUsername(config.getEmailRemetente());
        mailSenderDinamico.setPassword(config.getSenhaEmailRemetente());

        Properties props = mailSenderDinamico.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        return mailSenderDinamico;
    }

    // Função Antiga (1 por 1) - Mantida por precaução
    public void enviarXmlContador(NotaFiscal nota, String emailContador) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        JavaMailSenderImpl mailSender = criarMailSenderDinamico(config);

        String caminhoXml = System.getProperty("user.dir") + "/nfe_xmls/" + nota.getChaveAcesso() + ".xml";
        File arquivoXml = new File(caminhoXml);
        if (!arquivoXml.exists()) throw new Exception("XML não encontrado.");

        MimeMessage mensagem = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");

        helper.setFrom(config.getEmailRemetente(), config.getRazaoSocial() != null ? config.getRazaoSocial() : "Sistema ERP");
        helper.setTo(emailContador);
        helper.setSubject("Envio de XML - NF-e " + nota.getNumero());
        helper.setText("<h3>Olá!</h3><p>Segue XML em anexo.</p>", true);
        helper.addAttachment("NFe_" + nota.getChaveAcesso() + ".xml", new FileSystemResource(arquivoXml));

        mailSender.send(mensagem);

        // 🚀 3. AUDITORIA: Registro de envio individual
        auditoriaService.registrar("FISCAL", "ENVIO_EMAIL_NFE", "Enviou o XML da NF-e " + nota.getNumero() + " para o e-mail do contador: " + emailContador);
    }

    // 🚀 FUNÇÃO NOVA: ENVIO EM LOTE (ZIP COM XML + PDF) MENSAL
    public void enviarLoteXmlContador(List<NotaFiscal> notas, String emailContador, String mesAno, String mensagemCustomizada) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        JavaMailSenderImpl mailSender = criarMailSenderDinamico(config);

        File arquivoZip = File.createTempFile("Fechamento_Fiscal_" + mesAno, ".zip");
        int quantidadeArquivos = 0;

        try (FileOutputStream fos = new FileOutputStream(arquivoZip);
             ZipOutputStream zos = new ZipOutputStream(fos)) {

            for (NotaFiscal nota : notas) {
                if (nota.getChaveAcesso() != null) {

                    File xml = new File(System.getProperty("user.dir") + "/nfe_xmls/" + nota.getChaveAcesso() + ".xml");
                    if (xml.exists()) {
                        zos.putNextEntry(new ZipEntry("NFe_" + nota.getChaveAcesso() + ".xml"));
                        Files.copy(xml.toPath(), zos);
                        zos.closeEntry();
                        quantidadeArquivos++;
                    }

                    try {
                        byte[] pdfBytes;
                        if (nota.getVenda() != null) {
                            pdfBytes = danfeService.gerarDanfePdf(nota);
                        } else {
                            pdfBytes = danfeService.gerarDanfeAvulsaPdf(nota);
                        }

                        if (pdfBytes != null && pdfBytes.length > 0) {
                            zos.putNextEntry(new ZipEntry("DANFE_" + nota.getChaveAcesso() + ".pdf"));
                            zos.write(pdfBytes);
                            zos.closeEntry();
                            quantidadeArquivos++;
                        }
                    } catch (Exception e) {
                        log.warn("Não foi possível gerar PDF para a nota {} neste lote", nota.getChaveAcesso(), e);
                    }
                }
            }
        }

        if (quantidadeArquivos == 0) {
            arquivoZip.delete();
            throw new Exception("Nenhum arquivo XML ou PDF foi processado.");
        }

        MimeMessage mensagem = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");

        helper.setFrom(config.getEmailRemetente(), config.getRazaoSocial() != null ? config.getRazaoSocial() : "Sistema ERP");
        helper.setTo(emailContador);
        helper.setSubject("Fechamento Fiscal (XML e PDF) - " + mesAno);

        String textoFormatado = mensagemCustomizada.replace("\n", "<br>");

        String corpo = "<div style='font-family: sans-serif; color: #333;'>"
                + "<h3>Fechamento Mensal</h3>"
                + "<p>" + textoFormatado + "</p>"
                + "<br><p style='font-size: 12px; color: #666;'><i>Enviado automaticamente pelo GrandPort ERP.</i></p>"
                + "</div>";

        helper.setText(corpo, true);
        helper.addAttachment("Fechamento_Fiscal_" + mesAno + ".zip", new FileSystemResource(arquivoZip));

        mailSender.send(mensagem);
        arquivoZip.delete();

        // 🚀 4. AUDITORIA: Registro de envio em lote (O mais importante!)
        auditoriaService.registrar("FISCAL", "ENVIO_LOTE_FISCAL", "Enviou arquivo ZIP de fechamento fiscal (" + mesAno + ") para o contador (" + emailContador + "). Total de arquivos gerados no lote: " + quantidadeArquivos);
    }

    // 🚀 TESTAR CONEXÃO DE E-MAIL
    public void testarConexaoEmail() throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        JavaMailSenderImpl mailSender = criarMailSenderDinamico(config);

        mailSender.testConnection();

        // 🚀 5. AUDITORIA: Registro de teste de SMTP
        auditoriaService.registrar("SISTEMA", "TESTE_SMTP", "Realizou com sucesso um teste de conexão com o servidor de envio de e-mails (SMTP).");
    }
}
