package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParceiroService {

    @Autowired
    private ParceiroRepository repository;

    @Transactional
    public Parceiro criar(Parceiro parceiro) {
        // Aqui poderiam entrar validações de negócio
        return repository.save(parceiro);
    }

    @Transactional
    public Parceiro atualizar(Long id, Parceiro dadosAtualizados) {
        Parceiro parceiroExistente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado com ID: " + id));

        // Atualiza os campos
        parceiroExistente.setNome(dadosAtualizados.getNome());
        parceiroExistente.setDocumento(dadosAtualizados.getDocumento());
        parceiroExistente.setEmail(dadosAtualizados.getEmail());
        parceiroExistente.setTelefone(dadosAtualizados.getTelefone());
        parceiroExistente.setTipo(dadosAtualizados.getTipo());
        parceiroExistente.setEndereco(dadosAtualizados.getEndereco());
        
        return repository.save(parceiroExistente);
    }
}
