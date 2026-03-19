package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.model.OrdemServico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RelatorioComissaoService {

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private OrdemServicoRepository osRepository;

    public List<ComissaoMembroDTO> calcularComissoes(LocalDateTime inicio, LocalDateTime fim, Long vendedorFiltroId) {
        Map<Long, ComissaoMembroDTO> mapaComissoes = new HashMap<>();

        // =======================================================
        // 1. PROCESSA AS VENDAS (BALCÃO)
        // =======================================================
        List<Venda> vendas = vendaRepository.findAll();

        for (Venda venda : vendas) {
            // Ignora se estiver fora da data
            if (venda.getDataHora() == null || venda.getDataHora().isBefore(inicio) || venda.getDataHora().isAfter(fim)) continue;

            // Verifica o Status
            if ("CONCLUIDA".equals(venda.getStatus().name()) || "PAGA".equals(venda.getStatus().name()) || "FATURADA".equals(venda.getStatus().name())) {

                // 🚀 PUXANDO OS CAMPOS EXATOS DA SUA CLASSE VENDA
                Long vendedorId = venda.getVendedorId();
                String vendedorNome = (venda.getVendedorNome() != null) ? venda.getVendedorNome() : "Desconhecido";

                // Se não filtramos por vendedor, ou se o vendedor for o selecionado
                if (vendedorId != null && (vendedorFiltroId == null || vendedorFiltroId.equals(vendedorId))) {

                    for (var item : venda.getItens()) {
                        // 🚀 BIGDECIMAL PARA DOUBLE (Consertando o erro do '*')
                        double preco = item.getPrecoUnitario() != null ? item.getPrecoUnitario().doubleValue() : 0.0;
                        double qtd = item.getQuantidade() != null ? item.getQuantidade().doubleValue() : 1.0;
                        double valorBase = preco * qtd;

                        double percAplicado = 0.0;
                        if (item.getProduto() != null && item.getProduto().getComissao() != null) {
                            percAplicado = item.getProduto().getComissao().doubleValue();
                        }

                        String tipoRegra = percAplicado > 0 ? "ESPECÍFICA (PEÇA)" : "PADRÃO (VENDEDOR)";
                        String descricao = item.getProduto() != null ? item.getProduto().getNome() : "Item de Venda";

                        registrarComissao(mapaComissoes, vendedorId, vendedorNome, "Venda #" + venda.getId(), "PEÇA", descricao, valorBase, percAplicado, tipoRegra);
                    }
                }
            }
        }

        // =======================================================
        // 2. PROCESSA AS ORDENS DE SERVIÇO (OFICINA)
        // =======================================================
        List<OrdemServico> ordens = osRepository.findAll();

        for (OrdemServico os : ordens) {
            if (os.getDataEntrada() == null || os.getDataEntrada().isBefore(inicio) || os.getDataEntrada().isAfter(fim)) continue;

            if ("FATURADA".equals(os.getStatus().name())) {

                // A) PEÇAS DA OS (Vai para o Consultor)
                // 🚀 PUXANDO O CAMPO "CONSULTOR" DA SUA CLASSE OS
                Long consultorId = (os.getConsultor() != null) ? os.getConsultor().getId() : null;
                String consultorNome = (os.getConsultor() != null) ? os.getConsultor().getUsername() : "Consultor";

                if (consultorId != null && (vendedorFiltroId == null || vendedorFiltroId.equals(consultorId))) {

                    for (var peca : os.getItensPecas()) {
                        double preco = peca.getPrecoUnitario() != null ? peca.getPrecoUnitario().doubleValue() : 0.0;
                        double qtd = peca.getQuantidade() != null ? peca.getQuantidade().doubleValue() : 1.0;
                        double valorBase = preco * qtd;

                        double percAplicado = 0.0;
                        if (peca.getProduto() != null && peca.getProduto().getComissao() != null) {
                            percAplicado = peca.getProduto().getComissao().doubleValue();
                        }

                        String tipoRegra = percAplicado > 0 ? "ESPECÍFICA (PEÇA)" : "PADRÃO (CONSULTOR)";
                        String nomeProd = peca.getProduto() != null ? peca.getProduto().getNome() : "Peça";

                        registrarComissao(mapaComissoes, consultorId, consultorNome, "OS #" + os.getId(), "PEÇA", nomeProd, valorBase, percAplicado, tipoRegra);
                    }
                }

                // B) MÃO DE OBRA (Vai para o Mecânico)
                for (var servico : os.getItensServicos()) {
                    Long mecanicoId = (servico.getMecanico() != null) ? servico.getMecanico().getId() : null;
                    String mecanicoNome = (servico.getMecanico() != null) ? servico.getMecanico().getUsername() : "Mecânico";

                    if (mecanicoId != null && (vendedorFiltroId == null || vendedorFiltroId.equals(mecanicoId))) {
                        double preco = servico.getPrecoUnitario() != null ? servico.getPrecoUnitario().doubleValue() : 0.0;
                        double qtd = servico.getQuantidade() != null ? servico.getQuantidade().doubleValue() : 1.0;
                        double valorBase = preco * qtd;

                        double percAplicado = 0.0;
                        String tipoRegra = "PADRÃO (MECÂNICO)";
                        String nomeServico = servico.getServico() != null ? servico.getServico().getNome() : "Serviço";

                        registrarComissao(mapaComissoes, mecanicoId, mecanicoNome, "OS #" + os.getId(), "MÃO DE OBRA", nomeServico, valorBase, percAplicado, tipoRegra);
                    }
                }
            }
        }

        // Converte o Mapa em Lista e ordena
        List<ComissaoMembroDTO> resultado = new ArrayList<>(mapaComissoes.values());
        resultado.sort((a, b) -> Double.compare(b.getTotalComissao(), a.getTotalComissao()));

        return resultado;
    }

    private void registrarComissao(Map<Long, ComissaoMembroDTO> mapa, Long usuarioId, String nome, String origem, String tipoItem, String descricao, double valorBase, double percAplicado, String tipoRegra) {
        ComissaoMembroDTO membro = mapa.computeIfAbsent(usuarioId, k -> new ComissaoMembroDTO(usuarioId, nome));
        double valorComissao = valorBase * (percAplicado / 100.0);

        membro.setTotalBase(membro.getTotalBase() + valorBase);
        membro.setTotalComissao(membro.getTotalComissao() + valorComissao);
        membro.getDetalhes().add(new ComissaoDetalheDTO(origem, tipoItem, descricao, valorBase, percAplicado, valorComissao, tipoRegra));
    }

    // =======================================================
    // CLASSES DTO PARA O REACT ENTENDER OS DADOS
    // =======================================================
    public static class ComissaoMembroDTO {
        private Long id;
        private String nome;
        private double totalBase = 0;
        private double totalComissao = 0;
        private List<ComissaoDetalheDTO> detalhes = new ArrayList<>();

        public ComissaoMembroDTO(Long id, String nome) { this.id = id; this.nome = nome; }
        public Long getId() { return id; }
        public String getNome() { return nome; }
        public double getTotalBase() { return totalBase; }
        public void setTotalBase(double totalBase) { this.totalBase = totalBase; }
        public double getTotalComissao() { return totalComissao; }
        public void setTotalComissao(double totalComissao) { this.totalComissao = totalComissao; }
        public List<ComissaoDetalheDTO> getDetalhes() { return detalhes; }
    }

    public static class ComissaoDetalheDTO {
        private String origem;
        private String tipoItem;
        private String descricao;
        private double valorBase;
        private double percAplicado;
        private double valorComissao;
        private String tipoRegra;

        public ComissaoDetalheDTO(String origem, String tipoItem, String descricao, double valorBase, double percAplicado, double valorComissao, String tipoRegra) {
            this.origem = origem; this.tipoItem = tipoItem; this.descricao = descricao; this.valorBase = valorBase; this.percAplicado = percAplicado; this.valorComissao = valorComissao; this.tipoRegra = tipoRegra;
        }

        public String getOrigem() { return origem; }
        public String getTipoItem() { return tipoItem; }
        public String getDescricao() { return descricao; }
        public double getValorBase() { return valorBase; }
        public double getPercAplicado() { return percAplicado; }
        public double getValorComissao() { return valorComissao; }
        public String getTipoRegra() { return tipoRegra; }
    }
}