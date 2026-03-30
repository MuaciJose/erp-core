# 🎯 PLANO DE AÇÃO DETALHADO - CÓDIGO PREMIUM

**Objetivo:** 4-6 semanas para transformar o ERP em production-ready  
**Status Atual:** Funcional, mas sem qualidade profissional  
**Data Criação:** 2026-03-30

---

## ✅ TAREFAS JÁ COMPLETADAS

### ✅ 1. Corrigir Migration do Banco (V2__Fix_Configuracoes_Sequence.sql)
- **Status:** ✅ COMPLETO
- **O que foi feito:** Adicionado validação DO $$ END $$ para evitar erro de identity column
- **Impacto:** App agora inicia normalmente
- **Teste:** `mvn spring-boot:run` deve iniciar sem erro de migration

### ✅ 2. Verificar Erro do Frontend (ContasBancarias.jsx)
- **Status:** ✅ VÁLIDO - Sem erro de sintaxe
- **Verificado:** Linhas 1-665 estão corretas
- **Próximo:** Compilar com `npm run build`

---

## 🔴 TAREFAS CRÍTICAS (HOJE - 2-3 HORAS)

### ❌ 1. GlobalExceptionHandler (30 min)
**Arquivo novo:** `/src/main/java/com/grandport/erp/config/exception/GlobalExceptionHandler.java`

**Incluir:**
- Validação de DTOs (@MethodArgumentNotValidException)
- Acesso negado (@AccessDeniedException)
- Recurso não encontrado (ResourceNotFoundException)
- Erro genérico (Exception)

**Resposta padronizada:**
```json
{
  "timestamp": "2026-03-30T10:30:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Validação falhou",
  "details": {"nome": "Campo obrigatório"},
  "path": "/api/financeiro/contas-bancarias"
}
```

### ❌ 2. Corrigir CORS (15 min)
**Arquivo:** `src/main/java/com/grandport/erp/config/security/SecurityConfig.java`

**Mudar de:**
```java
configuration.setAllowedOriginPatterns(Arrays.asList("*"));
configuration.setAllowedHeaders(Arrays.asList("*"));
```

**Para:**
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:3000",
    "http://localhost:5173",
    "https://www.seudominio.com"
));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
configuration.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization"));
```

### ❌ 3. Adicionar Logging SLF4J (45 min)
**Criar arquivo:** `src/main/resources/logback-spring.xml`

**Substituir em:**
- SecurityFilter.java
- TenantResolver.java
- TokenService.java
- EdiRemessaController.java
- WhatsAppService.java

**Exemplo:**
```java
// ANTES:
System.out.println(">>> INICIANDO GERAÇÃO DE REMESSA");

// DEPOIS:
private static final Logger logger = LoggerFactory.getLogger(EdiRemessaController.class);
logger.info("Iniciando geração de remessa para contaBancariaId: {}", contaBancariaId);
```

### ❌ 4. Adicionar Validações em DTOs (30 min)

**Arquivo:** `src/main/java/com/grandport/erp/modules/financeiro/model/ContaBancaria.java`

```java
@NotBlank(message = "Nome da conta é obrigatório")
@Size(min = 3, max = 100, message = "Nome deve ter 3-100 caracteres")
private String nome;

@NotBlank(message = "Número do banco é obrigatório")
@Pattern(regexp = "\\d{3}", message = "Número do banco deve ter 3 dígitos")
private String numeroBanco;
```

**E adicionar @Valid em Controllers:**
```java
@PostMapping("/contas-bancarias")
public ResponseEntity<ContaBancaria> criar(@Valid @RequestBody ContaBancaria conta) {
    // Spring automaticamente valida
}
```

---

## ⚠️ TAREFAS ALTAS (AMANHÃ - 4 HORAS)

### ⚠️ 5. Response DTOs (60 min)
Criar DTOs separados para respostas (sem dados sensíveis)

### ⚠️ 6. Adicionar @PreAuthorize (30 min)
Verificar e adicionar permissões em todos endpoints financeiros

### ⚠️ 7. Implementar Soft Delete (45 min)
Adicionar `ativo` e `dataDelecao` em entidades financeiras

### ⚠️ 8. Transactional em operações críticas (45 min)
Adicionar `@Transactional` em transferências e operações múltiplas

---

## 📋 TAREFAS MÉDIAS (ESSA SEMANA - 8 HORAS)

### 📋 9. Adicionar Paginação
- [ ] Controllers retornar `Page<DTO>` ao invés de `List<DTO>`
- [ ] Adicionar `@RequestParam int page`, `size`, `sort`
- [ ] Testar com 1000+ registros

### 📋 10. Implementar Cache
- [ ] Adicionar dependência Redis
- [ ] `@Cacheable` em listagens
- [ ] `@CacheEvict` em criação/edição

### 📋 11. Rate Limiting
- [ ] Adicionar Bucket4j
- [ ] 5 tentativas de login/minuto
- [ ] 100 requisições/minuto por IP

### 📋 12. Testes Unitários
- [ ] Criar 50+ testes em FinanceiroServiceTest
- [ ] Testar validações e edge cases
- [ ] Executar com `mvn test`

---

## 🎯 TAREFAS BAIXAS (PRÓXIMAS SEMANAS)

### 🎯 13. OpenAPI/Swagger
- [ ] `@Operation`, `@ApiResponse` em endpoints
- [ ] Documentação automática em `/swagger-ui.html`

### 🎯 14. Docker
- [ ] Dockerfile para backend
- [ ] docker-compose.yml com PostgreSQL
- [ ] Build e push para registry

### 🎯 15. CI/CD
- [ ] GitHub Actions workflow
- [ ] Executar testes, build, análise de código
- [ ] Deploy automático

### 🎯 16. Monitoramento
- [ ] Prometheus + Grafana
- [ ] Alertas de erro
- [ ] Logs centralizados (ELK Stack)

---

## 🚀 CRONOGRAMA SUGERIDO

```
SEMANA 1:
  Seg-Ter: Tarefas críticas (GlobalExceptionHandler, CORS, Logging, Validação)
  Qua-Qui: Resposta DTOs, Soft Delete, Transactional
  Sex: Testes + Deploy em staging

SEMANA 2:
  Seg-Ter: Paginação, Cache, Rate Limiting
  Qua-Qui: Swagger/OpenAPI, Testes E2E
  Sex: Code Review + Correções

SEMANA 3-4:
  Docker, CI/CD, Monitoramento, Polimento
```

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta | Peso |
|---------|-------|------|------|
| Erros HTTP padronizados | 0% | 100% | 🔴 CRÍTICO |
| Cobertura de testes | 5% | 80% | 🔴 CRÍTICO |
| Logs estruturados | 0% | 100% | 🟠 ALTO |
| DTOs para response | 10% | 100% | 🟠 ALTO |
| Endpoints com @PreAuthorize | 40% | 100% | 🟠 ALTO |
| Uptime esperado | 95% | 99.9% | 🟡 MÉDIO |
| Tempo resposta p95 | 500ms | 200ms | 🟡 MÉDIO |

---

## 🔗 REFERÊNCIA RÁPIDA

**Documentos relacionados:**
- `ANALISE_CODIGO_PREMIUM.md` - Análise detalhada de 42 problemas
- `ROADMAP_CORRECOES.md` - Roadmap técnico (já existente)
- `TROUBLESHOOTING.md` - FAQ e soluções (já existente)

**Comandos úteis:**
```bash
# Compilar
mvn clean package -DskipTests -X

# Testar
mvn test -Dtest=*Financeiro*

# Verificar qualidade
mvn sonar:sonar

# Build frontend
cd grandport-frontend && npm run build

# Deploy docker
docker build -t erp-core:latest .
docker run -p 8080:8080 erp-core:latest
```

---

## ✨ RESULTADO ESPERADO

Após 4-6 semanas:
- ✅ Código profissional e testado
- ✅ Segurança em nível enterprise
- ✅ Logs e monitoramento funcionando
- ✅ Cobertura de testes >80%
- ✅ Pronto para produção
- ✅ Fácil onboarding de novos devs

---

**Última atualização:** 2026-03-30  
**Status:** Pronto para começar

