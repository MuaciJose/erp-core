package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.ConciliacaoDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import net.sf.ofx4j.domain.data.ResponseEnvelope;
import net.sf.ofx4j.domain.data.ResponseMessageSet;
import net.sf.ofx4j.domain.data.banking.BankStatementResponse;
import net.sf.ofx4j.domain.data.banking.BankStatementResponseTransaction;
import net.sf.ofx4j.domain.data.banking.BankingResponseMessageSet;
import net.sf.ofx4j.domain.data.common.Transaction;
import net.sf.ofx4j.io.AggregateUnmarshaller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ConciliacaoService {

    @Autowired private ContaPagarRepository pagarRepo;
    @Autowired private ContaReceberRepository receberRepo;

    public ConciliacaoDTO processarOfx(MultipartFile arquivo) throws Exception {
        AggregateUnmarshaller<ResponseEnvelope> unmarshaller = new AggregateUnmarshaller<>(ResponseEnvelope.class);
        ResponseEnvelope envelope = unmarshaller.unmarshal(arquivo.getInputStream());
        
        BankStatementResponse response = null;

        // Itera sobre os conjuntos de mensagens para encontrar a resposta bancária
        for (ResponseMessageSet messageSet : envelope.getMessageSets()) {
            if (messageSet instanceof BankingResponseMessageSet) {
                BankingResponseMessageSet bankingSet = (BankingResponseMessageSet) messageSet;
                // Pega a primeira resposta de extrato disponível
                if (bankingSet.getStatementResponses() != null && !bankingSet.getStatementResponses().isEmpty()) {
                    response = bankingSet.getStatementResponses().get(0).getMessage();
                    break;
                }
            }
        }

        if (response == null) {
            throw new RuntimeException("Não foi possível encontrar transações bancárias no arquivo OFX.");
        }

        ConciliacaoDTO dto = new ConciliacaoDTO();
        dto.setContaBancaria("Extrato Importado");
        
        if (response.getLedgerBalance() != null) {
            dto.setSaldoBanco(new BigDecimal(response.getLedgerBalance().getAmount()));
        } else {
            dto.setSaldoBanco(BigDecimal.ZERO);
        }
        
        dto.setTransacoes(new ArrayList<>());

        if (response.getTransactionList() != null && response.getTransactionList().getTransactions() != null) {
            for (Transaction txn : response.getTransactionList().getTransactions()) {
                ConciliacaoDTO.TransacaoConciliacaoDTO tDto = new ConciliacaoDTO.TransacaoConciliacaoDTO();
                tDto.setIdBanco(txn.getId());
                tDto.setData(txn.getDatePosted().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
                tDto.setDescricaoBanco(txn.getMemo());
                tDto.setValor(new BigDecimal(txn.getAmount()).abs());
                tDto.setTipo(txn.getAmount() > 0 ? "ENTRADA" : "SAIDA");
                
                buscarSugestao(tDto);
                
                dto.getTransacoes().add(tDto);
            }
        }

        return dto;
    }

    private void buscarSugestao(ConciliacaoDTO.TransacaoConciliacaoDTO tDto) {
        if ("SAIDA".equals(tDto.getTipo())) {
            List<ContaPagar> sugestoes = pagarRepo.findByStatus(StatusFinanceiro.PENDENTE);
            Optional<ContaPagar> match = sugestoes.stream()
                .filter(c -> c.getValorOriginal().compareTo(tDto.getValor()) == 0)
                .findFirst();
            
            if (match.isPresent()) {
                tDto.setStatus("SUGERIDO");
                ConciliacaoDTO.SugestaoSistemaDTO sug = new ConciliacaoDTO.SugestaoSistemaDTO();
                sug.setId(match.get().getId());
                sug.setDescricao(match.get().getDescricao());
                sug.setValor(match.get().getValorOriginal());
                tDto.setSugestaoSistema(sug);
            } else {
                tDto.setStatus("DESCONHECIDO");
            }
        } else {
            tDto.setStatus("DESCONHECIDO");
        }
    }
}
