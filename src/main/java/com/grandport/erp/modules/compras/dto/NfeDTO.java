package com.grandport.erp.modules.compras.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@JacksonXmlRootElement(localName = "NFe")
@JsonIgnoreProperties(ignoreUnknown = true)
public class NfeDTO {

    @JacksonXmlProperty(localName = "infNFe")
    private InfoNfe infNFe;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InfoNfe {
        @JacksonXmlProperty(localName = "ide")
        private Ide ide;

        @JacksonXmlProperty(localName = "emit")
        private Emitente emitente;

        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "det")
        private List<Detalhe> detalhes;

        @JacksonXmlProperty(localName = "total")
        private Total total;

        @JacksonXmlProperty(localName = "cobr")
        private Cobranca cobranca;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Detalhe {
        @JacksonXmlProperty(localName = "prod")
        private ItemNotaDTO produto;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Ide {
        @JacksonXmlProperty(localName = "nNF")
        private String numeroNota;
        @JacksonXmlProperty(localName = "dhEmi")
        private OffsetDateTime dataEmissao;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Emitente {
        @JacksonXmlProperty(localName = "CNPJ")
        private String cnpj;
        @JacksonXmlProperty(localName = "xNome")
        private String nome;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Total {
        @JacksonXmlProperty(localName = "ICMSTot")
        private IcmsTot icmsTot;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IcmsTot {
        @JacksonXmlProperty(localName = "vNF")
        private BigDecimal valorTotal;
    }

    // 🚀 BLINDAGEM DO FINANCEIRO
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Cobranca {
        // Mapeamos a Fatura para o Jackson não se perder antes de chegar nas duplicatas
        @JacksonXmlProperty(localName = "fat")
        private Fatura fatura;

        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "dup")
        private List<Duplicata> duplicatas;
    }

    // Estrutura da Fatura (Opcional, mas ajuda o Jackson)
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Fatura {
        @JacksonXmlProperty(localName = "nFat")
        private String numero;
        @JacksonXmlProperty(localName = "vOrig")
        private BigDecimal valorOriginal;
        @JacksonXmlProperty(localName = "vLiq")
        private BigDecimal valorLiquido;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Duplicata {
        @JacksonXmlProperty(localName = "nDup")
        private String numero;

        // 🚀 FORÇANDO O PADRÃO DE DATA PARA EVITAR ERRO DE PARSE
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @JacksonXmlProperty(localName = "dVenc")
        private LocalDate dataVencimento;

        @JacksonXmlProperty(localName = "vDup")
        private BigDecimal valor;
    }
}