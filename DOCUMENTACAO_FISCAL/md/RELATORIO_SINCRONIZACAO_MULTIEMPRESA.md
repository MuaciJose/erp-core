# 📊 RELATÓRIO: O QUE FALTA PARA SINCRONIZAÇÃO TOTAL MULTI-EMPRESA

## 🎯 SITUAÇÃO ATUAL

Seu projeto **JÁ TEM** uma estrutura multi-empresa bem implementada:

### ✅ O QUE JÁ ESTÁ FUNCIONANDO

| Componente | Status | Detalhes |
|-----------|--------|----------|
| **BaseEntityMultiEmpresa** | ✅ Implementado | Todas as entidades principais herdam dessa classe |
| **@TenantId do Hibernate** | ✅ Ativado | Configurado em `application.yaml` |
| **TenantResolver** | ✅ Funcional | Resolve empresa por usuário logado |
| **Isolamento por Empresa** | ✅ Ativo | Cada usuário só vê dados da sua empresa |
| **Entidades Multi-Empresa** | ✅ Mapeadas | Venda, Produto, NotaFiscal, etc. |

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### **PROBLEMA 1: Repositórios NÃO Filtram por EmpresaId** 🔴 CRÍTICO

**Localização**: Todos os repositórios (ProdutoRepository, VendaRepository, etc.)

**Sintoma**: Queries não incluem filtro `WHERE empresa_id = ?`

**Impacto**:
- ❌ Se desabilitarem o TenantId do Hibernate, dados vazam entre empresas
- ❌ Relatórios podem misturar dados de empresas diferentes
- ❌ Sincronização background pode processar dados de todas as empresas

**Exemplo do Problema**:
```java
// ❌ PROBLEMA ATUAL
@Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
List<Produto> findAlertasEstoque();

// ✅ CORRETO (mesmo que Hibernate filtre, é defesa em profundidade)
@Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId")
List<Produto> findAlertasEstoque(@Param("empresaId") Long empresaId);
```

---

### **PROBLEMA 2: Sincronização Entre Empresas NÃO Existe** 🟡 MÉDIO

**Localização**: `SincronizacaoErpService.java`

**Sintoma**: Serviço sincroniza apenas dentro da mesma empresa

**Impacto**:
- ⚠️ Produtos cadastrados em Empresa A não podem ser compartilhados com Empresa B
- ⚠️ Série/Número de NF-e é independente por empresa (OK) mas não há sincronização de dados base
- ⚠️ Estoque não sincroniza entre unidades/filiais

**Caso de Uso Perdido**:
```
Empresa A (Matriz) → Cadastra Produto X
Empresa B (Filial) → NÃO consegue usar Produto X sem re-cadastrar
```

---

### **PROBLEMA 3: SincronizacaoErpService NÃO Filtra por EmpresaId** 🔴 CRÍTICO

**Localização**: Linha ~70-100 de `SincronizacaoErpService.java`

**Código Problemático**:
```java
@Transactional
@Scheduled(fixedRate = 300000) // 5 minutos
public void sincronizarAutomaticamente() {
    // ❌ Isto pega TODAS as vendas, independente da empresa!
    List<Venda> vendas = vendaRepository.findAll();

    for (Venda venda : vendas) {
        sincronizarStatusVenda(venda);
    }
}
```

**Resultado**: Se você tiver 1000 vendas na Empresa A e 1000 na Empresa B, o task agendado processa 2000 toda vez!

---

### **PROBLEMA 4: Sem Sincronização de Configurações Fiscais Entre Empresas** 🟡 MÉDIO

**Localização**: Módulo `fiscal` → `service/MotorFiscalService.java`

**Sintoma**:
- CFOP é definido por produto, não por empresa+produto
- Alíquotas ICMS são globais, não por estado da empresa

**Impacto**:
```
Empresa A (SP) vende para BA → CFOP = 6102 ✓
Empresa B (BA) vende para SP → CFOP = 5102 ✓
MAS...
Se ambas compartilharem Produto X, qual CFOP usar?
```

---

### **PROBLEMA 5: Frontend NÃO Filtra por Empresa Atual** 🟡 MÉDIO

**Localização**: `grandport-frontend/src/`

**Sintoma**: Componentes React recebem listas globais do backend

**Impacto**:
- ⚠️ Autocompletes mostram todos os produtos, sem filtro visual
- ⚠️ Relatórios carregam dados sem contexto de empresa

---

### **PROBLEMA 6: Auditoria NÃO Registra EmpresaId Explicitamente** 🟡 MÉDIO

**Localização**: `LogAuditoria.java`

**Sintoma**: Embora LogAuditoria estenda BaseEntityMultiEmpresa, não há query específica por empresa

---

## 🛠️ RECOMENDAÇÕES (PRIORIDADE)

### 🔴 **PRIORIDADE 1: Defesa em Profundidade nos Repositórios**

**Arquivos a Modificar**:
1. `/src/main/java/com/grandport/erp/modules/estoque/repository/ProdutoRepository.java`
2. `/src/main/java/com/grandport/erp/modules/vendas/repository/VendaRepository.java`
3. `/src/main/java/com/grandport/erp/modules/financeiro/repository/` (todos)
4. `/src/main/java/com/grandport/erp/modules/fiscal/repository/` (todos)

**O que fazer**:
- Adicionar `@Param("empresaId") Long empresaId` em TODAS as queries `@Query`
- Adicionar `AND p.empresaId = :empresaId` em TODAS as consultas
- Criar métodos findByEmpresaId para cada entidade principal

**Exemplo**:
```java
@Query("SELECT p FROM Produto p WHERE p.empresaId = :empresaId ORDER BY p.nome")
List<Produto> findAllByEmpresa(@Param("empresaId") Long empresaId);

@Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId")
List<Produto> findAlertasEstoque(@Param("empresaId") Long empresaId);
```

**Estimativa**: 3-4 horas

---

### 🔴 **PRIORIDADE 2: Sincronização Corrigida no Service**

**Arquivo**: `/src/main/java/com/grandport/erp/modules/fiscal/service/SincronizacaoErpService.java`

**O que fazer**:
1. Criar método privado para obter `empresaId` do usuário logado
2. Modificar todas as queries para incluir filtro por empresa
3. Adicionar `@Scheduled` separado para cada empresa (ou loop com diferentes empresas)

**Exemplo**:
```java
private Long obterEmpresaIdDoUsuario() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth.getPrincipal() instanceof Usuario) {
        return ((Usuario) auth.getPrincipal()).getEmpresaId();
    }
    return 1L;
}

@Transactional
@Scheduled(fixedRate = 300000)
public void sincronizarAutomaticamente() {
    Long empresaId = obterEmpresaIdDoUsuario();
    List<Venda> vendas = vendaRepository.findByEmpresaId(empresaId);
    // ... resto do código
}
```

**Estimativa**: 2-3 horas

---

### 🟡 **PRIORIDADE 3: Sincronização Entre Empresas (Produtos Compartilhados)**

**Novo Arquivo**: `/src/main/java/com/grandport/erp/modules/estoque/service/ProdutoSincronizacaoService.java`

**O que fazer**:
1. Criar serviço para sincronizar produtos entre empresas
2. Adicionar endpoint `/api/produtos/sincronizar-empresa` (admin only)
3. Copiar produto de Empresa A → Empresa B, ajustando valores fiscais por estado

**Exemplo**:
```java
@Service
public class ProdutoSincronizacaoService {

    public Produto sincronizarParaEmpresa(Long produtoId, Long empresaOrigemId, Long empresaDestinoId) {
        Produto original = produtoRepository.findById(produtoId).orElseThrow();

        // Validar que original pertence à empresa origem
        if (!original.getEmpresaId().equals(empresaOrigemId)) {
            throw new Exception("Produto não pertence à empresa origem");
        }

        // Criar cópia
        Produto copia = new Produto();
        BeanUtils.copyProperties(original, copia);
        copia.setId(null); // Reset ID
        copia.setEmpresaId(empresaDestinoId);
        copia.setReferenciaOriginal(original.getId() + "_" + empresaOrigemId); // Rastreabilidade

        return produtoRepository.save(copia);
    }
}
```

**Estimativa**: 4-5 horas

---

### 🟡 **PRIORIDADE 4: Sincronização de Configurações Fiscais**

**Novo Arquivo**: `/src/main/java/com/grandport/erp/modules/fiscal/service/ConfiguracaoFiscalPorEmpresaService.java`

**O que fazer**:
1. Criar tabela `configuracoes_fiscais_empresa` com campos:
   - `id`
   - `empresa_id`
   - `estado_origem`
   - `cfop_padrao_estadual`
   - `cfop_padrao_outro_estado`
   - `aliquota_icms_interna`
   - `aliquota_icms_externa`

2. Modificar `MotorFiscalService` para usar esta tabela

**Estimativa**: 6-8 horas

---

### 🟢 **PRIORIDADE 5: Melhorias no Frontend**

**Arquivos a Modificar**:
1. `grandport-frontend/src/modules/estoque/Produtos.jsx`
2. `grandport-frontend/src/modules/vendas/Vendas.jsx`

**O que fazer**:
1. Adicionar filtro visual de empresa
2. Mostrar qual empresa cada produto pertence
3. Adicionar badge de "Produto compartilhado"

**Estimativa**: 2-3 horas

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

```
FASE 1: DEFESA EM PROFUNDIDADE (1-2 dias)
[ ] ProdutoRepository com filtro empresaId
[ ] VendaRepository com filtro empresaId
[ ] NotaFiscalRepository com filtro empresaId
[ ] Todos os outros repositórios com filtro empresaId
[ ] Testes unitários para validar filtros
[ ] Deploy e validar que dados isolam corretamente

FASE 2: SINCRONIZAÇÃO CORRIGIDA (1 dia)
[ ] SincronizacaoErpService com filtro por empresa
[ ] Criar método obterEmpresaIdDoUsuario()
[ ] Atualizar @Scheduled para usar empresaId
[ ] Testes de sincronização

FASE 3: COMPARTILHAMENTO DE PRODUTOS (2-3 dias)
[ ] Criar ProdutoSincronizacaoService
[ ] Adicionar endpoints de sincronização
[ ] Criar testes
[ ] UI para sincronizar produtos

FASE 4: CONFIGURAÇÕES FISCAIS POR EMPRESA (2-3 dias)
[ ] Criar tabela configuracoes_fiscais_empresa
[ ] Criar migration Flyway
[ ] Criar service ConfiguracaoFiscalPorEmpresaService
[ ] Atualizar MotorFiscalService
[ ] Testes

FASE 5: MELHORIAS FRONTEND (1 dia)
[ ] Adicionar filtro de empresa visual
[ ] Mostrar origem do produto
[ ] Atualizar componentes
```

---

## 🔍 VERIFICAÇÃO RÁPIDA: Seu Sistema Está Seguro?

Execute estas queries SQL para verificar:

```sql
-- 1. Verificar se há produtos sem empresa_id (vazamento)
SELECT COUNT(*) FROM produtos WHERE empresa_id IS NULL;

-- 2. Verificar distribuição de produtos por empresa
SELECT empresa_id, COUNT(*) as total FROM produtos GROUP BY empresa_id;

-- 3. Verificar vendas por empresa
SELECT empresa_id, COUNT(*) as total FROM vendas GROUP BY empresa_id;

-- 4. Verificar notas fiscais por empresa
SELECT empresa_id, COUNT(*) as total FROM notas_fiscais GROUP BY empresa_id;

-- Se tudo retornar dados esperados, você está seguro! ✅
```

---

## 📞 PRÓXIMAS AÇÕES

1. **Confirme o escopo**: Você quer:
   - [ ] Apenas isolamento seguro de dados por empresa? (Prioridade 1-2)
   - [ ] Compartilhamento de produtos entre empresas? (Prioridade 3)
   - [ ] Sincronização fiscal automática? (Prioridade 4)

2. **Indique o cronograma**: Quando você precisa disso pronto?

3. **Levante casos de uso**: Quais são seus cenários específicos de multi-empresa?

---

## 🎓 RESUMO EXECUTIVO

| Aspecto | Status | Risco | Ação |
|--------|--------|-------|------|
| **Isolamento de dados** | ⚠️ Parcial | MÉDIO | Adicionar filtros em repositórios |
| **Sincronização intra-empresa** | ✅ OK | BAIXO | Manter como está |
| **Sincronização inter-empresa** | ❌ Não existe | ALTO | Implementar novo serviço |
| **Configurações fiscais** | ⚠️ Global | MÉDIO | Criar por empresa |
| **Frontend** | ⚠️ Sem filtro | BAIXO | Adicionar contexto visual |
| **Segurança** | ✅ OK | BAIXO | Manter TenantId ativo |

**Tempo Total Estimado**: **8-12 dias** de desenvolvimento
**Prioridade**: Começar por **PRIORIDADE 1** (defesa em profundidade)

---

**Documento gerado em**: 2026-03-24
**Versão do Projeto**: erp-core v0.0.1-SNAPSHOT
**Stack**: Spring Boot 4.0.3 + PostgreSQL + Hibernate

