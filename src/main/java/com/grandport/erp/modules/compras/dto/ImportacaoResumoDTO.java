package com.grandport.erp.modules.compras.dto;

import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.parceiro.model.Parceiro; // 🚀 Import importante!
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportacaoResumoDTO {
    private Long id;
    private String numero;
    private String fornecedorNome;
    private String status;
    private LocalDate dataEmissao;
    private BigDecimal valorTotalNota;

    private FornecedorResumoDTO fornecedor;
    private int quantidadeProdutosCadastrados;
    private List<ContaPagar> parcelasGeradas;
    private List<ProdutoImportadoDTO> produtosImportados;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FornecedorResumoDTO {
        private String nome;
        private String documento;
        private boolean novo;

        // 🚀 CONSTRUTOR QUE RESOLVE O ERRO DE COMPILAÇÃO
        public FornecedorResumoDTO(Parceiro p, boolean isNew) {
            this.nome = p.getNome();
            this.documento = p.getDocumento();
            this.novo = isNew;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProdutoImportadoDTO {
        private Long id;
        private String nome;
        private BigDecimal precoCusto;
        private BigDecimal precoVenda;
    }
}