package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ConfiguracaoService {

    @Autowired
    private ConfiguracaoRepository repository;

    // Busca a configuração. Se não existir, cria a número 1 padrão.
    public ConfiguracaoSistema obterConfiguracao() {
        return repository.findById(1L).orElseGet(() -> {
            ConfiguracaoSistema configPadrao = new ConfiguracaoSistema();
            configPadrao.setId(1L);
            return repository.save(configPadrao);
        });
    }

    // Salva as alterações feitas pelo usuário
    public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
        dadosAtualizados.setId(1L); // Trava o ID em 1 por segurança
        return repository.save(dadosAtualizados);
    }
}