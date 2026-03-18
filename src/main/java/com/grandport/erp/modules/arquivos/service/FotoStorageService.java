package com.grandport.erp.modules.arquivos.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FotoStorageService {

    // Pasta física onde as fotos serão salvas no seu computador/servidor
    private final String DIRETORIO_FOTOS = "uploads/checklists/";

    public FotoStorageService() {
        // Cria a pasta automaticamente quando o sistema iniciar, caso ela não exista
        try {
            Files.createDirectories(Paths.get(DIRETORIO_FOTOS));
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de fotos.", e);
        }
    }

    public String salvarFoto(MultipartFile arquivo) {
        try {
            // 1. Gera um nome único para a foto (ex: 550e8400-e29b-41d4-a716-446655440000.jpg)
            String extensao = arquivo.getOriginalFilename().substring(arquivo.getOriginalFilename().lastIndexOf("."));
            String nomeArquivo = UUID.randomUUID().toString() + extensao;

            // 2. Define o caminho completo
            Path caminhoDestino = Paths.get(DIRETORIO_FOTOS + nomeArquivo);

            // 3. Salva o arquivo fisicamente na pasta
            Files.copy(arquivo.getInputStream(), caminhoDestino, StandardCopyOption.REPLACE_EXISTING);

            // 4. Retorna a URL relativa que o React vai usar para acessar a imagem
            return "/uploads/checklists/" + nomeArquivo;

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar a imagem: " + e.getMessage(), e);
        }
    }
}