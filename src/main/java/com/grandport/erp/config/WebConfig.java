package com.grandport.erp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // --- Mantendo sua lógica original ---
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        // Pega o caminho absoluto da pasta no seu servidor
        String caminhoUploads = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // --- Atualização Segura ---
        // Usamos o caminho absoluto extraído do seu 'uploadDir'
        // O sufixo '/' no final é essencial para o Spring entender que é um diretório
        String resourcePath = "file:" + uploadPath + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourcePath);

        // Dica: Se você usa o Spring Security, lembre-se de liberar
        // a rota "/uploads/**" no SecurityFilterChain para que as fotos apareçam!
    }
}