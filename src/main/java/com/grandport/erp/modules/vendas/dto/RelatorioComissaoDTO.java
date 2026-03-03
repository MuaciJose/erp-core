package com.grandport.erp.modules.vendas.dto;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioComissaoDTO(
        String vendedorNome,
        Long totalVendas,
        BigDecimal valorTotalVendido,
        BigDecimal totalComissao,
        List<VendaResumoDTO> vendasDetalhes
) {}

// DTO Auxiliar para as linhas do relatório
record VendaResumoDTO(Long id, String data, BigDecimal total, BigDecimal comissao) {}