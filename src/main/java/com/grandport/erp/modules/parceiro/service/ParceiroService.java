package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.parceiro.dto.HistoricoComprasClienteDTO;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
// 🚀 IMPORTAÇÕES DA OS
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.model.OrdemServico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParceiroService {

    @Autowired private ParceiroRepository repository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private VendaRepository vendaRepository;
    @Autowired private EmpresaContextService empresaContextService;

    // 🚀 INJETANDO O REPOSITÓRIO DE OS
    @Autowired private OrdemServicoRepository osRepository;

    @Transactional
    public Parceiro criar(Parceiro parceiro) {
        parceiro.setEmpresaId(empresaContextService.getRequiredEmpresaId());
        Parceiro salvo = repository.save(parceiro);
        String doc = salvo.getDocumento() != null ? salvo.getDocumento() : "S/ Doc";
        auditoriaService.registrar("CADASTROS", "CRIACAO_PARCEIRO", "Cadastrou o parceiro: " + salvo.getNome() + " (" + salvo.getTipo() + ") | Doc: " + doc);
        return salvo;
    }

    @Transactional
    public Parceiro atualizar(Long id, Parceiro dadosAtualizados) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Parceiro parceiroExistente = repository.findByEmpresaIdAndId(empresaId, id)
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado com ID: " + id));

        BigDecimal limiteAntigo = parceiroExistente.getLimiteCredito();
        BigDecimal limiteNovo = dadosAtualizados.getLimiteCredito();

        parceiroExistente.setNome(dadosAtualizados.getNome());
        parceiroExistente.setDocumento(dadosAtualizados.getDocumento());
        parceiroExistente.setEmail(dadosAtualizados.getEmail());
        parceiroExistente.setTelefone(dadosAtualizados.getTelefone());
        parceiroExistente.setTipo(dadosAtualizados.getTipo());
        parceiroExistente.setEndereco(dadosAtualizados.getEndereco());

        parceiroExistente.setLimiteCredito(dadosAtualizados.getLimiteCredito());
        parceiroExistente.setIntervaloDiasPagamento(dadosAtualizados.getIntervaloDiasPagamento());
        parceiroExistente.setPercentualDesconto(dadosAtualizados.getPercentualDesconto());

        Parceiro salvo = repository.save(parceiroExistente);

        String logMsg = "Atualizou dados do parceiro: " + salvo.getNome();
        if (limiteAntigo != null && limiteNovo != null && limiteAntigo.compareTo(limiteNovo) != 0) {
            logMsg += " | ALERTA: Limite de Crédito alterado de R$ " + limiteAntigo + " para R$ " + limiteNovo;
        }
        auditoriaService.registrar("CADASTROS", "EDICAO_PARCEIRO", logMsg);

        return salvo;
    }

    @Transactional
    public void excluir(Long id) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Parceiro p = repository.findByEmpresaIdAndId(empresaId, id)
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado"));
        String nome = p.getNome();
        String doc = p.getDocumento() != null ? p.getDocumento() : "S/ Doc";

        repository.delete(p);
        auditoriaService.registrar("CADASTROS", "EXCLUSAO_PARCEIRO", "Excluiu o parceiro: " + nome + " (Doc: " + doc + ")");
    }

    // 🚀 HISTÓRICO MISTO: VENDAS + OS
    public List<HistoricoComprasClienteDTO> buscarHistoricoCompras(Long clienteId) {

        // 1. Busca as Vendas de Balcão
        List<HistoricoComprasClienteDTO> historico = vendaRepository.findByClienteIdOrderByDataHoraDesc(clienteId).stream()
                .map(venda -> new HistoricoComprasClienteDTO(
                        venda.getId(),
                        venda.getDataHora(), // Aqui pega da Venda e joga para o campo "data" do DTO
                        venda.getValorTotal(),
                        "VENDA: " + venda.getStatus().name(),
                        venda.getVeiculo() != null ? venda.getVeiculo().getModelo() + " (" + venda.getVeiculo().getPlaca() + ")" : "Nenhum",
                        venda.getItens().size()
                ))
                .collect(Collectors.toList());

        // 2. Busca as Ordens de Serviço
        List<OrdemServico> oss = osRepository.findByClienteId(clienteId);

        for (OrdemServico os : oss) {
            int qtdItens = os.getItensPecas().size() + os.getItensServicos().size();
            historico.add(new HistoricoComprasClienteDTO(
                    os.getId(),
                    os.getDataEntrada(), // 🚀 Usando o campo exato da sua entidade
                    os.getValorTotal(),
                    "OS: " + os.getStatus().name(),
                    os.getVeiculo() != null ? os.getVeiculo().getModelo() + " (" + os.getVeiculo().getPlaca() + ")" : "Nenhum",
                    qtdItens
            ));
        }


        // 3. Ordena tudo cronologicamente (mais recente primeiro)
        historico.sort((h1, h2) -> {
            if (h1.getData() == null || h2.getData() == null) return 0;
            return h2.getData().compareTo(h1.getData()); // 🚀 Usando getData()
        });

        return historico;
    }
}
