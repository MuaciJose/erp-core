package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaBancariaRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.financeiro.service.EdiRemessaService;
import com.grandport.erp.modules.usuario.model.Usuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/financeiro/edi/remessa")
@Tag(name = "Financeiro - EDI Bancário")
public class EdiRemessaController {

    @Autowired
    private EdiRemessaService remessaService;

    @Autowired
    private ContaBancariaRepository contaBancariaRepo;

    @Autowired
    private ContaReceberRepository contaReceberRepo;

    @GetMapping("/gerar/{contaBancariaId}")
    @Operation(summary = "Gera o arquivo TXT CNAB 400 para enviar ao banco")
    public ResponseEntity<?> baixarArquivoRemessa(@PathVariable Long contaBancariaId) {

        try {
            System.out.println(">>> INICIANDO GERAÇÃO DE REMESSA PARA A CONTA " + contaBancariaId);

            ContaBancaria conta = contaBancariaRepo.findById(contaBancariaId)
                    .orElseThrow(() -> new RuntimeException("Conta Bancária não encontrada no sistema."));

            System.out.println(">>> CONTA ENCONTRADA: " + conta.getNome());

            // (Ajuste o Enum StatusFinanceiro de acordo com a sua classe)
            List<ContaReceber> boletosPendentes = contaReceberRepo.findByStatus(com.grandport.erp.modules.financeiro.model.StatusFinanceiro.PENDENTE);

            System.out.println(">>> BOLETOS ENCONTRADOS: " + boletosPendentes.size());

            if (boletosPendentes.isEmpty()) {
                throw new RuntimeException("Não há boletos pendentes para gerar remessa.");
            }

            String conteudoArquivo = remessaService.gerarArquivoRemessaCnab400(conta, boletosPendentes);
            String nomeArquivo = "REMESSA_" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy")) + ".txt";

            System.out.println(">>> ARQUIVO GERADO COM SUCESSO! ENVIANDO...");

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeArquivo + "\"")
                    .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                    .body(conteudoArquivo.getBytes());

        } catch (RuntimeException e) {
            // 🛑 ERRO CONTROLADO: O erro real fica na tela preta do servidor
            System.err.println("❌ ERRO NA REMESSA: " + e.getMessage());
            e.printStackTrace();

            // 🛡️ MENSAGEM BLINDADA: O React recebe apenas o texto simples
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            // 🛑 ERRO GRAVE INESPERADO (Banco de dados fora, null pointer, etc)
            System.err.println("❌ ERRO INTERNO CRÍTICO NA REMESSA: " + e.getMessage());
            e.printStackTrace();

            // 🛡️ O Hacker vê apenas isso:
            return ResponseEntity.internalServerError().body("Erro interno no servidor ao processar arquivo CNAB.");
        }
    }

    @Autowired
    private com.grandport.erp.modules.financeiro.service.EdiRetornoService retornoService;

    // =========================================================================
    // 📥 RECEBE O ARQUIVO DE RETORNO DO BANCO (.RET / .TXT)
    // =========================================================================
    @PostMapping(value = "/retorno/importar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importa o arquivo de retorno CNAB para baixa automática")
    public ResponseEntity<String> importarRetornoBancario(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            System.out.println(">>> RECEBENDO ARQUIVO DE RETORNO: " + file.getOriginalFilename());
            String resultado = retornoService.processarArquivoRetorno(file);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao processar Retorno: " + e.getMessage());
        }
    }
}