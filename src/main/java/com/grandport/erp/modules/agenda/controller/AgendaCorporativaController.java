package com.grandport.erp.modules.agenda.controller;

import com.grandport.erp.modules.agenda.dto.AgendaResumoDTO;
import com.grandport.erp.modules.agenda.dto.AgendaSugestaoDTO;
import com.grandport.erp.modules.agenda.model.CompromissoAgenda;
import com.grandport.erp.modules.agenda.service.AgendaCorporativaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agenda")
public class AgendaCorporativaController {

    private final AgendaCorporativaService service;

    public AgendaCorporativaController(AgendaCorporativaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CompromissoAgenda>> listar(
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String setor,
            @RequestParam(required = false) Long usuarioResponsavelId
    ) {
        LocalDate inicio = dataInicio != null ? dataInicio : LocalDate.now().minusDays(7);
        LocalDate fim = dataFim != null ? dataFim : LocalDate.now().plusDays(30);
        return ResponseEntity.ok(service.listar(inicio, fim, status, setor, usuarioResponsavelId));
    }

    @GetMapping("/resumo")
    public ResponseEntity<AgendaResumoDTO> resumo(@RequestParam(required = false) LocalDate data) {
        return ResponseEntity.ok(service.resumo(data != null ? data : LocalDate.now()));
    }

    @GetMapping("/sugestoes")
    public ResponseEntity<List<AgendaSugestaoDTO>> sugestoes(
            @RequestParam LocalDate data,
            @RequestParam(defaultValue = "60") int duracaoMinutos,
            @RequestParam(required = false) Long usuarioResponsavelId
    ) {
        return ResponseEntity.ok(service.sugerirHorarios(data, duracaoMinutos, usuarioResponsavelId));
    }

    @PostMapping
    public ResponseEntity<CompromissoAgenda> criar(@RequestBody CompromissoAgenda compromisso) {
        return ResponseEntity.ok(service.criar(compromisso));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompromissoAgenda> atualizar(@PathVariable Long id, @RequestBody CompromissoAgenda compromisso) {
        return ResponseEntity.ok(service.atualizar(id, compromisso));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CompromissoAgenda> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(service.atualizarStatus(id, payload.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/origens/revisao/{id}")
    public ResponseEntity<CompromissoAgenda> criarDaRevisao(@PathVariable Long id) {
        return ResponseEntity.ok(service.criarAPartirDaRevisao(id));
    }

    @PostMapping("/origens/venda/{id}")
    public ResponseEntity<CompromissoAgenda> criarDaVenda(@PathVariable Long id) {
        return ResponseEntity.ok(service.criarAPartirDaVenda(id));
    }

    @PostMapping("/origens/os/{id}")
    public ResponseEntity<CompromissoAgenda> criarDaOs(@PathVariable Long id) {
        return ResponseEntity.ok(service.criarAPartirDaOs(id));
    }

    @PostMapping("/sincronizar/revisoes")
    public ResponseEntity<Map<String, Integer>> sincronizarRevisoes() {
        return ResponseEntity.ok(Map.of("criados", service.sincronizarRevisoesPendentes()));
    }
}
