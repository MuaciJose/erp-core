package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.checklist.repository.ChecklistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ManutencaoService {

    @Autowired
    private ChecklistRepository checklistRepository;

    @Transactional
    public Map<String, Object> limparFotosVistoriasAntigas(int mesesIdade) {
        // 1. Calcula a data de corte (Ex: Tudo que for mais velho que 24 meses)
        LocalDateTime dataCorte = LocalDateTime.now().minusMonths(mesesIdade);
        List<ChecklistVeiculo> checklistsAntigos = checklistRepository.findByDataRegistroBefore(dataCorte);

        int fotosApagadas = 0;
        long bytesLiberados = 0;
        String dataHoje = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // 2. O Robô começa a varredura
        for (ChecklistVeiculo chk : checklistsAntigos) {
            if (chk.getFotos() != null && !chk.getFotos().isEmpty()) {

                for (String caminhoFoto : chk.getFotos()) {
                    try {
                        // Converte o caminho do banco (ex: /uploads/...) para o caminho real no Windows/Linux
                        // Ajuste esse "user.dir" se a sua pasta de uploads ficar em outro lugar
                        Path pathOriginal = Paths.get(System.getProperty("user.dir"), caminhoFoto);
                        File arquivoFoto = pathOriginal.toFile();

                        if (arquivoFoto.exists()) {
                            bytesLiberados += arquivoFoto.length();
                            arquivoFoto.delete(); // 🔥 Apaga o arquivo físico do HD!
                            fotosApagadas++;
                        }
                    } catch (Exception e) {
                        System.out.println("Erro ao apagar foto: " + caminhoFoto);
                    }
                }

                // 3. Limpa a lista no banco e deixa um recado no prontuário
                chk.getFotos().clear();

                String obsAtual = chk.getObservacoesGerais() != null ? chk.getObservacoesGerais() : "";
                chk.setObservacoesGerais(obsAtual + "\n\n[SISTEMA]: Evidências fotográficas removidas automaticamente em " + dataHoje + " para liberar espaço no servidor.");

                checklistRepository.save(chk);
            }
        }

        // 4. Prepara o relatório final para mostrar na tela do cliente
        double megabytes = bytesLiberados / (1024.0 * 1024.0);

        Map<String, Object> relatorio = new HashMap<>();
        relatorio.put("fotosApagadas", fotosApagadas);
        relatorio.put("espacoLiberadoMb", String.format("%.2f", megabytes));
        relatorio.put("checklistsAfetados", checklistsAntigos.size());

        return relatorio;
    }
}