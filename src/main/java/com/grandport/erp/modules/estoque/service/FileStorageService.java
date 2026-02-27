package com.grandport.erp.modules.estoque.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads/produtos");

    public String salvarArquivo(MultipartFile arquivo) {
        try {
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }
            
            // Geramos um nome único para o arquivo usando UUID
            String nomeArquivo = UUID.randomUUID().toString() + "_" + arquivo.getOriginalFilename();
            Files.copy(arquivo.getInputStream(), this.root.resolve(nomeArquivo));
            
            return nomeArquivo; // Retornamos o nome para salvar no banco
        } catch (Exception e) {
            throw new RuntimeException("Não foi possível salvar a imagem: " + e.getMessage());
        }
    }
}
