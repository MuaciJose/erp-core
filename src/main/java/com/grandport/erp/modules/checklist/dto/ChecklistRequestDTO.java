package com.grandport.erp.modules.checklist.dto;

import java.util.List;

public record ChecklistRequestDTO(
        Long veiculoId,
        Long clienteId,
        Integer kmAtual,
        String nivelCombustivel,
        String itensAvariados,
        String observacoesGerais,
        List<String> fotos, // Lista de links/base64 das fotos, se houver
        String urlAssinaturaCliente
) {}