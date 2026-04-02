package com.grandport.erp.modules.atendimento.controller;

import com.grandport.erp.modules.atendimento.dto.AbrirAtendimentoDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoMensagemDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoTicketDTO;
import com.grandport.erp.modules.atendimento.dto.AtualizarAtendimentoStatusDTO;
import com.grandport.erp.modules.atendimento.dto.EnviarAtendimentoMensagemDTO;
import com.grandport.erp.modules.atendimento.service.AtendimentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/atendimentos")
public class AtendimentoController {

    private final AtendimentoService atendimentoService;

    public AtendimentoController(AtendimentoService atendimentoService) {
        this.atendimentoService = atendimentoService;
    }

    @GetMapping("/meus")
    public List<AtendimentoTicketDTO> listarMeusTickets() {
        return atendimentoService.listarMeusTickets();
    }

    @PostMapping("/meus")
    public ResponseEntity<?> abrirTicket(@RequestBody AbrirAtendimentoDTO dto) {
        try {
            return ResponseEntity.ok(atendimentoService.abrirTicket(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/meus/{ticketId}/mensagens")
    public List<AtendimentoMensagemDTO> listarMensagensDoMeuTicket(@PathVariable Long ticketId) {
        return atendimentoService.listarMensagensDoMeuTicket(ticketId);
    }

    @PostMapping("/meus/{ticketId}/mensagens")
    public ResponseEntity<?> enviarMensagemCliente(@PathVariable Long ticketId, @RequestBody EnviarAtendimentoMensagemDTO dto) {
        try {
            return ResponseEntity.ok(atendimentoService.enviarMensagemCliente(ticketId, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/meus/{ticketId}/anexos")
    public ResponseEntity<?> enviarAnexoCliente(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mensagem", required = false) String mensagem
    ) {
        try {
            return ResponseEntity.ok(atendimentoService.enviarAnexoCliente(ticketId, file, mensagem));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/meus/{ticketId}/encerrar")
    public ResponseEntity<?> encerrarMeuTicket(@PathVariable Long ticketId) {
        try {
            return ResponseEntity.ok(atendimentoService.encerrarMeuTicket(ticketId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/plataforma/tickets")
    public List<AtendimentoTicketDTO> listarTicketsPlataforma(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca
    ) {
        return atendimentoService.listarTicketsPlataforma(status, busca);
    }

    @GetMapping("/plataforma/tickets/{ticketId}/mensagens")
    public List<AtendimentoMensagemDTO> listarMensagensPlataforma(@PathVariable Long ticketId) {
        return atendimentoService.listarMensagensPlataforma(ticketId);
    }

    @PostMapping("/plataforma/tickets/{ticketId}/mensagens")
    public ResponseEntity<?> enviarMensagemPlataforma(@PathVariable Long ticketId, @RequestBody EnviarAtendimentoMensagemDTO dto) {
        try {
            return ResponseEntity.ok(atendimentoService.enviarMensagemPlataforma(ticketId, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/plataforma/tickets/{ticketId}/anexos")
    public ResponseEntity<?> enviarAnexoPlataforma(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mensagem", required = false) String mensagem
    ) {
        try {
            return ResponseEntity.ok(atendimentoService.enviarAnexoPlataforma(ticketId, file, mensagem));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/plataforma/tickets/{ticketId}/status")
    public ResponseEntity<?> atualizarStatusTicket(@PathVariable Long ticketId, @RequestBody AtualizarAtendimentoStatusDTO dto) {
        try {
            return ResponseEntity.ok(atendimentoService.atualizarStatusPlataforma(ticketId, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
