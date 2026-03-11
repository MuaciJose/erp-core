package com.grandport.erp.modules.fiscal.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class NfeAvulsaRequestDTO {

    // --- ABA 1: DADOS GERAIS ---
    private String naturezaOperacao; // Ex: VENDA DE MERCADORIA, DEVOLUÇÃO
    private String informacoesComplementares; // Observações para o Fisco/Cliente

    // --- ABA 2: DESTINATÁRIO ---
    private Long clienteId; // Se já for cadastrado no ERP

    // --- ABA 3: PRODUTOS ---
    private List<ItemNfeDTO> itens;

    // --- ABA 4: TRANSPORTE E VOLUMES ---
    private TransporteDTO transporte;

    // --- ABA 5: FINANCEIRO / COBRANÇA ---
    private FinanceiroNfeDTO financeiro;

    // ==========================================
    // CLASSES INTERNAS (Os sub-blocos da tela)
    // ==========================================

    @Data
    public static class ItemNfeDTO {
        private Long produtoId;
        private BigDecimal quantidade;
        private BigDecimal precoUnitario;
        private BigDecimal desconto;
        // Campos que o usuário pode forçar a mudança na tela:
        private String cfopEspecifico;
    }

    @Data
    public static class TransporteDTO {
        private Integer modalidadeFrete; // 0=Emitente, 1=Destinatário, 9=Sem Frete
        private Long transportadoraId; // Se tiver transportadora cadastrada
        private String placaVeiculo;
        private String ufVeiculo;
        // Volumes
        private Integer quantidadeVolumes;
        private String especie; // Ex: CAIXA, PALLET
        private String marca;
        private String numeracao;
        private BigDecimal pesoBruto;
        private BigDecimal pesoLiquido;
    }

    @Data
    public static class FinanceiroNfeDTO {
        private BigDecimal valorFrete;
        private BigDecimal valorSeguro;
        private BigDecimal valorDescontoGeral;
        private BigDecimal outrasDespesas;
        private List<DuplicataDTO> duplicatas;
    }

    @Data
    public static class DuplicataDTO {
        private String numero; // Ex: 001/03, 002/03
        private String dataVencimento; // Padrão YYYY-MM-DD
        private BigDecimal valor;
    }
}