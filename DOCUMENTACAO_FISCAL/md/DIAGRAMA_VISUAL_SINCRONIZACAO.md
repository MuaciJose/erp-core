# 📊 DIAGRAMA VISUAL: SINCRONIZAÇÃO FISCAL × ESTOQUE

## 🎯 Fluxo Completo da Sincronização

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE SINCRONIZAÇÃO COMPLETO                       │
└────────────────────────────────────────────────────────────────────────────┘

                           🏪 CADASTRO DE PRODUTO
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   FRONTEND (React)          │
                    │   Produtos.jsx              │
                    │  [Formulário de Criação]    │
                    └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Preenche:                     │
                    │ ✅ Nome, SKU, Preço          │
                    │ ✅ NCM (Classificação)       │
                    │ ✅ CFOP (Tipo de Operação)   │
                    │ ✅ CSOSN/CST (Tributação)    │
                    │ ✅ Alíquotas (ICMS, IPI)     │
                    │ ✅ Marca, Categoria          │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   BACKEND (Java)            │
                    │   ProdutoController         │
                    │   .cadastrar()              │
                    └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Valida:                       │
                    │ ⚠️ Campo obrigatório?         │
                    │ ⚠️ Tipo de dados correto?     │
                    │ ⚠️ NCM é válido (8 dígitos)?  │
                    │ ⚠️ CFOP é válido (4 dígitos)? │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   BANCO DE DADOS (SQL)      │
                    │   Tabela: produtos          │
                    │  [Salva com todos dados]    │
                    └──────────────┬──────────────┘
                                    │
                                    ▼
        ╔════════════════════════════════════════════════════════════╗
        ║  ✅ PRODUTO CRIADO COM DADOS FISCAIS SINCRONIZADOS!       ║
        ║  - NCM vinculado à classificação correta                 ║
        ║  - CFOP configurado para tipo de venda                  ║
        ║  - Alíquotas prontas para cálculo de impostos            ║
        ╚════════════════════════════════════════════════════════════╝
```

---

## 🛒 Fluxo de Venda (Quando Sincronização é Usada)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE VENDA COM SINCRONIZAÇÃO                     │
└────────────────────────────────────────────────────────────────────────────┘

                            📦 CLIENTE COMPRA PRODUTO
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   FRONTEND (React)          │
                    │   OrcamentoPedido.jsx       │
                    │   [Adicionar Item à Venda]  │
                    └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Carrega do Estoque:           │
                    │ ✅ Nome do produto            │
                    │ ✅ Preço de venda             │
                    │ ✅ Quantidade em estoque      │
                    │ ✅ NCM (já sincronizado)      │
                    │ ✅ CFOP, Alíquotas (já sync)  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   BACKEND (Java)            │
                    │   VendaController           │
                    │   .criarVenda()             │
                    └──────────────┬──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ Cria ItemVenda vinculado a:   │
                    │ ✅ Venda (pedido)             │
                    │ ✅ Produto (com dados fiscais)│
                    │ ✅ Quantidade                 │
                    │ ✅ Preço unitário             │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   BANCO DE DADOS (SQL)      │
                    │   Tabelas:                  │
                    │   - vendas                  │
                    │   - itens_venda             │
                    │  [Salva a venda com itens] │
                    └──────────────┬──────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   GERADOR DE NF-e           │
                    │   FiscalController          │
                    │   .emitirNfeSefaz()         │
                    └──────────────┬──────────────┘
                                    │
              ┌─────────────────────┴──────────────────────┐
              │  VALIDAÇÃO CRÍTICA (NOVO - PASSO 2):       │
              │  ⚠️ NCM está preenchido?                    │
              │  ⚠️ CFOP está configurado?                  │
              │  ⚠️ CSOSN/CST está ok?                      │
              │  ⚠️ Alíquota ICMS está preenchida?         │
              │  ⚠️ Marca está vinculada?                   │
              └─────────────────────┬──────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                  ✅ TUDO OK             ❌ FALTA ALGO
                        │                       │
                        ▼                       ▼
        ┌───────────────────────┐   ┌──────────────────────────┐
        │ Motor Fiscal          │   │ ERRO CLARO AO USUÁRIO:   │
        │ MotorFiscalService    │   │                          │
        │ calcularTributosDoItem│   │ ❌ PRODUTO SEM DADOS      │
        │                       │   │    FISCAIS COMPLETOS     │
        │ Lê do Produto:        │   │                          │
        │ ✅ NCM da classe.     │   │ Produto: ABC-123         │
        │ ✅ CFOP padrão        │   │                          │
        │ ✅ Alíquotas          │   │ Erros encontrados:       │
        │ ✅ Origem Mercadoria  │   │ - CFOP não configurado   │
        │                       │   │ - Alíquota ICMS faltando │
        │ Calcula:              │   │                          │
        │ ✅ CFOP Final         │   │ ⚠️ Corrija no cadastro!  │
        │ ✅ Valor ICMS         │   └──────────────────────────┘
        │ ✅ Valor IPI          │
        │ ✅ Valor PIS          │
        │ ✅ Valor COFINS       │
        └───────────────┬───────┘
                        │
                        ▼
        ┌─────────────────────────────┐
        │ Gera XML da NF-e com:       │
        │ ✅ Valores de impostos      │
        │ ✅ Detalhes do CFOP         │
        │ ✅ Classificação NCM        │
        │ ✅ Alíquotas corretas       │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │ Envia para SEFAZ             │
        └────────┬─────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
  ✅ AUTORIZADO          ❌ REJEITADO
     │                       │
     ▼                       ▼
┌────────────┐        ┌──────────────┐
│ Atualiza   │        │ Logs erro:   │
│ Venda com  │        │ NCM inválido │
│ Nota Fiscal│        │ CFOP errado  │
│            │        │ Alíquota ruim│
│ ✅ Status: │        └──────────────┘
│  AUTORIZADA│
└────────────┘
     │
     ▼
┌──────────────────────┐
│ Gera DANFE (PDF)     │
│ com impostos corretos│
│                      │
│ ✅ Pronto para       │
│    impressão         │
└──────────────────────┘
```

---

## 🔄 Estrutura de Dados: Como Funciona a Sincronização

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  TABELAS E RELACIONAMENTOS NO BANCO                       │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│         TABELA: produtos            │
├─────────────────────────────────────┤
│ id (PK)                             │
│ nome                                │
│ sku                                 │
│ ncm_codigo (FK → ncm.codigo)    ◄───┼─── Vinculo Fiscal!
│ cfop_padrao                         │
│ csosn_padrao                        │
│ cst_padrao                          │
│ aliquota_icms                       │
│ aliquota_ipi                        │
│ aliquota_pis                        │
│ aliquota_cofins                     │
│ preco_venda (para cálculo)     ◄───┼─── Usa para impostos
│ quantidade_estoque                  │
│ marca_id (FK → marcas.id)          │
│ categoria_id (FK → categorias.id)   │
└─────────────────────────────────────┘
         │
         │
         ├──────┬──────────────────────────────────┐
         │      │                                  │
         ▼      ▼                                  ▼
┌─────────────────┐    ┌────────────────────┐    ┌──────────────┐
│  TABELA: itens  │    │  TABELA: vendas    │    │ TABELA: ncm  │
│     _venda      │    ├────────────────────┤    ├──────────────┤
├─────────────────┤    │ id (PK)            │    │ codigo (PK)  │
│ id (PK)         │    │ cliente_id         │    │ descricao    │
│ venda_id (FK)───┼───→│ data_hora          │    │ aliquota_pad │
│ produto_id (FK) │    │ valor_total        │    └──────────────┘
│ quantidade      │    │ status             │
│ preco_unitario  │    └────────────────────┘
└─────────────────┘
         │
         └──────────────────────┐
                                │
                ┌───────────────┴──────────────┐
                │                              │
                ▼                              ▼
    ┌───────────────────────┐    ┌───────────────────────┐
    │   TABELA: notas_      │    │  TABELA: fiscal_      │
    │        fiscais        │    │        regras         │
    ├───────────────────────┤    ├───────────────────────┤
    │ id (PK)               │    │ id (PK)               │
    │ numero                │    │ nome_regra            │
    │ serie                 │    │ ncm_prefixo           │
    │ chave_acesso          │    │ estado_destino        │
    │ venda_id (FK)     ◄───┼──→│ cfop                  │
    │ status                │    │ cst_icms              │
    │ protocolo             │    │ icms_aliquota         │
    │ url_danfe             │    │ pis_aliquota          │
    └───────────────────────┘    └───────────────────────┘
             │
             └───────────┬──────────────────┐
                         │                  │
                 ✅ SINCRONIZADO     ✅ AUDITADO
```

---

## 🎨 Validação em Três Níveis

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    VALIDAÇÃO EM 3 NÍVEIS (NOVO)                            │
└────────────────────────────────────────────────────────────────────────────┘

NÍVEL 1: FRONTEND (React) - Validação Imediata ao Usuário
┌─────────────────────────────────────────────────────────┐
│ Produtos.jsx                                            │
│                                                         │
│ ⚠️ Campo obrigatório vazio? → Destaca em vermelho     │
│ ⚠️ NCM tem formato errado? → Mostra alerta             │
│ ⚠️ Produto sem marca? → Sugere preencher              │
│                                                         │
│ Resultado: Usuário sabe IMEDIATAMENTE se algo falta   │
└─────────────────────────────────────────────────────────┘
         │
         │ Envia dados válidos
         ▼
NÍVEL 2: BACKEND (Java) - Validação Antes de Salvar
┌─────────────────────────────────────────────────────────┐
│ ProdutoController.cadastrar()                           │
│                                                         │
│ ❌ NCM não existe no banco? → Retorna 400             │
│ ❌ CFOP inválido? → Retorna 400                        │
│ ❌ Dados incompletos? → Retorna mensagem clara        │
│                                                         │
│ Resultado: Valida antes de gravar no banco             │
└─────────────────────────────────────────────────────────┘
         │
         │ Dados validados
         ▼
NÍVEL 3: NF-e (Fiscal) - Validação Antes de Emitir
┌─────────────────────────────────────────────────────────┐
│ NfeService.emitirNfeSefaz()                             │
│ [NOVO - Implementado no PASSO 2]                       │
│                                                         │
│ ❌ Produto sem NCM? → Erro claro e não emite          │
│ ❌ CFOP faltando? → Erro claro e não emite            │
│ ❌ Alíquota nula? → Erro claro e não emite            │
│                                                         │
│ Resultado: Impede NF-e defeituosa na raiz!            │
└─────────────────────────────────────────────────────────┘
         │
         │ Tudo validado em 3 níveis
         ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ NF-e SEGURA                                          │
│ - Impostos corretos na DANFE                            │
│ - SEFAZ aceita sem problemas                            │
│ - Cliente recebe documento fiscal perfeito             │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Indicador de Sincronização (Status Visual)

```
┌────────────────────────────────────────────────────────────────────────────┐
│              NOVO ENDPOINT: /api/produtos/auditoria-fiscal                 │
└────────────────────────────────────────────────────────────────────────────┘

Retorna Status em Tempo Real:

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Total de Produtos: 150                                      │
│  ✅ Prontos para Fiscal: 145 (96.7%)                        │
│  ⚠️  Incompletos: 5 (3.3%)                                  │
│                                                              │
│  PRODUTOS INCOMPLETOS:                                       │
│  • Produto ABC-123 → Falta: NCM, CFOP                       │
│  • Produto XYZ-456 → Falta: Alíquota ICMS                   │
│  • Produto QWE-789 → Falta: Marca                           │
│  • Produto RTY-012 → Falta: CSOSN                           │
│  • Produto UIO-345 → Falta: Tudo!                           │
│                                                              │
│  [Botão] Corrigir Automaticamente                           │
│  [Botão] Exportar Relatório                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Visual no Dashboard:

┌─────────────────────────────────────────┐
│  SINCRONIZAÇÃO FISCAL × ESTOQUE         │
├─────────────────────────────────────────┤
│                                         │
│  █████████████████░ 96.7%              │
│  (145 de 150 produtos OK)              │
│                                         │
│  🟢 145 Prontos                         │
│  🔴  5 Incompletos                      │
│  ⏳  0 Em Sincronização                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Garantias de Sincronização

Depois de implementar os passos acima, você tem garantido:

```
✅ NCM SINCRONIZADO
   └─→ Toda venda usa a classificação correta da SEFAZ

✅ CFOP SINCRONIZADO
   └─→ Tipo de operação ajustado para estado do cliente

✅ ALÍQUOTAS SINCRONIZADAS
   └─→ ICMS, IPI, PIS, COFINS calculados corretamente

✅ MARCA SINCRONIZADA
   └─→ Origem da mercadoria registrada na NF-e

✅ ESTOQUE SINCRONIZADO
   └─→ Quantidade deduzida no momento da venda

✅ AUDITORIA SINCRONIZADA
   └─→ Cada movimento registrado com rastreabilidade

✅ SEFAZ SATISFEITO
   └─→ 0% de rejeições por falta de dados
```

---

**Pronto! Você entende agora como a sincronização funciona! 🎉**

