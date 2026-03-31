package com.grandport.erp.modules.os.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.service.OrdemServicoService;
import com.grandport.erp.modules.os.service.OsFiscalService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.pdf.service.PdfService;
import com.grandport.erp.modules.veiculo.model.Veiculo;
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
@DisplayName("Testes Web - OrdemServico Controller")
class OrdemServicoControllerWebTest {

    @Mock
    private OrdemServicoRepository osRepository;
    @Mock
    private OrdemServicoService osService;
    @Mock
    private OsFiscalService osFiscalService;
    @Mock
    private PdfService pdfService;
    @Mock
    private ConfiguracaoAtualService configuracaoAtualService;
    @Mock
    private EmpresaContextService empresaContextService;

    @InjectMocks
    private OrdemServicoController ordemServicoController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ordemServicoController).build();
    }

    @Test
    @DisplayName("GET /api/os/{id}/imprimir-pdf deve retornar PDF da OS")
    void deveRetornarPdfDaOs() throws Exception {
        Parceiro cliente = new Parceiro();
        cliente.setNome("Cliente Oficina");
        cliente.setTelefone("81999999999");

        Veiculo veiculo = new Veiculo();
        veiculo.setMarca("Fiat");
        veiculo.setModelo("Uno");
        veiculo.setPlaca("ABC1234");

        OrdemServico os = new OrdemServico();
        os.setId(15L);
        os.setCliente(cliente);
        os.setVeiculo(veiculo);
        os.setKmEntrada(120345);

        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setLayoutHtmlOs("<html><body>OS</body></html>");

        when(empresaContextService.getRequiredEmpresaId()).thenReturn(1L);
        when(osRepository.findByEmpresaIdAndId(1L, 15L)).thenReturn(Optional.of(os));
        when(configuracaoAtualService.obterAtual()).thenReturn(config);
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("pdf-os".getBytes());

        mockMvc.perform(get("/api/os/15/imprimir-pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "inline; filename=OS-15.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes("pdf-os".getBytes()));
    }
}
