package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.parceiro.dto.HistoricoComprasClienteDTO;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParceiroService {

    @Autowired private ParceiroRepository repository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private VendaRepository vendaRepository;

    @Transactional
    public Parceiro criar(Parceiro parceiro) {
        Parceiro salvo = repository.save(parceiro);
        auditoriaService.registrar("CADASTROS", "CRIACAO_PARCEIRO", "Cadastrou o parceiro: " + salvo.getNome() + " (" + salvo.getTipo() + ")");
        return salvo;
    }

    @Transactional
    public Parceiro atualizar(Long id, Parceiro dadosAtualizados) {
        Parceiro parceiroExistente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado com ID: " + id));

        parceiroExistente.setNome(dadosAtualizados.getNome());
        parceiroExistente.setDocumento(dadosAtualizados.getDocumento());
        parceiroExistente.setEmail(dadosAtualizados.getEmail());
        parceiroExistente.setTelefone(dadosAtualizados.getTelefone());
        parceiroExistente.setTipo(dadosAtualizados.getTipo());
        parceiroExistente.setEndereco(dadosAtualizados.getEndereco());
        
        Parceiro salvo = repository.save(parceiroExistente);
        auditoriaService.registrar("CADASTROS", "EDICAO_PARCEIRO", "Atualizou dados do parceiro: " + salvo.getNome());
        return salvo;
    }

    @Transactional
    public void excluir(Long id) {
        Parceiro p = repository.findById(id).orElseThrow(() -> new RuntimeException("Parceiro não encontrado"));
        repository.deleteById(id);
        auditoriaService.registrar("CADASTROS", "EXCLUSAO_PARCEIRO", "Excluiu o parceiro: " + p.getNome());
    }

    public List<HistoricoComprasClienteDTO> buscarHistoricoCompras(Long clienteId) {
        return vendaRepository.findByClienteIdOrderByDataHoraDesc(clienteId).stream()
            .map(venda -> new HistoricoComprasClienteDTO(
                venda.getId(),
                venda.getDataHora(),
                venda.getValorTotal(),
                venda.getStatus().name(),
                venda.getVeiculo() != null ? venda.getVeiculo().getModelo() + " (" + venda.getVeiculo().getPlaca() + ")" : "Nenhum",
                venda.getItens().size()
            ))
            .collect(Collectors.toList());
    }
}
