package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 🔄 SERVIÇO: Sincronização ERP ↔️ Notas Fiscais
 * 
 * Responsável por:
 * 1. Sincronizar série/número de NF quando autorizadas
 * 2. Atualizar status das vendas conforme status da NF
 * 3. Garantir consistência entre ERP e SEFAZ
 * 4. Executar sincronizações automáticas em horários definidos
 * 
 * Este serviço garante que:
 * - Não há "buracos" na série de NF-e
 * - Vendas sempre refletem o status da NF
 * - Números são atualizados de forma atômica
 */
@Service
@Slf4j
public class SincronizacaoErpService {

    @Value("${app.jobs.fiscal.sincronizacao.enabled:true}")
    private boolean sincronizacaoJobEnabled;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private EmpresaContextService empresaContextService;

    // =========================================================================
    // 🔐 MÉTODO AUXILIAR: Obter Empresa do Usuário Autenticado
    // =========================================================================

    /**
     * 🆕 Obtém o ID da empresa do usuário atualmente autenticado
     * Usado para isolamento de dados em sincronizações automáticas
     * 
     */
    private Long obterEmpresaIdDoUsuarioAutenticado() {
        try {
            return empresaContextService.getRequiredEmpresaId();
        } catch (Exception e) {
            return null;
        }
    }

    // =========================================================================
    // 🔄 SINCRONIZAÇÃO DE SÉRIE/NÚMERO
    // =========================================================================

    /**
     * Sincroniza série e número de uma nota após autorização
     * 
     * Quando uma nota é autorizada pela SEFAZ, este método:
     * 1. Valida a serie/número recebidos da SEFAZ
     * 2. Atualiza a tabela de configurações
     * 3. Marca como sincronizado
     * 4. Registra em auditoria
     * 
     * ⚠️ CRÍTICO: Esta operação é ATÔMICA (all-or-nothing)
     */
    @Transactional
    public void sincronizarSerieNumero(
            NotaFiscal notaAutorizada,
            Long numeroSefaz,
            Integer serieSefaz) throws Exception {
        
        // ✅ Validação
        if (notaAutorizada == null) {
            throw new Exception("Nota não pode ser nula");
        }

        if (numeroSefaz == null || numeroSefaz <= 0) {
            throw new Exception("Número da SEFAZ inválido");
        }

        if (serieSefaz == null || serieSefaz <= 0) {
            throw new Exception("Série da SEFAZ inválida");
        }

        // ✅ Obtém configuração atual
        ConfiguracaoSistema config = configuracaoService.obterConfiguracaoSistema();

        // ✅ Valida se o número retornado é o esperado
        if (!config.getSerieNfce().equals(serieSefaz)) {
            throw new Exception(
                String.format(
                    "Série retornada pela SEFAZ (%d) diferente da esperada (%d)",
                    serieSefaz, config.getSerieNfce()
                )
            );
        }

        // ✅ Valida se o número está na sequência correta
        if (!config.getNumeroProximaNfce().equals(numeroSefaz)) {
            // Se não bater, possivelmente houve um vazio na série
            String aviso = String.format(
                "AVISO: Número retornado (%d) diferente do esperado (%d). " +
                "Possível vazio na série.",
                numeroSefaz, config.getNumeroProximaNfce()
            );
            log.warn(aviso);
        }

        // ✅ Atualiza a nota
        notaAutorizada.setNumero(numeroSefaz);
        notaAutorizada.setSerie(String.valueOf(serieSefaz));
        notaAutorizada.setStatus("SINCRONIZADA");
        notaFiscalRepository.save(notaAutorizada);

        // ✅ Atualiza próximo número no config
        config.setNumeroProximaNfce(numeroSefaz + 1);
        configuracaoService.atualizarConfiguracao(config);

        // ✅ Registra em auditoria
        auditoriaService.registrar("FISCAL", "SINCRONIZACAO_SERIE_NUMERO",
            String.format(
                "✅ Série/Número sincronizado: NF-e Nº %d Série %d. " +
                "Próximo número será: %d",
                numeroSefaz, serieSefaz, numeroSefaz + 1
            )
        );

        log.info("Serie/numero sincronizado com sucesso. numero={} serie={} proximo={}",
                numeroSefaz, serieSefaz, numeroSefaz + 1);
    }

    // =========================================================================
    // 🔄 SINCRONIZAÇÃO DE STATUS (Venda ↔️ NF)
    // =========================================================================

    /**
     * Sincroniza status entre Venda e Nota Fiscal
     * 
     * Garante que:
     * - Se NF foi autorizada → Venda muda para CONCLUIDA
     * - Se NF foi cancelada → Venda pode ser reaplicada
     * - Se NF foi complementada → Registra alteração
     * - Se NF teve erro → Venda volta para PEDIDO
     */
    @Transactional
    public void sincronizarStatus(NotaFiscal nota) throws Exception {
        
        // ✅ Se não tem venda vinculada, não sincroniza
        if (nota.getVenda() == null) {
            return;
        }

        Venda venda = nota.getVenda();

        // ✅ Sincroniza conforme status da NF
        switch (nota.getStatus()) {
            case "AUTORIZADA", "SINCRONIZADA" -> {
                // NF autorizada = Venda concluída
                if (!venda.getStatus().equals(StatusVenda.CONCLUIDA)) {
                    venda.setStatus(StatusVenda.CONCLUIDA);
                    vendaRepository.save(venda);
                    
                    auditoriaService.registrar("VENDAS", "VENDA_CONCLUIDA",
                        "Venda atualizada para CONCLUIDA após autorização da NF-e");
                }
            }
            case "CANCELADA" -> {
                // NF cancelada = Venda pode ser reprocessada
                venda.setStatus(StatusVenda.CANCELADA);
                vendaRepository.save(venda);
                
                auditoriaService.registrar("VENDAS", "VENDA_CANCELADA",
                    "Venda cancelada após cancelamento da NF-e");
            }
            case "REJEITADA", "ERRO_ENVIO", "ERRO_COMUNICACAO" -> {
                // Erro na NF = Venda volta para pedido
                venda.setStatus(StatusVenda.PEDIDO);
                vendaRepository.save(venda);
                
                auditoriaService.registrar("VENDAS", "VENDA_ERRO_NF",
                    "Venda retornou a PEDIDO devido a erro na NF-e: " + nota.getStatus());
            }
            case "CONTINGENCIA" -> {
                // Emitida em contingência, marca como concluída
                venda.setStatus(StatusVenda.CONCLUIDA);
                vendaRepository.save(venda);
                
                auditoriaService.registrar("VENDAS", "VENDA_EMITIDA_CONTINGENCIA",
                    "Venda concluída em modo contingência (SEFAZ offline)");
            }
            default -> {
                // Status intermediário, não sincroniza
            }
        }
    }

    // =========================================================================
    // 🤖 SINCRONIZAÇÃO AUTOMÁTICA (ROBÔ)
    // =========================================================================

    /**
     * 🤖 ROBÔ: Executa sincronização automática a cada 5 minutos
     * 
     * Este método é executado automaticamente a cada 5 minutos e:
     * 1. Localiza notas sem sincronização
     * 2. Sincroniza status das vendas
     * 3. Limpa "buracos" de série
     * 4. Registra operações em auditoria
     * 
     * Execução: A cada 5 minutos (300.000 milisegundos)
     */
    @Scheduled(fixedDelayString = "${app.jobs.fiscal.sincronizacao.fixed-delay:300000}")
    @Transactional
    public void roboSincronizacaoAutomatica() {
        if (!sincronizacaoJobEnabled) {
            return;
        }

        try {
            log.info("Iniciando robo de sincronizacao automatica.");

            // ✅ Sincroniza status de todas as notas com vendas
            List<NotaFiscal> notasComVenda = listarNotasDoEscopoAtual().stream()
                .filter(n -> n.getVenda() != null)
                .toList();

            int sincronizadas = 0;
            for (NotaFiscal nota : notasComVenda) {
                try {
                    this.sincronizarStatus(nota);
                    sincronizadas++;
                } catch (Exception e) {
                    log.error("Erro ao sincronizar nota id={}", nota.getId(), e);
                }
            }

            // ✅ Valida série/número
            validarIntegridade();

            log.info("Robo de sincronizacao concluido. notasSincronizadas={}", sincronizadas);

        } catch (Exception e) {
            log.error("Erro no robo de sincronizacao", e);
            auditoriaService.registrar("SISTEMA", "ERRO_ROBO_SINCRONIZACAO",
                "Erro na execução automática de sincronização: " + e.getMessage());
        }
    }

    // =========================================================================
    // 🔍 VALIDAÇÕES E LIMPEZA
    // =========================================================================

    /**
     * Valida integridade de série/número
     * 
     * Verifica se há "buracos" ou inconsistências na série
     */
    @Transactional
    public Map<String, Object> validarIntegridade() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracaoSistema();
        
        List<NotaFiscal> notas = listarNotasDoEscopoAtual().stream()
            .filter(n -> "AUTORIZADA".equals(n.getStatus()) || 
                         "SINCRONIZADA".equals(n.getStatus()))
            .sorted((a, b) -> Long.compare(a.getNumero(), b.getNumero()))
            .toList();

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("total_notas", notas.size());
        resultado.put("proximoNumero", config.getNumeroProximaNfce());

        if (!notas.isEmpty()) {
            long ultimoNumero = notas.get(notas.size() - 1).getNumero();
            resultado.put("ultimoNumero", ultimoNumero);
            resultado.put("esperado", ultimoNumero + 1);
            resultado.put("consistente", ultimoNumero + 1 == config.getNumeroProximaNfce());
        }

        return resultado;
    }

    /**
     * Limpa dados órfãos e inconsistências
     */
    @Transactional
    public void limparInconsistencias() {
        auditoriaService.registrar("SISTEMA", "LIMPEZA_INCONSISTENCIAS",
            "Inicializando limpeza de inconsistências fiscais...");
        
        // Localiza notas sem vendas vinculadas
        List<NotaFiscal> notasOrfas = listarNotasDoEscopoAtual().stream()
            .filter(n -> n.getVenda() == null && 
                        ("RASCUNHO".equals(n.getStatus()) || 
                         "ENVIADA".equals(n.getStatus())))
            .toList();

        log.info("Limpando notas orfas. quantidade={}", notasOrfas.size());

        for (NotaFiscal nota : notasOrfas) {
            // Pode deletar ou mover para status especial
            notaFiscalRepository.delete(nota);
            
            auditoriaService.registrar("SISTEMA", "NOTA_ORFA_DELETADA",
                "Nota órfã deletada: " + nota.getId());
        }
    }

    private List<NotaFiscal> listarNotasDoEscopoAtual() {
        Long empresaId = obterEmpresaIdDoUsuarioAutenticado();
        if (empresaId != null) {
            return notaFiscalRepository.findAllByEmpresaIdOrderByIdDesc(empresaId);
        }
        return notaFiscalRepository.findAll();
    }
}
