package com.grandport.erp.modules.servicos.controller;

import com.grandport.erp.modules.servicos.model.Servico;
import com.grandport.erp.modules.servicos.repository.ServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    @Autowired
    private ServicoRepository servicoRepository;

    @GetMapping
    public List<Servico> listarTodos(@RequestParam(required = false) String busca) {
        if (busca != null && !busca.isEmpty()) {
            return servicoRepository.buscarPorNomeOuCodigo(busca);
        }
        return servicoRepository.findAll();
    }

    @PostMapping
    public Servico criar(@RequestBody Servico servico) {
        return servicoRepository.save(servico);
    }

    @PutMapping("/{id}")
    public Servico atualizar(@PathVariable Long id, @RequestBody Servico servicoAtualizado) {
        return servicoRepository.findById(id).map(s -> {
            s.setCodigo(servicoAtualizado.getCodigo());
            s.setNome(servicoAtualizado.getNome());
            s.setDescricao(servicoAtualizado.getDescricao());
            s.setPreco(servicoAtualizado.getPreco());
            s.setTempoEstimadoMinutos(servicoAtualizado.getTempoEstimadoMinutos());
            s.setAtivo(servicoAtualizado.getAtivo());
            return servicoRepository.save(s);
        }).orElseThrow(() -> new RuntimeException("Serviço não encontrado"));
    }
}