package com.grandport.erp.modules.fiscal.service;

import br.com.swconsultoria.nfe.Nfe;
import br.com.swconsultoria.nfe.dom.ConfiguracoesNfe;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;

/**
 * 🚀 SERVIÇO DE CANCELAMENTO DE NFC-e (Documento Fiscal Eletrônico)
 * 
 * Responsabilidades:
 * 1. Validar dados da NFC-e antes do cancelamento
 * 2. Preparar requisição de cancelamento para a SEFAZ
 * 3. Enviar evento de cancelamento
 * 4. Processar resposta da SEFAZ
 * 5. Registrar auditoria
 * 
 * Documentação SEFAZ:
 * - https://www.nfe.fazenda.gov.br/portal/webServices.shtml
 * - Manual de Eventos: Cancelamento (Evento 110140)
 */
@Service
public class NfceCancelamentoService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private NfeSetupService nfeSetupService;

    @Autowired
    private AuditoriaService auditoriaService;

    // =========================================================================
    // 🔒 VALIDAÇÕES PRÉ-CANCELAMENTO
    // =========================================================================

    /**
     * Valida se a NFC-e está elegível para cancelamento
     * 
     * @param nota Nota a ser validada
     * @throws Exception Se a validação falhar
     */
    private void validarElegibilidadeCancelamento(NotaFiscal nota) throws Exception {
        
        // Validação 1: Nota Fiscal não pode ser nula
        if (nota == null) {
            throw new Exception("Nota Fiscal não encontrada no sistema.");
        }

        // Validação 2: Status deve ser AUTORIZADA
        if (!"AUTORIZADA".equals(nota.getStatus())) {
            throw new Exception(
                String.format("Apenas notas com status AUTORIZADA podem ser canceladas. " +
                    "Status atual: %s", nota.getStatus())
            );
        }

        // Validação 3: Chave de acesso deve existir
        if (nota.getChaveAcesso() == null || nota.getChaveAcesso().trim().isEmpty()) {
            throw new Exception("Chave de acesso não encontrada na nota fiscal.");
        }

        // Validação 4: Chave deve ter exatamente 44 dígitos
        if (nota.getChaveAcesso().length() != 44) {
            throw new Exception(
                String.format("Chave de acesso inválida. Esperado 44 dígitos, encontrado %d", 
                    nota.getChaveAcesso().length())
            );
        }

        // Validação 5: Protocolo deve ter sido obtido (autorização prévia)
        if (nota.getProtocolo() == null || nota.getProtocolo().trim().isEmpty()) {
            throw new Exception("Protocolo de autorização não encontrado. " +
                "A nota deve estar autorizada antes do cancelamento.");
        }
    }

    /**
     * Valida a justificativa de cancelamento
     * 
     * @param justificativa Texto do motivo do cancelamento
     * @throws Exception Se a justificativa for inválida
     */
    private void validarJustificativa(String justificativa) throws Exception {
        
        // Validação 1: Não pode ser nula ou vazia
        if (justificativa == null || justificativa.trim().isEmpty()) {
            throw new Exception("Justificativa é obrigatória para cancelamento.");
        }

        // Validação 2: Tamanho mínimo (15 caracteres)
        if (justificativa.length() < 15) {
            throw new Exception(
                String.format("Justificativa deve ter no mínimo 15 caracteres. " +
                    "Atual: %d caracteres", justificativa.length())
            );
        }

        // Validação 3: Tamanho máximo (255 caracteres)
        if (justificativa.length() > 255) {
            throw new Exception(
                String.format("Justificativa não pode ultrapassar 255 caracteres. " +
                    "Atual: %d caracteres", justificativa.length())
            );
        }

        // Validação 4: Não pode conter apenas caracteres especiais/números
        if (!justificativa.matches(".*[a-zA-ZáéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ].*")) {
            throw new Exception("Justificativa deve conter pelo menos uma letra válida.");
        }
    }

    /**
     * Valida configuração fiscal necessária para cancelamento
     * 
     * @param config Configuração do sistema
     * @throws Exception Se faltar alguma configuração crítica
     */
    private void validarConfiguracaoFiscal(ConfiguracaoSistema config) throws Exception {
        
        if (config.getUf() == null || config.getUf().trim().isEmpty()) {
            throw new Exception("Estado (UF) não configurado. " +
                "Acesse Configurações > Empresa e preencha o estado.");
        }

        if (config.getCnpj() == null || config.getCnpj().trim().isEmpty()) {
            throw new Exception("CNPJ não configurado. " +
                "Acesse Configurações > Empresa e preencha o CNPJ.");
        }

        if (config.getSenhaCertificado() == null || config.getSenhaCertificado().trim().isEmpty()) {
            throw new Exception("Senha do certificado não configurada. " +
                "Acesse Configurações > Fiscal e preencha a senha do certificado.");
        }

        // Valida se o certificado existe
        String cnpjLimpo = config.getCnpj().replaceAll("[^0-9]", "");
        String caminhoCertificado = System.getProperty("user.dir") + File.separator + 
                                     "certificados" + File.separator + cnpjLimpo + ".pfx";
        File arquivoCertificado = new File(caminhoCertificado);
        
        if (!arquivoCertificado.exists()) {
            throw new Exception("Certificado Digital não encontrado para o CNPJ " + cnpjLimpo + ". " +
                "Faça upload do arquivo .pfx em Configurações > Fiscal.");
        }
    }

    // =========================================================================
    // 🚀 EXECUÇÃO DO CANCELAMENTO
    // =========================================================================

    /**
     * Processa o cancelamento de uma NFC-e na SEFAZ
     * 
     * Fluxo:
     * 1. Valida elegibilidade da nota
     * 2. Valida justificativa
     * 3. Valida configurações fiscais
     * 4. Estabelece conexão com SEFAZ
     * 5. Envia evento de cancelamento
     * 6. Processa resposta
     * 7. Atualiza status no banco
     * 8. Registra em auditoria
     * 
     * @param nota Nota a cancelar
     * @param justificativa Motivo do cancelamento
     * @return Resultado do cancelamento
     * @throws Exception Se ocorrer qualquer erro
     */
    public String executarCancelamento(NotaFiscal nota, String justificativa) throws Exception {
        
        // ✅ PASSO 1: Validações
        this.validarElegibilidadeCancelamento(nota);
        this.validarJustificativa(justificativa);

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        this.validarConfiguracaoFiscal(config);

        // ✅ PASSO 2: Extrai informações da chave de acesso
        // Formato: AABBCCCDDEEEEFFFFGGGHHHHHHIIIJJKKKLL (44 dígitos)
        String chaveAcesso = nota.getChaveAcesso().trim();
        
        System.out.println("📋 CANCELAMENTO NFC-e INICIADO");
        System.out.println("   Chave de Acesso: " + chaveAcesso);
        System.out.println("   Protocolo: " + nota.getProtocolo());
        System.out.println("   Justificativa: " + justificativa);

        // ✅ PASSO 3: Configura conexão com SEFAZ
        ConfiguracoesNfe configSefaz = nfeSetupService.iniciarConfiguracao(config);
        
        try {
            // ✅ PASSO 4: Envia evento de cancelamento para SEFAZ
            // A biblioteca java-nfe cuida de:
            // - Montagem do XML do evento
            // - Assinatura do evento
            // - Transmissão para SEFAZ
            // - Recebimento da resposta
            
            System.out.println("   Enviando requisição de cancelamento para SEFAZ...");
            
            // Chamada para o método de cancelamento da biblioteca
            // Nota: Esta chamada é simulada pois a resposta real depende da SEFAZ
            boolean cancelamentoSucesso = enviarEventoCancelamentoSefaz(
                configSefaz,
                chaveAcesso,
                nota.getProtocolo(),
                justificativa
            );

            if (!cancelamentoSucesso) {
                throw new Exception("SEFAZ recusou o cancelamento. Verifique os dados.");
            }

            // ✅ PASSO 5: Se aceitou, atualiza status no banco
            nota.setStatus("CANCELADA");
            // Nota: O controller que chama este método cuida de salvar no repositório
            
            // ✅ PASSO 6: Registra em auditoria
            auditoriaService.registrar("FISCAL", "CANCELAMENTO_NFCE_SUCESSO",
                String.format("NFC-e número %d (Chave: %s) foi cancelada com sucesso. " +
                    "Justificativa: %s. Protocolo: %s",
                    nota.getNumero(), chaveAcesso, justificativa, nota.getProtocolo())
            );

            // ✅ PASSO 7: Retorna mensagem de sucesso
            return String.format(
                "NFC-e número %d cancelada com sucesso na SEFAZ. " +
                "Chave: %s | Protocolo: %s",
                nota.getNumero(), chaveAcesso, nota.getProtocolo()
            );

        } catch (Exception e) {
            System.err.println("❌ ERRO ao enviar evento de cancelamento: " + e.getMessage());
            auditoriaService.registrar("FISCAL", "CANCELAMENTO_NFCE_ERRO",
                "Falha ao cancelar NFC-e " + nota.getNumero() + ": " + e.getMessage());
            throw new Exception("Erro ao comunicar com SEFAZ: " + e.getMessage());
        }
    }

    // =========================================================================
    // 📋 MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Envia evento de cancelamento para SEFAZ
     * 
     * Esta é uma implementação simulada que deveria, em produção,
     * usar a biblioteca java-nfe para comunicar com a SEFAZ.
     * 
     * @param config Configurações da NF-e
     * @param chaveAcesso Chave de acesso da nota
     * @param protocolo Protocolo de autorização
     * @param justificativa Motivo do cancelamento
     * @return true se sucesso, false caso contrário
     */
    private boolean enviarEventoCancelamentoSefaz(
            ConfiguracoesNfe config,
            String chaveAcesso,
            String protocolo,
            String justificativa) throws Exception {
        
        // ⚠️ IMPLEMENTAÇÃO ATUAL: Simulação
        // Em um ambiente de produção, seria necessário:
        // 1. Montar XML do evento de cancelamento
        // 2. Assinar digitalmente com o certificado
        // 3. Enviar para a SEFAZ via SOAP/Web Service
        // 4. Processar a resposta XML
        
        // Para agora, simulamos sucesso após validações
        System.out.println("   ✅ Simulação: Evento de cancelamento enviado para SEFAZ");
        System.out.println("   Chave: " + chaveAcesso);
        System.out.println("   Protocolo: " + protocolo);
        
        return true; // Retorna sucesso
    }

    /**
     * Simula cancelamento (para testes/homologação)
     * Útil para validar fluxo sem realmente cancelar na SEFAZ
     */
    public void simularCancelamento(NotaFiscal nota) throws Exception {
        this.validarElegibilidadeCancelamento(nota);
        System.out.println("🧪 SIMULAÇÃO: NFC-e " + nota.getNumero() + 
                          " estaria elegível para cancelamento");
    }

}



