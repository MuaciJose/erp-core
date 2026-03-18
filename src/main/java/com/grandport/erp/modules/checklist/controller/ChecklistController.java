package com.grandport.erp.modules.checklist.controller;

import com.grandport.erp.modules.arquivos.service.FotoStorageService;
import com.grandport.erp.modules.checklist.dto.ChecklistRequestDTO;
import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.checklist.repository.ChecklistRepository;
import com.grandport.erp.modules.checklist.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // 🚀 IMPORT NOVO AQUI!
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private ChecklistRepository checklistRepository;

    @Autowired
    private FotoStorageService fotoStorageService;

    // 🚀 O Spring puxa automaticamente o endereço que estiver no application.yml
    @Value("${app.api.base-url}")
    private String baseUrl;

    @PostMapping
    public ResponseEntity<ChecklistVeiculo> criar(@RequestBody ChecklistRequestDTO dto) {
        return ResponseEntity.ok(checklistService.criar(dto));
    }

    // =========================================================
    // 🚀 ROTA PARA RECEBER AS FOTOS (Preparada para o Cliente!)
    // =========================================================
    @PostMapping("/{id}/fotos")
    public ResponseEntity<String> uploadFotoVistoria(@PathVariable Long id, @RequestParam("foto") MultipartFile foto) {
        try {
            // 1. Usa o seu método salvarFoto que você criou no Service
            String caminhoRelativo = fotoStorageService.salvarFoto(foto);

            // 2. Busca o Checklist no banco de dados
            ChecklistVeiculo checklist = checklistService.buscarPorId(id);

            // 3. Monta a URL pública usando a variável inteligente
            // Se estiver no seu PC: http://192.168.1.104:8080/uploads/checklists/...
            // Se estiver no cliente: https://api.oficina.com.br/uploads/checklists/...
            String urlFotoCompleta = baseUrl + caminhoRelativo;

            // 4. Adiciona a URL na lista de fotos do Checklist e salva
            checklist.getFotos().add(urlFotoCompleta);
            checklistRepository.save(checklist);

            return ResponseEntity.ok("Foto salva com sucesso!");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao salvar foto: " + e.getMessage());
        }
    }

    @GetMapping("/veiculo/{veiculoId}")
    public ResponseEntity<List<ChecklistVeiculo>> listarPorVeiculo(@PathVariable Long veiculoId) {
        return ResponseEntity.ok(checklistService.listarPorVeiculo(veiculoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChecklistVeiculo> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(checklistService.buscarPorId(id));
    }

    // =========================================================
    // 🖋️ ROTA PARA RECEBER A ASSINATURA DIGITAL DO CLIENTE!
    // =========================================================
    @PostMapping("/{id}/assinatura")
    public ResponseEntity<String> uploadAssinatura(@PathVariable Long id, @RequestParam("assinatura") MultipartFile assinatura) {
        try {
            // 1. Usa o SEU método que já está pronto para salvar imagens
            String caminhoRelativo = fotoStorageService.salvarFoto(assinatura);

            // 2. Busca o Checklist no banco de dados
            ChecklistVeiculo checklist = checklistService.buscarPorId(id);

            // 3. Monta a URL pública (igual fizemos com as fotos)
            String urlAssinaturaCompleta = baseUrl + caminhoRelativo;

            // 4. Salva o link da assinatura no campo específico que você já tinha criado!
            checklist.setUrlAssinaturaCliente(urlAssinaturaCompleta);
            checklistRepository.save(checklist);

            return ResponseEntity.ok("Assinatura salva com sucesso!");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao salvar assinatura: " + e.getMessage());
        }
    }

    @Autowired
    private com.grandport.erp.modules.checklist.service.LaudoVistoriaService laudoVistoriaService;

    // =========================================================
    // 🖨️ ROTA PARA BAIXAR O LAUDO DE VISTORIA EM PDF
    // =========================================================
    @GetMapping("/{id}/laudo")
    public ResponseEntity<byte[]> imprimirLaudo(@PathVariable Long id) {
        try {
            byte[] relatorioPdf = laudoVistoriaService.gerarLaudoPdf(id);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "inline; filename=laudo_vistoria_" + id + ".pdf")
                    .body(relatorioPdf);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}