package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.assinatura.dto.AtualizarLicencaModuloDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaCobrancaComposicaoDTO;
import com.grandport.erp.modules.assinatura.dto.ModuloLicencaResumoDTO;
import com.grandport.erp.modules.assinatura.model.LicencaModuloEmpresa;
import com.grandport.erp.modules.assinatura.repository.LicencaModuloEmpresaRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LicenciamentoModuloService {

    private final EmpresaRepository empresaRepository;
    private final LicencaModuloEmpresaRepository licencaModuloEmpresaRepository;
    private final AuditoriaService auditoriaService;

    private static final List<ModuloCatalogoItem> CATALOGO = List.of(
            item("dash", "Dashboard", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("pdv", "PDV", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("vendas", "Vendas", "Comercial", "ESSENCIAL", BigDecimal.ZERO),
            item("checklist", "Checklist", "Servicos", "ESSENCIAL", BigDecimal.ZERO),
            item("os", "Ordem de Servico", "Servicos", "ESSENCIAL", BigDecimal.ZERO),
            item("listagem-os", "Listagem de OS", "Servicos", "ESSENCIAL", BigDecimal.ZERO),
            item("fila-caixa", "Fila do Caixa", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("caixa", "Caixa", "Financeiro", "ESSENCIAL", BigDecimal.ZERO),
            item("estoque", "Estoque", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("marcas", "Marcas", "Cadastros", "ESSENCIAL", BigDecimal.ZERO),
            item("categorias", "Categorias", "Cadastros", "ESSENCIAL", BigDecimal.ZERO),
            item("ajuste_estoque", "Ajuste de Estoque", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("parceiros", "Parceiros", "Cadastros", "ESSENCIAL", BigDecimal.ZERO),
            item("servicos", "Servicos", "Cadastros", "ESSENCIAL", BigDecimal.ZERO),
            item("agenda", "Agenda", "Operacao", "ESSENCIAL", BigDecimal.ZERO),
            item("manual", "Manual", "Sistema", "ESSENCIAL", BigDecimal.ZERO),
            item("usuarios", "Usuarios", "Sistema", "ESSENCIAL", BigDecimal.ZERO),
            item("configuracoes", "Configuracoes", "Sistema", "ESSENCIAL", BigDecimal.ZERO),
            item("orcamentos", "Orcamentos", "Comercial", "PROFISSIONAL", BigDecimal.ZERO),
            item("relatorio-comissoes", "Relatorio de Comissoes", "Comercial", "PROFISSIONAL", BigDecimal.ZERO),
            item("crm", "CRM", "Comercial", "PROFISSIONAL", BigDecimal.ZERO),
            item("revisoes", "Revisoes", "Comercial", "PROFISSIONAL", BigDecimal.ZERO),
            item("whatsapp", "WhatsApp", "Comercial", "PROFISSIONAL", new BigDecimal("39.90")),
            item("compras", "Compras", "Operacao", "PROFISSIONAL", BigDecimal.ZERO),
            item("previsao", "Previsao", "Operacao", "PROFISSIONAL", BigDecimal.ZERO),
            item("faltas", "Faltas", "Gestao", "PROFISSIONAL", new BigDecimal("29.90")),
            item("curva-abc", "Curva ABC", "Operacao", "PROFISSIONAL", new BigDecimal("19.90")),
            item("etiquetas", "Etiquetas", "Operacao", "PROFISSIONAL", new BigDecimal("14.90")),
            item("contas-pagar", "Contas a Pagar", "Financeiro", "PROFISSIONAL", BigDecimal.ZERO),
            item("contas-receber", "Contas a Receber", "Financeiro", "PROFISSIONAL", BigDecimal.ZERO),
            item("bancos", "Bancos", "Financeiro", "PROFISSIONAL", BigDecimal.ZERO),
            item("conciliacao", "Conciliacao", "Financeiro", "PROFISSIONAL", new BigDecimal("49.90")),
            item("recibo-avulso", "Recibo Avulso", "Financeiro", "PROFISSIONAL", new BigDecimal("12.90")),
            item("historico-recibos", "Historico de Recibos", "Financeiro", "PROFISSIONAL", BigDecimal.ZERO),
            item("plano-contas", "Plano de Contas", "Financeiro", "PREMIUM", BigDecimal.ZERO),
            item("dre", "DRE", "Financeiro", "PREMIUM", BigDecimal.ZERO),
            item("fluxo-caixa-projecao", "Fluxo de Caixa", "Financeiro", "PREMIUM", new BigDecimal("39.90")),
            item("fiscal", "Fiscal", "Fiscal", "PREMIUM", new BigDecimal("149.90")),
            item("regras-fiscais", "Regras Fiscais", "Fiscal", "PREMIUM", BigDecimal.ZERO),
            item("gerenciador-nfe", "Gerenciador NF-e", "Fiscal", "PREMIUM", BigDecimal.ZERO),
            item("emitir-nfe-avulsa", "NF-e Avulsa", "Fiscal", "PREMIUM", new BigDecimal("29.90")),
            item("auditoria", "Auditoria", "Governanca", "PREMIUM", new BigDecimal("19.90")),
            item("calculadora", "Calculadora", "Utilitarios", "ESSENCIAL", BigDecimal.ZERO),
            item("ncm", "NCM", "Fiscal", "PREMIUM", BigDecimal.ZERO),
            item("backup", "Backup", "Sistema", "PREMIUM", new BigDecimal("24.90"))
    );

    private static ModuloCatalogoItem item(String modulo, String nome, String categoria, String planoBase, BigDecimal valorBaseMensal) {
        return new ModuloCatalogoItem(modulo, nome, categoria, planoBase, valorBaseMensal);
    }

    @Transactional(readOnly = true)
    public Set<String> modulosLiberados(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
        String plano = empresa == null ? "ESSENCIAL" : empresa.getPlano();
        Set<String> modulos = new LinkedHashSet<>(modulosDoPlano(plano));
        for (LicencaModuloEmpresa override : licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId)) {
            String modulo = normalizarModulo(override.getModulo());
            if (Boolean.TRUE.equals(override.getAtivo()) && !Boolean.TRUE.equals(override.getBloqueadoComercial())) {
                modulos.add(modulo);
            } else {
                modulos.remove(modulo);
            }
        }
        return modulos;
    }

    @Transactional(readOnly = true)
    public List<ModuloLicencaResumoDTO> listarLicencasEmpresa(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        String plano = empresa.getPlano();
        Set<String> base = modulosDoPlano(plano);
        Map<String, LicencaModuloEmpresa> overrides = licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId).stream()
                .collect(Collectors.toMap(item -> normalizarModulo(item.getModulo()), item -> item, (a, b) -> b, LinkedHashMap::new));

        List<ModuloLicencaResumoDTO> resposta = new ArrayList<>();
        for (ModuloCatalogoItem item : CATALOGO) {
            boolean disponivelNoPlano = base.contains(item.modulo());
            LicencaModuloEmpresa override = overrides.get(item.modulo());
            boolean bloqueadoComercial = override != null && Boolean.TRUE.equals(override.getBloqueadoComercial());
            boolean ativo = (override != null ? Boolean.TRUE.equals(override.getAtivo()) : disponivelNoPlano) && !bloqueadoComercial;
            String origem = override == null
                    ? "PLANO"
                    : bloqueadoComercial
                        ? "BLOQUEIO_COMERCIAL"
                        : (ativo ? "LIBERACAO_MANUAL" : "BLOQUEIO_MANUAL");
            boolean trialAtivo = override != null && override.getTrialAte() != null && !override.getTrialAte().isBefore(LocalDate.now());
            resposta.add(new ModuloLicencaResumoDTO(
                    item.modulo(),
                    item.nomeExibicao(),
                    item.categoria(),
                    disponivelNoPlano,
                    ativo,
                    origem,
                    override == null ? null : override.getObservacao(),
                    item.valorBaseMensal().doubleValue(),
                    override == null || override.getValorMensalExtra() == null ? item.valorBaseMensal().doubleValue() : override.getValorMensalExtra().doubleValue(),
                    trialAtivo,
                    override == null || override.getTrialAte() == null ? null : override.getTrialAte().toString(),
                    bloqueadoComercial,
                    override == null ? null : override.getMotivoBloqueioComercial(),
                    override == null || override.getUpdatedAt() == null ? null : override.getUpdatedAt().toString(),
                    override == null ? null : override.getUpdatedBy()
            ));
        }
        return resposta;
    }

    @Transactional
    public List<ModuloLicencaResumoDTO> atualizarLicencaEmpresa(Long empresaId, AtualizarLicencaModuloDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        if (dto == null || dto.modulo() == null || dto.modulo().isBlank()) {
            throw new RuntimeException("Informe o módulo que será ajustado.");
        }
        if (dto.ativo() == null) {
            throw new RuntimeException("Informe se o módulo deve ficar ativo ou bloqueado.");
        }

        String modulo = normalizarModulo(dto.modulo());
        ModuloCatalogoItem catalogo = CATALOGO.stream()
                .filter(item -> item.modulo().equals(modulo))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Módulo não reconhecido: " + dto.modulo()));

        LicencaModuloEmpresa licenca = licencaModuloEmpresaRepository.findByEmpresaIdAndModuloIgnoreCase(empresaId, modulo)
                .orElseGet(LicencaModuloEmpresa::new);
        licenca.setEmpresaId(empresaId);
        licenca.setModulo(modulo);
        licenca.setAtivo(dto.ativo());
        licenca.setObservacao(dto.observacao() == null || dto.observacao().isBlank() ? null : dto.observacao().trim());
        licenca.setValorMensalExtra(dto.valorMensalExtra() == null ? catalogo.valorBaseMensal() : BigDecimal.valueOf(dto.valorMensalExtra()));
        licenca.setTrialAte(dto.trialAte() == null || dto.trialAte().isBlank() ? null : LocalDate.parse(dto.trialAte()));
        licenca.setBloqueadoComercial(Boolean.TRUE.equals(dto.bloqueadoComercial()));
        licenca.setMotivoBloqueioComercial(dto.motivoBloqueioComercial() == null || dto.motivoBloqueioComercial().isBlank() ? null : dto.motivoBloqueioComercial().trim());
        licenca.setUpdatedAt(LocalDateTime.now());
        licenca.setUpdatedBy(usuarioAtual());
        licencaModuloEmpresaRepository.save(licenca);

        String detalhes = "Empresa " + empresa.getRazaoSocial()
                + " teve o módulo '" + catalogo.nomeExibicao() + "' ajustado para "
                + (Boolean.TRUE.equals(dto.ativo()) ? "LIBERADO" : "BLOQUEADO")
                + ". Valor extra: R$ " + licenca.getValorMensalExtra()
                + (licenca.getTrialAte() == null ? "" : ". Trial até: " + licenca.getTrialAte())
                + (Boolean.TRUE.equals(licenca.getBloqueadoComercial()) ? ". Bloqueio comercial ativo." : "")
                + (licenca.getObservacao() == null ? "." : ". Motivo: " + licenca.getObservacao());
        auditoriaService.registrar("SAAS", "LICENCA_MODULO", detalhes);

        return listarLicencasEmpresa(empresaId);
    }

    @Transactional(readOnly = true)
    public Set<String> modulosDoPlano(String plano) {
        return CATALOGO.stream()
                .filter(item -> nivelPlano(plano) >= nivelPlano(item.planoBase()))
                .map(ModuloCatalogoItem::modulo)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    @Transactional(readOnly = true)
    public BigDecimal somarReceitaExtrasMensal() {
        return licencaModuloEmpresaRepository.somarExtrasAtivos();
    }

    @Transactional(readOnly = true)
    public long totalTrialsAtivos() {
        return licencaModuloEmpresaRepository.countByAtivoTrueAndTrialAteGreaterThanEqual(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public long totalModulosExtrasAtivos() {
        return licencaModuloEmpresaRepository.countByAtivoTrueAndValorMensalExtraGreaterThan(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public long totalModulosBloqueadosComercialmente() {
        return licencaModuloEmpresaRepository.findAll().stream()
                .filter(item -> Boolean.TRUE.equals(item.getBloqueadoComercial()))
                .count();
    }

    @Transactional(readOnly = true)
    public EmpresaCobrancaComposicaoDTO montarComposicaoCobrancaEmpresa(Empresa empresa) {
        BigDecimal valorPlanoBase = empresa == null || empresa.getValorMensal() == null
                ? BigDecimal.ZERO
                : empresa.getValorMensal();
        BigDecimal valorExtras = empresa == null
                ? BigDecimal.ZERO
                : somarExtrasCobraveisEmpresa(empresa.getId());
        return new EmpresaCobrancaComposicaoDTO(
                valorPlanoBase.doubleValue(),
                valorExtras.doubleValue(),
                valorPlanoBase.add(valorExtras).doubleValue(),
                empresa == null ? List.of() : listarExtrasCobraveisEmpresa(empresa.getId())
        );
    }

    @Transactional(readOnly = true)
    public BigDecimal somarExtrasCobraveisEmpresa(Long empresaId) {
        return licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId).stream()
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .filter(item -> item.getTrialAte() == null || item.getTrialAte().isBefore(LocalDate.now()))
                .map(item -> item.getValorMensalExtra() == null ? BigDecimal.ZERO : item.getValorMensalExtra())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public List<String> listarExtrasCobraveisEmpresa(Long empresaId) {
        Map<String, ModuloCatalogoItem> catalogo = CATALOGO.stream()
                .collect(Collectors.toMap(ModuloCatalogoItem::modulo, item -> item));

        return licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId).stream()
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .filter(item -> item.getTrialAte() == null || item.getTrialAte().isBefore(LocalDate.now()))
                .filter(item -> item.getValorMensalExtra() != null && item.getValorMensalExtra().compareTo(BigDecimal.ZERO) > 0)
                .map(item -> {
                    ModuloCatalogoItem modulo = catalogo.get(normalizarModulo(item.getModulo()));
                    String nome = modulo == null ? item.getModulo() : modulo.nomeExibicao();
                    return nome + " (R$ " + item.getValorMensalExtra() + ")";
                })
                .toList();
    }

    @Transactional
    public int expirarTrialsVencidos() {
        LocalDate hoje = LocalDate.now();
        int expirados = 0;

        for (LicencaModuloEmpresa licenca : licencaModuloEmpresaRepository.findByAtivoTrueAndTrialAteBefore(hoje)) {
            Empresa empresa = empresaRepository.findById(licenca.getEmpresaId()).orElse(null);
            if (empresa == null) {
                continue;
            }

            boolean jaNoPlano = modulosDoPlano(empresa.getPlano()).contains(normalizarModulo(licenca.getModulo()));
            licenca.setTrialAte(null);

            if (!jaNoPlano) {
                licenca.setAtivo(false);
                licenca.setBloqueadoComercial(false);
                licenca.setMotivoBloqueioComercial(null);
                String observacaoAtual = licenca.getObservacao() == null ? "" : licenca.getObservacao().trim();
                String complemento = "Trial expirado automaticamente em " + hoje + ".";
                licenca.setObservacao(observacaoAtual.isBlank() ? complemento : observacaoAtual + " " + complemento);
                expirados++;
                auditoriaService.registrar(
                        "SAAS",
                        "TRIAL_EXPIRADO",
                        "Empresa " + empresa.getRazaoSocial() + " perdeu acesso ao módulo " + licenca.getModulo() + " por fim do trial."
                );
            } else {
                auditoriaService.registrar(
                        "SAAS",
                        "TRIAL_ENCERRADO",
                        "Empresa " + empresa.getRazaoSocial() + " concluiu trial do módulo " + licenca.getModulo() + ", mantendo acesso pelo plano."
                );
            }

            licenca.setUpdatedAt(LocalDateTime.now());
            licenca.setUpdatedBy("SCHEDULER");
            licencaModuloEmpresaRepository.save(licenca);
        }

        return expirados;
    }

    @Transactional
    public int bloquearAddonsPorInadimplencia(Long empresaId, String motivo) {
        int atualizados = 0;
        String motivoFinal = (motivo == null || motivo.isBlank())
                ? "Bloqueio automático por inadimplência de add-ons."
                : motivo.trim();

        for (LicencaModuloEmpresa licenca : licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId)) {
            if (!Boolean.TRUE.equals(licenca.getAtivo())) {
                continue;
            }
            if (licenca.getValorMensalExtra() == null || licenca.getValorMensalExtra().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (Boolean.TRUE.equals(licenca.getBloqueadoComercial())
                    && motivoFinal.equals(licenca.getMotivoBloqueioComercial())) {
                continue;
            }

            licenca.setBloqueadoComercial(true);
            licenca.setMotivoBloqueioComercial(motivoFinal);
            licenca.setUpdatedAt(LocalDateTime.now());
            licenca.setUpdatedBy("SCHEDULER");
            licencaModuloEmpresaRepository.save(licenca);
            atualizados++;
        }

        return atualizados;
    }

    @Transactional
    public int liberarBloqueiosAutomaticosPorPagamento(Long empresaId) {
        int atualizados = 0;

        for (LicencaModuloEmpresa licenca : licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(empresaId)) {
            if (!Boolean.TRUE.equals(licenca.getBloqueadoComercial())) {
                continue;
            }
            String motivo = licenca.getMotivoBloqueioComercial();
            if (motivo == null || !motivo.startsWith("Bloqueio automático por inadimplência")) {
                continue;
            }

            licenca.setBloqueadoComercial(false);
            licenca.setMotivoBloqueioComercial(null);
            licenca.setUpdatedAt(LocalDateTime.now());
            licenca.setUpdatedBy("SISTEMA_PAGAMENTO");
            licencaModuloEmpresaRepository.save(licenca);
            atualizados++;
        }

        return atualizados;
    }

    private int nivelPlano(String plano) {
        String valor = plano == null ? "ESSENCIAL" : plano.trim().toUpperCase(Locale.ROOT);
        return switch (valor) {
            case "PREMIUM" -> 3;
            case "PROFISSIONAL" -> 2;
            default -> 1;
        };
    }

    private String normalizarModulo(String modulo) {
        return modulo == null ? "" : modulo.trim().toLowerCase(Locale.ROOT);
    }

    private String usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SISTEMA";
        }
        return authentication.getName();
    }

    private record ModuloCatalogoItem(String modulo, String nomeExibicao, String categoria, String planoBase, BigDecimal valorBaseMensal) {}
}
