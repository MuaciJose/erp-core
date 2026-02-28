package com.grandport.erp.modules.compras.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

@Data
@JacksonXmlRootElement(localName = "nfeProc")
@JsonIgnoreProperties(ignoreUnknown = true)
public class NfeProcDTO {

    @JacksonXmlProperty(localName = "NFe")
    private NfeDTO nfe;
}
