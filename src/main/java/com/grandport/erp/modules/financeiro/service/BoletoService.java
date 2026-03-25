package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.repository.ContaBancariaRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class BoletoService {

    @Autowired
    private ContaReceberRepository contaReceberRepo;

    @Autowired
    private ContaBancariaRepository contaBancariaRepo;

    // =========================================================================
    // 🖨️ GERAÇÃO DE BOLETO BANCÁRIO (PREPARAÇÃO PARA PDF)
    // =========================================================================
    public byte[] gerarBoletoPdf(Long contaReceberId, Long contaBancariaId) {

        ContaReceber conta = contaReceberRepo.findById(contaReceberId)
                .orElseThrow(() -> new RuntimeException("Conta a Receber não encontrada!"));

        ContaBancaria banco = contaBancariaRepo.findById(contaBancariaId)
                .orElseThrow(() -> new RuntimeException("Conta Bancária emissora não encontrada!"));

        // 1. DADOS DO PAGADOR (Cliente)
        String nomePagador = conta.getParceiro() != null ? conta.getParceiro().getNome() : "Consumidor Final";
        String docPagador = conta.getParceiro() != null && conta.getParceiro().getDocumento() != null
                ? conta.getParceiro().getDocumento() : "000.000.000-00";

        // 2. DADOS DO BENEFICIÁRIO (Sua Empresa)
        String agencia = banco.getAgencia();
        String numeroConta = banco.getNumeroConta();
        String carteira = banco.getCarteira() != null ? banco.getCarteira() : "109"; // Ex: Carteira Itaú

        // 3. DADOS DO BOLETO
        // O Nosso Número DEVE ser o mesmo que vai na Remessa (ex: ID da conta)
        String nossoNumero = String.valueOf(conta.getId());
        String valor = conta.getValorOriginal().toString();
        String vencimento = conta.getDataVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        System.out.println(">>> PREPARANDO BOLETO PARA: " + nomePagador);
        System.out.println(">>> NOSSO NÚMERO: " + nossoNumero + " | VALOR: R$ " + valor);

        // =====================================================================
        // 🚀 AQUI ENTRARÁ A SUA FUTURA BIBLIOTECA (Ex: Caelum Stella Boleto)
        // =====================================================================
        /* Exemplo de como ficará o código real no futuro:
         * * Banco itau = new Itau();
         * Datas datas = Datas.novasDatas().comDocumento(hoje).comVencimento(dataVencimento);
         * Pagador pagador = Pagador.novoPagador().comNome(nomePagador).comDocumento(docPagador);
         * Beneficiario beneficiario = Beneficiario.novoBeneficiario().comNome("Sua Empresa").comAgencia(agencia)...
         * * Boleto boleto = Boleto.novoBoleto().comBanco(itau).comDatas(datas).comBeneficiario(beneficiario)
         * .comPagador(pagador).comValorBoleto(valor).comNossoNumero(nossoNumero);
         * * GeradorDeBoleto gerador = new GeradorDeBoleto(boleto);
         * return gerador.geraPDF();
         */

        // Por enquanto, devolvemos um PDF falso (ou um TXT simulando o PDF)
        // para o sistema não quebrar e deixar a rota pronta.
        String pdfSimulado = "%PDF-1.4\n%Boleto Visual em Construção...\nNosso Numero: " + nossoNumero;
        return pdfSimulado.getBytes();
    }
}