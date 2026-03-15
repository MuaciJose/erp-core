package com.grandport.erp.modules.compras.dto;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportacaoResumoDTO {
    private Long id;
    private String numero;
    private String fornecedorNome;
    private String status;
    private LocalDateTime dataEmissao;
    private BigDecimal valorTotalNota;

    private FornecedorResumoDTO fornecedor;
    private int quantidadeProdutosCadastrados;

    // 🚀 BLINDAGEM: Usando DTO em vez de Entidade para evitar Loop Infinito no JSON
    private List<ParcelaGeradaDTO> parcelasGeradas;
    private List<ProdutoImportadoDTO> produtosImportados;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FornecedorResumoDTO {
        private String nome;
        private String documento;
        private boolean novo;

        // Construtor que resolve o erro de compilação
        public FornecedorResumoDTO(Parceiro p, boolean isNew) {
            this.nome = p.getNome();
            this.documento = p.getDocumento();
            this.novo = isNew;
        }
    }

    // 🚀 NOVO: Classe para enviar os boletos de forma segura para o React
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParcelaGeradaDTO {
        private String numero;
        private LocalDate vencimento;
        private BigDecimal valor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProdutoImportadoDTO {
        private Long id;
        private String nome;
        private BigDecimal precoCusto;
        private BigDecimal precoVenda;

        // 🚀 NOVOS CAMPOS: Para o Espelho da Nota no React ficar completo
        private String sku;
        private BigDecimal quantidade;
        private Integer estoqueAtual;
        // Construtor antigo mantido para não quebrar o  Service
        public ProdutoImportadoDTO(Long id, String nome, BigDecimal precoCusto, BigDecimal precoVenda) {
            this.id = id;
            this.nome = nome;
            this.precoCusto = precoCusto;
            this.precoVenda = precoVenda;
        }
    }
}