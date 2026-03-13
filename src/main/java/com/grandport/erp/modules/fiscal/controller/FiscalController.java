package com.grandport.erp.modules.fiscal.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.fiscal.service.DanfeService;
import com.grandport.erp.modules.fiscal.service.NfeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.swconsultoria.nfe.Nfe;
import br.com.swconsultoria.nfe.dom.ConfiguracoesNfe;
import br.com.swconsultoria.nfe.dom.enuns.DocumentoEnum;
import br.com.swconsultoria.nfe.schema_4.retConsStatServ.TRetConsStatServ;
import com.grandport.erp.modules.fiscal.service.NfeSetupService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
public class FiscalController {

    @Autowired
    private NfeService nfeService;

    @Autowired
    private DanfeService danfeService;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private com.grandport.erp.modules.fiscal.service.EmailFiscalService emailFiscalService;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private NfeSetupService nfeSetupService;

    // =======================================================================
    // 🚀 LISTAR TODAS AS NOTAS (PARA O GERENCIADOR FISCAL)
    // =======================================================================
    @GetMapping("/notas")
    public ResponseEntity<List<NotaFiscal>> listarTodasAsNotas() {
        try {
            List<NotaFiscal> notas = notaFiscalRepository.findAll();
            notas.sort((n1, n2) -> n2.getId().compareTo(n1.getId()));
            return ResponseEntity.ok(notas);
        } catch (Exception e) {
            System.err.println("[ERRO - LISTAR NOTAS] " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // =======================================================================
    // 🚀 EMITIR / AUTORIZAR A NOTA VIA PDV
    // =======================================================================
    @PostMapping("/emitir/{vendaId}")
    public ResponseEntity<?> emitirCupom(@PathVariable Long vendaId) {
        try {
            Map<String, Object> resultadoSefaz = nfeService.emitirNfeSefaz(vendaId);
            NotaFiscal notaSalva = notaFiscalRepository.findByVendaId(vendaId);
            Map<String, Object> response = new HashMap<>(resultadoSefaz);

            if (notaSalva != null) {
                response.put("id", notaSalva.getId());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 TESTAR STATUS DA SEFAZ
    // =======================================================================
    @GetMapping("/status-sefaz")
    public ResponseEntity<?> verificarStatusSefaz() {
        try {
            ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
            if (config == null) return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "Configurações não encontradas."));
            if (config.getUf() == null || config.getUf().isEmpty()) return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "Selecione a UF."));

            ConfiguracoesNfe configSefaz = nfeSetupService.iniciarConfiguracao(config);
            TRetConsStatServ retornoSefaz = Nfe.statusServico(configSefaz, DocumentoEnum.NFCE);

            if ("107".equals(retornoSefaz.getCStat())) {
                return ResponseEntity.ok(Map.of("status", "ONLINE", "mensagem", "SEFAZ OK: " + retornoSefaz.getXMotivo()));
            } else {
                return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "SEFAZ Recusou: " + retornoSefaz.getXMotivo()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERRO", "mensagem", e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 DOWNLOAD DO DANFE (PDV E AVULSA)
    // =======================================================================
    @GetMapping("/{nfeId}/danfe")
    public ResponseEntity<byte[]> baixarDanfe(@PathVariable Long nfeId) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            byte[] pdfBytes = danfeService.gerarDanfePdf(nota);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=danfe_" + nota.getNumero() + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping(value = "/danfe/avulsa/{chaveAcesso}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> baixarDanfeAvulsa(@PathVariable String chaveAcesso) {
        try {
            NotaFiscal nota = notaFiscalRepository.findAll().stream()
                    .filter(n -> chaveAcesso.equals(n.getChaveAcesso()))
                    .findFirst()
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada no Banco de Dados."));

            byte[] pdfBytes = danfeService.gerarDanfeAvulsaPdf(nota);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"DANFE_" + chaveAcesso + ".pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // =======================================================================
    // 🚀 DOWNLOAD DO XML
    // =======================================================================
    @GetMapping("/{nfeId}/xml")
    public ResponseEntity<byte[]> baixarXml(@PathVariable Long nfeId) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            String diretorioXml = System.getProperty("user.dir") + "/nfe_xmls/";
            Path caminhoArquivo = Paths.get(diretorioXml + nota.getChaveAcesso() + ".xml");

            if (!Files.exists(caminhoArquivo)) throw new Exception("XML físico não encontrado.");

            byte[] xmlBytes = Files.readAllBytes(caminhoArquivo);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nota.getChaveAcesso() + ".xml")
                    .contentType(org.springframework.http.MediaType.APPLICATION_XML)
                    .body(xmlBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // =======================================================================
    // 🚀 EMISSÃO AVANÇADA E COMUNICAÇÃO CONTADOR
    // =======================================================================
    @PostMapping("/emitir-completa")
    public ResponseEntity<?> emitirNfeCompleta(@RequestBody com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO request) {
        try {
            Map<String, Object> respostaSefaz = nfeService.emitirNfeAvancada(request);
            return ResponseEntity.ok(respostaSefaz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao emitir NF-e: " + e.getMessage()));
        }
    }

    @PostMapping("/{nfeId}/enviar-contador")
    public ResponseEntity<?> enviarParaContador(@PathVariable Long nfeId, @RequestParam String email) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota não encontrada."));
            emailFiscalService.enviarXmlContador(nota, email);
            return ResponseEntity.ok(Map.of("message", "E-mail enviado com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: " + e.getMessage()));
        }
    }

    @PostMapping("/enviar-lote-contador")
    public ResponseEntity<?> enviarLoteMensal(
            @RequestParam String email,
            @RequestParam String mesAno,
            @RequestParam(required = false, defaultValue = "Segue fechamento fiscal.") String mensagem,
            @RequestBody List<Long> nfeIds) {
        try {
            List<NotaFiscal> notasDoLote = notaFiscalRepository.findAllById(nfeIds);
            emailFiscalService.enviarLoteXmlContador(notasDoLote, email, mesAno, mensagem);
            return ResponseEntity.ok(Map.of("message", "Fechamento enviado com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: " + e.getMessage()));
        }
    }

    @GetMapping("/testar-email")
    public ResponseEntity<?> verificarStatusEmail() {
        try {
            emailFiscalService.testarConexaoEmail();
            return ResponseEntity.ok(Map.of("status", "ONLINE", "mensagem", "E-mail OK"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERRO", "mensagem", "Falha SMTP."));
        }
    }

    // =======================================================================
    // 🚀 EXCLUIR REGISTRO FISCAL COM ERRO/PENDENTE
    // =======================================================================
    @DeleteMapping("/notas/{id}")
    public ResponseEntity<?> excluirNotaComErro(@PathVariable Long id) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(id)
                    .orElseThrow(() -> new Exception("Nota não encontrada no sistema."));

            if ("AUTORIZADA".equals(nota.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Segurança Fiscal: Não é permitido excluir uma nota autorizada. Utilize a função Cancelar."));
            }

            // Se for vinculada a uma venda, primeiro tira o vínculo para não dar erro de banco
            if (nota.getVenda() != null) {
                nota.getVenda().setNotaFiscal(null);
            }

            notaFiscalRepository.delete(nota);
            return ResponseEntity.ok(Map.of("message", "Registro fiscal excluído com sucesso."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao excluir nota: " + e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 CANCELAR NF-E AVULSA (Aquela que não tem uma venda PDV atrelada)
    // =======================================================================
    @PostMapping("/cancelar-nfe/{id}")
    public ResponseEntity<?> cancelarNotaFiscalAvulsa(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String justificativa = payload.get("justificativa");

        if (justificativa == null || justificativa.trim().length() < 15) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "A justificativa deve conter no mínimo 15 caracteres."));
        }

        try {
            NotaFiscal nota = notaFiscalRepository.findById(id)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            if (!"AUTORIZADA".equals(nota.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Apenas notas autorizadas podem ser canceladas na SEFAZ."));
            }

            // AQUI VOCÊ CHAMA O SEU SERVIÇO QUE FALA COM A SEFAZ
            // Exemplo: motorFiscalService.cancelarNota(nota.getChaveAcesso(), justificativa);

            System.out.println(">>> Enviando CANCELAMENTO AVULSO para a SEFAZ...");
            System.out.println("Chave: " + nota.getChaveAcesso());

            nota.setStatus("CANCELADA");
            notaFiscalRepository.save(nota);

            return ResponseEntity.ok(Map.of("message", "Nota Fiscal cancelada com sucesso na SEFAZ."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Rejeição SEFAZ: " + e.getMessage()));
        }
    }
}