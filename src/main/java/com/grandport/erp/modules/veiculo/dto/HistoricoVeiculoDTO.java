package com.grandport.erp.modules.veiculo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoVeiculoDTO {
    private Long idVenda;
    private LocalDateTime data;
    private Integer kmRegistrado;
    private String clienteComprador;
    private List<ItemHistoricoDTO> itens;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemHistoricoDTO {
        private String descricao;
        private BigDecimal valor;
    }
}
