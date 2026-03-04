package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

@Service
public class RelatorioService {

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    public byte[] gerarPdfVenda(Long vendaId) {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada"));

        // Busca as configurações reais da loja
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(baos);
            PageSize pageSize = new PageSize(226, 842); // Largura de 80mm
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(pageSize);

            Document document = new Document(pdf);
            document.setMargins(5, 5, 5, 5);

            // --- CABEÇALHO DINÂMICO ---
            String nomeLoja = (config.getNomeFantasia() != null) ? config.getNomeFantasia() : "GRANDPORT ERP";
            document.add(new Paragraph(nomeLoja.toUpperCase()).setBold().setTextAlignment(TextAlignment.CENTER));

            if (config.getCnpj() != null) {
                document.add(new Paragraph("CNPJ: " + config.getCnpj()).setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            }

            // Endereço Completo (Usando os novos campos)
            String logradouro = config.getLogradouro() != null ? config.getLogradouro() : "";
            String numero = config.getNumero() != null ? config.getNumero() : "S/N";
            String bairro = config.getBairro() != null ? config.getBairro() : "";

            String enderecoFormatado = String.format("%s, %s - %s", logradouro, numero, bairro);
            if (!enderecoFormatado.equals(", S/N - ")) {
                document.add(new Paragraph(enderecoFormatado).setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            }

            if (config.getTelefone() != null) {
                document.add(new Paragraph("Tel: " + config.getTelefone()).setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            }

            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            // --- TABELA DE ITENS ---
            Table table = new Table(new float[]{120f, 30f, 60f});
            table.addCell(new Cell().add(new Paragraph("ITEM").setFontSize(8)).setBorder(Border.NO_BORDER));
            table.addCell(new Cell().add(new Paragraph("QTD").setFontSize(8)).setBorder(Border.NO_BORDER));
            table.addCell(new Cell().add(new Paragraph("VLR").setFontSize(8)).setBorder(Border.NO_BORDER));

            venda.getItens().forEach(item -> {
                table.addCell(new Cell().add(new Paragraph(item.getProduto().getNome()).setFontSize(7)).setBorder(Border.NO_BORDER));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantidade())).setFontSize(7)).setBorder(Border.NO_BORDER));
                table.addCell(new Cell().add(new Paragraph("R$ " + item.getPrecoUnitario()).setFontSize(7)).setBorder(Border.NO_BORDER));
            });
            document.add(table);

            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            // --- TOTAIS ---
            document.add(new Paragraph("SUBTOTAL: R$ " + venda.getValorSubtotal()).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            if (venda.getDesconto() != null && venda.getDesconto().compareTo(BigDecimal.ZERO) > 0) {
                document.add(new Paragraph("DESCONTO: R$ " + venda.getDesconto()).setFontSize(9).setItalic().setTextAlignment(TextAlignment.RIGHT));
            }

            document.add(new Paragraph("TOTAL GERAL: R$ " + venda.getValorTotal()).setBold().setFontSize(11).setTextAlignment(TextAlignment.RIGHT));
            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            // --- PAGAMENTO ---
            document.add(new Paragraph("FORMA DE PAGAMENTO:").setBold().setFontSize(8));
            venda.getPagamentos().forEach(p -> {
                String detalhe = p.getMetodo().replace("_", " ");
                if (p.getParcelas() != null && p.getParcelas() > 1) {
                    detalhe += " (" + p.getParcelas() + "x)";
                }

                Table pTable = new Table(new float[]{150f, 76f});
                pTable.addCell(new Cell().add(new Paragraph(detalhe).setFontSize(8)).setBorder(Border.NO_BORDER));
                pTable.addCell(new Cell().add(new Paragraph("R$ " + p.getValor()).setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));
                document.add(pTable);
            });

            // --- RODAPÉ ---
            String msgRodape = (config.getMensagemRodape() != null) ? config.getMensagemRodape() : "Obrigado pela preferência!";
            document.add(new Paragraph(msgRodape).setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginTop(10));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
        return baos.toByteArray();
    }
}