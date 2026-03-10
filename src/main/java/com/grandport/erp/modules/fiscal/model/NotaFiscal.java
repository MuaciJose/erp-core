package com.grandport.erp.modules.fiscal.model;

// ⚠️ ATENÇÃO: Ajuste este import para apontar para a sua classe de Orçamento/Pedido real
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grandport.erp.modules.vendas.model.Venda;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notas_fiscais")
@Data
public class NotaFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_nota")
    private Long numero; // Ex: 1234

    private String serie = "1"; // Geralmente série 1

    @Column(name = "chave_acesso", length = 44, unique = true)
    private String chaveAcesso; // Os famosos 44 dígitos da SEFAZ

    private String protocolo;

    private String status = "AUTORIZADA"; // AUTORIZADA, CANCELADA, REJEITADA

    @Column(name = "url_danfe", length = 500)
    private String urlDanfe; // Link para o PDF

    @Column(name = "data_emissao")
    private LocalDateTime dataEmissao = LocalDateTime.now();

    // 🚀 RELACIONAMENTO: Uma Nota Fiscal pertence a 1 único Pedido
    @OneToOne
    @JoinColumn(name = "pedido_id", unique = true, nullable = false)
    @JsonIgnore // java nã entrar no loop
    private Venda venda;
}