package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

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
            // Definindo tamanho para bobina térmica (80mm de largura)
            // 226pt é aproximadamente 80mm
            PageSize pageSize = new PageSize(226, 842); // Altura maior para vendas longas
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(pageSize);
            
            Document document = new Document(pdf);
            document.setMargins(5, 5, 5, 5); // Margens mínimas para térmica

            document.add(new Paragraph("GRANDPORT ERP").setBold().setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Rua das Pecas, 100 - Centro").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("--------------------------------").setTextAlignment(TextAlignment.CENTER));

            // Tabela compacta para térmica
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
            document.add(new Paragraph("TOTAL: R$ " + venda.getValorTotal()).setBold().setFontSize(10).setTextAlignment(TextAlignment.RIGHT));
            document.add(new Paragraph("Obrigado pela preferência!").setFontSize(8).setTextAlignment(TextAlignment.CENTER));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
        return baos.toByteArray();
    }
}
