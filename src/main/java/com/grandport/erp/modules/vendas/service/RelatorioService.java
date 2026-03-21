package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;

// 🚀 NOVOS IMPORTS DO ITEXT 7 PARA DEIXAR O PDF LINDO
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Base64;

@Service
public class RelatorioService {

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    public byte[] gerarPdfVenda(Long vendaId) {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada"));

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(baos);
            // 80mm de largura (Padrão de bobina térmica digital)
            PageSize pageSize = new PageSize(226, 842);
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(pageSize);

            Document document = new Document(pdf);
            document.setMargins(10, 10, 10, 10);

            // ==========================================
            // 1. LOGO DA EMPRESA (Se existir no banco)
            // ==========================================
            if (config.getLogoBase64() != null && !config.getLogoBase64().isEmpty()) {
                try {
                    // Limpa o prefixo "data:image/png;base64," se vier do React
                    String base64Data = config.getLogoBase64().contains(",") ?
                            config.getLogoBase64().split(",")[1] : config.getLogoBase64();

                    byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                    ImageData imageData = ImageDataFactory.create(imageBytes);
                    Image logo = new Image(imageData);

                    logo.setWidth(80); // Tamanho ideal para bobina 80mm
                    logo.setHorizontalAlignment(HorizontalAlignment.CENTER);
                    logo.setMarginBottom(5);
                    document.add(logo);
                } catch (Exception e) {
                    System.err.println("Erro ao processar logo para o PDF: " + e.getMessage());
                }
            }

            // ==========================================
            // 2. CABEÇALHO (Nome e Endereço Elegante)
            // ==========================================
            String nomeLoja = (config.getNomeFantasia() != null && !config.getNomeFantasia().isEmpty())
                    ? config.getNomeFantasia() : "GRANDPORT ERP";

            document.add(new Paragraph(nomeLoja.toUpperCase())
                    .setBold()
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(0));

            if (config.getCnpj() != null && !config.getCnpj().isEmpty()) {
                document.add(new Paragraph("CNPJ: " + config.getCnpj())
                        .setFontSize(7)
                        .setFontColor(ColorConstants.DARK_GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(0));
            }

            String logradouro = config.getLogradouro() != null ? config.getLogradouro() : "";
            String numero = config.getNumero() != null ? config.getNumero() : "S/N";
            String bairro = config.getBairro() != null ? config.getBairro() : "";
            String enderecoFormatado = String.format("%s, %s - %s", logradouro, numero, bairro);

            if (!enderecoFormatado.equals(", S/N - ")) {
                document.add(new Paragraph(enderecoFormatado)
                        .setFontSize(7)
                        .setFontColor(ColorConstants.GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(0));
            }

            if (config.getTelefone() != null && !config.getTelefone().isEmpty()) {
                document.add(new Paragraph("Contato: " + config.getTelefone())
                        .setFontSize(7)
                        .setFontColor(ColorConstants.GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(0));
            }

            // Linha divisória moderna (Substitui os tracinhos)
            LineSeparator separator = new LineSeparator(new SolidLine(0.5f));
            separator.setMarginTop(8).setMarginBottom(8);
            document.add(separator);

            // ==========================================
            // 3. DADOS DO CLIENTE & VENDA
            // ==========================================
            document.add(new Paragraph("RECIBO Nº: " + venda.getId())
                    .setBold().setFontSize(9).setTextAlignment(TextAlignment.CENTER));

            if (venda.getCliente() != null) {
                document.add(new Paragraph("Cliente: " + venda.getCliente().getNome())
                        .setFontSize(8).setMarginTop(2));
            }

            document.add(separator);

            // ==========================================
            // 4. TABELA DE ITENS (Clean Design)
            // ==========================================
            Table table = new Table(UnitValue.createPercentArray(new float[]{15, 60, 25})).useAllAvailableWidth();

            // Cabeçalho da Tabela
            table.addHeaderCell(new Cell().add(new Paragraph("QTD").setBold().setFontSize(7)).setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f)));
            table.addHeaderCell(new Cell().add(new Paragraph("DESCRIÇÃO").setBold().setFontSize(7)).setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f)));
            table.addHeaderCell(new Cell().add(new Paragraph("TOTAL").setBold().setFontSize(7).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f)));

            // Itens
            venda.getItens().forEach(item -> {
                table.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantidade())).setFontSize(8)).setBorder(Border.NO_BORDER).setPaddingTop(3));
                table.addCell(new Cell().add(new Paragraph(item.getProduto().getNome()).setFontSize(8)).setBorder(Border.NO_BORDER).setPaddingTop(3));

                // Calcula QTD * Preço Unitário para mostrar o total da linha
                BigDecimal totalItem = item.getPrecoUnitario().multiply(new BigDecimal(item.getQuantidade()));
                table.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", totalItem)).setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER).setPaddingTop(3));
            });
            document.add(table);

            document.add(separator);

            // ==========================================
            // 5. RESUMO DE TOTAIS
            // ==========================================
            Table totaisTable = new Table(UnitValue.createPercentArray(new float[]{60, 40})).useAllAvailableWidth();

            totaisTable.addCell(new Cell().add(new Paragraph("Subtotal:").setFontSize(8)).setBorder(Border.NO_BORDER));
            totaisTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", venda.getValorSubtotal())).setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));

            if (venda.getDesconto() != null && venda.getDesconto().compareTo(BigDecimal.ZERO) > 0) {
                totaisTable.addCell(new Cell().add(new Paragraph("Desconto:").setFontSize(8).setFontColor(ColorConstants.RED)).setBorder(Border.NO_BORDER));
                totaisTable.addCell(new Cell().add(new Paragraph("- R$ " + String.format("%.2f", venda.getDesconto())).setFontSize(8).setFontColor(ColorConstants.RED).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));
            }

            // TOTAL GERAL DESTAQUE
            totaisTable.addCell(new Cell().add(new Paragraph("TOTAL:").setBold().setFontSize(11)).setBorder(Border.NO_BORDER).setPaddingTop(5));
            totaisTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", venda.getValorTotal())).setBold().setFontSize(11).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER).setPaddingTop(5));

            document.add(totaisTable);
            document.add(separator);

            // ==========================================
            // 6. FORMAS DE PAGAMENTO
            // ==========================================
            document.add(new Paragraph("MÉTODO DE PAGAMENTO").setBold().setFontSize(7).setFontColor(ColorConstants.DARK_GRAY));

            Table pTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
            venda.getPagamentos().forEach(p -> {
                String detalhe = p.getMetodo().replace("_", " ");
                if (p.getParcelas() != null && p.getParcelas() > 1) {
                    detalhe += " (" + p.getParcelas() + "x)";
                }
                pTable.addCell(new Cell().add(new Paragraph(detalhe).setFontSize(8)).setBorder(Border.NO_BORDER));
                pTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", p.getValor())).setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));
            });
            document.add(pTable);

            // ==========================================
            // 7. RODAPÉ (Agradecimento)
            // ==========================================
            String msgRodape = (config.getMensagemRodape() != null && !config.getMensagemRodape().isEmpty())
                    ? config.getMensagemRodape() : "Obrigado pela preferência! Volte sempre.";

            document.add(new Paragraph(msgRodape)
                    .setFontSize(7)
                    .setItalic()
                    .setFontColor(ColorConstants.DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(15));

            document.close();

        } catch (Exception e) {
            System.err.println("Erro Crítico ao Gerar PDF: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao gerar PDF", e);
        }

        return baos.toByteArray();
    }
}