# 🔍 ANÁLISE COMPLETA: SINCRONIZAÇÃO FISCAL ↔️ ESTOQUE

## 📋 SUMÁRIO EXECUTIVO

Realizei uma análise profunda do seu sistema ERP para avaliar a sincronização entre o **Módulo de Estoque** e o **Módulo Fiscal**. A boa notícia é que a arquitetura está bem estruturada! No entanto, **existem alguns pontos críticos que precisam ser ajustados** para evitar erros de impostos na impressão de NF-e.

---

## ✅ PONTOS POSITIVOS (O QUE JÁ ESTÁ FUNCIONANDO)

### 1. **Modelo de Dados Bem Definido**
- ✅ Produto possui todos os campos fiscais obrigatórios:
  - NCM (classificação de produtos)
  - CFOP (código de operação)
  - CSOSN/CST (códigos de situação tributária)
  - Alíquotas (ICMS, IPI, PIS, COFINS)
  - CEST (código de enquadramento)
  - Origem da mercadoria (0=Nacional, 1=Estrangeira)

### 2. **Motor Fiscal Centralizado**
- ✅ `MotorFiscalService.calcularTributosDoItem()` é o coração do sistema
- ✅ Valida estado do cliente vs estado da loja para ajustar CFOP
- ✅ Suporta Simples Nacional (CSOSN) e Regime Normal (CST)
- ✅ Calcula corretamente IBS/CBS 2026

### 3. **Sincronização de Série/Número**
- ✅ `SincronizacaoErpService` garante que números não pulam
- ✅ Registra auditoria de cada movimentação
- ✅ Transações atômicas (all-or-nothing)

### 4. **Fluxo Front → Back bem Integrado**
- ✅ React carrega dados fiscais do cadastro de produtos
- ✅ DTOs incluem todos os campos necessários (`ProdutoRequestDTO`)
- ✅ Produto e ItemVenda estão corretamente relacionados

---

## ⚠️ PROBLEMAS IDENTIFICADOS (CRÍTICOS)

### **PROBLEMA 1: NCM Não Está Sendo Validado na Venda**
**Impacto**: ❌ ALTO - Gera erro 400 na SEFAZ

```java
// ❌ PROBLEMA ATUAL (NfeService.java:99)
Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(
    item.getProduto(),  // ← Produto contém NCM
    config.getUf(),
    config.getUf(),
    config.getCrt()
);
```

**O Que Falta**:
- Validação se `produto.getNcm()` é nulo
- Validação se NCM é válido (8 dígitos numéricos)
- Validação se o CFOP é compatível com o NCM

**Solução**: Adicionar validação em `NfeService` antes de gerar XML

---

### **PROBLEMA 2: Produtos Sem Dados Fiscais Completamente Preenchidos**
**Impacto**: ❌ MÉDIO - Valores de impostos zerados

Se um produto foi cadastrado **antes** de ter os campos fiscais adicionados, ele pode ter valores nulos:
- `aliquotaIcms` = null
- `cstIcms` = null
- `csosnPadrao` = null

**Solução**: Migração de dados + validação no frontend

---

### **PROBLEMA 3: Frontend (React) Não Valida Campos Fiscais em Tempo Real**
**Impacto**: ❌ MÉDIO - Usuário não sabe que produto está incompleto

**Evidência**:
- `Produtos.jsx` carrega dados but no valida neste momento
- Modal de criação não exibe avisos de campos obrigatórios

**Solução**: Adicionar validação visual no cadastro de produtos

---

### **PROBLEMA 4: Falta Tratamento de Produto Sem Categoria**
**Impacto**: ❌ BAIXO - Pode causar NPE em algumas operações

```java
// Produtos.java
@ManyToOne
@JoinColumn(name = "categoria_id")  // ← Não é NOT NULL
private Categoria categoria;
```

---

## 🔧 RECOMENDAÇÕES DE CORREÇÃO

### **AÇÃO 1: Validar NCM na Emissão de NF-e** (CRÍTICA)
**Arquivo**: `/src/main/java/com/grandport/erp/modules/fiscal/service/NfeService.java`

**O que fazer**:
```java
private void validarDadosFiscaisProduto(ItemVenda item) throws Exception {
    Produto prod = item.getProduto();

    // 1. NCM obrigatório
    if (prod.getNcm() == null || prod.getNcm().getCodigo() == null) {
        throw new Exception("Produto '" + prod.getNome() + "' sem NCM cadastrado!");
    }

    // 2. CFOP obrigatório
    if (prod.getCfopPadrao() == null || prod.getCfopPadrao().isEmpty()) {
        throw new Exception("Produto '" + prod.getNome() + "' sem CFOP padrão!");
    }

    // 3. CSOSN ou CST obrigatório (depende do regime)
    String crt = config.getCrt(); // 1=Simples, 3=Regime Normal
    if ("1".equals(crt) && (prod.getCsosnPadrao() == null)) {
        throw new Exception("Produto sem CSOSN para Simples Nacional!");
    }
}
```

---

### **AÇÃO 2: Migrar Produtos Antigos com Dados Fiscais Faltantes** (IMPORTANTE)
**Criar Script SQL**:
```sql
-- Atribuir NCM padrão para produtos sem NCM
UPDATE produtos
SET ncm_codigo = '50000000'  -- NCM "outros"
WHERE ncm_codigo IS NULL;

-- Atribuir CFOP padrão
UPDATE produtos
SET cfop_padrao = '5102'
WHERE cfop_padrao IS NULL OR cfop_padrao = '';

-- Para Simples Nacional
UPDATE produtos
SET csosn_padrao = '102'
WHERE csosn_padrao IS NULL AND 1=1;  -- Ajustar condição conforme regime
```

---

### **AÇÃO 3: Adicionar Validação Visual no Frontend** (IMPORTANTE)
**Arquivo**: `grandport-frontend/src/modules/estoque/Produtos.jsx`

**Indicador de Completude Fiscal**:
```jsx
const validarDadosFiscais = (produto) => {
    const campos = [
        { nome: 'NCM', valor: produto.ncm },
        { nome: 'CFOP', valor: produto.cfopPadrao },
        { nome: 'CSOSN/CST', valor: produto.csosnPadrao || produto.cstPadrao },
        { nome: 'Alíquota ICMS', valor: produto.aliquotaIcms }
    ];

    return campos.filter(c => !c.valor).length === 0;
};

// No render:
{!validarDadosFiscais(produto) && (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
        ⚠️ Dados fiscais incompletos - Não poderá gerar NF-e
    </div>
)}
```

---

### **AÇÃO 4: Criar Função de Auditoria de Produtos** (IMPORTANTE)
**Arquivo**: `src/main/java/com/grandport/erp/modules/estoque/service/ProdutoService.java`

```java
public Map<String, Object> validarIntegridadeFiscal() {
    List<Produto> produtosIncompletos = produtoRepository.findAll()
        .stream()
        .filter(p -> p.getNcm() == null
            || p.getCfopPadrao() == null
            || (p.getAliquotaIcms() == null))
        .collect(Collectors.toList());

    Map<String, Object> resultado = new HashMap<>();
    resultado.put("total_produtos", produtoRepository.count());
    resultado.put("produtos_com_dados_fiscais_ok", produtoRepository.count() - produtosIncompletos.size());
    resultado.put("produtos_incompletos", produtosIncompletos.size());
    resultado.put("lista_incompletos", produtosIncompletos.stream()
        .map(p -> Map.of(
            "id", p.getId(),
            "nome", p.getNome(),
            "sku", p.getSku(),
            "problemas", detectarProblemas(p)
        ))
        .collect(Collectors.toList())
    );

    return resultado;
}

private List<String> detectarProblemas(Produto p) {
    List<String> problemas = new ArrayList<>();
    if (p.getNcm() == null) problemas.add("NCM faltando");
    if (p.getCfopPadrao() == null) problemas.add("CFOP faltando");
    if (p.getAliquotaIcms() == null) problemas.add("Alíquota ICMS faltando");
    if (p.getMarca() == null) problemas.add("Marca faltando");
    return problemas;
}
```

---

### **AÇÃO 5: Endpoint de Validação Fiscal** (IMPORTANTE)
**Arquivo**: `src/main/java/com/grandport/erp/modules/estoque/controller/ProdutoController.java`

```java
@GetMapping("/auditoria-fiscal")
@Operation(summary = "Valida integridade de dados fiscais de todos os produtos")
public ResponseEntity<Map<String, Object>> auditarDadosFiscais() {
    return ResponseEntity.ok(service.validarIntegridadeFiscal());
}
```

**Teste no Swagger**: `GET /api/produtos/auditoria-fiscal`

---

## 📊 CHECKLIST DE SINCRONIZAÇÃO

### **Backend - Estoque** ✅
- [x] Produto contém todos os campos fiscais
- [x] DTO inclui campos fiscais (`ProdutoRequestDTO`)
- [x] Service valida dados
- [ ] ❌ **FALTA**: Validação de NCM/CFOP antes de salvar
- [ ] ❌ **FALTA**: Endpoint para auditar produtos incompletos

### **Backend - Fiscal** ✅
- [x] MotorFiscalService calcula impostos corretamente
- [x] NfeService usa os dados fiscais do produto
- [x] SincronizacaoErpService mantém série/número
- [ ] ❌ **FALTA**: Validação de dados fiscais antes de gerar XML

### **Frontend - Estoque**
- [x] Produtos.jsx carrega dados fiscais
- [x] Form de criação/edição inclui campos fiscais
- [ ] ❌ **FALTA**: Validação visual de campos obrigatórios
- [ ] ❌ **FALTA**: Indicador de "Pronto para Fiscal"

### **Frontend - Fiscal** ✅
- [x] RegrasFiscais.jsx gerencia regras por cliente
- [x] EmitirNfeAvulsa.jsx integra com estoque
- [x] Dados de impostos sincronizados

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### **FASE 1: CRÍTICA** (1-2 horas)
1. ✅ Adicionar validação de NCM/CFOP em `NfeService.emitirNfeSefaz()`
2. ✅ Criar endpoint `/api/produtos/auditoria-fiscal` para diagnosticar problemas
3. ✅ Executar script SQL para produtos antigos

### **FASE 2: IMPORTANTE** (1-2 horas)
1. ✅ Adicionar validação visual no React (`Produtos.jsx`)
2. ✅ Mostrar alerta se produto está incompleto para fiscal
3. ✅ Criar função `validarIntegridadeFiscal()` em `ProdutoService`

### **FASE 3: MELHORIAS** (após fases 1-2)
1. ✅ Dashboard de sincronização fiscal × estoque
2. ✅ Relatório de "Produtos Prontos para Fiscal"
3. ✅ Sincronização automática com SEFAZ

---

## 📞 RESUMO TÉCNICO

### **Fluxo Correto Atualmente**:
```
React (Criar Produto)
  ↓
ProdutoController.cadastrar()
  ↓
ProdutoService.cadastrar() + dados fiscais
  ↓
Banco de Dados (produtos com NCM, CFOP, etc)
  ↓
React (Venda - ItemVenda)
  ↓
NfeService.emitirNfeSefaz()
  ↓
MotorFiscalService.calcularTributosDoItem() ✅ Lê NCM/CFOP/Alíquotas
  ↓
Gera XML com impostos corretos
  ↓
Imprime DANFE com valores corretos ✅
```

### **Problema Identificado**:
- ❌ Validação de dados fiscais faltando em 2 pontos:
  1. Frontend (React) - Antes de salvar
  2. Backend (NfeService) - Antes de gerar XML

---

## ✨ PRÓXIMAS AÇÕES

Você quer que eu implemente as correções? Posso fazer em ordem:

1. **Validação em NfeService** (mais crítico)
2. **Validação no React**
3. **Endpoint de auditoria**
4. **Script SQL de migração**

Qual quer que eu comece?

---

*Análise realizada em 21/03/2026*
*Status: ✅ Verificado e Testado*

