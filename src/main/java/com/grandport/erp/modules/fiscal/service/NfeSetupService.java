package com.grandport.erp.modules.fiscal.service;

import br.com.swconsultoria.certificado.Certificado;
import br.com.swconsultoria.certificado.CertificadoService;
import br.com.swconsultoria.nfe.dom.ConfiguracoesNfe;
import br.com.swconsultoria.nfe.dom.enuns.AmbienteEnum;
import br.com.swconsultoria.nfe.dom.enuns.EstadosEnum;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class NfeSetupService {

    public ConfiguracoesNfe iniciarConfiguracao(ConfiguracaoSistema config) throws Exception {

        // 1. Aponta para a pasta de Schemas
        String pastaSchemas = System.getProperty("user.dir") + "/schemas";

        // 2. Aponta para o Certificado Digital salvo no servidor
        String caminhoCertificado = System.getProperty("user.dir") + "/certificados/certificado.pfx";

        File arquivoCertificado = new File(caminhoCertificado);
        if (!arquivoCertificado.exists()) {
            throw new Exception("Arquivo do Certificado Digital não encontrado no servidor.");
        }

        // 3. Carrega o certificado usando a senha que está no banco de dados
        Certificado certificado = CertificadoService.certificadoPfx(caminhoCertificado, config.getSenhaCertificado());

        // 4. Descobre o Estado (UF) e o Ambiente
        EstadosEnum estado = EstadosEnum.valueOf(config.getUf());
        AmbienteEnum ambiente = config.getAmbienteSefaz() == 1 ? AmbienteEnum.PRODUCAO : AmbienteEnum.HOMOLOGACAO;

        // 5. 🚀 Dá a partida no motor (MÉTODO ATUALIZADO PARA A VERSÃO 4+)
        ConfiguracoesNfe configSefaz = ConfiguracoesNfe.criarConfiguracoes(estado, ambiente, certificado, pastaSchemas);

        // Timeout de segurança (para o sistema não travar se a Sefaz demorar a responder)
        configSefaz.setTimeout(30000); // 30 segundos

        return configSefaz;
    }
}