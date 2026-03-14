package com.grandport.erp.modules.compras.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "compras_xml_itens")
@Data
public class CompraItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- VÍNCULO COM O SISTEMA (O SEU CÓDIGO ORIGINAL) ---
    private Long produtoId;          // ID do produto no seu banco (se ele já existir)
    private String nome;             // xProd do XML (Mantive o seu nome original)
    private BigDecimal precoCusto;   // Custo Real Calculado (Peça + Impostos + Frete)
    private BigDecimal precoVenda;   // O seu Preço de Venda

    // --- DADOS BÁSICOS DO XML ---
    private String codigoFornecedor; // cProd (Código que o fornecedor usa)
    private String eanBarras;        // cEAN (Código de Barras)
    private String unidadeMedida;    // uCom (Ex: PC, UN, CX)
    private BigDecimal quantidade;   // qCom (Quantidade comprada)
    private BigDecimal valorUnitario;// vUnCom (Preço puro da peça no XML)
    private BigDecimal valorTotal;   // vProd (Qtd * Valor Unitário)

    // 🚀 --- DADOS FISCAIS (O CORAÇÃO DO ESTOQUE) ---
    private String ncm;              // Nomenclatura Comum do Mercosul
    private String cest;             // Código Especificador da Substituição Tributária
    private String cfop;             // CFOP da nota (Ex: 5102, 5405)
    private String cstIcms;          // CST ou CSOSN (Situação Tributária)

    // 💰 --- IMPOSTOS (PARA A COMPOSIÇÃO DO CUSTO REAL) ---
    private BigDecimal baseCalculoIcms;
    private BigDecimal valorIcms;
    private BigDecimal valorIpi;
    private BigDecimal valorSt;      // ICMS ST (Substituição Tributária - Frequente em Auto Peças)
    private BigDecimal valorFrete;   // Rateio do Frete para esta peça

    // --- RELACIONAMENTO COM A NOTA PAI ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id")
    @JsonIgnore // 🛡️ Salva-vidas: Impede o loop infinito ao enviar o JSON para o React
    private CompraXML compra;
}