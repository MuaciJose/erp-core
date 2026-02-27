package com.grandport.erp;

import com.grandport.erp.modules.usuario.model.Role;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ErpCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpCoreApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repository.findByUsername("admin") == null) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setSenha(passwordEncoder.encode("admin123")); // Senha criptografada
                admin.setNomeCompleto("Administrador do Sistema");
                admin.setRole(Role.ADMIN);
                repository.save(admin);
                System.out.println(">>> Usuário ADMIN criado com sucesso! Use: admin / admin123");
            }
        };
    }
}
