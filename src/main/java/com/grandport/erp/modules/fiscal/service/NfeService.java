package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NfeService {

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private MotorFiscalService motorFiscalService;

    public Map<String, Object> emitirNfeSefaz(Long vendaId) throws Exception {
        // 1. Busca a Venda e as Configurações da Empresa
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new Exception("Venda não encontrada."));

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 2. Trava de Segurança
        NotaFiscal notaExistente = notaFiscalRepository.findByVendaId(vendaId);
        if (notaExistente != null && "AUTORIZADA".equals(notaExistente.getStatus())) {
            throw new Exception("NF-e já autorizada com a chave: " + notaExistente.getChaveAcesso());
        }

        // 🚀 3. IDENTIFICAÇÃO DA UF DO CLIENTE (Correção do Erro de Compilação)
        // Como o Endereço é @Embedded, acessamos via getEndereco()
        String ufCliente = config.getUf(); // Default: mesma UF da loja

        if (venda.getCliente() != null && venda.getCliente().getEndereco() != null) {
            String ufCadastrada = venda.getCliente().getEndereco().getUf();
            if (ufCadastrada != null && !ufCadastrada.isBlank()) {
                ufCliente = ufCadastrada;
            }
        }

        // 4. 🛡️ O CORAÇÃO DO FISCAL: Processamento dos Itens
        for (ItemVenda item : venda.getItens()) {
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(
                    item.getProduto(),
                    config.getUf(),
                    ufCliente, // Agora usando a UF tratada
                    config.getCrt()
            );

            // Log para debug no console do Java
            System.out.println("Produto: " + item.getProduto().getNome() + " | CFOP Calculado: " + impostos.get("CFOP"));
        }

        // 5. ✍️ ASSINATURA DIGITAL (Caminho do arquivo que salvamos)
        String caminhoCertificado = System.getProperty("user.dir") + "/certificados/certificado_a1.pfx";
        // String senha = config.getSenhaCertificado();

        // 6. GERAÇÃO DA CHAVE E PERSISTÊNCIA
        String chaveAcessoReal = gerarChaveAcesso(config, venda);

        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setVenda(venda);
        novaNota.setNumero(config.getNumeroProximaNfe().longValue());
        novaNota.setChaveAcesso(chaveAcessoReal);
        novaNota.setStatus("AUTORIZADA");
        novaNota.setProtocolo("1" + (System.currentTimeMillis() / 1000)); // Simulação de protocolo

        notaFiscalRepository.save(novaNota);

        // 🚀 7. ATUALIZAÇÃO DO SEQUENCIAL (Para a próxima nota não repetir o número)
        config.setNumeroProximaNfe(config.getNumeroProximaNfe() + 1);
        configuracaoService.atualizarConfiguracao(config);

        return Map.of(
                "status", "AUTORIZADA",
                "chaveAcesso", chaveAcessoReal,
                "numero", novaNota.getNumero(),
                "mensagem", "Nota emitida com sucesso no ambiente de simulação."
        );
    }

    private String gerarChaveAcesso(ConfiguracaoSistema c, Venda v) {
        // Simplificação da chave de 44 dígitos (UF + AnoMes + CNPJ + Mod + Serie + Num + TpEmis + Cod + DV)
        String cnpjLimpo = c.getCnpj().replaceAll("\\D", "");
        String numeroFormatado = String.format("%09d", c.getNumeroProximaNfe());
        return "262403" + cnpjLimpo + "55001" + numeroFormatado + "123456789";
    }
}