package com.grandport.erp.modules.financeiro.service;

import br.com.caelum.stella.boleto.*;
import br.com.caelum.stella.boleto.bancos.*; // Pacote correto com 's' no final
import br.com.caelum.stella.boleto.transformer.GeradorDeBoleto;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.repository.ContaBancariaRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class BoletoService {

    @Autowired
    private ContaReceberRepository contaReceberRepo;

    @Autowired
    private ContaBancariaRepository contaBancariaRepo;

    public byte[] gerarBoletoPdf(Long contaReceberId, Long contaBancariaId) {

        ContaReceber conta = contaReceberRepo.findById(contaReceberId)
                .orElseThrow(() -> new RuntimeException("Conta a Receber não encontrada!"));

        // ⚠️ A Conta Bancária ainda é consultada para manter a estrutura,
        // mas as variáveis matemáticas dela serão ignoradas neste teste.
        ContaBancaria bancoEmpresa = contaBancariaRepo.findById(contaBancariaId)
                .orElseThrow(() -> new RuntimeException("Conta Bancária emissora não encontrada!"));

        String nomePagador = conta.getParceiro() != null ? conta.getParceiro().getNome() : "Consumidor Final";
        String docPagador = conta.getParceiro() != null && conta.getParceiro().getDocumento() != null ? conta.getParceiro().getDocumento() : "000.000.000-00";

        // =========================================================
        // 🚀 MUNIÇÃO REAL (LENDO DADOS DO BANCO DE DADOS)
        // =========================================================
        String agencia = bancoEmpresa.getAgencia() != null ? bancoEmpresa.getAgencia() : "0000";
        String contaNum = bancoEmpresa.getNumeroConta() != null ? bancoEmpresa.getNumeroConta() : "00000";
        String digito = bancoEmpresa.getDigitoConta() != null ? bancoEmpresa.getDigitoConta() : "0";
        String carteira = bancoEmpresa.getCarteira() != null ? bancoEmpresa.getCarteira() : "109";
        String convenio = bancoEmpresa.getConvenio() != null ? bancoEmpresa.getConvenio() : "1234567";

        // Mantemos o preenchimento de zeros (8 casas) para o Nosso Número não quebrar a matemática!
        String nossoNumero = String.format("%08d", conta.getId());

        // Forçamos o emissor a ser o Itaú, independentemente do que vem da base de dados,
        // para garantir que os dados acima casam com a regra do banco.
        Banco bancoEmissor = new Itau();
        // =========================================================

        LocalDate hoje = LocalDate.now();
        LocalDate vencimento = hoje.plusDays(3);

        if (conta.getDataVencimento() != null) {
            vencimento = conta.getDataVencimento().toLocalDate();
        }

        Datas datas = Datas.novasDatas()
                .comDocumento(hoje.getDayOfMonth(), hoje.getMonthValue(), hoje.getYear())
                .comProcessamento(hoje.getDayOfMonth(), hoje.getMonthValue(), hoje.getYear())
                .comVencimento(vencimento.getDayOfMonth(), vencimento.getMonthValue(), vencimento.getYear());

        Endereco enderecoEmpresa = Endereco.novoEndereco()
                .comLogradouro("Rua da Empresa, S/N")
                .comBairro("Centro")
                .comCep("00000-000")
                .comCidade("Abreu e Lima")
                .comUf("PE");

        Beneficiario beneficiario = Beneficiario.novoBeneficiario()
                .comNomeBeneficiario("GrandPort ERP LTDA")
                .comDocumento("00.000.000/0001-00")
                .comAgencia(agencia)
                .comCodigoBeneficiario(contaNum)
                .comDigitoCodigoBeneficiario(digito)
                .comNumeroConvenio("1234567")
                .comCarteira(carteira)
                .comEndereco(enderecoEmpresa)
                .comNossoNumero(nossoNumero)
                .comDigitoNossoNumero("1");

        Pagador pagador = Pagador.novoPagador()
                .comNome(nomePagador)
                .comDocumento(docPagador);

        Boleto boleto = Boleto.novoBoleto()
                .comBanco(bancoEmissor)
                .comDatas(datas)
                .comBeneficiario(beneficiario)
                .comPagador(pagador)
                .comValorBoleto(conta.getValorOriginal())
                .comNumeroDoDocumento(nossoNumero)
                .comInstrucoes(
                        "Pagar preferencialmente nas lotéricas ou aplicativo do banco.",
                        "Após o vencimento, cobrar multa de 2% e juros de 1% ao mês."
                );

        GeradorDeBoleto gerador = new GeradorDeBoleto(boleto);
        return gerador.geraPDF();
    }
}