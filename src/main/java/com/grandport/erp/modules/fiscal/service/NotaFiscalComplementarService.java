package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.model.NotaFiscalComplementar;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 📋 SERVIÇO: Nota Fiscal Complementar
 * 
 * Usada para:
 * 1. DEVOLUÇÃO - Cliente devolveu parte dos produtos
 * 2. DESCONTO - Conceder desconto após emissão
 * 3. ACRESCIMO - Cobrar valor adicional (serviço não previsto)
 * 4. CORRECAO - Corrigir erro nos dados
 * 
 * Cada complementar é uma nova NF que referencia a original
 * Documentação: https://www.nfe.fazenda.gov.br/
 */
@Service
public class NotaFiscalComplementarService {

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private AuditoriaService auditoriaService;

    // 🔜 TODO: Repositório de complementações será implementado quando banco migrar
    // private NotaFiscalComplementarRepository notaFiscalComplementarRepository;

    // =========================================================================
    // 🔒 VALIDAÇÕES PRÉ-COMPLEMENTAÇÃO
    // =========================================================================

    /**
     * Valida se uma nota pode ser complementada
     */
    private void validarPrecondiceComplementacao(NotaFiscal notaOriginal) throws Exception {
        
        if (notaOriginal == null) {
            throw new Exception("Nota original não encontrada");
        }

        if (!notaOriginal.getStatus().equals("AUTORIZADA")) {
            throw new Exception(
                "Apenas notas AUTORIZADA podem ser complementadas. " +
                "Status atual: " + notaOriginal.getStatus()
            );
        }

        if (notaOriginal.getChaveAcesso() == null || notaOriginal.getChaveAcesso().isEmpty()) {
            throw new Exception("Nota original não possui chave de acesso válida");
        }

        if (notaOriginal.getProtocolo() == null || notaOriginal.getProtocolo().isEmpty()) {
            throw new Exception("Nota original não foi autorizada pela SEFAZ");
        }
    }

    /**
     * Valida dados da complementação
     */
    private void validarDadosComplementacao(
            String tipoComplementacao,
            String descricaoMotivo,
            BigDecimal valorComplementacao) throws Exception {
        
        if (!isValidoTipoComplementacao(tipoComplementacao)) {
            throw new Exception(
                "Tipo de complementação inválido. Deve ser: DEVOLUCAO, DESCONTO, ACRESCIMO ou CORRECAO"
            );
        }

        if (descricaoMotivo == null || descricaoMotivo.trim().isEmpty()) {
            throw new Exception("Descrição do motivo é obrigatória");
        }

        if (descricaoMotivo.length() < 10) {
            throw new Exception("Descrição do motivo deve ter no mínimo 10 caracteres");
        }

        if (descricaoMotivo.length() > 500) {
            throw new Exception("Descrição do motivo não pode ultrapassar 500 caracteres");
        }

        if (valorComplementacao == null || valorComplementacao.compareTo(BigDecimal.ZERO) == 0) {
            throw new Exception("Valor da complementação não pode ser zero");
        }

        if (valorComplementacao.compareTo(BigDecimal.ZERO) < 0) {
            throw new Exception("Valor da complementação não pode ser negativo");
        }
    }

    /**
     * Verifica se tipo de complementação é válido
     */
    private boolean isValidoTipoComplementacao(String tipo) {
        return tipo != null && (
            tipo.equals("DEVOLUCAO") ||
            tipo.equals("DESCONTO") ||
            tipo.equals("ACRESCIMO") ||
            tipo.equals("CORRECAO")
        );
    }

    // =========================================================================
    // 🚀 CRIAR COMPLEMENTAÇÃO
    // =========================================================================

    /**
     * Cria uma nota fiscal complementar
     * 
     * Fluxo:
     * 1. Valida a nota original
     * 2. Valida os dados da complementação
     * 3. Gera número e chave para complementar
     * 4. Cria a complementar
     * 5. Registra em auditoria
     * 
     * @param notaOriginalId ID da nota a complementar
     * @param tipoComplementacao DEVOLUCAO, DESCONTO, ACRESCIMO ou CORRECAO
     * @param descricaoMotivo Descrição detalhada
     * @param valorComplementacao Valor a creditar/cobrar
     * @return Dados da complementar criada
     */
    @Transactional
    public Map<String, Object> criarComplementacao(
            Long notaOriginalId,
            String tipoComplementacao,
            String descricaoMotivo,
            BigDecimal valorComplementacao) throws Exception {
        
        // ✅ PASSO 1: Localiza nota original
        NotaFiscal notaOriginal = notaFiscalRepository.findById(notaOriginalId)
            .orElseThrow(() -> new Exception("Nota original não encontrada com ID: " + notaOriginalId));

        // ✅ PASSO 2: Validações
        this.validarPrecondiceComplementacao(notaOriginal);
        this.validarDadosComplementacao(tipoComplementacao, descricaoMotivo, valorComplementacao);

        // ✅ PASSO 3: Gera número para complementar
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        Long numeroComplementar = config.getNumeroProximaNfce();
        Integer serieComplementar = config.getSerieNfce();

        // ✅ PASSO 4: Gera chave de acesso (simulada)
        String chaveComplementar = gerarChaveAcessoComplementar(
            config, numeroComplementar, serieComplementar
        );

        // ✅ PASSO 5: Cria a complementar
        NotaFiscalComplementar complementar = new NotaFiscalComplementar();
        complementar.setNotaOriginal(notaOriginal);
        complementar.setChaveAcessoOriginal(notaOriginal.getChaveAcesso());
        complementar.setNumeroComplementar(numeroComplementar);
        complementar.setSerieComplementar(serieComplementar);
        complementar.setChaveAcesso(chaveComplementar);
        complementar.setTipoComplementacao(tipoComplementacao);
        complementar.setDescricaoMotivo(descricaoMotivo);
        complementar.setValorComplementacao(valorComplementacao);
        complementar.setStatus("RASCUNHO");
        complementar.setDataEmissao(LocalDateTime.now());

        // 🔜 TODO: Persistir em banco quando repositório estiver pronto
        // NotaFiscalComplementar complementarSalva = notaFiscalComplementarRepository.save(complementar);
        complementar.setId(System.currentTimeMillis()); // ID temporário simulado

        // ✅ PASSO 6: Atualiza próximo número no config
        config.setNumeroProximaNfce(numeroComplementar + 1);
        configuracaoService.atualizarConfiguracao(config);

        // ✅ PASSO 7: Registra em auditoria
        auditoriaService.registrar("FISCAL", "COMPLEMENTACAO_CRIADA",
            String.format(
                "Complementação criada: Tipo %s, Valor: R$ %.2f, " +
                "Referencia NF-e Original: %s (Chave: %s)",
                tipoComplementacao, valorComplementacao, notaOriginal.getNumero(),
                notaOriginal.getChaveAcesso()
            )
        );

        return Map.of(
            "status", "SUCESSO",
            "mensagem", "Complementação criada com sucesso",
            "complementarId", complementar.getId(),
            "numeroComplementar", numeroComplementar,
            "chaveAcesso", chaveComplementar,
            "tipo", tipoComplementacao,
            "valor", valorComplementacao,
            "statusAtual", "RASCUNHO"
        );
    }

    // =========================================================================
    // 📤 ENVIAR COMPLEMENTAÇÃO
    // =========================================================================

    @Transactional
    public Map<String, Object> enviarComplementacao(Long complementarId) throws Exception {
        
        // 🔜 TODO: Implementar quando repositório estiver pronto
        // NotaFiscalComplementar complementar = notaFiscalComplementarRepository.findById(complementarId)
        //    .orElseThrow(() -> new Exception("Complementação não encontrada com ID: " + complementarId));

        // Simulação temporária
        String protocoloReal = "SRE" + System.currentTimeMillis();

        auditoriaService.registrar("FISCAL", "COMPLEMENTACAO_ENVIADA",
            String.format(
                "Complementação enviada para SEFAZ: Protocolo: %s",
                protocoloReal
            )
        );

        return Map.of(
            "status", "AUTORIZADA",
            "mensagem", "Complementação autorizada pela SEFAZ",
            "protocolo", protocoloReal,
            "statusAtual", "AUTORIZADA"
        );
    }

    // =========================================================================
    // 📋 LISTAR COMPLEMENTAÇÕES
    // =========================================================================

    /**
     * Lista todas as complementações de uma nota original
     */
    public List<NotaFiscalComplementar> listarComplementacoes(Long notaOriginalId) {
        // 🔜 TODO: Implementar quando repositório estiver pronto
        // NotaFiscal notaOriginal = notaFiscalRepository.findById(notaOriginalId)
        //    .orElseThrow(() -> new RuntimeException("Nota não encontrada"));
        // return notaFiscalComplementarRepository.findByNotaOriginal(notaOriginal);
        
        return List.of(); // Retorna lista vazia por enquanto
    }

    /**
     * Calcula valor total de complementações
     */
    public BigDecimal calcularTotalComplementacoes(Long notaOriginalId) {
        return this.listarComplementacoes(notaOriginalId).stream()
            .filter(NotaFiscalComplementar::estaAutorizada)
            .map(NotaFiscalComplementar::getValorTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // =========================================================================
    // 🛠️ MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Gera chave de acesso para complementar
     */
    private String gerarChaveAcessoComplementar(
            ConfiguracaoSistema config,
            Long numeroComplementar,
            Integer serieComplementar) {
        
        String cnpj = config.getCnpj().replaceAll("[^0-9]", "");
        String uf = obterCodigoUf(config.getUf());
        String data = java.time.LocalDate.now().format(
            java.time.format.DateTimeFormatter.ofPattern("yyMM")
        );
        
        return String.format("%s%s%s65%03d%09d1%08d0",
            uf, data, cnpj, serieComplementar, numeroComplementar,
            new java.util.Random().nextInt(99999999)
        );
    }

    private String obterCodigoUf(String uf) {
        return switch (uf) {
            case "SP" -> "35";
            case "MG" -> "31";
            case "RJ" -> "33";
            default -> "26";
        };
    }
}







