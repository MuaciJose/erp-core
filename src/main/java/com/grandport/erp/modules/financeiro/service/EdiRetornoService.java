package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class EdiRetornoService {

    private static final Logger log = LoggerFactory.getLogger(EdiRetornoService.class);

    @Autowired
    private ContaReceberRepository contaReceberRepo;

    @Autowired
    private EmpresaContextService empresaContextService;

    // =========================================================================
    // 🧠 LEITOR DE INTELIGÊNCIA CNAB 400 (RETORNO)
    // =========================================================================
    @Transactional
    public String processarArquivoRetorno(MultipartFile file) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        int qtdBaixados = 0;
        int qtdErros = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String linha;

            while ((linha = reader.readLine()) != null) {

                // 🛡️ Ignora Cabeçalho (0) e Rodapé (9). Lê apenas o Detalhe (1)
                if (linha.startsWith("1") && linha.length() >= 390) { // Tolera variações de quebra de linha
                    try {
                        // 1. O Código de Ocorrência (O que o banco está avisando?)
                        // Padrão FEBRABAN CNAB 400: Posição 109 a 110 (Índice 108 a 110)
                        // 06 = Liquidação Normal (Pago!), 02 = Entrada Confirmada (Apenas registado)
                        String ocorrencia = linha.substring(108, 110);

                        // Só damos baixa se for "06" (Pago / Liquidado) ou "00" (Alguns bancos usam 00)
                        if (ocorrencia.equals("06") || ocorrencia.equals("00")) {

                            // 2. Nosso Número (O ID do Boleto que o banco devolveu)
                            // Padrão Itaú: Posição 86 a 93 (No nosso exemplo da remessa, usamos até a posição 41,
                            // mas num CNAB real o banco devolve nesta posição ou na 117. Vamos buscar o ID puro!)
                            String nossoNumeroStr = linha.substring(85, 93).trim();

                            // 💡 TRUQUE TÁTICO: Limpa os zeros à esquerda e converte para ID
                            Long idConta = Long.parseLong(nossoNumeroStr);

                            // 3. Valor Pago (Pos 254 a 266 = 13 dígitos) -> Ex: 0000000015050 = R$ 150,50
                            String valorPagoStr = linha.substring(253, 266);
                            BigDecimal valorPago = new BigDecimal(valorPagoStr).divide(new BigDecimal("100"));

                            // 4. Procura o Boleto no Banco de Dados
                            ContaReceber conta = contaReceberRepo.findByEmpresaIdAndId(empresaId, idConta).orElse(null);

                            if (conta != null && conta.getStatus() == StatusFinanceiro.PENDENTE) {
                                // 🎯 TIRO CERTEIRO! DÁ BAIXA AUTOMÁTICA!

                                // (Ajuste o status de acordo com o seu Enum. PAGO, LIQUIDADO ou RECEBIDO)
                                conta.setStatus(StatusFinanceiro.valueOf("PAGO"));

                                // Se você tiver esses campos na sua ContaReceber, desconte o comentário:
                                // conta.setValorPago(valorPago);
                                // conta.setDataPagamento(LocalDate.now().atStartOfDay());
                                // conta.setFormaPagamento("BOLETO BANCÁRIO (EDI)");

                                contaReceberRepo.save(conta);
                                qtdBaixados++;
                            } else {
                                qtdErros++;
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao processar linha do arquivo de retorno bancário", e);
                        qtdErros++;
                    }
                }
            }
            return "Operação Concluída! Boletos baixados com sucesso: " + qtdBaixados + " | Ignorados/Erros: " + qtdErros;

        } catch (Exception e) {
            throw new RuntimeException("Falha crítica ao ler o arquivo: " + e.getMessage(), e);
        }
    }
}
