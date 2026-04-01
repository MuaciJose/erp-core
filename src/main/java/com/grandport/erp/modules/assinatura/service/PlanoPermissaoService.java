package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PlanoPermissaoService {

    private final EmpresaRepository empresaRepository;

    public List<String> filtrarPermissoes(Long empresaId, List<String> permissoes) {
        if (permissoes == null) {
            return List.of();
        }

        Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
        Set<String> permitidas = permissoesPermitidasPorPlano(empresa == null ? "ESSENCIAL" : empresa.getPlano());

        return permissoes.stream()
                .filter(p -> p != null && !p.isBlank())
                .filter(permitidas::contains)
                .distinct()
                .toList();
    }

    public UsuarioDTO toDtoFiltrado(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO(usuario);
        if (usuario.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            dto.setPermissoes(filtrarPermissoes(usuario.getEmpresaId(), usuario.getPermissoes()));
            dto.setPlanoEmpresa(empresaRepository.findById(usuario.getEmpresaId()).map(Empresa::getPlano).orElse("ESSENCIAL"));
        } else {
            dto.setPlanoEmpresa("PLATFORM");
        }
        return dto;
    }

    public Collection<? extends GrantedAuthority> getAuthorities(Usuario usuario) {
        List<String> permissoes = usuario.getTipoAcesso() == TipoAcesso.PLATFORM_ADMIN
                ? (usuario.getPermissoes() == null ? List.of() : usuario.getPermissoes())
                : filtrarPermissoes(usuario.getEmpresaId(), usuario.getPermissoes());

        Set<String> authorities = new LinkedHashSet<>();
        for (String permissao : permissoes) {
            if (permissao == null || permissao.isBlank()) continue;
            String normalizada = permissao.trim().toUpperCase(Locale.ROOT);
            authorities.add("ROLE_" + normalizada);

            switch (normalizada) {
                case "USUARIOS" -> authorities.add("ROLE_ADMIN");
                case "CONFIGURACOES" -> authorities.add("ROLE_CONFIGURADOR");
                case "AUDITORIA" -> authorities.add("ROLE_AUDITORIA");
                case "CONTAS-PAGAR", "CONTAS-RECEBER", "BANCOS", "CONCILIACAO", "PLANO-CONTAS", "DRE" ->
                        authorities.add("ROLE_FINANCEIRO");
                case "VENDAS", "ORCAMENTOS", "CRM", "REVISOES" -> authorities.add("ROLE_VENDEDOR");
                case "CAIXA", "FILA-CAIXA", "PDV" -> authorities.add("ROLE_CAIXA");
                default -> {
                }
            }
        }

        if (usuario.getTipoAcesso() != null) {
            authorities.add("ROLE_" + usuario.getTipoAcesso().name());
        }

        return authorities.stream().map(SimpleGrantedAuthority::new).toList();
    }

    private Set<String> permissoesPermitidasPorPlano(String plano) {
        String valor = plano == null ? "ESSENCIAL" : plano.trim().toUpperCase(Locale.ROOT);
        Set<String> permissoes = new LinkedHashSet<>();

        permissoes.addAll(List.of(
                "dash", "pdv", "vendas", "checklist", "os", "listagem-os",
                "fila-caixa", "caixa",
                "estoque", "marcas", "categorias", "ajuste_estoque",
                "parceiros", "servicos",
                "agenda", "manual", "usuarios", "configuracoes"
        ));

        if ("PROFISSIONAL".equals(valor) || "PREMIUM".equals(valor)) {
            permissoes.addAll(List.of(
                    "orcamentos", "relatorio-comissoes",
                    "crm", "revisoes", "whatsapp",
                    "compras", "previsao", "faltas", "curva-abc", "etiquetas",
                    "contas-pagar", "contas-receber", "bancos", "conciliacao",
                    "recibo-avulso", "historico-recibos"
            ));
        }

        if ("PREMIUM".equals(valor)) {
            permissoes.addAll(List.of(
                    "plano-contas", "dre", "fluxo-caixa-projecao",
                    "fiscal", "regras-fiscais", "gerenciador-nfe", "emitir-nfe-avulsa",
                    "auditoria"
            ));
        }

        return permissoes;
    }
}
