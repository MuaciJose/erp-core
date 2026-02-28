package com.grandport.erp.modules.compras.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ItemNotaDTO {

    @JacksonXmlProperty(localName = "cProd")
    private String codigoProduto;

    @JacksonXmlProperty(localName = "xProd")
    private String nomeProduto;

    @JacksonXmlProperty(localName = "NCM")
    private String ncm;

    @JacksonXmlProperty(localName = "qCom")
    private Integer quantidade;

    @JacksonXmlProperty(localName = "vUnCom")
    private BigDecimal valorUnitario;

    @JacksonXmlProperty(localName = "cEAN")
    private String ean;
}
