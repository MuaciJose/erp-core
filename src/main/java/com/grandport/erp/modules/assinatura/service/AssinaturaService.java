package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.assinatura.dto.NovaEmpresaDTO;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AssinaturaService {

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AssinaturaService(EmpresaRepository empresaRepository, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Empresa registarNovaEmpresa(NovaEmpresaDTO dto) {
        // 1. Validação Tática
        if (empresaRepository.existsByCnpj(dto.cnpj())) {
            throw new RuntimeException("Operação Negada: Já existe uma empresa registrada com este CNPJ.");
        }

        // 🚀 Verificação direta para nulo (sem o isPresent)
        if (usuarioRepository.findByUsername(dto.emailAdmin()) != null) {
            throw new RuntimeException("Operação Negada: Este login/e-mail já está em uso por outro usuário.");
        }

        // 2. Cria o Quartel-General (A Empresa)
        Empresa empresa = new Empresa();
        empresa.setRazaoSocial(dto.razaoSocial());
        empresa.setCnpj(dto.cnpj());
        empresa.setEmailContato(dto.emailAdmin());
        empresa.setTelefone(dto.telefone());

        Empresa empresaSalva = empresaRepository.save(empresa);

        // 3. Cria o General (O Usuário Admin da nova empresa)
        Usuario admin = new Usuario();

        admin.setNomeCompleto(dto.nomeAdmin());
        admin.setUsername(dto.emailAdmin()); // Onde vai ficar salvo o e-mail de login
        admin.setSenha(passwordEncoder.encode(dto.senhaAdmin()));

        // O motor do SaaS ativado
        admin.setEmpresaId(empresaSalva.getId());

        // 🚀 O ARSENAL COMPLETO: Dá o crachá de acesso total absoluto ao dono da nova empresa!
        admin.setPermissoes(java.util.Arrays.asList(
                "dash", "pdv", "vendas", "orcamentos", "fila-caixa", "caixa", "relatorio-comissoes",
                "estoque", "marcas", "ajuste_estoque", "compras", "previsao", "faltas",
                "contas-pagar", "contas-receber", "bancos", "conciliacao", "plano-contas", "dre",
                "parceiros", "usuarios", "auditoria", "fiscal", "configuracoes", "calculadora", "recibo-avulso","historico-recibos","ncm", "whatsapp",
                "backup","regras-fiscais","categorias","gerenciador-nfe","emitir-nfe-avulsa","manual","revisoes","crm","etiquetas",
                "os","servicos","listagem-os","checklist","curva-abc","fluxo-caixa-projecao"
        ));

        usuarioRepository.save(admin);

        return empresaSalva;
    }
}