package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.fiscal.model.RegraFiscal;
import com.grandport.erp.modules.fiscal.repository.RegraFiscalRepository;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RegraFiscalService {

    @Autowired
    private RegraFiscalRepository repository;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private EmpresaContextService empresaContextService;

    public List<RegraFiscal> listarTodas() {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        return repository.findAllByEmpresaIdOrderByIdDesc(empresaId);
    }

    public RegraFiscal buscarPorId(Long id) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        return repository.findByEmpresaIdAndId(empresaId, id)
                .orElseThrow(() -> new RuntimeException("Regra Fiscal não encontrada."));
    }

    public RegraFiscal salvar(RegraFiscal regraFiscal) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        // Verifica se é uma regra nova ou uma edição (antes de salvar)
        boolean isNovaRegra = (regraFiscal.getId() == null);

        if (!isNovaRegra) {
            buscarPorId(regraFiscal.getId());
        }

        regraFiscal.setEmpresaId(empresaId);

        // Aqui podemos colocar validações no futuro (ex: se o CFOP tem 4 dígitos)
        RegraFiscal salva = repository.save(regraFiscal);

        // 🚀 3. AUDITORIA: Registra a alteração na matriz tributária
        String acao = isNovaRegra ? "CRIACAO_REGRA_FISCAL" : "EDICAO_REGRA_FISCAL";
        String verbo = isNovaRegra ? "Criou" : "Atualizou";

        // Proteção caso a entidade não tenha um campo de nome claro, usamos o ID
        String identificacao = "Regra ID: " + salva.getId();

        auditoriaService.registrar("FISCAL", acao, "ALERTA: O usuário " + verbo.toLowerCase() + " uma parametrização de imposto (" + identificacao + "). As próximas notas usarão esta base.");

        return salva;
    }

    public void excluir(Long id) {
        // 🚀 Busca a regra antes de apagar para o log ficar rico em detalhes!
        RegraFiscal regraParaApagar = buscarPorId(id);

        repository.delete(regraParaApagar);

        // 🚀 4. AUDITORIA: Registra a exclusão da regra
        auditoriaService.registrar("FISCAL", "EXCLUSAO_REGRA_FISCAL", "ALERTA CRÍTICO: O usuário excluiu definitivamente a parametrização fiscal ID: " + regraParaApagar.getId());
    }
}
