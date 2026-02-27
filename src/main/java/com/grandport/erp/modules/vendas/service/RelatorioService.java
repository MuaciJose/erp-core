package com.grandport.erp.modules.vendas.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
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
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Cabeçalho do ERP
            document.add(new Paragraph("GRANDPORT AUTOPEÇAS").setBold().setFontSize(20));
            document.add(new Paragraph("Comprovante de Venda #" + venda.getId()));
            document.add(new Paragraph("Data: " + venda.getDataHora()));
            document.add(new Paragraph("--------------------------------------------------"));

            // Tabela de Itens
            float[] columnWidths = {300f, 50f, 100f};
            Table table = new Table(columnWidths);
            table.addCell("Produto");
            table.addCell("Qtd");
            table.addCell("Preço");

            venda.getItens().forEach(item -> {
                table.addCell(item.getProduto().getNome());
                table.addCell(String.valueOf(item.getQuantidade()));
                table.addCell("R$ " + item.getPrecoUnitario());
            });

            document.add(table);
            document.add(new Paragraph("\nTOTAL: R$ " + venda.getValorTotal()).setBold());
            
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF", e);
        }

        return baos.toByteArray();
    }
}
