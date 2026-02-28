package com.grandport.erp.modules.vendas.service;

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

    public byte[] gerarPdfVenda(Long vendaId) {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(baos);
            PageSize pageSize = new PageSize(226, 842);
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(pageSize);
            
            Document document = new Document(pdf);
            document.setMargins(5, 5, 5, 5);

            document.add(new Paragraph("GRANDPORT ERP").setBold().setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Rua das Pecas, 100 - Centro").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            Table table = new Table(new float[]{120f, 30f, 60f});
            table.addCell(new Cell().add(new Paragraph("ITEM").setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph("QTD").setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph("VLR").setFontSize(8)));

            venda.getItens().forEach(item -> {
                table.addCell(new Cell().add(new Paragraph(item.getProduto().getNome()).setFontSize(7)));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantidade())).setFontSize(7)));
                table.addCell(new Cell().add(new Paragraph(item.getPrecoUnitario().toString()).setFontSize(7)));
            });
            document.add(table);

            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("SUBTOTAL: R$ " + venda.getValorSubtotal()).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            if (venda.getDesconto() != null && venda.getDesconto().compareTo(BigDecimal.ZERO) > 0) {
                document.add(new Paragraph("DESCONTO: R$ " + venda.getDesconto()).setFontSize(9).setItalic().setTextAlignment(TextAlignment.RIGHT));
            }
            document.add(new Paragraph("TOTAL GERAL: R$ " + venda.getValorTotal()).setBold().setFontSize(11).setTextAlignment(TextAlignment.RIGHT));
            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("FORMA DE PAGAMENTO:").setBold().setFontSize(8));
            venda.getPagamentos().forEach(p -> {
                String detalhe = p.getMetodo();
                if (p.getParcelas() != null && p.getParcelas() > 1) {
                    detalhe += " (" + p.getParcelas() + "x)";
                }
                
                Table pTable = new Table(new float[]{150f, 76f});
                pTable.addCell(new Cell().add(new Paragraph(detalhe).setFontSize(8)).setBorder(Border.NO_BORDER));
                pTable.addCell(new Cell().add(new Paragraph("R$ " + p.getValor()).setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));
                document.add(pTable);
            });
            
            document.add(new Paragraph("Obrigado pela preferência!").setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginTop(10));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
        return baos.toByteArray();
    }
}
