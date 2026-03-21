package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
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
            // Formato A4 Oficial (595 x 842 pontos)
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(PageSize.A4);

            Document document = new Document(pdf);
            // Margens padrão A4 (aprox 1.5 cm)
            document.setMargins(40, 40, 40, 40);

            // ==========================================
            // TÍTULO DINÂMICO (ORÇAMENTO VS PEDIDO)
            // ==========================================
            String statusVenda = (venda.getStatus() != null) ? venda.getStatus().toString().toUpperCase() : "";
            String tituloDocumento = statusVenda.equals("ORCAMENTO") ? "ORÇAMENTO" : "PEDIDO DE VENDA";

            // ==========================================
            // CABEÇALHO CORPORATIVO (LOGO + DADOS)
            // ==========================================
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{30, 70})).useAllAvailableWidth();

            // Coluna 1: Logo
            Cell logoCell = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE);
            if (config.getLogoBase64() != null && !config.getLogoBase64().isEmpty()) {
                try {
                    String base64Data = config.getLogoBase64().contains(",") ? config.getLogoBase64().split(",")[1] : config.getLogoBase64();
                    byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                    ImageData imageData = ImageDataFactory.create(imageBytes);
                    Image logo = new Image(imageData);
                    logo.setWidth(120);
                    logoCell.add(logo);
                } catch (Exception e) {
                    System.err.println("Erro ao processar logo.");
                }
            }
            headerTable.addCell(logoCell);

            // Coluna 2: Dados da Empresa e Título
            Cell infoCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);

            // TÍTULO GIGANTE NO TOPO
            infoCell.add(new Paragraph(tituloDocumento).setBold().setFontSize(18).setFontColor(ColorConstants.BLUE));
            infoCell.add(new Paragraph("Nº: " + venda.getId()).setBold().setFontSize(12));

            String nomeLoja = (config.getNomeFantasia() != null && !config.getNomeFantasia().isEmpty()) ? config.getNomeFantasia() : "GRANDPORT ERP";
            infoCell.add(new Paragraph(nomeLoja.toUpperCase()).setBold().setFontSize(10).setMarginTop(10));

            if (config.getCnpj() != null && !config.getCnpj().isEmpty()) {
                infoCell.add(new Paragraph("CNPJ: " + config.getCnpj()).setFontSize(9).setFontColor(ColorConstants.DARK_GRAY));
            }
            if (config.getTelefone() != null && !config.getTelefone().isEmpty()) {
                infoCell.add(new Paragraph("Contato: " + config.getTelefone()).setFontSize(9).setFontColor(ColorConstants.DARK_GRAY));
            }
            headerTable.addCell(infoCell);
            document.add(headerTable);

            // Linha Divisória
            LineSeparator separator = new LineSeparator(new SolidLine(1f));
            separator.setMarginTop(15).setMarginBottom(15);
            document.add(separator);

            // ==========================================
            // DADOS DO CLIENTE (Corrigido para não quebrar a compilação)
            // ==========================================
            Table clienteTable = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            clienteTable.addCell(new Cell().add(new Paragraph("DADOS DO CLIENTE").setBold().setFontSize(10).setBackgroundColor(ColorConstants.LIGHT_GRAY)).setBorder(Border.NO_BORDER).setPadding(5));

            if (venda.getCliente() != null) {
                String nomeCli = venda.getCliente().getNome();
                String telCli = (venda.getCliente().getTelefone() != null) ? " | Tel: " + venda.getCliente().getTelefone() : "";
                clienteTable.addCell(new Cell().add(new Paragraph("Nome: " + nomeCli + telCli).setFontSize(10)).setBorder(Border.NO_BORDER).setPadding(5));
            } else {
                clienteTable.addCell(new Cell().add(new Paragraph("Cliente Padrão / Consumidor Final").setFontSize(10)).setBorder(Border.NO_BORDER).setPadding(5));
            }

            document.add(clienteTable);
            document.add(new Paragraph("").setMarginBottom(10)); // Espaço

            // ==========================================
            // TABELA DE ITENS
            // ==========================================
            Table table = new Table(UnitValue.createPercentArray(new float[]{10, 50, 20, 20})).useAllAvailableWidth();

            table.addHeaderCell(new Cell().add(new Paragraph("QTD").setBold().setFontSize(10).setFontColor(ColorConstants.WHITE)).setBackgroundColor(ColorConstants.DARK_GRAY).setPadding(5).setTextAlignment(TextAlignment.CENTER));
            table.addHeaderCell(new Cell().add(new Paragraph("DESCRIÇÃO DO PRODUTO / SERVIÇO").setBold().setFontSize(10).setFontColor(ColorConstants.WHITE)).setBackgroundColor(ColorConstants.DARK_GRAY).setPadding(5));
            table.addHeaderCell(new Cell().add(new Paragraph("VLR. UNITÁRIO").setBold().setFontSize(10).setFontColor(ColorConstants.WHITE)).setBackgroundColor(ColorConstants.DARK_GRAY).setPadding(5).setTextAlignment(TextAlignment.RIGHT));
            table.addHeaderCell(new Cell().add(new Paragraph("TOTAL").setBold().setFontSize(10).setFontColor(ColorConstants.WHITE)).setBackgroundColor(ColorConstants.DARK_GRAY).setPadding(5).setTextAlignment(TextAlignment.RIGHT));

            venda.getItens().forEach(item -> {
                table.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantidade())).setFontSize(10)).setPadding(5).setTextAlignment(TextAlignment.CENTER));
                table.addCell(new Cell().add(new Paragraph(item.getProduto().getNome()).setFontSize(10)).setPadding(5));
                table.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", item.getPrecoUnitario())).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)).setPadding(5));

                BigDecimal totalItem = item.getPrecoUnitario().multiply(new BigDecimal(item.getQuantidade()));
                table.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", totalItem)).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)).setPadding(5));
            });
            document.add(table);

            // ==========================================
            // RESUMO FINANCEIRO
            // ==========================================
            Table totaisTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth().setMarginTop(15);
            totaisTable.addCell(new Cell().setBorder(Border.NO_BORDER)); // Espaço em branco

            Table valoresTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            valoresTable.addCell(new Cell().add(new Paragraph("Subtotal:").setFontSize(10)).setBorder(Border.NO_BORDER));
            valoresTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", venda.getValorSubtotal())).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));

            if (venda.getDesconto() != null && venda.getDesconto().compareTo(BigDecimal.ZERO) > 0) {
                valoresTable.addCell(new Cell().add(new Paragraph("Desconto:").setFontSize(10).setFontColor(ColorConstants.RED)).setBorder(Border.NO_BORDER));
                valoresTable.addCell(new Cell().add(new Paragraph("- R$ " + String.format("%.2f", venda.getDesconto())).setFontSize(10).setFontColor(ColorConstants.RED).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER));
            }

            valoresTable.addCell(new Cell().add(new Paragraph("TOTAL GERAL:").setBold().setFontSize(14)).setBorder(Border.NO_BORDER).setPaddingTop(10));
            valoresTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", venda.getValorTotal())).setBold().setFontSize(14).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER).setPaddingTop(10));

            totaisTable.addCell(new Cell().add(valoresTable).setBorder(Border.NO_BORDER));
            document.add(totaisTable);

            // ==========================================
            // FORMAS DE PAGAMENTO
            // ==========================================
            if (venda.getPagamentos() != null && !venda.getPagamentos().isEmpty()) {
                document.add(new Paragraph("MÉTODO DE PAGAMENTO").setBold().setFontSize(10).setFontColor(ColorConstants.DARK_GRAY).setMarginTop(20));

                Table pTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
                venda.getPagamentos().forEach(p -> {
                    String detalhe = p.getMetodo().replace("_", " ");
                    if (p.getParcelas() != null && p.getParcelas() > 1) {
                        detalhe += " (" + p.getParcelas() + " parcelas)";
                    }
                    pTable.addCell(new Cell().add(new Paragraph(detalhe).setFontSize(10)).setBorder(Border.NO_BORDER));
                    pTable.addCell(new Cell().add(new Paragraph("R$ " + String.format("%.2f", p.getValor())).setFontSize(10)).setBorder(Border.NO_BORDER));
                });
                document.add(pTable);
            }

            // ==========================================
            // RODAPÉ / OBSERVAÇÕES
            // ==========================================
            LineSeparator footerSeparator = new LineSeparator(new SolidLine(0.5f));
            footerSeparator.setMarginTop(30).setMarginBottom(10);
            document.add(footerSeparator);

            String msgRodape = (config.getMensagemRodape() != null && !config.getMensagemRodape().isEmpty()) ? config.getMensagemRodape() : "Obrigado pela preferência! Volte sempre.";
            document.add(new Paragraph(msgRodape).setFontSize(9).setItalic().setFontColor(ColorConstants.DARK_GRAY).setTextAlignment(TextAlignment.CENTER));

            if ("ORCAMENTO".equals(statusVenda)) {
                document.add(new Paragraph("Validade deste orçamento: " + config.getDiasValidadeOrcamento() + " dias.").setFontSize(8).setBold().setFontColor(ColorConstants.RED).setTextAlignment(TextAlignment.CENTER).setMarginTop(5));
            } else {
                document.add(new Paragraph("Este documento não possui valor fiscal.").setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER).setMarginTop(5));
            }

            document.close();

        } catch (Exception e) {
            System.err.println("Erro Crítico ao Gerar PDF A4: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao gerar PDF", e);
        }

        return baos.toByteArray();
    }
}