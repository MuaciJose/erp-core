package com.grandport.erp;

import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
@EnableScheduling
public class ErpCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpCoreApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            // LISTA ATUALIZADA: Agora inclui "relatorio-comissoes"
            List<String> todasPermissoes = Arrays.asList(
                    "dash", "pdv", "vendas", "orcamentos", "fila-caixa", "caixa", "relatorio-comissoes", // <-- ADICIONADO AQUI
                    "estoque", "marcas", "ajuste_estoque", "compras", "previsao", "faltas",
                    "contas-pagar", "contas-receber", "bancos", "conciliacao", "plano-contas", "dre",
                    "parceiros", "usuarios", "auditoria", "fiscal", "configuracoes", "calculadora", "recibo-avulso","historico-recibos","ncm", "whatsapp",
                    "backup","regras-fiscais","categorias"
            );

            Usuario admin = (Usuario) repository.findByUsername("admin");

            if (admin == null) {
                admin = new Usuario();
                admin.setUsername("admin");
                admin.setSenha(passwordEncoder.encode("admin123"));
                admin.setNomeCompleto("Administrador do Sistema");
                admin.setPermissoes(todasPermissoes);
                repository.save(admin);
                System.out.println(">>> Usuário ADMIN criado com sucesso! Use: admin / admin123");
            } else {
                admin.setPermissoes(todasPermissoes);
                repository.save(admin);
                System.out.println(">>> Permissões do usuário ADMIN atualizadas com sucesso!");
            }
        };
    }
}