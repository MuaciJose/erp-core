package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaBancariaRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.financeiro.service.EdiRemessaService;
import com.grandport.erp.modules.usuario.model.Usuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(EdiRemessaController.class);

    @Autowired
    private EdiRemessaService remessaService;

    @Autowired
    private ContaBancariaRepository contaBancariaRepo;

    @Autowired
    private ContaReceberRepository contaReceberRepo;

    @Autowired
    private EmpresaContextService empresaContextService;

    @GetMapping("/gerar/{contaBancariaId}")
    @Operation(summary = "Gera o arquivo TXT CNAB 400 para enviar ao banco")
    public ResponseEntity<?> baixarArquivoRemessa(@PathVariable Long contaBancariaId) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        try {
            log.info("Iniciando geração de remessa para conta {}", contaBancariaId);

            ContaBancaria conta = contaBancariaRepo.findByEmpresaIdAndId(empresaId, contaBancariaId)
                    .orElseThrow(() -> new RuntimeException("Conta Bancária não encontrada no sistema."));

            log.info("Conta bancária encontrada para remessa: {}", conta.getNome());

            // (Ajuste o Enum StatusFinanceiro de acordo com a sua classe)
            List<ContaReceber> boletosPendentes = contaReceberRepo.findByEmpresaIdAndStatusOrderByDataVencimentoAsc(empresaId, com.grandport.erp.modules.financeiro.model.StatusFinanceiro.PENDENTE);

            log.info("Boletos pendentes encontrados para remessa: {}", boletosPendentes.size());

            if (boletosPendentes.isEmpty()) {
                throw new RuntimeException("Não há boletos pendentes para gerar remessa.");
            }

            String conteudoArquivo = remessaService.gerarArquivoRemessaCnab400(conta, boletosPendentes);
            String nomeArquivo = "REMESSA_" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy")) + ".txt";

            log.info("Arquivo de remessa gerado com sucesso para conta {}", contaBancariaId);

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeArquivo + "\"")
                    .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                    .body(conteudoArquivo.getBytes());

        } catch (RuntimeException e) {
            log.warn("Erro controlado ao gerar remessa da conta {}: {}", contaBancariaId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            log.error("Erro interno ao gerar remessa da conta {}", contaBancariaId, e);
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
            log.info("Recebendo arquivo de retorno na rota de remessa {}", file.getOriginalFilename());
            String resultado = retornoService.processarArquivoRetorno(file);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao processar retorno bancário {}", file.getOriginalFilename(), e);
            return ResponseEntity.badRequest().body("Erro ao processar Retorno: " + e.getMessage());
        }
    }
}
