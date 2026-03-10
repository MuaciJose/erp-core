package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.estoque.model.Produto; // Ajuste os imports para as suas pastas
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MotorFiscalService {

    /**
     * Calcula as regras tributárias de um item no momento exato de gerar a NF-e.
     */
    public Map<String, String> calcularTributosDoItem(Produto produto, String ufLoja, String ufCliente, String crtLoja) {
        Map<String, String> impostos = new HashMap<>();

        // 1. REGRA DO CFOP (Dentro ou Fora do Estado?)
        boolean isVendaMesmoEstado = (ufCliente == null || ufCliente.trim().isEmpty() || ufLoja.equalsIgnoreCase(ufCliente));
        String cfopFinal = produto.getCfopPadrao() != null ? produto.getCfopPadrao() : "5102";

        if (!isVendaMesmoEstado && cfopFinal.startsWith("5")) {
            // MÁGICA: Se a venda for pra fora do estado, o sistema troca o 5 inicial por 6 sozinho!
            // Exemplo: 5102 vira 6102. 5405 vira 6404.
            cfopFinal = "6" + cfopFinal.substring(1);
        }
        impostos.put("CFOP", cfopFinal);

        // 2. REGRA DO CSOSN / CST (Simples Nacional vs Lucro Real)
        // CRT 1 = Simples Nacional
        if ("1".equals(crtLoja)) {
            impostos.put("CSOSN", produto.getCsosnPadrao() != null ? produto.getCsosnPadrao() : "102");
            impostos.put("CST", ""); // Simples Nacional não usa CST na tag de ICMS normal
        } else {
            impostos.put("CST", produto.getCstPadrao() != null ? produto.getCstPadrao() : "00");
            impostos.put("CSOSN", "");
        }

        // 3. ORIGEM DA MERCADORIA (0 = Nacional)
        impostos.put("ORIGEM", String.valueOf(produto.getOrigemMercadoria() != null ? produto.getOrigemMercadoria() : 0));

        return impostos;
    }
}