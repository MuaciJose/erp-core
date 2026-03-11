package com.grandport.erp.modules.fiscal.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class NfeAvulsaRequestDTO {

    // 🚀 NOVOS CAMPOS PARA DEVOLUÇÃO E TIPO DE NOTA
    private Integer tipoOperacao;
    private Integer finalidade;
    private String chaveAcessoReferencia;

    // CAMPOS GERAIS
    private String naturezaOperacao;
    private String dataEmissao;
    private String dataSaida;
    private String vendedorNome;
    private String informacoesComplementares;
    private Long clienteId;

    // BLOCOS DE DADOS
    private List<ItemNfeDTO> itens;
    private TransporteDTO transporte;
    private FinanceiroDTO financeiro;

    // ================= CLASSES INTERNAS =================

    @Data
    public static class ItemNfeDTO {
        private Long produtoId;
        private String produtoNome;
        private BigDecimal quantidade;
        private BigDecimal precoUnitario;
        private String cfopEspecifico;
        private String cst;
        private BigDecimal baseCalculoIcms;
        private BigDecimal aliquotaIcms;
        private BigDecimal valorIpi;
    }

    @Data
    public static class TransporteDTO {
        private Integer modalidadeFrete;
        private Long transportadoraId;
        private String placaVeiculo;
        private String ufVeiculo;
        private Integer quantidadeVolumes;
        private String especie;
        private BigDecimal pesoBruto;
        private BigDecimal pesoLiquido;
    }

    @Data
    public static class FinanceiroDTO {
        private BigDecimal valorFrete;
        private BigDecimal valorSeguro;
        private BigDecimal valorDescontoGeral;
        private BigDecimal outrasDespesas;
        private List<DuplicataDTO> duplicatas;
    }

    @Data
    public static class DuplicataDTO {
        private String numero;
        private String dataVencimento;
        private BigDecimal valor;
    }
}