# ✅ CHECKLIST DE IMPLEMENTAÇÃO - CÓDIGO PREMIUM

**Objetivo:** Guia prático passo-a-passo para implementar melhorias  
**Duração:** 4-6 semanas  
**Atualizado:** 2026-03-30

---

## LEGENDA

- 🔴 = CRÍTICO (começar agora)
- 🟠 = ALTO (semana 1-2)
- 🟡 = MÉDIO (semana 2-3)
- 🟢 = BAIXO (semana 3-4)

---

## SEMANA 1 - SEGURANÇA E QUALIDADE (40h)

### DIA 1-2: Problemas Críticos (16h)

#### 🔴 GlobalExceptionHandler (2h)

- [ ] Criar classe: `com.grandport.erp.config.exception.GlobalExceptionHandler`
- [ ] Criar classe: `com.grandport.erp.config.exception.ErrorResponse`
- [ ] Criar classe: `com.grandport.erp.config.exception.ResourceNotFoundException`
- [ ] Adicionar `@RestControllerAdvice`
- [ ] Implementar handlers para:
  - [ ] `@MethodArgumentNotValidException` (validação)
  - [ ] `@AccessDeniedException` (acesso negado)
  - [ ] `ResourceNotFoundException` (não encontrado)
  - [ ] `Exception` (erro genérico)
- [ ] Testar com Postman:
  - [ ] POST com validação quebrada → erro formatado
  - [ ] GET recurso que não existe → 404 formatado
  - [ ] Endpoint sem permissão → 403 formatado
- [ ] Verificar resposta JSON contém: timestamp, status, error, message, path

#### 🔴 Corrigir CORS (30 min)

- [ ] Abrir `SecurityConfig.java`
- [ ] Encontrar método `corsConfigurationSource()`
- [ ] Remover: `setAllowedOriginPatterns(Arrays.asList("*"))`
- [ ] Remover: `setAllowedHeaders(Arrays.asList("*"))`
- [ ] Adicionar domínios específicos:
  - [ ] localhost:3000
  - [ ] localhost:5173
  - [ ] seu-dominio.com
- [ ] Retirar wildcard em setAllowedMethods
- [ ] Testar CORS com curl:
  ```bash
  curl -i -X OPTIONS http://localhost:8080/api/financeiro/contas-bancarias \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET"
  ```
- [ ] Verificar `Access-Control-Allow-Origin` retorna domínio específico

#### 🔴 Adicionar Logging SLF4J (2.5h)

- [ ] Criar `src/main/resources/logback-spring.xml`
- [ ] Configurar appender CONSOLE
- [ ] Configurar appender FILE (com rolagem)
- [ ] Configurar níveis:
  - [ ] `com.grandport` = INFO
  - [ ] `org.springframework.security` = DEBUG
  - [ ] `org.hibernate.SQL` = DEBUG
- [ ] Substituir System.out em 5 arquivos:
  - [ ] `SecurityFilter.java` (linha 40)
  - [ ] `TenantResolver.java` (linha 13)
  - [ ] `TokenService.java` (geração de token)
  - [ ] `EdiRemessaController.java` (inicialização)
  - [ ] `WhatsAppService.java` (integração)
- [ ] Adicionar em cada arquivo:
  ```java
  private static final Logger logger = LoggerFactory.getLogger(NomeDaClasse.class);
  logger.info("Mensagem aqui com {}", variável);
  ```
- [ ] Testar:
  ```bash
  mvn spring-boot:run | grep "Iniciando geração"
  ```
- [ ] Verificar arquivo de log: `logs/spring.log`

#### 🔴 Adicionar Validações em DTOs (1.5h)

- [ ] Abrir `ContaBancaria.java` (entity)
- [ ] Adicionar anotações:
  ```java
  @NotBlank(message = "Nome é obrigatório")
  @Size(min = 3, max = 100)
  private String nome;
  
  @NotBlank(message = "Número do banco é obrigatório")
  @Pattern(regexp = "\\d{3}")
  private String numeroBanco;
  
  @NotBlank
  @Size(min = 4, max = 10)
  private String agencia;
  ```
- [ ] Repetir em: `Configuracoes.java`, `Usuario.java`, `Empresa.java`
- [ ] Em TODOS os controllers, adicionar `@Valid`:
  ```java
  @PostMapping("/contas-bancarias")
  public ResponseEntity criar(@Valid @RequestBody ContaBancaria conta) {
  ```
- [ ] Testar com JSON inválido via Postman
- [ ] Verificar mensagens de validação aparecem no erro

### DIA 3-4: Qualidade de Código (16h)

#### 🔴 Criar Response DTOs (3h)

- [ ] Criar `ContaBancariaResponseDTO`:
  ```java
  public record ContaBancariaResponseDTO(
      Long id,
      String nome,
      String tipo,
      BigDecimal saldoAtual,
      LocalDateTime dataCriacao
  ) {
      public ContaBancariaResponseDTO(ContaBancaria c) {
          this(c.getId(), c.getNome(), c.getTipo(), c.getSaldoAtual(), c.getDataCriacao());
      }
  }
  ```
- [ ] Repetir para: `UsuarioResponseDTO`, `ConfiguracoesResponseDTO`, `EmpresaResponseDTO`
- [ ] Atualizar Controllers para retornar DTOs ao invés de Entities
- [ ] Testar endpoints e verificar que não expõe dados sensíveis

#### 🔴 Adicionar @PreAuthorize (2h)

- [ ] Abrir `FinanceiroController.java`
- [ ] Adicionar em cada endpoint:
  ```java
  @GetMapping("/contas-bancarias")
  @PreAuthorize("hasAnyRole('ADMIN', 'FINANCEIRO', 'GERENTE')")
  public ResponseEntity<List<ContaBancariaResponseDTO>> listar() {
  ```
- [ ] Adicionar em 5 principais controllers:
  - [ ] FinanceiroController
  - [ ] UsuarioController
  - [ ] EmpresaController
  - [ ] FiscalController
  - [ ] VendaController
- [ ] Testar com JWT inválido → 403
- [ ] Testar com usuário sem role → 403

#### 🟠 Implementar Soft Delete (3h)

- [ ] Criar migration: `V3__Add_Soft_Delete.sql`
  ```sql
  ALTER TABLE contas_bancarias ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
  ALTER TABLE contas_bancarias ADD COLUMN data_delecao TIMESTAMP NULL;
  ALTER TABLE contas_bancarias ADD COLUMN usuario_delecao VARCHAR(255) NULL;
  ```
- [ ] Adicionar em `ContaBancaria.java`:
  ```java
  @Column(name = "ativo", nullable = false)
  private Boolean ativo = true;
  
  @Column(name = "data_delecao")
  private LocalDateTime dataDelecao;
  
  @Column(name = "usuario_delecao")
  private String usuarioDelecao;
  ```
- [ ] Atualizar Repository queries para ignorar deletadas:
  ```java
  @Query("SELECT c FROM ContaBancaria c WHERE c.empresa.id = :empresaId AND c.ativo = true")
  List<ContaBancaria> findByEmpresa(@Param("empresaId") Long empresaId);
  ```
- [ ] Atualizar Controller DELETE:
  ```java
  @DeleteMapping("/{id}")
  public ResponseEntity delete(@PathVariable Long id) {
      ContaBancaria conta = repository.findById(id).orElseThrow();
      conta.setAtivo(false);
      conta.setDataDelecao(LocalDateTime.now());
      conta.setUsuarioDelecao(usuarioLogado.getUsername());
      repository.save(conta);
      return ResponseEntity.ok().build();
  }
  ```
- [ ] Teste: deletar e verificar que não aparece em listagens

#### 🟠 Implementar @Transactional (2h)

- [ ] Abrir `FinanceiroService.java`
- [ ] Adicionar em métodos críticos:
  ```java
  @Transactional
  public void transferir(Long origemId, Long destinoId, BigDecimal valor) {
      ContaBancaria origem = repository.findById(origemId).orElseThrow();
      ContaBancaria destino = repository.findById(destinoId).orElseThrow();
      
      origem.setSaldo(origem.getSaldo().subtract(valor));
      destino.setSaldo(destino.getSaldo().add(valor));
      
      repository.save(origem);
      repository.save(destino);
      // Se falhar aqui, rollback automático
  }
  ```
- [ ] Adicionar em: transferências, pagamentos, processamento de remessa
- [ ] Teste: simular erro na segunda operação e verificar rollback

### DIA 5: Teste e Verificação (8h)

#### 🟡 Escrever 20 Testes Unitários (6h)

- [ ] Criar `src/test/java/com/grandport/erp/modules/financeiro/service/FinanceiroServiceTest.java`
- [ ] Teste 1-5: Criar conta com sucesso
- [ ] Teste 6-10: Validações de entrada
- [ ] Teste 11-15: Edge cases
- [ ] Teste 16-20: Integração com repositório
- [ ] Executar: `mvn test -Dtest=FinanceiroServiceTest`
- [ ] Verificar: ✅ Testes passando

#### 🟡 Verificar Compilação (1h)

- [ ] Executar: `mvn clean package -DskipTests -X`
- [ ] Procurar por: `BUILD SUCCESS`
- [ ] Se houver erros, corrigir antes de prosseguir

#### 🟡 Teste Manual (1h)

- [ ] Iniciar backend: `mvn spring-boot:run`
- [ ] Testar CRUD de contas:
  - [ ] POST com dados válidos → 200
  - [ ] POST com dados inválidos → 400 com mensagem
  - [ ] GET listagem → 200 com array
  - [ ] GET inexistente → 404 formatado
  - [ ] PUT atualizar → 200
  - [ ] DELETE → 204
- [ ] Verificar logs estruturados aparecem

---

## SEMANA 2 - FUNCIONALIDADES AVANÇADAS (36h)

### DIA 1-2: DTOs e Autorização (16h)

#### 🟠 Response DTOs Completos (4h)

- [ ] Criar DTOs para TODOS os módulos
- [ ] Estrutura recomendada:
  ```
  modules/
    ├── usuario/
    │   └── dto/
    │       ├── UsuarioResponseDTO.java
    │       └── UsuarioRequestDTO.java
    ├── financeiro/
    │   └── dto/
    │       ├── ContaBancariaResponseDTO.java
    │       └── ContaBancariaRequestDTO.java
  ```
- [ ] Nunca retornar Entity diretamente
- [ ] Sempre usar ResponseDTO

#### 🟠 Permissões Completas (3h)

- [ ] Mapear permissões necessárias para cada role:
  - [ ] ADMIN: tudo
  - [ ] GERENTE: leitura + escrita (menos deletar)
  - [ ] FINANCEIRO: operações financeiras apenas
  - [ ] VENDEDOR: vendas apenas
- [ ] Adicionar `@PreAuthorize` em 20 endpoints
- [ ] Testar cada role

#### 🟠 Paginação (4h)

- [ ] Atualizar todos os Controllers GET para retornar `Page<DTO>`:
  ```java
  @GetMapping("/contas-bancarias")
  public ResponseEntity<Page<ContaBancariaResponseDTO>> listar(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "nome,asc") String sort) {
      
      Pageable pageable = PageRequest.of(page, size, Sort.by("nome"));
      Page<ContaBancaria> resultado = repository.findAll(pageable);
      return ResponseEntity.ok(resultado.map(ContaBancariaResponseDTO::new));
  }
  ```
- [ ] Testar paginação com Postman
- [ ] Testar ordenação

#### 🟠 Rate Limiting (5h)

- [ ] Adicionar dependência no `pom.xml`:
  ```xml
  <dependency>
      <groupId>com.github.vladimir-bukhtoyarov</groupId>
      <artifactId>bucket4j-core</artifactId>
      <version>7.6.0</version>
  </dependency>
  ```
- [ ] Criar anotação `@RateLimitByIp`
- [ ] Criar interceptor para validar rate limit
- [ ] Aplicar em endpoints críticos (login, transações)
- [ ] Teste: fazer 10 requisições seguidas → erro 429 na 6ª

### DIA 3-4: Testes (12h)

#### 🟡 50 Testes Unitários (8h)

- [ ] FinanceiroServiceTest: 20 testes
- [ ] UsuarioServiceTest: 15 testes
- [ ] EmpresaServiceTest: 10 testes
- [ ] FiscalServiceTest: 5 testes
- [ ] Executar: `mvn test`
- [ ] Procurar por: `Tests run: 50, Failures: 0`

#### 🟡 20 Testes de Integração (4h)

- [ ] FinanceiroControllerTest: 10 testes
- [ ] UsuarioControllerTest: 5 testes
- [ ] FiscalControllerTest: 5 testes
- [ ] Usar `@SpringBootTest` + `MockMvc`
- [ ] Executar: `mvn test`

---

## SEMANA 3 - INFRAESTRUTURA (32h)

### DIA 1-2: Cache e API Docs (16h)

#### 🟡 Redis Cache (6h)

- [ ] Adicionar dependência:
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-redis</artifactId>
  </dependency>
  ```
- [ ] Configurar em `application.yaml`
- [ ] Adicionar `@Cacheable` em listagens
- [ ] Adicionar `@CacheEvict` em criação/edição/deleção
- [ ] Testar com Redis CLI

#### 🟡 OpenAPI/Swagger (4h)

- [ ] Adicionar em Controllers com `@Operation`, `@ApiResponse`
- [ ] Exemplo:
  ```java
  @Operation(
      summary = "Listar contas bancárias",
      description = "Retorna todas as contas da empresa logada"
  )
  @ApiResponse(responseCode = "200", description = "Lista de contas")
  @ApiResponse(responseCode = "401", description = "Não autenticado")
  @GetMapping("/contas-bancarias")
  public ResponseEntity<Page<ContaBancariaResponseDTO>> listar(Pageable page) {
  ```
- [ ] Acessar: `http://localhost:8080/swagger-ui.html`

#### 🟡 Testes E2E (6h)

- [ ] Instalar Playwright: `npm install -D @playwright/test`
- [ ] Criar testes em `grandport-frontend/e2e/`
- [ ] Teste 1: Login
- [ ] Teste 2: Criar conta bancária
- [ ] Teste 3: Editar conta
- [ ] Teste 4: Deletar conta
- [ ] Executar: `npm run test:e2e`

### DIA 3-4: Docker (12h)

#### 🟢 Dockerfile Backend (3h)

- [ ] Criar `Dockerfile` na raiz:
  ```dockerfile
  FROM eclipse-temurin:17-jdk-slim AS builder
  WORKDIR /app
  COPY ../.. .
  RUN ./mvnw clean package -DskipTests

  FROM eclipse-temurin:17-jre-slim
  WORKDIR /app
  COPY --from=builder /app/target/erp-core-0.0.1-SNAPSHOT.jar app.jar
  EXPOSE 8080
  ENTRYPOINT ["java", "-jar", "app.jar"]
  ```
- [ ] Build: `docker build -t erp-core:latest .`
- [ ] Teste: `docker run -p 8080:8080 erp-core:latest`

#### 🟢 docker-compose.yml (3h)

- [ ] Criar `docker-compose.yml`:
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15-alpine
      environment:
        POSTGRES_DB: grandport_erp
        POSTGRES_PASSWORD: senha123
      ports:
        - "5432:5432"
    
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
    
    backend:
      build: .
      ports:
        - "8080:8080"
      depends_on:
        - postgres
        - redis
  ```
- [ ] Teste: `docker-compose up`

#### 🟢 Dockerfile Frontend (3h)

- [ ] Criar `grandport-frontend/Dockerfile`:
  ```dockerfile
  FROM node:18-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY ../.. .
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  EXPOSE 80
  ```
- [ ] Build: `docker build -t erp-core-frontend:latest ./grandport-frontend`

#### 🟢 GitHub Actions CI/CD (3h)

- [ ] Criar `.github/workflows/ci-cd.yml`:
  ```yaml
  name: CI/CD
  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-java@v3
          with:
            java-version: '17'
        
        - name: Build Backend
          run: ./mvnw clean package -DskipTests
        
        - name: Test Backend
          run: ./mvnw test
        
        - name: Build Frontend
          run: cd grandport-frontend && npm install && npm run build
  ```

### DIA 5: Finalização (4h)

#### 🟢 Verificação Final (4h)

- [ ] Checklist de qualidade:
  - [ ] Compilação: `mvn clean package -DskipTests` → BUILD SUCCESS
  - [ ] Testes: `mvn test` → 70+ testes passando
  - [ ] Frontend: `npm run build` → dist criado
  - [ ] Logs: verificar `logback-spring.xml` está sendo usado
  - [ ] Documentação: Swagger acessível em `/swagger-ui.html`
  - [ ] Docker: `docker-compose up` inicia tudo
  - [ ] GitHub Actions: workflow passando
- [ ] Cobertura de testes: `mvn jacoco:report` → mínimo 50%
- [ ] SonarQube: `mvn sonar:sonar` → sem critical issues

---

## SEMANA 4 - DEPLOY E MONITORAMENTO (28h)

### 🟢 Deploy em Staging (10h)

- [ ] Configurar servidor staging
- [ ] Deploy Docker: `docker pull`, `docker run`
- [ ] Testar endpoints em staging
- [ ] Validação de performance

### 🟢 Monitoramento (10h)

- [ ] Prometheus configuration
- [ ] Grafana dashboards
- [ ] Alert rules
- [ ] Log aggregation (ELK)

### 🟢 Documentação Final (8h)

- [ ] Architecture diagrams
- [ ] API documentation
- [ ] Deployment guide
- [ ] Operations manual

---

## RESUMO FINAL

### Métricas de Sucesso

| Métrica | Meta | Status |
|---------|------|--------|
| Testes unitários | >70 | ☐ |
| Cobertura de testes | >50% | ☐ |
| Erros tratados globalmente | 100% | ☐ |
| Logs estruturados | 100% | ☐ |
| CORS específico | ✅ | ☐ |
| Response DTOs | 100% | ☐ |
| @PreAuthorize | 100% | ☐ |
| Soft delete | ✅ | ☐ |
| @Transactional | ✅ | ☐ |
| Rate limiting | ✅ | ☐ |
| Cache Redis | ✅ | ☐ |
| Paginação | ✅ | ☐ |
| Swagger/OpenAPI | ✅ | ☐ |
| Docker | ✅ | ☐ |
| CI/CD | ✅ | ☐ |
| E2E Tests | ✅ | ☐ |

---

**Data:** 2026-03-30  
**Última atualização:** 2026-03-30  
**Versão:** 1.0

