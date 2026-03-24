package com.grandport.erp.modules.relatorios.service;

import com.grandport.erp.modules.relatorios.dto.CurvaAbcDTO;
import com.grandport.erp.modules.vendas.repository.ItemVendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CurvaAbcService {

    private final ItemVendaRepository itemVendaRepository;

    public List<CurvaAbcDTO> calcularCurvaABC() {
        List<Object[]> rankingBruto = itemVendaRepository.findRankingFaturamentoProdutos();

        BigDecimal faturamentoTotal = BigDecimal.ZERO;

        // 🚀 CORREÇÃO: O Faturamento agora está no índice [5].
        // Usamos new BigDecimal(toString()) que é à prova de falhas para qualquer banco de dados!
        for (Object[] linha : rankingBruto) {
            if (linha[5] != null) {
                BigDecimal valorLinha = new BigDecimal(linha[5].toString());
                faturamentoTotal = faturamentoTotal.add(valorLinha);
            }
        }

        List<CurvaAbcDTO> curvaABC = new ArrayList<>();
        BigDecimal valorAcumulado = BigDecimal.ZERO;

        for (Object[] linha : rankingBruto) {
            // 🛡️ BLINDAGEM EXTRA: Evita erros se vier nulo ou com tipo diferente
            Long id = linha[0] != null ? ((Number) linha[0]).longValue() : 0L;
            String sku = linha[1] != null ? linha[1].toString() : "";
            String nome = linha[2] != null ? linha[2].toString() : "";
            String refOriginal = linha[3] != null ? linha[3].toString() : "";

            // A quantidade está no índice 4
            Long qtdVendida = linha[4] != null ? ((Number) linha[4]).longValue() : 0L;

            // O Faturamento está no índice 5
            BigDecimal valorProduto = BigDecimal.ZERO;
            if (linha[5] != null) {
                valorProduto = new BigDecimal(linha[5].toString());
            }

            valorAcumulado = valorAcumulado.add(valorProduto);

            double percAcumulado = 0.0;
            if (faturamentoTotal.compareTo(BigDecimal.ZERO) > 0) {
                percAcumulado = valorAcumulado
                        .divide(faturamentoTotal, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .doubleValue();
            }

            String classe;
            if (percAcumulado <= 80.0) {
                classe = "A";
            } else if (percAcumulado <= 95.0) {
                classe = "B";
            } else {
                classe = "C";
            }

            curvaABC.add(new CurvaAbcDTO(id, sku, nome, refOriginal, qtdVendida, valorProduto, percAcumulado, classe));
        }

        return curvaABC;
    }
}