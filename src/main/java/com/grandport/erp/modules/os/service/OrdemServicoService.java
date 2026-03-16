package com.grandport.erp.modules.os.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.os.dto.OsRequestDTO;
import com.grandport.erp.modules.os.model.*;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.servicos.repository.ServicoRepository;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class OrdemServicoService {

    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private VeiculoRepository veiculoRepository;
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private ServicoRepository servicoRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Transactional
    public OrdemServico salvarRascunho(OsRequestDTO dto, Long osId) {
        OrdemServico os = (osId != null) ? osRepository.findById(osId).orElse(new OrdemServico()) : new OrdemServico();

        // 1. Preenche a Capa (Dados do Cliente e Carro)
        os.setCliente(dto.clienteId() != null ? parceiroRepository.findById(dto.clienteId()).orElse(null) : null);
        os.setVeiculo(dto.veiculoId() != null ? veiculoRepository.findById(dto.veiculoId()).orElse(null) : null);
        os.setKmEntrada(dto.kmEntrada());
        os.setNivelCombustivel(dto.nivelCombustivel());
        os.setDefeitoRelatado(dto.defeitoRelatado());
        os.setDiagnosticoTecnico(dto.diagnosticoTecnico());
        os.setObservacoes(dto.observacoes());
        os.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);

        // Limpa itens antigos se for uma edição
        os.getItensPecas().clear();
        os.getItensServicos().clear();

        BigDecimal somaPecas = BigDecimal.ZERO;
        BigDecimal somaServicos = BigDecimal.ZERO;

        // 2. Processa as Peças
        if (dto.pecas() != null) {
            for (var p : dto.pecas()) {
                OsItemPeca item = new OsItemPeca();
                item.setOrdemServico(os);
                item.setProduto(produtoRepository.findById(p.produtoId()).orElseThrow());
                item.setQuantidade(p.quantidade());
                item.setPrecoUnitario(p.precoUnitario());
                item.setValorTotal(p.precoUnitario().multiply(BigDecimal.valueOf(p.quantidade())));
                os.getItensPecas().add(item);
                somaPecas = somaPecas.add(item.getValorTotal());
            }
        }

        // 3. Processa a Mão de Obra e Vincula o Mecânico
        if (dto.servicos() != null) {
            for (var s : dto.servicos()) {
                OsItemServico item = new OsItemServico();
                item.setOrdemServico(os);
                item.setServico(servicoRepository.findById(s.servicoId()).orElseThrow());
                item.setMecanico(s.mecanicoId() != null ? usuarioRepository.findById(s.mecanicoId()).orElse(null) : null);
                item.setQuantidade(s.quantidade());
                item.setPrecoUnitario(s.precoUnitario());
                item.setValorTotal(s.precoUnitario().multiply(BigDecimal.valueOf(s.quantidade())));
                os.getItensServicos().add(item);
                somaServicos = somaServicos.add(item.getValorTotal());
            }
        }

        // 4. Calcula os Totais da OS
        os.setTotalPecas(somaPecas);
        os.setTotalServicos(somaServicos);
        os.setValorTotal(somaPecas.add(somaServicos).subtract(os.getDesconto()));

        return osRepository.save(os);
    }

    @Transactional
    public OrdemServico faturarOS(Long osId) {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        if (os.getStatus() == com.grandport.erp.modules.os.model.StatusOS.FATURADA) {
            throw new RuntimeException("Esta OS já foi faturada e fechada!");
        }

        // 1. Baixar o Estoque Fisicamente
        for (OsItemPeca item : os.getItensPecas()) {
            Produto p = item.getProduto();
            if (p.getQuantidadeEstoque() < item.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para a peça: " + p.getNome());
            }
            p.setQuantidadeEstoque(p.getQuantidadeEstoque() - item.getQuantidade());
            produtoRepository.save(p);
        }

        // 2. Travar a OS como Faturada
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.FATURADA);

        return osRepository.save(os);
    }
}