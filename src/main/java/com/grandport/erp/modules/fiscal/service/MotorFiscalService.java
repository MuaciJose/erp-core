package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.estoque.model.Produto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
            cfopFinal = "6" + cfopFinal.substring(1);
        }
        impostos.put("CFOP", cfopFinal);

        // 2. REGRA DO CSOSN / CST (ICMS Antigo - Mantido para Histórico/Transição)
        if ("1".equals(crtLoja)) { // 1 = Simples Nacional
            impostos.put("CSOSN", produto.getCsosnPadrao() != null ? produto.getCsosnPadrao() : "102");
            impostos.put("CST", "");
        } else {
            impostos.put("CST", produto.getCstPadrao() != null ? produto.getCstPadrao() : "00");
            impostos.put("CSOSN", "");
        }

        // 3. ORIGEM DA MERCADORIA (0 = Nacional)
        impostos.put("ORIGEM", String.valueOf(produto.getOrigemMercadoria() != null ? produto.getOrigemMercadoria() : 0));

        // =========================================================================
        // 🚀 4. NOVO MOTOR DA REFORMA TRIBUTÁRIA 2026 (IBS e CBS)
        // Matemática Financeira usando BigDecimal (Evita erros de centavos)
        // =========================================================================

        BigDecimal valorBaseItem = produto.getPrecoVenda() != null ? produto.getPrecoVenda() : BigDecimal.ZERO;

        if ("1".equals(crtLoja)) {
            // REGRA SIMPLES NACIONAL (Transição):
            impostos.put("CST_IBS", "50");
            impostos.put("CST_CBS", "50");
            impostos.put("VALOR_IBS", "0.00");
            impostos.put("VALOR_CBS", "0.00");

        } else {
            // REGRA REGIME NORMAL (Destaque das alíquotas de teste para 2026)
            BigDecimal aliquotaCBS = new BigDecimal("0.9"); // 0.9% Federal
            BigDecimal aliquotaIBS = new BigDecimal("1.2"); // 1.2% Estados/Municípios
            BigDecimal cem = new BigDecimal("100");

            impostos.put("CST_IBS", "01");
            impostos.put("CST_CBS", "01");

            // Cálculo Matemático (Valor * Aliquota / 100) com arredondamento de 2 casas
            BigDecimal valorCbs = valorBaseItem.multiply(aliquotaCBS).divide(cem, 2, RoundingMode.HALF_UP);
            BigDecimal valorIbs = valorBaseItem.multiply(aliquotaIBS).divide(cem, 2, RoundingMode.HALF_UP);

            impostos.put("VALOR_CBS", valorCbs.toString());
            impostos.put("VALOR_IBS", valorIbs.toString());
        }

        return impostos;
    }
}