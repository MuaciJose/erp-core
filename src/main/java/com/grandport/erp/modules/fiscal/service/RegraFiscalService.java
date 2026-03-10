package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.fiscal.model.RegraFiscal;
import com.grandport.erp.modules.fiscal.repository.RegraFiscalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RegraFiscalService {

    @Autowired
    private RegraFiscalRepository repository;

    public List<RegraFiscal> listarTodas() {
        return repository.findAll();
    }

    public RegraFiscal buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Regra Fiscal não encontrada."));
    }

    public RegraFiscal salvar(RegraFiscal regraFiscal) {
        // Aqui podemos colocar validações no futuro (ex: se o CFOP tem 4 dígitos)
        return repository.save(regraFiscal);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }
}