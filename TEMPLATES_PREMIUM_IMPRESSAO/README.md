# Templates Premium de Impressao

Biblioteca de templates prontos para uso na Central de Layouts e na Central de Laudos.

Mapeamento para a Central de Layouts:

- `extrato_cliente` -> `extratoCliente`
- `extrato_fornecedor` -> `extratoFornecedor`
- `os` -> `os`
- `venda` -> `venda`
- `recibo` -> `recibo`
- `recibo_pagamento` -> `reciboPagamento`
- `fechamento_caixa` -> `fechamentoCaixa`
- `espelho_nota` -> `espelhoNota`
- `dre` -> `dre`
- `relatorio_comissao` -> `relatorioComissao`
- `relatorio_contas_pagar` -> `relatorioContasPagar`
- `relatorio_contas_receber` -> `relatorioContasReceber`
- `laudo_vistoria_jrxml` -> editor do laudo JRXML

Padrao dos arquivos:

- `01-executivo`
- `02-corporativo`
- `03-automotivo`
- `04-minimalista`
- `05-signature`

Observacoes:

- Os arquivos HTML usam Thymeleaf e foram montados com as variaveis ja suportadas pelo backend.
- Os arquivos JRXML do laudo servem como base profissional para customizacao.
- Antes de publicar na central, use o preview PDF para validar paginacao e campos opcionais.
