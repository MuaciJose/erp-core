package com.grandport.erp.modules.os.dto;

import java.math.BigDecimal;
import java.util.List;

public record OsRequestDTO(
        Long clienteId,
        Long veiculoId,

        Long consultorId,
        Integer kmEntrada,
        String defeitoRelatado,
        String diagnosticoTecnico,
        String observacoes,
        BigDecimal desconto,
        List<OsItemPecaDTO> pecas,
        List<OsItemServicoDTO> servicos


) {}