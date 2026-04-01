package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.service.RelatorioService;
import com.grandport.erp.modules.vendas.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendas/relatorios")
public class RelatorioVendaController {

    @Autowired
    private RelatorioService relatorioService;

    // INJETADO O REPOSITÓRIO PARA BUSCAR AS VENDAS DA COMISSÃO
    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private EmpresaContextService empresaContextService;

    // SEU ENDPOINT ORIGINAL MANTIDO INTACTO
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> imprimirVenda(@PathVariable Long id) {
        byte[] pdf = relatorioService.gerarPdfVenda(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("inline", "venda_" + id + ".pdf");

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @Autowired
    private WhatsAppService whatsAppService;

    // NOVO ENDPOINT: /api/vendas/{id}/whatsapp
    @PostMapping("/{id}/whatsapp")
    // 👉 ADICIONE ESTA LINHA ABAIXO PARA LIBERAR O ACESSO (Ajuste a ROLE se necessário, ex: hasAnyRole('ADMIN', 'CAIXA'))
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_VENDAS', 'ROLE_CAIXA', 'ROLE_FILA-CAIXA')")
    public ResponseEntity<String> enviarReciboWhatsApp(@PathVariable Long id) {
        try {
            whatsAppService.enviarReciboPdfPorWhatsApp(id);
            return ResponseEntity.ok("Recibo enviado para o WhatsApp do cliente com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =========================================================================
    // NOVO ENDPOINT: RELATÓRIO DE COMISSÕES (/api/vendas/relatorios/comissoes)
    // =========================================================================
    @GetMapping("/comissoes")
    public ResponseEntity<List<Map<String, Object>>> gerarRelatorioComissoes(
            @RequestParam("inicio") String inicioStr,
            @RequestParam("fim") String fimStr,
            @RequestParam(value = "vendedorId", required = false) Long vendedorId) {

        LocalDateTime inicio = LocalDate.parse(inicioStr).atStartOfDay();
        LocalDateTime fim = LocalDate.parse(fimStr).atTime(LocalTime.MAX);

        // Busca e filtra vendas no período e pelo vendedor (se selecionado)
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        List<Venda> vendasNoPeriodo = vendaRepository.findAllByEmpresa(empresaId).stream()
                .filter(v -> "CONCLUIDA".equals(v.getStatus().name()))
                .filter(v -> !v.getDataHora().isBefore(inicio) && !v.getDataHora().isAfter(fim))
                .filter(v -> vendedorId == null || vendedorId.equals(v.getVendedorId()))
                .collect(Collectors.toList());

        // Agrupa por vendedor
        Map<String, List<Venda>> vendasPorVendedor = vendasNoPeriodo.stream()
                .filter(v -> v.getVendedorNome() != null && !v.getVendedorNome().isEmpty())
                .collect(Collectors.groupingBy(Venda::getVendedorNome));

        List<Map<String, Object>> relatorioFinal = new ArrayList<>();

        for (Map.Entry<String, List<Venda>> entry : vendasPorVendedor.entrySet()) {
            String nomeVendedor = entry.getKey();
            List<Venda> vendasDoCara = entry.getValue();

            BigDecimal totalVendido = vendasDoCara.stream()
                    .map(Venda::getValorTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalComissao = vendasDoCara.stream()
                    .map(v -> v.getValorComissao() != null ? v.getValorComissao() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<Map<String, Object>> detalhes = vendasDoCara.stream().map(v -> {
                Map<String, Object> det = new HashMap<>();
                det.put("id", v.getId());
                det.put("data", v.getDataHora().toString());
                det.put("total", v.getValorTotal());
                det.put("comissao", v.getValorComissao() != null ? v.getValorComissao() : BigDecimal.ZERO);
                return det;
            }).collect(Collectors.toList());

            Map<String, Object> resumoVendedor = new HashMap<>();
            resumoVendedor.put("vendedorNome", nomeVendedor);
            resumoVendedor.put("valorTotalVendido", totalVendido);
            resumoVendedor.put("totalComissao", totalComissao);
            resumoVendedor.put("vendasDetalhes", detalhes);

            relatorioFinal.add(resumoVendedor);
        }

        return ResponseEntity.ok(relatorioFinal);
    }
}
