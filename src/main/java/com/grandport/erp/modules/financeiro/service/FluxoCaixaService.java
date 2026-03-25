package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.FluxoCaixaDiarioDTO;
import com.grandport.erp.modules.financeiro.dto.FluxoCaixaResponseDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class FluxoCaixaService {

    // Injecte aqui os seus repositórios (ContaPagarRepository, ContaReceberRepository, etc)
     @Autowired
     private ContaPagarRepository pagarRepo;
     @Autowired
     private ContaReceberRepository receberRepo;
     @Autowired
     private CaixaService caixaService;

    public FluxoCaixaResponseDTO gerarProjecao(LocalDate dataInicio, LocalDate dataFim) {
        // 1. Identifica o General e a sua Base (Blindagem Multi-Empresa)
        Usuario utilizadorLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long empresaId = utilizadorLogado.getEmpresaId();

        LocalDateTime inicioDia = dataInicio.atStartOfDay();
        LocalDateTime fimDia = dataFim.atTime(LocalTime.MAX);

        // 2. Procura as provisões no campo de batalha
        List<ContaReceber> recebimentos = receberRepo.findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(empresaId, inicioDia, fimDia);
        List<ContaPagar> pagamentos = pagarRepo.findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(empresaId, inicioDia, fimDia);

        // 3. Agrupa tudo num Mapa organizado por Dia
        Map<LocalDate, BigDecimal> mapaEntradas = new TreeMap<>();
        Map<LocalDate, BigDecimal> mapaSaidas = new TreeMap<>();

        // Preenche com zeros para todos os dias do período
        for (LocalDate data = dataInicio; !data.isAfter(dataFim); data = data.plusDays(1)) {
            mapaEntradas.put(data, BigDecimal.ZERO);
            mapaSaidas.put(data, BigDecimal.ZERO);
        }

        // Soma as contas a receber
        for (ContaReceber cr : recebimentos) {
            LocalDate dia = cr.getDataVencimento().toLocalDate();
            mapaEntradas.put(dia, mapaEntradas.getOrDefault(dia, BigDecimal.ZERO).add(cr.getValorOriginal()));
        }

        // Soma as contas a pagar
        for (ContaPagar cp : pagamentos) {
            LocalDate dia = cp.getDataVencimento().toLocalDate();
            mapaSaidas.put(dia, mapaSaidas.getOrDefault(dia, BigDecimal.ZERO).add(cp.getValorOriginal()));
        }

        // 4. Calcula o Saldo Inicial (Pode buscar do saldo atual do Caixa/Bancos)
        // Por agora vamos assumir um valor base, mas depois ligamos ao seu CaixaService
        BigDecimal saldoAcumulado = new BigDecimal("0.00"); // Substitua por: caixaService.obterSaldoAtual(empresaId);
        BigDecimal saldoInicialDaProjecao = saldoAcumulado;

        // 5. Gera a linha do tempo (O Relatório)
        List<FluxoCaixaDiarioDTO> projecaoDiaria = new ArrayList<>();

        for (LocalDate data = dataInicio; !data.isAfter(dataFim); data = data.plusDays(1)) {
            BigDecimal entradasHoje = mapaEntradas.get(data);
            BigDecimal saidasHoje = mapaSaidas.get(data);

            BigDecimal saldoDoDia = entradasHoje.subtract(saidasHoje);
            saldoAcumulado = saldoAcumulado.add(saldoDoDia);

            projecaoDiaria.add(new FluxoCaixaDiarioDTO(
                    data,
                    entradasHoje,
                    saidasHoje,
                    saldoDoDia,
                    saldoAcumulado
            ));
        }

        return new FluxoCaixaResponseDTO(saldoInicialDaProjecao, projecaoDiaria, saldoAcumulado);
    }
}