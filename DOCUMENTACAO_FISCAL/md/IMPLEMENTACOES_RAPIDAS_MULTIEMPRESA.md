# 🚀 IMPLEMENTAÇÕES RÁPIDAS: SINCRONIZAÇÃO MULTI-EMPRESA

## PASSO 1: Fortalecer ProdutoRepository (30 minutos)

### Arquivo: `src/main/java/com/grandport/erp/modules/estoque/repository/ProdutoRepository.java`

Adicione estes métodos:

```java
package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    // ============ EXISTENTES ============
    Optional<Produto> findByCodigoBarras(String codigoBarras);
    Optional<Produto> findBySku(String sku);

    // ============ NOVOS COM FILTRO EMPRESA (DEFESA EM PROFUNDIDADE) ============

    /**
     * Buscar todos os produtos de uma empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.empresaId = :empresaId ORDER BY p.nome")
    List<Produto> findAllByEmpresa(@Param("empresaId") Long empresaId);

    /**
     * Buscar produto por SKU dentro da empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.sku = :sku AND p.empresaId = :empresaId")
    Optional<Produto> findBySkuAndEmpresa(@Param("sku") String sku, @Param("empresaId") Long empresaId);

    /**
     * Buscar produto por código de barras dentro da empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.codigoBarras = :codigo AND p.empresaId = :empresaId")
    Optional<Produto> findByCodigoBarrasAndEmpresa(@Param("codigo") String codigo, @Param("empresaId") Long empresaId);

    /**
     * Alertas de estoque por empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId ORDER BY p.nome")
    List<Produto> findAlertasEstoque(@Param("empresaId") Long empresaId);

    /**
     * Contar produtos com baixo estoque por empresa
     */
    @Query("SELECT COUNT(p) FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId")
    Long countProdutosBaixoEstoque(@Param("empresaId") Long empresaId);

    /**
     * Produtos críticos (curva A) por empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo " +
            "AND p.empresaId = :empresaId " +
            "AND p.id IN (SELECT iv.produto.id FROM ItemVenda iv WHERE iv.empresaId = :empresaId GROUP BY iv.produto.id HAVING COUNT(iv) > 5)")
    List<Produto> findProdutosCriticosCurvaA(@Param("empresaId") Long empresaId);

    /**
     * Produtos sem venda há X dias por empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque > 10 " +
            "AND p.empresaId = :empresaId " +
            "AND p.id NOT IN (SELECT iv.produto.id FROM ItemVenda iv WHERE iv.venda.dataHora >= :dataCorte AND iv.empresaId = :empresaId)")
    List<Produto> findProdutosSemVendaDesde(@Param("empresaId") Long empresaId, @Param("dataCorte") LocalDateTime dataCorte);

    /**
     * Busca inteligente por termo dentro da empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.empresaId = :empresaId AND (" +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.referenciaOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "p.codigoBarras = :termo)")
    List<Produto> buscaInteligente(@Param("termo") String termo, @Param("empresaId") Long empresaId);

    // ============ EXISTENTES (mantém compatibilidade) ============
    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    List<Produto> findAlertasEstoque();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    Long countProdutosBaixoEstoque();

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo " +
            "AND p.id IN (SELECT iv.produto.id FROM ItemVenda iv GROUP BY iv.produto.id HAVING COUNT(iv) > 5)")
    List<Produto> findProdutosCriticosCurvaA();

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque > 10 " +
            "AND p.id NOT IN (SELECT iv.produto.id FROM ItemVenda iv WHERE iv.venda.dataHora >= :dataCorte)")
    List<Produto> findProdutosSemVendaDesde(@Param("dataCorte") LocalDateTime dataCorte);

    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.referenciaOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.codigoBarras) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Produto> buscarPorTermo(@Param("termo") String termo);

    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.referenciaOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "p.codigoBarras = :termo")
    List<Produto> buscaInteligente(@Param("termo") String termo);

    List<Produto> findByReferenciaOriginalAndIdNot(String referenciaOriginal, Long id);
}
```

---

## PASSO 2: Fortalecer VendaRepository (20 minutos)

### Arquivo: `src/main/java/com/grandport/erp/modules/vendas/repository/VendaRepository.java`

Adicione estes métodos:

```java
// NOVOS COM FILTRO DE EMPRESA (adicione após os existentes)

/**
 * Buscar todas as vendas de uma empresa
 */
@Query("SELECT v FROM Venda v WHERE v.empresaId = :empresaId ORDER BY v.dataHora DESC")
List<Venda> findAllByEmpresa(@Param("empresaId") Long empresaId);

/**
 * Buscar vendas por status e empresa
 */
@Query("SELECT v FROM Venda v WHERE v.status = :status AND v.empresaId = :empresaId ORDER BY v.dataHora DESC")
List<Venda> findByStatusAndEmpresa(@Param("status") StatusVenda status, @Param("empresaId") Long empresaId);

/**
 * Buscar vendas de um vendedor em uma empresa
 */
@Query("SELECT v FROM Venda v WHERE v.vendedorId = :vendedorId AND v.empresaId = :empresaId ORDER BY v.dataHora DESC")
List<Venda> findByVendedorIdAndEmpresa(@Param("vendedorId") Long vendedorId, @Param("empresaId") Long empresaId);

/**
 * Somar vendas por período de uma empresa
 */
@Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
Optional<BigDecimal> sumTotalVendasPeriodoEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);

/**
 * Somar descontos por período de uma empresa
 */
@Query("SELECT SUM(v.desconto) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
Optional<BigDecimal> sumTotalDescontosPeriodoEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);

/**
 * Contar vendas por período de uma empresa
 */
@Query("SELECT COUNT(v) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
Long countVendasByDataEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);
```

---

## PASSO 3: Fortalecer SincronizacaoErpService (1 hora)

### Arquivo: `src/main/java/com/grandport/erp/modules/fiscal/service/SincronizacaoErpService.java`

Modifique o método `sincronizarAutomaticamente()`:

**ANTES (Linhas ~100-120)**:
```java
@Transactional
@Scheduled(fixedRate = 300000) // A cada 5 minutos
public void sincronizarAutomaticamente() {
    System.out.println("🔄 [SEFAZ] Sincronizando status de vendas com SEFAZ...");

    // ❌ PROBLEMA: Isso pega TODAS as vendas!
    List<Venda> vendas = vendaRepository.findAll();

    for (Venda venda : vendas) {
        sincronizarStatusVenda(venda);
    }

    System.out.println("✅ [SEFAZ] Sincronização concluída!");
}
```

**DEPOIS (Correto)**:
```java
@Transactional
@Scheduled(fixedRate = 300000) // A cada 5 minutos
public void sincronizarAutomaticamente() {
    System.out.println("🔄 [SEFAZ] Sincronizando status de vendas com SEFAZ...");

    // ✅ CORRETO: Sincroniza por empresa
    Long empresaId = obterEmpresaIdDoUsuario();
    System.out.println("  → Empresa: " + empresaId);

    List<Venda> vendas = vendaRepository.findAllByEmpresa(empresaId);
    System.out.println("  → Total de vendas para sincronizar: " + vendas.size());

    for (Venda venda : vendas) {
        sincronizarStatusVenda(venda);
    }

    System.out.println("✅ [SEFAZ] Sincronização concluída para empresa " + empresaId);
}

/**
 * 🆕 Método auxiliar para obter empresaId do usuário autenticado
 */
private Long obterEmpresaIdDoUsuario() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof Usuario) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        return usuario.getEmpresaId() != null ? usuario.getEmpresaId() : 1L;
    }
    return 1L; // Fallback
}
```

**Adicione no início do arquivo**:
```java
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.grandport.erp.modules.usuario.model.Usuario;
```

---

## PASSO 4: Criar Novo Service - ProdutoSincronizacaoService (2 horas)

### Arquivo: `src/main/java/com/grandport/erp/modules/estoque/service/ProdutoSincronizacaoService.java` (NOVO)

```java
package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 🆕 SERVIÇO: Sincronização de Produtos Entre Empresas
 *
 * Permite compartilhar produtos da empresa A com a empresa B
 * Mantém referência cruzada para rastreabilidade
 */
@Service
@Slf4j
public class ProdutoSincronizacaoService {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private AuditoriaService auditoriaService;

    /**
     * Sincroniza um produto de uma empresa para outra
     *
     * Cria uma CÓPIA do produto na empresa destino
     * Não modifica o produto original
     * Mantém rastreabilidade via referenciaOriginal
     */
    @Transactional
    public Produto sincronizarParaEmpresa(
            Long produtoId,
            Long empresaOrigemId,
            Long empresaDestinoId) throws Exception {

        log.info("📦 Sincronizando Produto ID={} de Empresa {} para Empresa {}",
                produtoId, empresaOrigemId, empresaDestinoId);

        // ✅ Validação: Produto existe?
        Produto original = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new Exception("Produto não encontrado: " + produtoId));

        // ✅ Validação: Produto pertence à empresa origem?
        if (!original.getEmpresaId().equals(empresaOrigemId)) {
            throw new Exception(
                String.format("Produto ID=%d não pertence à Empresa %d", produtoId, empresaOrigemId)
            );
        }

        // ✅ Validação: Já existe cópia na empresa destino?
        String referenciaOriginal = produtoId + "_" + empresaOrigemId;
        List<Produto> existentes = produtoRepository.findByReferenciaOriginalAndIdNot(referenciaOriginal, produtoId);
        if (!existentes.isEmpty()) {
            log.warn("⚠️ Produto já foi sincronizado para outra empresa!");
            return existentes.get(0);
        }

        // 🚀 Criar cópia
        Produto copia = new Produto();
        BeanUtils.copyProperties(original, copia);

        // Reset ID para novo registro
        copia.setId(null);

        // Alterar empresa
        copia.setEmpresaId(empresaDestinoId);

        // Rastreabilidade
        copia.setReferenciaOriginal(referenciaOriginal);

        // Salvar
        Produto sincronizado = produtoRepository.save(copia);

        // Auditoria
        Map<String, Object> detalhes = new HashMap<>();
        detalhes.put("produto_original_id", original.getId());
        detalhes.put("produto_copia_id", sincronizado.getId());
        detalhes.put("empresa_origem", empresaOrigemId);
        detalhes.put("empresa_destino", empresaDestinoId);
        detalhes.put("nome_produto", original.getNome());
        detalhes.put("sku", original.getSku());

        auditoriaService.registrarAuditoria(
                "PRODUTO_SINCRONIZADO",
                "Produto sincronizado entre empresas",
                detalhes,
                empresaDestinoId
        );

        log.info("✅ Produto sincronizado com sucesso! ID Cópia: {}", sincronizado.getId());
        return sincronizado;
    }

    /**
     * Sincroniza múltiplos produtos para uma empresa
     */
    @Transactional
    public Map<String, Object> sincronizarEmLote(
            List<Long> produtoIds,
            Long empresaOrigemId,
            Long empresaDestinoId) throws Exception {

        Map<String, Object> resultado = new HashMap<>();
        int sucessos = 0;
        int erros = 0;
        StringBuilder erroLog = new StringBuilder();

        for (Long produtoId : produtoIds) {
            try {
                sincronizarParaEmpresa(produtoId, empresaOrigemId, empresaDestinoId);
                sucessos++;
            } catch (Exception e) {
                erros++;
                erroLog.append("Erro no produto ").append(produtoId).append(": ").append(e.getMessage()).append("\n");
                log.error("❌ Erro ao sincronizar produto {}: {}", produtoId, e.getMessage());
            }
        }

        resultado.put("total_processados", produtoIds.size());
        resultado.put("sucessos", sucessos);
        resultado.put("erros", erros);
        if (erroLog.length() > 0) {
            resultado.put("detalhes_erros", erroLog.toString());
        }

        log.info("📊 Sincronização em lote concluída: {} OK, {} ERRO", sucessos, erros);
        return resultado;
    }

    /**
     * Lista todos os produtos compartilhados com uma empresa
     */
    public List<Produto> listarProdutosCompartilhados(Long empresaId) {
        return produtoRepository.findAll().stream()
                .filter(p -> p.getEmpresaId().equals(empresaId)
                        && p.getReferenciaOriginal() != null
                        && !p.getReferenciaOriginal().isEmpty())
                .toList();
    }
}
```

---

## PASSO 5: Adicionar Endpoint para Sincronização (1 hora)

### Arquivo: `src/main/java/com/grandport/erp/modules/estoque/controller/ProdutoController.java`

Adicione estes endpoints (ao final da classe):

```java
@Autowired
private ProdutoSincronizacaoService produtoSincronizacaoService;

/**
 * POST /api/produtos/sincronizar-empresa
 * Sincroniza um produto para outra empresa
 */
@PostMapping("/sincronizar-empresa")
public ResponseEntity<?> sincronizarProduto(
        @RequestParam Long produtoId,
        @RequestParam Long empresaDestinoId) {
    try {
        // Obter empresa do usuário logado como origem
        Long empresaOrigemId = obterEmpresaIdDoUsuario();

        Produto sincronizado = produtoSincronizacaoService.sincronizarParaEmpresa(
                produtoId,
                empresaOrigemId,
                empresaDestinoId
        );

        return ResponseEntity.ok(Map.of(
            "mensagem", "Produto sincronizado com sucesso",
            "produtoOriginalId", produtoId,
            "produtoNovoId", sincronizado.getId(),
            "empresaDestino", empresaDestinoId
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
            "erro", e.getMessage()
        ));
    }
}

/**
 * POST /api/produtos/sincronizar-lote
 * Sincroniza múltiplos produtos para outra empresa
 */
@PostMapping("/sincronizar-lote")
public ResponseEntity<?> sincronizarLote(
        @RequestBody List<Long> produtoIds,
        @RequestParam Long empresaDestinoId) {
    try {
        Long empresaOrigemId = obterEmpresaIdDoUsuario();

        Map<String, Object> resultado = produtoSincronizacaoService.sincronizarEmLote(
                produtoIds,
                empresaOrigemId,
                empresaDestinoId
        );

        return ResponseEntity.ok(resultado);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
            "erro", e.getMessage()
        ));
    }
}

/**
 * GET /api/produtos/compartilhados
 * Lista produtos compartilhados com a empresa atual
 */
@GetMapping("/compartilhados")
public ResponseEntity<?> listarCompartilhados() {
    Long empresaId = obterEmpresaIdDoUsuario();
    List<Produto> produtos = produtoSincronizacaoService.listarProdutosCompartilhados(empresaId);
    return ResponseEntity.ok(produtos);
}

// Método auxiliar (adicione ao controller)
private Long obterEmpresaIdDoUsuario() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof Usuario) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        return usuario.getEmpresaId() != null ? usuario.getEmpresaId() : 1L;
    }
    return 1L;
}
```

**Adicione imports no início do arquivo**:
```java
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.grandport.erp.modules.usuario.model.Usuario;
```

---

## PASSO 6: Testes Unitários (Opcional - 30 minutos)

### Arquivo: `src/test/java/com/grandport/erp/modules/estoque/service/ProdutoSincronizacaoServiceTest.java` (NOVO)

```java
package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class ProdutoSincronizacaoServiceTest {

    @Autowired
    private ProdutoSincronizacaoService service;

    @MockBean
    private ProdutoRepository repository;

    @MockBean
    private AuditoriaService auditoriaService;

    private Produto produtoOriginal;

    @BeforeEach
    void setUp() {
        produtoOriginal = new Produto();
        produtoOriginal.setId(1L);
        produtoOriginal.setNome("Produto Teste");
        produtoOriginal.setSku("SKU-001");
        produtoOriginal.setEmpresaId(1L);
        produtoOriginal.setPrecoVenda(BigDecimal.valueOf(100.00));
    }

    @Test
    void testSincronizarParaEmpresaComSucesso() throws Exception {
        // Arrange
        when(repository.findById(1L)).thenReturn(Optional.of(produtoOriginal));
        when(repository.findByReferenciaOriginalAndIdNot("1_1", 1L)).thenReturn(java.util.List.of());
        when(repository.save(any())).thenReturn(produtoOriginal);

        // Act
        Produto resultado = service.sincronizarParaEmpresa(1L, 1L, 2L);

        // Assert
        assertNotNull(resultado);
        assertEquals(2L, resultado.getEmpresaId());
        assertEquals("1_1", resultado.getReferenciaOriginal());
    }

    @Test
    void testSincronizarComErroEmpresaNaoCorrespondem() {
        // Arrange
        produtoOriginal.setEmpresaId(2L);
        when(repository.findById(1L)).thenReturn(Optional.of(produtoOriginal));

        // Act & Assert
        assertThrows(Exception.class, () -> service.sincronizarParaEmpresa(1L, 1L, 2L));
    }
}
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

```
Passo 1: ProdutoRepository
[ ] Abrir arquivo
[ ] Adicionar novos métodos com @Query
[ ] Testar compilação (mvn clean compile)

Passo 2: VendaRepository
[ ] Abrir arquivo
[ ] Adicionar novos métodos com @Query
[ ] Testar compilação

Passo 3: SincronizacaoErpService
[ ] Abrir arquivo
[ ] Modificar sincronizarAutomaticamente()
[ ] Adicionar método obterEmpresaIdDoUsuario()
[ ] Adicionar imports

Passo 4: ProdutoSincronizacaoService (NOVO)
[ ] Criar arquivo
[ ] Copiar código
[ ] Testar compilação

Passo 5: ProdutoController
[ ] Abrir arquivo
[ ] Adicionar novos endpoints
[ ] Adicionar @Autowired ProdutoSincronizacaoService
[ ] Adicionar método auxiliar

Passo 6: Testes (OPCIONAL)
[ ] Criar teste
[ ] Rodar testes

Passo 7: Deploy
[ ] mvn clean package
[ ] Reiniciar servidor
[ ] Testar endpoints
```

---

## 🧪 COMO TESTAR

### 1. Teste de Isolamento de Dados

```bash
# Terminal 1 - Usuário da Empresa 1
curl -X GET http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_EMPRESA_1"

# Terminal 2 - Usuário da Empresa 2
curl -X GET http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_EMPRESA_2"

# Esperado: Listas diferentes ✅
```

### 2. Teste de Sincronização

```bash
# Sincronizar produto ID 5 de Empresa 1 para Empresa 2
curl -X POST "http://localhost:8080/api/produtos/sincronizar-empresa?produtoId=5&empresaDestinoId=2" \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Resposta esperada:
# {
#   "mensagem": "Produto sincronizado com sucesso",
#   "produtoOriginalId": 5,
#   "produtoNovoId": 105,
#   "empresaDestino": 2
# }
```

### 3. Teste de Sincronização em Lote

```bash
curl -X POST "http://localhost:8080/api/produtos/sincronizar-lote?empresaDestinoId=2" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d "[1, 2, 3, 4, 5]"

# Resposta esperada:
# {
#   "total_processados": 5,
#   "sucessos": 5,
#   "erros": 0
# }
```

---

**Tempo Total Estimado**: **5-6 horas**
**Dificuldade**: ⭐⭐⭐ (Intermediária)
**Impacto**: 🔴 CRÍTICO (Segurança de dados)

