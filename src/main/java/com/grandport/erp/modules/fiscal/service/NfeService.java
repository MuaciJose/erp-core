package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.Venda;
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

    public Map<String, Object> emitirNfeSefaz(Long vendaId) throws Exception {
        System.out.println("Iniciando processo de emissão da NF-e para a Venda: #" + vendaId);

        // 1. Busca a Venda no banco
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new Exception("Venda não encontrada no banco de dados."));

        // 2. Trava de Segurança: Verifica se já não existe uma nota!
        NotaFiscal notaExistente = notaFiscalRepository.findByVendaId(vendaId);
        if (notaExistente != null && notaExistente.getStatus().equals("AUTORIZADA")) {
            throw new Exception("Esta venda já possui uma NF-e autorizada (Chave: " + notaExistente.getChaveAcesso() + ")");
        }

        // Simula o tempo que a SEFAZ demora
        Thread.sleep(1500);

        // 3. SEFAZ aprovou!
        String chaveAcessoFalsa = "26240312345678000199550010000012341123456789";
        String protocoloAutorizacao = "1" + (System.currentTimeMillis() / 1000);
        String urlPdf = "https://grandport.com/fiscal/danfe/" + chaveAcessoFalsa + ".pdf";

        // 4. SALVAR A NOTA FISCAL NO BANCO DE DADOS
        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setVenda(venda); // 🚀 Agora vincula na sua entidade Venda
        novaNota.setNumero(1234L);
        novaNota.setChaveAcesso(chaveAcessoFalsa);
        novaNota.setProtocolo(protocoloAutorizacao);
        novaNota.setUrlDanfe(urlPdf);
        novaNota.setStatus("AUTORIZADA");

        notaFiscalRepository.save(novaNota);

        System.out.println("✅ NF-e Salva e amarrada à Venda #" + vendaId);

        return Map.of(
                "status", "AUTORIZADA",
                "mensagem", "NF-e Autorizada o uso na SEFAZ",
                "chaveAcesso", chaveAcessoFalsa,
                "protocolo", protocoloAutorizacao,
                "urlPdf", urlPdf
        );
    }
}