# 🔧 GUIA PRÁTICO: CORRIGIR SINCRONIZAÇÃO FISCAL × ESTOQUE

## 📍 Seu Status Atual

**Problema Principal**: Quando você tenta imprimir a NF-e, o sistema não valida se os dados fiscais do produto estão completos.

**Resultado**: Erros de impostos, DANFE com valores zerados, rejeição pela SEFAZ.

---

## 🎯 PASSO-A-PASSO PARA RESOLVER

### **PASSO 1: Diagnosticar o Problema**

Primeiro, vamos identificar quais produtos estão com dados fiscais incompletos.

**No seu banco de dados, execute**:
```sql
-- Veja quantos produtos estão incompletos
SELECT
    id, nome, sku,
    ncm_codigo,
    cfop_padrao,
    csosn_padrao,
    cst_padrao,
    aliquota_icms
FROM produtos
WHERE ncm_codigo IS NULL
   OR cfop_padrao IS NULL
   OR aliquota_icms IS NULL;
```

Se retornar registros = **VOCÊ ENCONTROU O PROBLEMA** ⚠️

---

### **PASSO 2: Adicionar Validação no Backend**

**Arquivo**: `/src/main/java/com/grandport/erp/modules/fiscal/service/NfeService.java`

**Localize** a função `emitirNfeSefaz()` (por volta da linha 90).

**Antes desta linha**:
```java
for (ItemVenda item : venda.getItens()) {
```

**Adicione este bloco de validação**:
```java
        // 🔍 VALIDAÇÃO DE DADOS FISCAIS CRÍTICA
        for (ItemVenda item : venda.getItens()) {
            Produto prod = item.getProduto();
            validarDadosFiscaisDoProduto(prod);
        }

        // ✅ Se chegou aqui, todos os produtos estão OK
        for (ItemVenda item : venda.getItens()) {
```

**E no final da classe, adicione este método**:
```java
    /**
     * ✅ VALIDAÇÃO CRÍTICA: Verifica se produto tem dados fiscais completos
     * Se faltar algo, lança exceção com mensagem clara
     */
    private void validarDadosFiscaisDoProduto(Produto produto) throws Exception {
        String erros = "";

        // ❌ Validação 1: NCM obrigatório
        if (produto.getNcm() == null || produto.getNcm().getCodigo() == null) {
            erros += "- NCM não configurado\n";
        }

        // ❌ Validação 2: CFOP obrigatório
        if (produto.getCfopPadrao() == null || produto.getCfopPadrao().trim().isEmpty()) {
            erros += "- CFOP padrão não configurado\n";
        }

        // ❌ Validação 3: CSOSN ou CST obrigatório
        if (produto.getCsosnPadrao() == null && produto.getCstPadrao() == null) {
            erros += "- Nem CSOSN nem CST configurados\n";
        }

        // ❌ Validação 4: Alíquota ICMS obrigatória
        if (produto.getAliquotaIcms() == null) {
            erros += "- Alíquota ICMS não configurada\n";
        }

        // ❌ Validação 5: Marca obrigatória
        if (produto.getMarca() == null) {
            erros += "- Marca não configurada\n";
        }

        // 🚨 Se encontrou erros, lança exceção com lista clara
        if (!erros.isEmpty()) {
            throw new Exception(
                "❌ PRODUTO SEM DADOS FISCAIS COMPLETOS:\n" +
                "Produto: " + produto.getNome() + " (SKU: " + produto.getSku() + ")\n" +
                "Erros encontrados:\n" + erros +
                "\n⚠️ Configure todos esses campos antes de emitir NF-e"
            );
        }
    }
```

---

### **PASSO 3: Testar a Validação**

1. **Acesse o Swagger**: `http://localhost:8080/swagger-ui.html`
2. **Procure** por `POST /api/vendas` (ou similar)
3. **Tente criar uma venda** com um produto incompleto
4. **Resultado esperado**: Erro claro dizendo qual campo está faltando ✅

---

### **PASSO 4: Corrigir Produtos no Frontend**

**Arquivo**: `/grandport-frontend/src/modules/estoque/Produtos.jsx`

**Localize a função de buscar produtos** (por volta da linha 130).

**Logo após `carregarDados()`, adicione**:
```javascript
// 🔍 Validar integridade fiscal
const verificarIntegridadeFiscal = async () => {
    try {
        const res = await api.get('/api/produtos/auditoria-fiscal');
        if (res.data.produtos_incompletos > 0) {
            toast.error(
                `⚠️ ${res.data.produtos_incompletos} produto(s) com dados fiscais incompletos!`,
                { duration: 5000 }
            );
        }
    } catch (error) {
        console.log('Auditoria fiscal não disponível');
    }
};

// Chamar ao carregar
useEffect(() => {
    carregarDados();
    verificarIntegridadeFiscal(); // 🆕
}, []);
```

---

### **PASSO 5: Corrigir Dados No Banco de Dados**

Se encontrou produtos incompletos no PASSO 1, execute:

```sql
-- 1. Atribuir NCM padrão para produtos sem NCM (NCM "Outras" = 50000000)
UPDATE produtos
SET ncm_codigo = '50000000'
WHERE ncm_codigo IS NULL;

-- 2. Atribuir CFOP padrão (5102 = Venda dentro do estado)
UPDATE produtos
SET cfop_padrao = '5102'
WHERE cfop_padrao IS NULL OR cfop_padrao = '';

-- 3. Para Simples Nacional: CSOSN 102 (sem débito)
UPDATE produtos
SET csosn_padrao = '102'
WHERE csosn_padrao IS NULL;

-- 4. Atribuir alíquota ICMS padrão (18%)
UPDATE produtos
SET aliquota_icms = 18.00
WHERE aliquota_icms IS NULL;

-- 5. Verificar resultado
SELECT id, nome, sku, ncm_codigo, cfop_padrao, csosn_padrao, aliquota_icms
FROM produtos
LIMIT 10;
```

---

### **PASSO 6: Executar Script de Criação de Endpoint**

Se seu backend ainda não tiver o endpoint `/api/produtos/auditoria-fiscal`, crie-o.

**Arquivo**: `/src/main/java/com/grandport/erp/modules/estoque/controller/ProdutoController.java`

**Ao final da classe, antes da última chave `}`, adicione**:

```java
    // ========================================================================
    // 🔍 AUDITORIA DE SINCRONIZAÇÃO FISCAL
    // ========================================================================

    @GetMapping("/auditoria-fiscal")
    @Operation(summary = "Verifica quais produtos estão prontos para emitir NF-e")
    public ResponseEntity<Map<String, Object>> auditarDadosFiscais() {
        return ResponseEntity.ok(service.validarIntegridadeFiscal());
    }
```

---

### **PASSO 7: Implementar Função de Auditoria no Service**

**Arquivo**: `/src/main/java/com/grandport/erp/modules/estoque/service/ProdutoService.java`

**Ao final da classe, antes da última chave `}`, adicione**:

```java
    /**
     * 🔍 AUDITORIA: Verifica quais produtos estão prontos para emitir NF-e
     */
    public Map<String, Object> validarIntegridadeFiscal() {
        List<Produto> todos = produtoRepository.findAll();
        List<Produto> incompletos = new ArrayList<>();

        for (Produto p : todos) {
            List<String> problemas = new ArrayList<>();

            if (p.getNcm() == null || p.getNcm().getCodigo() == null)
                problemas.add("NCM");
            if (p.getCfopPadrao() == null || p.getCfopPadrao().isEmpty())
                problemas.add("CFOP");
            if (p.getCsosnPadrao() == null && p.getCstPadrao() == null)
                problemas.add("CSOSN/CST");
            if (p.getAliquotaIcms() == null)
                problemas.add("Alíquota ICMS");
            if (p.getMarca() == null)
                problemas.add("Marca");

            if (!problemas.isEmpty()) {
                incompletos.add(p);
            }
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("total_produtos", todos.size());
        resultado.put("produtos_ok_para_fiscal", todos.size() - incompletos.size());
        resultado.put("produtos_incompletos", incompletos.size());
        resultado.put("percentual_completo",
            todos.isEmpty() ? 100 : ((todos.size() - incompletos.size()) * 100 / todos.size()));
        resultado.put("lista_incompletos",
            incompletos.stream()
                .map(p -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", p.getId());
                    item.put("nome", p.getNome());
                    item.put("sku", p.getSku());
                    item.put("ncm", p.getNcm() != null ? p.getNcm().getCodigo() : "FALTANDO");
                    item.put("cfop", p.getCfopPadrao() != null ? p.getCfopPadrao() : "FALTANDO");
                    item.put("csosn", p.getCsosnPadrao() != null ? p.getCsosnPadrao() : "FALTANDO");
                    item.put("marca", p.getMarca() != null ? p.getMarca().getNome() : "FALTANDO");
                    return item;
                })
                .collect(java.util.stream.Collectors.toList())
        );

        return resultado;
    }
```

**Não esqueça de importar**:
```java
import java.util.ArrayList;
import java.util.HashMap;
```

---

### **PASSO 8: Testar Tudo**

1. **Reinicie sua aplicação**:
   ```bash
   mvn clean spring-boot:run
   ```

2. **Acesse o Swagger**:
   ```
   http://localhost:8080/swagger-ui.html
   ```

3. **Teste o novo endpoint**:
   - Procure por `GET /api/produtos/auditoria-fiscal`
   - Clique em "Try it out"
   - Veja o resultado: produtos completos vs incompletos

4. **Tente criar uma venda**:
   - Com um produto incompleto
   - Deve gerar erro com mensagem clara ✅

---

## ✅ RESULTADO ESPERADO

**Antes** (❌ RUIM):
```
Erro ao emitir NF-e: null pointer exception
Alíquota ICMS aparece como 0.00 na DANFE
SEFAZ rejeita por falta de dados
```

**Depois** (✅ BOM):
```
Erro claro: "PRODUTO SEM DADOS FISCAIS COMPLETOS"
Mensagem: "Alíquota ICMS não configurada"
Usuário sabe exatamente o que corrigir
DANFE imprime com valores corretos
```

---

## 📞 SE ALGO DER ERRADO

**Erro 1: Método não encontrado**
- Verifique se você adicionou o método na classe correta
- Limpe o cache: `mvn clean`

**Erro 2: Imports faltando**
- IDE deve sugerir automaticamente (Alt+Enter no IntelliJ)
- Se não, importe manualmente

**Erro 3: Banco de dados**
- Execute os SQLs um de cada vez
- Verifique os nomes das colunas no seu banco

---

**Pronto! Sua sincronização fiscal × estoque está segura! 🎉**

