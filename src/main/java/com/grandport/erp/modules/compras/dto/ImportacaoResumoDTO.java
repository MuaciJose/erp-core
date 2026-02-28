package com.grandport.erp.modules.compras.dto;

import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ImportacaoResumoDTO {
    private FornecedorResumoDTO fornecedor;
    private int quantidadeProdutosCadastrados;
    private BigDecimal valorTotalNota;
    private List<ContaPagar> parcelasGeradas;
    private List<ProdutoImportadoDTO> produtosImportados;

    @Data
    @NoArgsConstructor
    public static class FornecedorResumoDTO {
        private String nome;
        private String documento;
        private boolean novo;

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
