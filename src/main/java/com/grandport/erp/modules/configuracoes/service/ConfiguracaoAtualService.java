package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConfiguracaoAtualService {

    private final ConfiguracaoRepository configuracaoRepository;
    private final EmpresaContextService empresaContextService;

    public ConfiguracaoSistema obterAtual() {
        return configuracaoRepository
                .findFirstByEmpresaIdOrderByIdDesc(empresaContextService.getRequiredEmpresaId())
                .orElseGet(ConfiguracaoSistema::new);
    }
}
