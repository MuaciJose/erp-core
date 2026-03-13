package com.grandport.erp.modules.fiscal.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService; // 🚀 IMPORT ADICIONADO
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.fiscal.service.DanfeService;
import com.grandport.erp.modules.fiscal.service.NfeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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

    // 🚀 INJEÇÃO ADICIONADA PARA O STATUS DA SEFAZ FUNCIONAR
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
            // 1. O NfeService retorna um Map (e não a NotaFiscal inteira)
            Map<String, Object> resultadoSefaz = nfeService.emitirNfeSefaz(vendaId);

            // 2. O React precisa do ID da nota! Vamos buscar a nota que acabou de ser salva
            NotaFiscal notaSalva = notaFiscalRepository.findByVendaId(vendaId);

            // 3. Como o Map original é imutável, criamos um novo para adicionar o ID
            Map<String, Object> response = new HashMap<>(resultadoSefaz);

            if (notaSalva != null) {
                response.put("id", notaSalva.getId()); // 🚀 INJETAMOS O ID AQUI!
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 TESTAR STATUS DA SEFAZ (CONEXÃO REAL COM O GOVERNO)
    // =======================================================================
    @GetMapping("/status-sefaz")
    public ResponseEntity<?> verificarStatusSefaz() {
        System.out.println("🚀 [BOTAO CLICADO] Iniciando teste de Status SEFAZ...");
        try {
            ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

            if (config == null) {
                System.out.println("❌ Erro: Configuração não encontrada no banco.");
                return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "Configurações não encontradas."));
            }

            System.out.println("📝 Dados encontrados: UF=" + config.getUf() + ", Ambiente=" + config.getAmbienteSefaz());

            // 1. Validação
            if (config.getUf() == null || config.getUf().isEmpty()) {
                System.out.println("⚠️ Validação falhou: UF vazia.");
                return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "Selecione a UF."));
            }

            // 2. Tenta ligar o motor
            System.out.println("⚙️ Ligando motor de configuração...");
            ConfiguracoesNfe configSefaz = nfeSetupService.iniciarConfiguracao(config);
            System.out.println("✅ Motor ligado com sucesso!");

            // 3. Consulta a Sefaz
            System.out.println("📡 Batendo na porta da SEFAZ oficial...");
            TRetConsStatServ retornoSefaz = Nfe.statusServico(configSefaz, DocumentoEnum.NFCE);

            System.out.println("📩 Resposta recebida! Código: " + retornoSefaz.getCStat());

            if ("107".equals(retornoSefaz.getCStat())) {
                return ResponseEntity.ok(Map.of("status", "ONLINE", "mensagem", "SEFAZ OK: " + retornoSefaz.getXMotivo()));
            } else {
                return ResponseEntity.ok(Map.of("status", "OFFLINE", "mensagem", "SEFAZ Recusou: " + retornoSefaz.getXMotivo()));
            }

        } catch (Exception e) {
            System.out.println("🚨 ERRO CRÍTICO NO JAVA: " + e.getMessage());
            e.printStackTrace(); // 👈 Isso vai imprimir a "pilha" do erro completa no console!
            return ResponseEntity.badRequest().body(Map.of("status", "ERRO", "mensagem", e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 DOWNLOAD/VISUALIZAÇÃO DO DANFE (PDF DO PDV - O CUPOM INTELIGENTE)
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
            System.err.println("[ERRO - GERAR PDF] " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // =======================================================================
    // 🚀 DOWNLOAD DO XML (Motor 2026 Integrado)
    // =======================================================================
    @GetMapping("/{nfeId}/xml")
    public ResponseEntity<byte[]> baixarXml(@PathVariable Long nfeId) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            String diretorioXml = System.getProperty("user.dir") + "/nfe_xmls/";
            Path caminhoArquivo = Paths.get(diretorioXml + nota.getChaveAcesso() + ".xml");

            if (!Files.exists(caminhoArquivo)) {
                throw new Exception("O arquivo XML físico não foi encontrado no servidor.");
            }

            byte[] xmlBytes = Files.readAllBytes(caminhoArquivo);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nota.getChaveAcesso() + ".xml")
                    .contentType(org.springframework.http.MediaType.APPLICATION_XML)
                    .body(xmlBytes);
        } catch (Exception e) {
            System.err.println("[ERRO - BAIXAR XML] " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // =======================================================================
    // 🚀 EMISSÃO AVANÇADA (TELA DEDICADA DE NOTA A4)
    // =======================================================================
    @PostMapping("/emitir-completa")
    public ResponseEntity<?> emitirNfeCompleta(@RequestBody com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO request) {
        try {
            System.out.println("Recebendo DTO da NF-e Avançada: " + request.getNaturezaOperacao());
            Map<String, Object> respostaSefaz = nfeService.emitirNfeAvancada(request);
            return ResponseEntity.ok(respostaSefaz);
        } catch (Exception e) {
            System.err.println("[ERRO - EMISSÃO AVANÇADA] " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao emitir NF-e: " + e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 BAIXAR PDF (DANFE) DA NOTA AVULSA
    // =======================================================================
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
            System.err.println("[ERRO - DANFE AVULSA] " + e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    // =======================================================================
    // 🚀 ENVIAR XML PARA O CONTADOR
    // =======================================================================
    @PostMapping("/{nfeId}/enviar-contador")
    public ResponseEntity<?> enviarParaContador(@PathVariable Long nfeId, @RequestParam String email) {
        try {
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            emailFiscalService.enviarXmlContador(nota, email);

            return ResponseEntity.ok(Map.of("message", "E-mail enviado com sucesso!"));
        } catch (Exception e) {
            System.err.println("[ERRO - EMAIL CONTADOR] " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao enviar e-mail: " + e.getMessage()));
        }
    }

    // =======================================================================
    // 🚀 ENVIAR LOTE MENSAL (FECHAMENTO)
    // =======================================================================
    @PostMapping("/enviar-lote-contador")
    public ResponseEntity<?> enviarLoteMensal(
            @RequestParam String email,
            @RequestParam String mesAno,
            @RequestParam(required = false, defaultValue = "Segue em anexo o fechamento fiscal.") String mensagem,
            @RequestBody List<Long> nfeIds) {
        try {
            List<NotaFiscal> notasDoLote = notaFiscalRepository.findAllById(nfeIds);
            emailFiscalService.enviarLoteXmlContador(notasDoLote, email, mesAno, mensagem);

            return ResponseEntity.ok(Map.of("message", "Fechamento enviado com sucesso!"));
        } catch (Exception e) {
            System.err.println("[ERRO - LOTE CONTADOR] " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao enviar lote: " + e.getMessage()));
        }
    }

    // 🚀 Adicione este endpoint no seu FiscalController.java
    @GetMapping("/testar-email")
    public ResponseEntity<?> verificarStatusEmail() {
        try {
            emailFiscalService.testarConexaoEmail();
            return ResponseEntity.ok(Map.of(
                    "status", "ONLINE",
                    "mensagem", "Conexão com o servidor de E-mail estabelecida com sucesso!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERRO",
                    "mensagem", "Falha na autenticação: Verifique a senha de app e o servidor SMTP."
            ));
        }
    }
}