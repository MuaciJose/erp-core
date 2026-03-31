# Manual de Instruções - GrandPort ERP

Este manual foi atualizado com base no estado atual do projeto: ERP web, governança de impressão e aplicativo mobile.

---

## 1. Visão Geral

O GrandPort ERP foi estruturado para operação automotiva completa:

- atendimento de balcão
- orçamento, pedido e caixa
- oficina, checklist e OS
- estoque, inventário e recebimento
- financeiro e fiscal
- layouts e impressão governada
- aplicativo mobile operacional

---

## 2. Vendas e Caixa

### 2.1. Central de Vendas

Use a central para:

- localizar documentos por número, cliente ou veículo
- consultar espelho da venda
- reabrir orçamentos e pedidos quando o status permitir
- iniciar novo orçamento/pedido

### 2.2. Orçamento e Pedido

Fluxo recomendado:

1. vincular cliente
2. vincular veículo quando houver
3. adicionar peças
4. aplicar desconto
5. salvar como orçamento ou converter em pedido

### 2.3. PDV

O PDV foi pensado para operação rápida e usa atalhos de teclado para reduzir uso de mouse.

### 2.4. Fila de Caixa

Pedidos enviados para recebimento aparecem na fila de caixa, onde o operador:

1. seleciona o documento
2. confere o total
3. lança as formas de pagamento
4. conclui a venda
5. imprime comprovante quando necessário

---

## 3. Estoque e Catálogo

### 3.1. Gestão de Peças

O cadastro de produto concentra:

- descrição
- SKU
- EAN
- referência original
- marca
- NCM
- custo e venda
- estoque e estoque mínimo
- localização
- foto

### 3.2. Inventário e Ajuste

O sistema possui fluxo web e mobile para:

- scan de peça
- consulta de saldo
- conferência física
- ajuste de estoque

### 3.3. Recebimento de Mercadoria

No app mobile, o recebimento funciona por conferência cega:

1. bipar a peça
2. montar o lote
3. conferir quantidade lida
4. confirmar entrada

---

## 4. Oficina e Recepção

### 4.1. Checklist / Recepção

Na recepção do veículo, registre:

- veículo
- KM
- combustível
- avarias
- fotos
- assinatura do cliente

### 4.2. Ordem de Serviço

A OS centraliza:

- cliente
- veículo
- peças
- serviços
- observações
- totais

### 4.3. Painel de OS

Use o painel como fila de produção da oficina para acompanhar:

- prioridade
- gargalos
- veículo parado
- andamento de execução

---

## 5. Impressão e Layouts

O ERP possui governança de impressão para:

- layouts HTML
- laudo de vistoria
- DANFE

### 5.1. Regra de uso

Fluxo correto:

1. editar
2. salvar draft
3. visualizar preview
4. publicar

### 5.2. Centrais

- **Central de Layouts**: documentos HTML como OS, vendas, recibos e extratos
- **Central de Laudos**: template JRXML do laudo de vistoria
- **Central DANFE**: template JRXML do DANFE

### 5.3. Histórico e rollback

As centrais suportam:

- biblioteca premium
- template oficial
- diff
- histórico
- rollback

---

## 6. Financeiro

### 6.1. Controle de Caixa

Abra o caixa no início do expediente e feche no final, conferindo fundo de troco, entradas e saídas.

### 6.2. Relatórios

O módulo financeiro possui geração de:

- recibos
- relatórios de contas a pagar e receber
- extrato de cliente
- extrato de fornecedor
- DRE

---

## 7. Aplicativo Mobile

O projeto possui um aplicativo mobile próprio em React Native / Expo.

Principais telas:

- dashboard mobile
- checklist mobile
- inventário mobile
- orçamento/pedido mobile
- parceiros
- recebimento de mercadoria
- cadastro rápido de produto

O mobile não substitui o ERP web inteiro. Ele cobre a operação de campo, balcão e estoque.

---

## 8. Atalhos do Balcão

Atalhos mais importantes:

- `F2`: foco no cliente
- `F3`: foco na busca de peças
- `F4`: desconto
- `F8`: salvar orçamento
- `F9`: converter para pedido
- `Ctrl + F9`: enviar para o caixa
- `F11`: envio por WhatsApp
- `Ctrl + P`: impressão rápida
- `Esc`: fechar modal ou voltar

---

## 9. Observação Operacional

Em impressão, salvar não coloca em produção. Para o documento usar o novo modelo, é necessário publicar.

No mobile, use os fluxos curtos para operação de campo. Para configuração, fiscal e parametrização completa, utilize o ERP web.
