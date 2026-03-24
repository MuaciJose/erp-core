package com.grandport.erp.modules.vendas.model;


import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Entity
@Table(name = "revisoes_crm")
@EqualsAndHashCode(callSuper = true)
public class Revisao extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dados do Cliente
    private Long parceiroId;
    private String clienteNome;
    private String clienteTelefone;

    // Dados do Veículo
    private Long veiculoId;
    private String veiculoDescricao; // Ex: Honda Civic
    private String veiculoPlaca;

    // Dados do Serviço
    private String servico; // Ex: Troca de Óleo
    private LocalDate dataPrevista;

    // Status: PENDENTE, CONTATADO, CONCLUIDO, CANCELADO
    private String status;

    // Construtor vazio obrigatório do JPA
    public Revisao() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getParceiroId() { return parceiroId; }
    public void setParceiroId(Long parceiroId) { this.parceiroId = parceiroId; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteTelefone() { return clienteTelefone; }
    public void setClienteTelefone(String clienteTelefone) { this.clienteTelefone = clienteTelefone; }

    public Long getVeiculoId() { return veiculoId; }
    public void setVeiculoId(Long veiculoId) { this.veiculoId = veiculoId; }

    public String getVeiculoDescricao() { return veiculoDescricao; }
    public void setVeiculoDescricao(String veiculoDescricao) { this.veiculoDescricao = veiculoDescricao; }

    public String getVeiculoPlaca() { return veiculoPlaca; }
    public void setVeiculoPlaca(String veiculoPlaca) { this.veiculoPlaca = veiculoPlaca; }

    public String getServico() { return servico; }
    public void setServico(String servico) { this.servico = servico; }

    public LocalDate getDataPrevista() { return dataPrevista; }
    public void setDataPrevista(LocalDate dataPrevista) { this.dataPrevista = dataPrevista; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}