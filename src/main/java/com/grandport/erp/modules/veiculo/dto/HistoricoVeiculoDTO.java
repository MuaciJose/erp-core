package com.grandport.erp.modules.veiculo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder // Adicionado o Builder para facilitar a criação no Service
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoVeiculoDTO {

    // --- CAMPOS COMUNS A QUALQUER EVENTO ---
    private String tipo; // Vai receber "OS" ou "CHECKLIST"
    private LocalDateTime data;
    private Long idReferencia; // Substitui o idVenda, pois pode ser ID da Venda ou ID do Checklist

    // --- OBJETOS ANINHADOS (Apenas um deles será preenchido por vez) ---
    private DadosOsDTO dadosOs;
    private DadosChecklistDTO dadosChecklist;

    // =========================================================
    // CLASSES INTERNAS PARA ORGANIZAR OS DADOS
    // =========================================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DadosOsDTO {
        private String clienteComprador;
        private Integer kmRegistrado;
        private List<ItemHistoricoDTO> itens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DadosChecklistDTO {
        private Integer kmAtual;
        private String nivelCombustivel;
        private String itensAvariados;
        private String observacoes;
        private List<String> fotos;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemHistoricoDTO {
        private String descricao;
        private BigDecimal valor;
    }
}