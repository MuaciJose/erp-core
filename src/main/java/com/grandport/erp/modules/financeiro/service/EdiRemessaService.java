package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EdiRemessaService {

    // =========================================================================
    // 🚀 O MOTOR PRINCIPAL QUE GERA O ARQUIVO .TXT
    // =========================================================================
    public String gerarArquivoRemessaCnab400(ContaBancaria contaBancaria, List<ContaReceber> boletos) {
        StringBuilder arquivoTxt = new StringBuilder();
        int numeroSequencialLinha = 1;

        // 1. GERA O CABEÇALHO (Header - Tipo 0)
        arquivoTxt.append(gerarCabecalho(contaBancaria, numeroSequencialLinha++));
        arquivoTxt.append("\r\n"); // Quebra de linha padrão do Windows (CRLF)

        // 2. GERA AS LINHAS DE DETALHE (Os Boletos - Tipo 1)
        for (ContaReceber boleto : boletos) {
            arquivoTxt.append(gerarDetalheBoleto(contaBancaria, boleto, numeroSequencialLinha++));
            arquivoTxt.append("\r\n");
        }

        // 3. GERA O RODAPÉ (Trailer - Tipo 9)
        arquivoTxt.append(gerarRodape(numeroSequencialLinha));

        return arquivoTxt.toString();
    }

    // =========================================================================
    // 📄 1. CABEÇALHO (O Banco lê esta linha para saber de quem é o arquivo)
    // =========================================================================
    private String gerarCabecalho(ContaBancaria conta, int sequencial) {
        StringBuilder linha = new StringBuilder();

        linha.append("0"); // Posição 001: Identificação do Registro (0 = Header)
        linha.append("1"); // Posição 002: Tipo de Operação (1 = Remessa)
        linha.append(completarComEspacos("REMESSA", 7)); // Pos 003 a 009
        linha.append("01"); // Pos 010 a 011: Tipo de Serviço (01 = Cobrança)
        linha.append(completarComEspacos("COBRANCA", 15)); // Pos 012 a 026

        // Dados da Empresa
        linha.append(completarComZeros(conta.getAgencia(), 4)); // Pos 027 a 030
        linha.append(completarComZeros("0", 2)); // Zeros
        linha.append(completarComZeros(conta.getNumeroConta(), 5)); // Pos 033 a 037
        linha.append(completarComEspacos(conta.getDigitoConta(), 1)); // Pos 038
        linha.append(completarComEspacos("", 8)); // Espaços vazios
        linha.append(completarComEspacos(conta.getNome().toUpperCase(), 30)); // Pos 047 a 076: Nome da Empresa

        // Dados do Banco (Exemplo Itaú: 341)
        linha.append(completarComEspacos(conta.getNumeroBanco(), 3)); // Pos 077 a 079
        linha.append(completarComEspacos("BANCO ITAU SA", 15)); // Pos 080 a 094

        // Data de Geração do Arquivo
        String dataGeracao = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyy"));
        linha.append(dataGeracao); // Pos 095 a 100

        // Preenche o resto da linha com espaços em branco até chegar quase ao fim
        linha.append(completarComEspacos("", 294)); // Pos 101 a 394

        // O Sequencial da linha SEMPRE fica nas últimas 6 posições (395 a 400)
        linha.append(completarComZeros(String.valueOf(sequencial), 6));

        return linha.toString();
    }

    // =========================================================================
    // 📄 2. DETALHE (A linha que contém os dados reais do Boleto a ser cobrado)
    // =========================================================================
    private String gerarDetalheBoleto(ContaBancaria conta, ContaReceber boleto, int sequencial) {
        StringBuilder linha = new StringBuilder();

        linha.append("1"); // Posição 001: Identificação do Registro (1 = Detalhe)

        // 🛡️ BLINDAGEM MÁXIMA ANTI-NULLPOINTER
        String doc = "00000000000";
        String nomeParceiro = "CONSUMIDOR FINAL";

        if (boleto.getParceiro() != null) {
            if (boleto.getParceiro().getDocumento() != null) {
                // Pega apenas os números do documento
                doc = boleto.getParceiro().getDocumento().replaceAll("[^0-9]", "");
            }
            if (boleto.getParceiro().getNome() != null) {
                nomeParceiro = boleto.getParceiro().getNome().toUpperCase();
            }
        }

        // Documento do Cliente
        String tipoDoc = doc.length() > 11 ? "02" : "01"; // 01=CPF, 02=CNPJ
        linha.append(tipoDoc); // Pos 002 a 003
        linha.append(completarComZeros(doc, 14)); // Pos 004 a 017

        // Agência e Conta
        linha.append(completarComZeros(conta.getAgencia(), 4));
        linha.append(completarComZeros("0", 2));
        linha.append(completarComZeros(conta.getNumeroConta(), 5));
        linha.append(completarComEspacos(conta.getDigitoConta(), 1));
        linha.append(completarComEspacos("", 4)); // Espaços

        // O Nosso Número (A Identidade do Boleto)
        linha.append(completarComZeros(boleto.getId().toString(), 8));

        // Preenche com espaços até chegar na data de vencimento
        linha.append(completarComEspacos("", 68));

        // Data de Vencimento do Boleto (DDMMYY) - Com blindagem caso não tenha data
        String dataVencimento = "010199"; // Data genérica de erro
        if (boleto.getDataVencimento() != null) {
            dataVencimento = boleto.getDataVencimento().format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy"));
        }
        linha.append(dataVencimento);

        // Valor do Boleto (Sem vírgula! Ex: 150,50 vira 0000000015050)
        BigDecimal valor = boleto.getValorOriginal() != null ? boleto.getValorOriginal() : BigDecimal.ZERO;
        BigDecimal valorFormatado = valor.multiply(new BigDecimal("100"));
        linha.append(completarComZeros(String.valueOf(valorFormatado.longValue()), 13));

        // Nome do Pagador blindado
        linha.append(completarComEspacos(nomeParceiro, 30));

        // Preenche vazio até o fim
        linha.append(completarComEspacos("", 207));

        // Sequencial (395 a 400)
        linha.append(completarComZeros(String.valueOf(sequencial), 6));

        // 🛡️ TRAVA DE SEGURANÇA: Garante que a linha tem EXATAMENTE 400 posições
        if (linha.length() > 400) return linha.substring(0, 400);
        if (linha.length() < 400) return completarComEspacos(linha.toString(), 400);

        return linha.toString();
    }

    // =========================================================================
    // 📄 3. RODAPÉ (Informa ao banco que o arquivo acabou)
    // =========================================================================
    private String gerarRodape(int sequencial) {
        StringBuilder linha = new StringBuilder();
        linha.append("9"); // Posição 001: (9 = Trailer)
        linha.append(completarComEspacos("", 393)); // O resto é tudo em branco
        linha.append(completarComZeros(String.valueOf(sequencial), 6)); // Últimas 6 posições
        return linha.toString();
    }

    // =========================================================================
    // 🛠️ FERRAMENTAS DE PREENCHIMENTO (A magia do CNAB)
    // =========================================================================

    // Adiciona espaços em branco à direita (Para Textos)
    private String completarComEspacos(String texto, int tamanhoMaximo) {
        if (texto == null) texto = "";
        if (texto.length() >= tamanhoMaximo) return texto.substring(0, tamanhoMaximo);
        StringBuilder sb = new StringBuilder(texto);
        while (sb.length() < tamanhoMaximo) {
            sb.append(" ");
        }
        return sb.toString();
    }

    // Adiciona Zeros à esquerda (Para Números e Valores)
    private String completarComZeros(String numero, int tamanhoMaximo) {
        if (numero == null) numero = "0";
        if (numero.length() >= tamanhoMaximo) return numero.substring(0, tamanhoMaximo);
        StringBuilder sb = new StringBuilder();
        while (sb.length() < (tamanhoMaximo - numero.length())) {
            sb.append("0");
        }
        sb.append(numero);
        return sb.toString();
    }
}