package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.vendas.dto.VendaPerdidaRankingDTO;
import com.grandport.erp.modules.vendas.repository.VendaPerdidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VendaPerdidaService {

    @Autowired
    private VendaPerdidaRepository repository;

    public List<VendaPerdidaRankingDTO> getRankingVendasPerdidas() {
        LocalDateTime seteDiasAtras = LocalDateTime.now().minusDays(7);
        return repository.findRankingVendasPerdidas(seteDiasAtras);
    }
}
