package com.grandport.erp;

import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@EnableScheduling
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
@Slf4j
public class ErpCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpCoreApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.enabled:false}") boolean bootstrapAdminEnabled,
            @Value("${app.bootstrap-admin.username:}") String bootstrapUsername,
            @Value("${app.bootstrap-admin.password:}") String bootstrapPassword) {
        return args -> {
            if (!bootstrapAdminEnabled) {
                log.info("Bootstrap de administrador desabilitado.");
                return;
            }

            if (bootstrapUsername.isBlank() || bootstrapPassword.isBlank()) {
                log.warn("Bootstrap de administrador habilitado sem credenciais completas. Seed ignorado.");
                return;
            }

            List<String> todasPermissoes = Arrays.asList(
                    "dash", "pdv", "vendas", "orcamentos", "fila-caixa", "caixa", "relatorio-comissoes",
                    "estoque", "marcas", "ajuste_estoque", "compras", "previsao", "faltas",
                    "contas-pagar", "contas-receber", "bancos", "conciliacao", "plano-contas", "dre",
                    "parceiros", "usuarios", "auditoria", "fiscal", "configuracoes", "calculadora", "recibo-avulso","historico-recibos","ncm", "whatsapp",
                    "backup","regras-fiscais","categorias","gerenciador-nfe","emitir-nfe-avulsa","manual","revisoes","crm","etiquetas",
                    "os","servicos","listagem-os","checklist","curva-abc","fluxo-caixa-projecao"
            );

            Usuario admin = repository.findByUsername(bootstrapUsername);

            if (admin == null) {
                admin = new Usuario();
                admin.setUsername(bootstrapUsername);
                admin.setSenha(passwordEncoder.encode(bootstrapPassword));
                admin.setNomeCompleto("Administrador do Sistema");
                admin.setPermissoes(todasPermissoes);
                admin.setEmpresaId(1L);

                repository.save(admin);
                log.warn("Usuário bootstrap [{}] criado. Desabilite BOOTSTRAP_ADMIN_ENABLED após o provisionamento.", bootstrapUsername);
            } else {
                admin.setPermissoes(todasPermissoes);
                if (admin.getEmpresaId() == null) {
                    admin.setEmpresaId(1L);
                }

                repository.save(admin);
                log.info("Permissões do usuário bootstrap [{}] atualizadas.", bootstrapUsername);
            }
        };
    }
}
