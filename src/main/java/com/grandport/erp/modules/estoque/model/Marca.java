package com.grandport.erp.modules.estoque.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;


@Entity
@Table(
        name = "marcas",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_marcas_empresa_nome", columnNames = {"empresa_id", "nome"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Marca extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome; // Ex: Bosch, Cofap, Nakata

    private String siteFabricante; // Útil para consulta rápida no Desktop
}
