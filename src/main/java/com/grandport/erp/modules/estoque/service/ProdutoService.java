package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.dto.ProdutoRequestDTO;
import com.grandport.erp.modules.estoque.model.Marca;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MarcaRepository;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProdutoService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private NcmRepository ncmRepository;

    @Transactional
    public Produto cadastrar(ProdutoRequestDTO dto, String imagePath) {
        // 1. Validar se a Marca existe (Ex: Bosch)
        Marca marca = marcaRepository.findById(dto.marcaId())
                .orElseThrow(() -> new RuntimeException("Erro: Marca ID " + dto.marcaId() + " não encontrada."));

        // 2. Validar se o NCM existe (Aquele que você importou via JSON)
        Ncm ncm = ncmRepository.findById(dto.ncmCodigo())
                .orElseThrow(() -> new RuntimeException("Erro: NCM " + dto.ncmCodigo() + " não cadastrado no sistema."));

        // 3. Mapear DTO para Entidade
        Produto produto = new Produto();
        produto.setSku(dto.sku());
        produto.setNome(dto.nome());
        produto.setDescricao(dto.descricao());
        produto.setCodigoBarras(dto.codigoBarras());
        produto.setPrecoCusto(dto.precoCusto());
        produto.setPrecoVenda(dto.precoVenda());
        produto.setQuantidadeEstoque(dto.quantidadeEstoque());
        
        // Relacionamentos
        produto.setMarca(marca);
        produto.setNcm(ncm);

        // Lógica de Fotos: Suporta os dois mundos
        produto.setFotoUrl(dto.fotoUrl()); // Link externo do fabricante
        if (imagePath != null) {
            produto.setFotoLocalPath("/uploads/produtos/" + imagePath); // Caminho do servidor
        }

        return produtoRepository.save(produto);
    }
}
