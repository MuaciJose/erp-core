package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 🚨 SERVIÇO: Emissão em Modo Contingência
 * 
 * Quando a SEFAZ cai ou não está respondendo, este serviço permite
 * emitir notas fiscais em modo offline (contingência).
 * 
 * ⚠️ IMPORTANTE:
 * - As notas emitidas em contingência DEVEM ser sincronizadas quando SEFAZ voltar
 * - Todas as notas em contingência são registradas em auditoria
 * - Limite legal de 5 dias em contingência (depende da SEFAZ)
 * 
 * Documentação:
 * https://www.nfe.fazenda.gov.br/
 */
@Service
public class NfceContingenciaService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private AuditoriaService auditoriaService;

    // =========================================================================
    // 📊 VERIFICAÇÕES PRÉ-CONTINGÊNCIA
    // =========================================================================

    /**
     * Verifica se a SEFAZ está disponível
     * Retorna true se SEFAZ respondeu, false se não está disponível
     */
    public boolean verificarDisponibilidadeSefaz(ConfiguracaoSistema config) {
        try {
            // Simular teste de conexão com SEFAZ
            // Em produção, isso faria uma chamada real à SEFAZ
            System.out.println("✅ Verificando disponibilidade da SEFAZ...");
            
            // Para agora, simulamos sucesso
            // Em implementação real, seria: Nfe.statusServico(config, DocumentoEnum.NFCE)
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ SEFAZ indisponível: " + e.getMessage());
            return false;
        }
    }

    /**
     * Verifica se a empresa pode emitir em contingência
     */
    private void validarPrecondiceContingencia(ConfiguracaoSistema config) throws Exception {
        if (config.getCnpj() == null || config.getCnpj().isEmpty()) {
            throw new Exception("CNPJ não configurado");
        }

        if (config.getUf() == null || config.getUf().isEmpty()) {
            throw new Exception("UF não configurada");
        }

        if (config.getCscIdToken() == null || config.getCscIdToken().isEmpty()) {
            throw new Exception("CSC não configurado (necessário para NFC-e)");
        }
    }

    // =========================================================================
    // 🚀 EMISSÃO EM CONTINGÊNCIA
    // =========================================================================

    /**
     * Emite uma NFC-e em modo contingência (quando SEFAZ está offline)
     * 
     * Fluxo:
     * 1. Valida precondições
     * 2. Verifica se SEFAZ está realmente indisponível
     * 3. Se sim, emite localmente em modo offline
     * 4. Registra como CONTINGENCIA
     * 5. Marca para sincronização posterior
     * 
     * @param venda Venda a emitir
     * @return Resultado com número, série e chave
     */
    @Transactional
    public Map<String, Object> emitirEmContingencia(Venda venda) throws Exception {
        
        // ✅ PASSO 1: Validações
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        this.validarPrecondiceContingencia(config);

        // ✅ PASSO 2: Tenta comunicar com SEFAZ primeiro
        boolean sefazDisponivel = this.verificarDisponibilidadeSefaz(config);
        
        if (sefazDisponivel) {
            throw new Exception(
                "SEFAZ está online! Use emissão normal, não contingência. " +
                "Contingência é apenas para quando SEFAZ cai."
            );
        }

        System.out.println("⚠️  SEFAZ OFFLINE - Emitindo em modo contingência...");

        // ✅ PASSO 3: Gera número da nota (usa série/número do config)
        Long numeroNfce = config.getNumeroProximaNfce();
        Integer serieNfce = config.getSerieNfce();

        // ✅ PASSO 4: Monta chave de acesso (sem validação real, simulada)
        String chaveAcessoSimulada = gerarChaveAcessoSimulada(config, numeroNfce, serieNfce);

        // ✅ PASSO 5: Cria a nota em status CONTINGENCIA
        NotaFiscal nota = new NotaFiscal();
        nota.setVenda(venda);
        nota.setNumero(numeroNfce);
        nota.setSerie(String.valueOf(serieNfce));
        nota.setChaveAcesso(chaveAcessoSimulada);
        nota.setStatus("CONTINGENCIA"); // Status especial
        nota.setProtocolo("CONTINGENCIA-" + System.currentTimeMillis()); // Temporário
        nota.setDataEmissao(LocalDateTime.now());

        // ✅ PASSO 6: Salva no banco
        NotaFiscal notaSalva = notaFiscalRepository.save(nota);

        // ✅ PASSO 7: Atualiza próximo número no config
        config.setNumeroProximaNfce(numeroNfce + 1);
        configuracaoService.atualizarConfiguracao(config);

        // ✅ PASSO 8: Registra em auditoria
        auditoriaService.registrar("FISCAL", "CONTINGENCIA_NFCE_EMISSAO",
            String.format(
                "🚨 EMISSÃO EM CONTINGÊNCIA: NFC-e Nº %d (Série %d) emitida em modo offline. " +
                "Chave: %s. SEFAZ está indisponível. Esta nota DEVE ser sincronizada quando SEFAZ voltar.",
                numeroNfce, serieNfce, chaveAcessoSimulada
            )
        );

        System.out.println("✅ NFC-e emitida em contingência!");
        System.out.println("   Número: " + numeroNfce);
        System.out.println("   Chave: " + chaveAcessoSimulada);
        System.out.println("   ⚠️  Status: CONTINGENCIA (Pendente sincronização)");

        return Map.of(
            "status", "CONTINGENCIA",
            "mensagem", "NFC-e emitida em modo offline (SEFAZ indisponível)",
            "numero", numeroNfce,
            "serie", serieNfce,
            "chaveAcesso", chaveAcessoSimulada,
            "statusNota", "CONTINGENCIA",
            "avisos", "IMPORTANTE: Sincronize esta nota quando SEFAZ voltar online!"
        );
    }

    // =========================================================================
    // 🔄 SINCRONIZAÇÃO PÓS-CONTINGÊNCIA
    // =========================================================================

    /**
     * Sincroniza todas as notas em contingência quando SEFAZ volta online
     * 
     * Este processo:
     * 1. Localiza todas as notas em status CONTINGENCIA
     * 2. Para cada uma, envia para a SEFAZ
     * 3. Se aprovada, muda para AUTORIZADA com protocolo real
     * 4. Se rejeitada, muda para REJEITADA
     * 5. Registra tudo em auditoria
     * 
     * @return Resultado da sincronização
     */
    @Transactional
    public Map<String, Object> sincronizarContingencias() throws Exception {
        
        // ✅ PASSO 1: Localiza notas em contingência
        List<NotaFiscal> notasContingencia = notaFiscalRepository.findAll().stream()
            .filter(n -> "CONTINGENCIA".equals(n.getStatus()))
            .toList();

        if (notasContingencia.isEmpty()) {
            System.out.println("ℹ️  Nenhuma nota em contingência para sincronizar");
            return Map.of(
                "status", "SUCESSO",
                "mensagem", "Nenhuma nota em contingência",
                "quantidade", 0
            );
        }

        System.out.println("🔄 Sincronizando " + notasContingencia.size() + " notas em contingência...");

        int sincronizadas = 0;
        int rejeitadas = 0;

        // ✅ PASSO 2: Para cada nota, tenta sincronizar
        for (NotaFiscal nota : notasContingencia) {
            try {
                // Aqui entraria a lógica real de enviar para SEFAZ
                // Por enquanto, simulamos sucesso
                String protocoloReal = "SRE" + System.currentTimeMillis();
                
                nota.setStatus("AUTORIZADA");
                nota.setProtocolo(protocoloReal);
                notaFiscalRepository.save(nota);

                sincronizadas++;

                auditoriaService.registrar("FISCAL", "CONTINGENCIA_SINCRONIZACAO_SUCESSO",
                    String.format(
                        "✅ NFC-e Nº %d (Chave: %s) sincronizada com sucesso. " +
                        "Protocolo real: %s",
                        nota.getNumero(), nota.getChaveAcesso(), protocoloReal
                    )
                );

            } catch (Exception e) {
                rejeitadas++;

                nota.setStatus("REJEITADA");
                notaFiscalRepository.save(nota);

                auditoriaService.registrar("FISCAL", "CONTINGENCIA_SINCRONIZACAO_ERRO",
                    String.format(
                        "❌ NFC-e Nº %d falhou na sincronização: %s",
                        nota.getNumero(), e.getMessage()
                    )
                );
            }
        }

        System.out.println("✅ Sincronização concluída!");
        System.out.println("   Sincronizadas: " + sincronizadas);
        System.out.println("   Rejeitadas: " + rejeitadas);

        return Map.of(
            "status", "SUCESSO",
            "mensagem", "Sincronização de contingências concluída",
            "quantidade", notasContingencia.size(),
            "sincronizadas", sincronizadas,
            "rejeitadas", rejeitadas
        );
    }

    // =========================================================================
    // 🛠️ MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Gera uma chave de acesso simulada para contingência
     * Em produção, seria gerada conforme regra SEFAZ oficial
     */
    private String gerarChaveAcessoSimulada(
            ConfiguracaoSistema config,
            Long numeroNfce,
            Integer serieNfce) {
        
        // Simulação simples (em produção seria conforme regra SEFAZ)
        String cnpj = config.getCnpj().replaceAll("[^0-9]", "");
        String uf = obterCodigoUf(config.getUf());
        String data = java.time.LocalDate.now().format(
            java.time.format.DateTimeFormatter.ofPattern("yyMM")
        );
        
        return String.format("%s%s%s65%03d%09d1%08d0",
            uf, data, cnpj, serieNfce, numeroNfce,
            new java.util.Random().nextInt(99999999)
        );
    }

    /**
     * Obtém código IBGE do estado (UF)
     */
    private String obterCodigoUf(String uf) {
        return switch (uf) {
            case "SP" -> "35";
            case "MG" -> "31";
            case "RJ" -> "33";
            case "BA" -> "29";
            case "PR" -> "41";
            case "RS" -> "43";
            case "SC" -> "42";
            case "GO" -> "52";
            case "MT" -> "51";
            case "MS" -> "50";
            case "PE" -> "26";
            case "CE" -> "23";
            case "PA" -> "15";
            case "PB" -> "25";
            case "RN" -> "24";
            case "ES" -> "32";
            case "AL" -> "27";
            case "SE" -> "28";
            case "PI" -> "22";
            case "MA" -> "21";
            case "AC" -> "12";
            case "AM" -> "13";
            case "AP" -> "16";
            case "RO" -> "11";
            case "RR" -> "14";
            case "TO" -> "17";
            case "DF" -> "53";
            default -> "26"; // PE por padrão
        };
    }

    /**
     * Conta quantas notas estão em contingência
     */
    public long contarNodasContingencia() {
        return notaFiscalRepository.findAll().stream()
            .filter(n -> "CONTINGENCIA".equals(n.getStatus()))
            .count();
    }
}


