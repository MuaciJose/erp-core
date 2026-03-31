package com.grandport.erp.modules.configuracoes.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConfiguracaoAtualService {

    private final ConfiguracaoService configuracaoService;

    public com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema obterAtual() {
        return configuracaoService.obterConfiguracao();
    }
}
