# 🚨 DIAGNÓSTICO CRÍTICO: MÓDULO FINANCEIRO - SINCRONIZAÇÃO MULTI-EMPRESA

## 📊 RESUMO EXECUTIVO
O módulo financeiro **NÃO está totalmente multi-empresa**. Há vazamento de dados entre empresas e falta de filtros essenciais em várias operações.

---

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1️⃣ **PLANO DE CONTAS - SEM FILTRO DE EMPRESA** ⚠️ CRÍTICO
**Arquivo:** `PlanoContaRepository.java`
```java
List<PlanoConta> findByContaPaiIsNull();  // ❌ PEGA TODOS OS PLANOS DE TODAS AS EMPRESAS
List<PlanoConta> findByTipoAndAceitaLancamentoTrue(String tipo);  // ❌ MESMA COISA
```

**Impacto:**
- Usuários de uma empresa veem planos de contas de outras empresas
- Lançamentos podem ser feitos em planos de contas errados
- Relatórios de DRE podem incluir dados de outras empresas

**Status no DB:** Tabela `plano_contas` tem coluna `empresa_id` herdada de `BaseEntityMultiEmpresa`

---

### 2️⃣ **CONTAS A RECEBER - REPOSITÓRIO INCONSISTENTE** ⚠️ CRÍTICO
**Arquivo:** `ContaReceberRepository.java`
```java
List<ContaReceber> findByStatus(StatusFinanceiro status);
// ❌ Retorna contas de TODAS as empresas

List<ContaReceber> findByEmpresaIdAndStatus(Long empresaId, StatusFinanceiro status);
// ✅ Este existe mas NÃO É USADO no service!

List<ContaReceber> findByParceiroIdAndStatus(Long parceiroId, StatusFinanceiro status);
// ❌ Sem filtro de empresa
```

**Problema no Service:** `FinanceiroService.java`
```java
public List<ContaReceberDTO> listarContasAReceber() {
    return recebaRepo.findByStatus(StatusFinanceiro.PENDENTE)  // ❌ VAZANDO DADOS!
            .stream()
            .map(ContaReceberDTO::new)
            .collect(Collectors.toList());
}
```

---

### 3️⃣ **CONTAS A PAGAR - MESMO PROBLEMA** ⚠️ CRÍTICO
**Arquivo:** `ContaPagarRepository.java` e `FinanceiroService.java`
```java
List<ContaPagar> findByStatus(StatusFinanceiro status);
// ❌ Sem filtro de empresa

@Query("SELECT SUM(c.valorPago) FROM ContaPagar c WHERE c.status = 'PAGO'
        AND c.dataPagamento BETWEEN :inicio AND :fim")
// ❌ Soma contas de TODAS as empresas
```

**Service também usa:**
```java
public List<ContaPagarDTO> listarContasAPagar() {
    return pagarRepo.findByStatus(StatusFinanceiro.PENDENTE)  // ❌ VAZANDO DADOS!
            .stream()
            .map(ContaPagarDTO::new)
            .collect(Collectors.toList());
}
```

---

### 4️⃣ **CAIXA DIÁRIO - FALTA FILTRO** ⚠️ CRÍTICO
**Arquivo:** `CaixaController.java` (linha 31)
```java
@GetMapping
public ResponseEntity<List<Map<String, Object>>> listarTodos() {
    List<Map<String, Object>> lista =
        caixaRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
        // ❌ Retorna TODOS os caixas de TODAS as empresas
```

**Repository:**
```java
Optional<CaixaDiario> findTopByOrderByIdDesc();
// ❌ Pega o último caixa sem verificar empresa
```

---

### 5️⃣ **DRE - DADOS MISTURADOS DE TODAS AS EMPRESAS** ⚠️ CRÍTICO
**Arquivo:** `FinanceiroService.java` (linha 172)
```java
public DreDTO calcularDre(YearMonth mesAno) {
    // ❌ Soma vendas de TODAS as empresas
    dre.setReceitaBruta(vendaRepository.sumTotalVendasPeriodo(inicioMes, fimMes))

    // ❌ Soma despesas de TODAS as empresas
    List<DespesaPorPlanoContaDTO> despesasAgrupadas =
        pagarRepo.sumDespesasPagasAgrupadasPorPlanoConta(inicioMes, fimMes);
}
```

---

### 6️⃣ **CONTAS BANCÁRIAS - SEM FILTRO** ⚠️ CRÍTICO
**Arquivo:** `ContaBancariaRepository.java`
```java
// ❌ Vazio! Usa só findAll() que pega TODAS as contas de TODAS as empresas
```

**Service:**
```java
public List<ContaBancaria> listarContasBancarias() {
    return bancoRepo.findAll();  // ❌ VAZANDO DADOS!
}
```

---

### 7️⃣ **PLANO DE CONTAS CONTROLLER - SEM AUTENTICAÇÃO** ⚠️ CRÍTICO
**Arquivo:** `PlanoContaController.java`
```java
@GetMapping
public ResponseEntity<List<PlanoConta>> getArvore() {
    return ResponseEntity.ok(repository.findByContaPaiIsNull());
    // ❌ Nenhuma validação de empresa
    // ❌ Nenhuma injeção de SecurityContext
}

@PostMapping
public ResponseEntity<?> criar(@RequestBody Map<String, Object> payload) {
    PlanoConta conta = new PlanoConta();
    // ❌ CRÍTICO: Não está setando empresaId!
    // ❌ Qualquer plano criado ficará com empresa_id NULL
    return ResponseEntity.ok(repository.save(conta));
}
```

---

### 8️⃣ **MOVIMENTAÇÃO DE CAIXA - SEM ISOLAMENTO** ⚠️ CRÍTICO
**Arquivo:** `MovimentacaoCaixaRepository.java`
```java
// Provavelmente usa apenas findAll() ou findByTipo()
// Sem filtro de empresa
```

---

## ✅ SOLUÇÕES NECESSÁRIAS

### **PASSO 1: Atualizar Repositórios com Filtros de Empresa**

#### `PlanoContaRepository.java`
```java
List<PlanoConta> findByEmpresaIdAndContaPaiIsNull(Long empresaId);
List<PlanoConta> findByEmpresaIdAndTipoAndAceitaLancamentoTrue(Long empresaId, String tipo);
List<PlanoConta> findByEmpresaId(Long empresaId);
```

#### `ContaReceberRepository.java`
```java
// Remover: findByStatus(StatusFinanceiro status);
// Remover: findByParceiroIdAndStatus(Long parceiroId, StatusFinanceiro status);

// Adicionar:
List<ContaReceber> findByEmpresaIdAndStatusOrderByDataVencimento(Long empresaId, StatusFinanceiro status);
List<ContaReceber> findByEmpresaIdAndParceiroIdAndStatus(Long empresaId, Long parceiroId, StatusFinanceiro status);

@Query("SELECT SUM(c.valorOriginal) FROM ContaReceber c WHERE c.empresaId = :empresaId AND c.status = 'PENDENTE'")
Optional<BigDecimal> sumContasAReceberPendentes(@Param("empresaId") Long empresaId);
```

#### `ContaPagarRepository.java`
```java
// Remover métodos sem empresaId

// Adicionar:
List<ContaPagar> findByEmpresaIdAndStatus(Long empresaId, StatusFinanceiro status);
List<ContaPagar> findByEmpresaIdAndDataPagamentoBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

@Query("SELECT SUM(c.valorPago) FROM ContaPagar c WHERE c.empresaId = :empresaId
        AND c.status = 'PAGO' AND c.dataPagamento BETWEEN :inicio AND :fim")
Optional<BigDecimal> sumDespesasPagasPeriodo(@Param("empresaId") Long empresaId,
                                             @Param("inicio") LocalDateTime inicio,
                                             @Param("fim") LocalDateTime fim);

@Query("SELECT new com.grandport.erp.modules.financeiro.dto.DespesaPorPlanoContaDTO(COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada'), SUM(cp.valorPago)) " +
       "FROM ContaPagar cp LEFT JOIN cp.planoConta pc " +
       "WHERE cp.empresaId = :empresaId AND cp.status = 'PAGO' AND cp.dataPagamento BETWEEN :inicio AND :fim " +
       "GROUP BY COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada')")
List<DespesaPorPlanoContaDTO> sumDespesasPagasAgrupadasPorPlanoConta(
        @Param("empresaId") Long empresaId,
        @Param("inicio") LocalDateTime inicio,
        @Param("fim") LocalDateTime fim);
```

#### `CaixaDiarioRepository.java`
```java
Optional<CaixaDiario> findTopByEmpresaIdOrderByIdDesc(Long empresaId);
List<CaixaDiario> findByEmpresaIdOrderByDataAberturaDesc(Long empresaId);
Optional<CaixaDiario> findByEmpresaIdAndStatus(Long empresaId, StatusCaixa status);
```

#### `ContaBancariaRepository.java`
```java
List<ContaBancaria> findByEmpresaId(Long empresaId);
Optional<ContaBancaria> findByEmpresaIdAndId(Long empresaId, Long id);
```

---

### **PASSO 2: Atualizar Service para Usar TenantContext**

Adicionar no `FinanceiroService.java`:
```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

private Long obterEmpresaAtual() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof com.grandport.erp.modules.usuario.model.Usuario) {
        com.grandport.erp.modules.usuario.model.Usuario usuario =
            (com.grandport.erp.modules.usuario.model.Usuario) auth.getPrincipal();
        return usuario.getEmpresaId();
    }
    throw new RuntimeException("Usuário não autenticado ou empresa não encontrada");
}

// Atualizar todos os métodos:
public List<ContaReceberDTO> listarContasAReceber() {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    return recebaRepo.findByEmpresaIdAndStatusOrderByDataVencimento(empresaId, StatusFinanceiro.PENDENTE)
            .stream()
            .map(ContaReceberDTO::new)
            .collect(Collectors.toList());
}

public List<ContaPagarDTO> listarContasAPagar() {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    return pagarRepo.findByEmpresaIdAndStatus(empresaId, StatusFinanceiro.PENDENTE)
            .stream()
            .map(ContaPagarDTO::new)
            .collect(Collectors.toList());
}

public List<ContaBancaria> listarContasBancarias() {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    return bancoRepo.findByEmpresaId(empresaId);
}

public DreDTO calcularDre(YearMonth mesAno) {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    LocalDateTime inicioMes = mesAno.atDay(1).atStartOfDay();
    LocalDateTime fimMes = mesAno.atEndOfMonth().atTime(23, 59, 59);

    DreDTO dre = new DreDTO();

    // Atualizar todas as queries para passar empresaId
    dre.setReceitaBruta(vendaRepository.sumTotalVendasPeriodoEmpresa(empresaId, inicioMes, fimMes)
            .orElse(BigDecimal.ZERO));

    List<DespesaPorPlanoContaDTO> despesasAgrupadas =
        pagarRepo.sumDespesasPagasAgrupadasPorPlanoConta(empresaId, inicioMes, fimMes);

    return dre;
}
```

---

### **PASSO 3: Atualizar Controllers**

#### `PlanoContaController.java`
```java
@GetMapping
public ResponseEntity<List<PlanoConta>> getArvore() {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    return ResponseEntity.ok(repository.findByEmpresaIdAndContaPaiIsNull(empresaId));
}

@GetMapping("/lancamentos")
public ResponseEntity<List<PlanoConta>> getContasLancamento(@RequestParam String tipo) {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO
    return ResponseEntity.ok(repository.findByEmpresaIdAndTipoAndAceitaLancamentoTrue(empresaId, tipo));
}

@PostMapping
public ResponseEntity<?> criar(@RequestBody Map<String, Object> payload) {
    try {
        Long empresaId = obterEmpresaAtual();  // ✅ NOVO
        PlanoConta conta = new PlanoConta();
        conta.setDescricao((String) payload.get("descricao"));
        conta.setTipo((String) payload.get("tipo"));
        conta.setAceitaLancamento((Boolean) payload.get("aceitaLancamento"));
        conta.setEmpresaId(empresaId);  // ✅ CRÍTICO: Setando empresa

        if (payload.get("contaPaiId") != null) {
            Long paiId = Long.valueOf(payload.get("contaPaiId").toString());
            PlanoConta pai = repository.findById(paiId).orElse(null);

            // ✅ Validar que o pai pertence à mesma empresa
            if (pai != null && !pai.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Plano pai pertence a outra empresa"));
            }

            conta.setContaPai(pai);
        }

        return ResponseEntity.ok(repository.save(conta));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Erro ao criar conta: " + e.getMessage()));
    }
}

private Long obterEmpresaAtual() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof com.grandport.erp.modules.usuario.model.Usuario) {
        com.grandport.erp.modules.usuario.model.Usuario usuario =
            (com.grandport.erp.modules.usuario.model.Usuario) auth.getPrincipal();
        return usuario.getEmpresaId();
    }
    throw new RuntimeException("Usuário não autenticado");
}
```

#### `CaixaController.java`
```java
@GetMapping
public ResponseEntity<List<Map<String, Object>>> listarTodos() {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO

    List<Map<String, Object>> lista = caixaRepository
            .findByEmpresaIdOrderByDataAberturaDesc(empresaId)  // ✅ NOVO
            .stream()
            .map(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", c.getId());
                map.put("dataAbertura", c.getDataAbertura());
                map.put("dataFechamento", c.getDataFechamento());
                map.put("status", c.getStatus() != null ? c.getStatus().name() : "DESCONHECIDO");
                map.put("operadorNome", c.getOperadorNome() != null && !c.getOperadorNome().isEmpty()
                    ? c.getOperadorNome() : "Administrador");
                return map;
            })
            .toList();
    return ResponseEntity.ok(lista);
}

@GetMapping("/pdf")
public ResponseEntity<byte[]> imprimirRelatorioCaixaPdf(@RequestParam(required = false) Long id) {
    Long empresaId = obterEmpresaAtual();  // ✅ NOVO

    com.grandport.erp.modules.financeiro.model.CaixaDiario caixaSelecionado;

    if (id != null) {
        // ✅ Validar que o caixa pertence à empresa atual
        caixaSelecionado = caixaRepository.findById(id)
                .filter(c -> c.getEmpresaId().equals(empresaId))
                .orElse(null);
    } else {
        caixaSelecionado = caixaRepository.findTopByEmpresaIdOrderByIdDesc(empresaId).orElse(null);
    }

    if (caixaSelecionado == null) return ResponseEntity.badRequest().build();

    // ... resto do código
}
```

---

### **PASSO 4: Adicionar Método Auxiliar em BaseEntityMultiEmpresa (opcional mas recomendado)**

```java
public abstract class BaseEntityMultiEmpresa {
    // ... código existente

    public void validarEmpresa(Long empresaAtual) {
        if (this.empresaId != null && !this.empresaId.equals(empresaAtual)) {
            throw new SecurityException("Acesso negado: registro pertence a outra empresa");
        }
    }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar `PlanoContaRepository.java` com métodos filtrando por empresa
- [ ] Atualizar `ContaReceberRepository.java` com métodos filtrando por empresa
- [ ] Atualizar `ContaPagarRepository.java` com métodos filtrando por empresa
- [ ] Atualizar `CaixaDiarioRepository.java` com métodos filtrando por empresa
- [ ] Atualizar `ContaBancariaRepository.java` com métodos filtrando por empresa
- [ ] Adicionar método `obterEmpresaAtual()` ao `FinanceiroService.java`
- [ ] Atualizar todos os métodos públicos de `FinanceiroService.java` para usar empresa atual
- [ ] Atualizar `PlanoContaController.java` com validação de empresa
- [ ] Atualizar `CaixaController.java` com filtro de empresa
- [ ] Atualizar `ContaReceberController.java` (se implementado)
- [ ] Atualizar `ContaPagarController.java` (se implementado)
- [ ] Testes: Validar que usuários de empresas diferentes não veem dados um do outro
- [ ] Testes: Validar que DRE mostra dados corretos por empresa

---

## 🧪 TESTES RECOMENDADOS

```sql
-- Teste 1: Verificar se há planos de contas sem empresa
SELECT * FROM plano_contas WHERE empresa_id IS NULL;

-- Teste 2: Verificar se há contas a receber de múltiplas empresas
SELECT empresa_id, COUNT(*) as total FROM contas_receber GROUP BY empresa_id;

-- Teste 3: Verificar isolamento de dados
-- Como usuário de empresa 1, verificar que não vê dados de empresa 2
SELECT * FROM contas_pagar WHERE empresa_id = 2;  -- Não deve retornar nada se autenticado como empresa 1
```

---

## 🎯 SEVERIDADE

| Item | Severidade | Impacto |
|------|-----------|--------|
| Plano de Contas sem filtro | 🔴 CRÍTICO | Vazamento de dados estruturais |
| Contas a Receber sem filtro | 🔴 CRÍTICO | Vazamento de dados financeiros |
| Contas a Pagar sem filtro | 🔴 CRÍTICO | Vazamento de dados financeiros |
| Caixa Diário sem filtro | 🔴 CRÍTICO | Vazamento de dados de caixa |
| Contas Bancárias sem filtro | 🔴 CRÍTICO | Vazamento de dados de contas |
| DRE misturando empresas | 🔴 CRÍTICO | Relatórios incorretos |
| PlanoContaController sem setEmpresaId | 🔴 CRÍTICO | Dados corruptos |

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **TenantContext está configurado corretamente** via `@TenantId` do Hibernate
2. **SecurityFilter está trazendo usuário correto** da autenticação
3. **Problema é na camada de Repository/Service** - não estão usando o empresaId
4. **Recomendação urgente**: Implementar essas mudanças ANTES de usar o sistema em produção com múltiplas empresas


