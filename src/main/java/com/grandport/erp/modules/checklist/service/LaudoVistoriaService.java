package com.grandport.erp.modules.checklist.service;

import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
// 🚀 IMPORT CORRIGIDO COM O NOME EXATO DO SEU ARQUIVO
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;

import net.sf.jasperreports.engine.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LaudoVistoriaService {

    @Autowired
    private ChecklistService checklistService;

    // 🚀 INJETANDO O SEU REPOSITÓRIO EXATO AQUI
    @Autowired
    private ConfiguracaoRepository configuracaoRepository;

    public byte[] gerarLaudoPdf(Long checklistId) {
        try {
            // 1. Busca os dados reais da vistoria no banco
            ChecklistVeiculo vistoria = checklistService.buscarPorId(checklistId);

            // 🚀 2. BUSCA OS DADOS DA EMPRESA NO BANCO DE DADOS (ID 1)
            ConfiguracaoSistema config = configuracaoRepository.findById(1L)
                    .orElse(new ConfiguracaoSistema());

            // 3. Prepara as variáveis (Parâmetros)
            Map<String, Object> parametros = new HashMap<>();

            // 🏢 INJETANDO OS DADOS REAIS DIRETO DO SEU BANCO!
            parametros.put("EMPRESA_NOME", config.getNomeFantasia() != null && !config.getNomeFantasia().isEmpty()
                    ? config.getNomeFantasia() : "OFICINA NÃO CONFIGURADA");

            parametros.put("EMPRESA_CNPJ", config.getCnpj() != null ? config.getCnpj() : "");
            parametros.put("EMPRESA_TELEFONE", config.getTelefone() != null ? config.getTelefone() : "");

            // Monta o endereço inteligentemente
            String enderecoCompleto = config.getEndereco();
            if (enderecoCompleto == null || enderecoCompleto.isEmpty()) {
                String logradouro = config.getLogradouro() != null ? config.getLogradouro() : "";
                String numero = config.getNumero() != null ? config.getNumero() : "S/N";
                String cidade = config.getCidade() != null ? config.getCidade() : "";
                String uf = config.getUf() != null ? config.getUf() : "";

                enderecoCompleto = logradouro + ", " + numero + " - " + cidade + "/" + uf;

                // Limpa se ficou só vírgula e traço por estar vazio
                if (enderecoCompleto.equals(", S/N - /")) enderecoCompleto = "";
            }
            parametros.put("EMPRESA_ENDERECO", enderecoCompleto);

            // 🚗 DADOS DO VEÍCULO E VISTORIA
            parametros.put("PLACA", vistoria.getVeiculo().getPlaca());
            parametros.put("MODELO", vistoria.getVeiculo().getModelo());
            parametros.put("CLIENTE_NOME", vistoria.getCliente() != null ? vistoria.getCliente().getNome() : "Não informado");
            parametros.put("DATA_ENTRADA", vistoria.getDataRegistro() != null ? vistoria.getDataRegistro().toString() : "");

            parametros.put("KM", vistoria.getKmAtual() != null ? vistoria.getKmAtual().toString() : "---");
            parametros.put("COMBUSTIVEL", vistoria.getNivelCombustivel());
            parametros.put("AVARIAS", vistoria.getItensAvariados());
            parametros.put("OBSERVACOES", vistoria.getObservacoesGerais());
            parametros.put("ASSINATURA_URL", vistoria.getUrlAssinaturaCliente());

            // 📸 MAPEANDO AS 4 FOTOS COM SEGURANÇA
            List<String> fotos = vistoria.getFotos();
            if (fotos != null) {
                if (fotos.size() > 0) parametros.put("FOTO_1", fotos.get(0));
                if (fotos.size() > 1) parametros.put("FOTO_2", fotos.get(1));
                if (fotos.size() > 2) parametros.put("FOTO_3", fotos.get(2));
                if (fotos.size() > 3) parametros.put("FOTO_4", fotos.get(3));
            }

            // 4. Lê o arquivo de desenho (.jrxml) da pasta resources
            InputStream relatorioStream = getClass().getResourceAsStream("/relatorios/laudo_vistoria.jrxml");
            if (relatorioStream == null) {
                throw new RuntimeException("Arquivo de layout do laudo não encontrado!");
            }

            // 5. Compila, preenche com os dados e exporta para PDF!
            JasperReport jasperReport = JasperCompileManager.compileReport(relatorioStream);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, new JREmptyDataSource());

            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erro ao gerar o PDF do Laudo: " + e.getMessage());
        }
    }
}