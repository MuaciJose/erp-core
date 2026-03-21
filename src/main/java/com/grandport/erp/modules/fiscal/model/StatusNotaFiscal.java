package com.grandport.erp.modules.fiscal.model;

/**
 * 📋 ENUM: Status de Uma Nota Fiscal
 * 
 * Representa todos os possíveis estados de uma nota fiscal no ciclo de vida
 */
public enum StatusNotaFiscal {

    // =========================================================================
    // 📊 ESTADOS INICIAIS
    // =========================================================================

    RASCUNHO("RASCUNHO", "Em edição, não foi enviada ainda"),
    CONTINGENCIA("CONTINGENCIA", "Emitida em modo offline (SEFAZ caiu)"),

    // =========================================================================
    // 📡 ESTADOS DE SUBMISSÃO À SEFAZ
    // =========================================================================

    ENVIADA("ENVIADA", "Enviada para SEFAZ, aguardando resposta"),
    PENDENTE_AUTORIZACAO("PENDENTE_AUTORIZACAO", "Aguardando autorização"),

    // =========================================================================
    // ✅ ESTADOS DE SUCESSO
    // =========================================================================

    AUTORIZADA("AUTORIZADA", "Autorizada pela SEFAZ, válida para uso"),
    SINCRONIZADA("SINCRONIZADA", "Sincronizada com ERP (série/número atualizados)"),

    // =========================================================================
    // ❌ ESTADOS DE REJEIÇÃO
    // =========================================================================

    REJEITADA("REJEITADA", "SEFAZ recusou a emissão"),
    CANCELADA("CANCELADA", "Cancelada na SEFAZ"),
    COMPLEMENTADA("COMPLEMENTADA", "Complementada por nota fiscal complementar"),

    // =========================================================================
    // ⚠️ ESTADOS DE ERRO
    // =========================================================================

    ERRO_ENVIO("ERRO_ENVIO", "Erro ao enviar para SEFAZ"),
    ERRO_COMUNICACAO("ERRO_COMUNICACAO", "Erro de comunicação com SEFAZ"),
    TIMEOUT("TIMEOUT", "Timeout na resposta da SEFAZ"),
    INVALIDA("INVALIDA", "Dados inválidos, não pode ser enviada");

    // =========================================================================
    // PROPRIEDADES
    // =========================================================================

    private final String codigo;
    private final String descricao;

    StatusNotaFiscal(String codigo, String descricao) {
        this.codigo = codigo;
        this.descricao = descricao;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Verifica se a nota está em estado "final" (não pode mudar mais)
     */
    public boolean isFinal() {
        return this == AUTORIZADA
            || this == CANCELADA
            || this == REJEITADA
            || this == INVALIDA;
    }

    /**
     * Verifica se a nota pode ser cancelada (apenas AUTORIZADA)
     */
    public boolean podeSerCancelada() {
        return this == AUTORIZADA;
    }

    /**
     * Verifica se a nota está "offline" (contingência)
     */
    public boolean eContingencia() {
        return this == CONTINGENCIA;
    }

    /**
     * Verifica se deve sincronizar com ERP
     */
    public boolean deveSincronizar() {
        return this == AUTORIZADA || this == CONTINGENCIA;
    }
}

