package com.grandport.erp.modules.veiculo.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(
        name = "veiculos",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_veiculos_empresa_placa", columnNames = {"empresa_id", "placa"})
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
public class Veiculo extends BaseEntityMultiEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String placa;

    private String marca;
    private String modelo;
    private Integer ano;
    private Integer km; // Novo campo KM

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Parceiro cliente; // Dono atual
}
