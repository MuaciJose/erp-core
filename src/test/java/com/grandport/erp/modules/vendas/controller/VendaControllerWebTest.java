package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.pdf.service.PdfService;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.service.VendaService;
import com.grandport.erp.modules.vendas.service.WhatsAppService;
import com.grandport.erp.modules.fiscal.service.NfeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Web - Venda Controller")
class VendaControllerWebTest {

    @Mock
    private VendaService service;
    @Mock
    private VendaRepository repository;
    @Mock
    private WhatsAppService whatsAppService;
    @Mock
    private NfeService nfeService;
    @Mock
    private PdfService pdfService;
    @Mock
    private ConfiguracaoAtualService configuracaoAtualService;
    @Mock
    private EmpresaContextService empresaContextService;

    @InjectMocks
    private VendaController vendaController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(vendaController).build();
    }

    @Test
    @DisplayName("GET /api/vendas/{id}/imprimir-pdf deve retornar PDF da venda")
    void deveRetornarPdfDaVenda() throws Exception {
        Parceiro cliente = new Parceiro();
        cliente.setNome("Cliente Balcao");

        Veiculo veiculo = new Veiculo();
        veiculo.setModelo("Gol");
        veiculo.setPlaca("XYZ9876");

        Venda venda = new Venda();
        venda.setId(21L);
        venda.setCliente(cliente);
        venda.setVeiculo(veiculo);
        venda.setStatus(StatusVenda.PEDIDO);
        venda.setKmVeiculo(88500);
        venda.setVendedorNome("Operador 01");

        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setLayoutHtmlVenda("<html><body>Venda</body></html>");

        when(empresaContextService.getRequiredEmpresaId()).thenReturn(1L);
        when(repository.findByEmpresaIdAndId(1L, 21L)).thenReturn(Optional.of(venda));
        when(configuracaoAtualService.obterAtual()).thenReturn(config);
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("pdf-venda".getBytes());

        mockMvc.perform(get("/api/vendas/21/imprimir-pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "inline; filename=Documento-21.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes("pdf-venda".getBytes()));
    }
}
