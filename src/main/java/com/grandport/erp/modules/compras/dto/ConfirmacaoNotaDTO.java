package com.grandport.erp.modules.compras.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ConfirmacaoNotaDTO {
    private List<ItemConfirmacao> itens;

    @Data
    public static class ItemConfirmacao {
        private Long idImportacao;          // ID original do item no XML (CompraItem)
        private Long produtoId;             // ID do Produto no seu Estoque (Nulo se for criar peça nova)
        private BigDecimal precoVenda;      // Preço final da prateleira

        // 🚀 OS NOVOS CAMPOS PARA A MÁGICA DA CONVERSÃO DE EMBALAGEM E VÍNCULO:
        private Boolean vinculoManual;      // Avisa o Java se você fez o "De-Para" manual na tela
        private String conversaoTipo;       // "DESMEMBRAR", "AGRUPAR" ou "NENHUMA"
        private Integer fatorConversao;     // Ex: 24 (A quantidade que vem dentro da caixa)
        private BigDecimal quantidadeFinal; // Ex: 48 (A quantidade real que vai somar no estoque)
        private BigDecimal custoFinal;      // Ex: 20.00 (O custo unitário de cada garrafa de óleo)
    }
}