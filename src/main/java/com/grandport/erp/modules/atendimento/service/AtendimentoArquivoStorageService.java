package com.grandport.erp.modules.atendimento.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class AtendimentoArquivoStorageService {

    private static final String DIRETORIO = "uploads/atendimento/";

    public AtendimentoArquivoStorageService() {
        try {
            Files.createDirectories(Paths.get(DIRETORIO));
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de anexos do atendimento.", e);
        }
    }

    public String salvar(MultipartFile arquivo) {
        try {
            String nomeOriginal = arquivo.getOriginalFilename() == null ? "arquivo" : arquivo.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
            String nomeArquivo = UUID.randomUUID() + "_" + nomeOriginal;
            Path destino = Paths.get(DIRETORIO + nomeArquivo);
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/atendimento/" + nomeArquivo;
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível salvar o anexo do atendimento.", e);
        }
    }
}
