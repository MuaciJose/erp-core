package com.grandport.erp.modules.checklist.model;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "checklists_veiculo")
@Data
public class ChecklistVeiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Parceiro cliente; // Dono do carro no momento do checklist

    @ManyToOne
    @JoinColumn(name = "recepcionista_id")
    private Usuario recepcionista; // Quem fez a vistoria

    private LocalDateTime dataRegistro = LocalDateTime.now();

    // --- DADOS DA VISTORIA ---
    private Integer kmAtual;
    private String nivelCombustivel; // Voltou pra cá! Ex: "1/4", "Meio Tanque", "Reserva"

    // Aqui você pode salvar um JSON em texto (ex: {"lataria":"amassada", "pneu":"careca"})
    // ou apenas um texto livre do que o recepcionista marcou de errado.
    @Column(columnDefinition = "TEXT")
    private String itensAvariados;

    @Column(columnDefinition = "TEXT")
    private String observacoesGerais;

    // 🚀 O SISTEMA DE FOTOS OPCIONAIS (Pode ter 0, 1 ou 20 fotos)
    // O Hibernate vai criar uma tabela auxiliar "checklist_fotos" automaticamente no banco
    @ElementCollection
    @CollectionTable(name = "checklist_fotos", joinColumns = @JoinColumn(name = "checklist_id"))
    @Column(name = "url_foto")
    private List<String> fotos = new ArrayList<>();

    // Assinatura do cliente (pode ser um link para a imagem da assinatura feita no tablet)
    @Column(columnDefinition = "TEXT")
    private String urlAssinaturaCliente;


}