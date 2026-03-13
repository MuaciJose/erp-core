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

        // 🚀 ATUALIZAÇÃO: Busca o certificado pelo CNPJ da empresa (limpando pontos/traços)
        String cnpjLimpo = config.getCnpj().replaceAll("[^0-9]", "");
        String caminhoCertificado = System.getProperty("user.dir") + File.separator + "certificados" + File.separator + cnpjLimpo + ".pfx";

        File arquivoCertificado = new File(caminhoCertificado);
        if (!arquivoCertificado.exists()) {
            throw new Exception("Certificado Digital não encontrado para o CNPJ " + cnpjLimpo + " em: " + caminhoCertificado);
        }

        // 3. Carrega o certificado usando a senha que está no banco de dados
        Certificado certificado = CertificadoService.certificadoPfx(caminhoCertificado, config.getSenhaCertificado());

        // 4. Descobre o Estado (UF) e o Ambiente
        EstadosEnum estado = EstadosEnum.valueOf(config.getUf());
        AmbienteEnum ambiente = config.getAmbienteSefaz() == 1 ? AmbienteEnum.PRODUCAO : AmbienteEnum.HOMOLOGACAO;

        // 5. 🚀 Dá a partida no motor
        ConfiguracoesNfe configSefaz = ConfiguracoesNfe.criarConfiguracoes(estado, ambiente, certificado, pastaSchemas);

        // Timeout de segurança
        configSefaz.setTimeout(30000); // 30 segundos

        return configSefaz;
    }
}