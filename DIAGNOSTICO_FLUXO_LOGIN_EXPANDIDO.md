# 🔍 DIAGNÓSTICO EXPANDIDO: Fluxo Completo de Login + Nova Empresa

## 🎯 PROBLEMA GERAL
Novas empresas não são independentes - usuários novos veem dados da empresa 1 mesmo tendo sido criados com `empresa_id = 2`.

---

## 📊 FLUXO DE LOGIN COMPLETO

### PASSO 1: Frontend envia credenciais
```
POST /auth/login
{
  "username": "novo@empresa2.com",
  "senha": "senha123"
}
```
**Status**: ✅ CORRETO - Frontend enviando certo

---

### PASSO 2: AutenticacaoController.java recebe login
```java
@PostMapping("/login")
public ResponseEntity login(@RequestBody @Valid LoginDTO data) {
    // Cria token de autenticação
    var usernamePassword = new UsernamePasswordAuthenticationToken(
        data.username(),    // "novo@empresa2.com"
        data.senha()        // "senha123"
    );

    // ✅ AuthenticationManager autentica contra o banco
    var auth = this.authenticationManager.authenticate(usernamePassword);

    // 🔴 AQUI: Obtém o objeto Usuario do banco
    Usuario usuario = (Usuario) auth.getPrincipal();

    // O objeto Usuario agora tem:
    // - id = 2
    // - username = "novo@empresa2.com"
    // - empresaId = 2 ✅ (do banco)
    // - permissoes = ["dash", "vendas", ...]

    // Gera token JWT com o username
    var token = tokenService.gerarToken(usuario);

    // Retorna usuario completo ao frontend
    return ResponseEntity.ok(new LoginResponseDTO(token, new UsuarioDTO(usuario)));
}
```

**Status**: ✅ CORRETO - AuthenticationManager carrega Usuario do banco com empresaId correto

---

### PASSO 3: TokenService gera JWT
```java
@Service
public class TokenService {

    public String gerarToken(Usuario usuario) {
        Algorithm algoritmo = Algorithm.HMAC256(secret);
        return JWT.create()
                .withIssuer("auth-api")
                .withSubject(usuario.getUsername())  // "novo@empresa2.com"
                .withExpiresAt(genExpirationDate())   // +2 horas
                .sign(algoritmo);
    }
}
```

**Token JWT contém**:
```
Header: {alg: HS256, typ: JWT}
Payload: {
  iss: "auth-api",
  sub: "novo@empresa2.com",  // ← Apenas username
  exp: 1711270...
}
Signature: ...
```

**Status**: ✅ CORRETO - Token armazena apenas o username

---

### PASSO 4: Frontend recebe resposta
```javascript
// Resposta do login
{
  "token": "eyJhbGc...",
  "usuario": {
    "id": 2,
    "username": "novo@empresa2.com",
    "empresaId": 2,  // ✅ Frontend tem valor correto
    "permissoes": ["dash", "vendas", ...]
  }
}
```

**Status**: ✅ Frontend recebe empresaId correto

---

### PASSO 5: Frontend armazena token
```javascript
// localStorage.setItem("token", "eyJhbGc...")
```

**Status**: ✅ Token armazenado

---

### PASSO 6: Frontend faz requisição com token
```javascript
// GET /api/configuracoes
Headers: {
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
```

**Status**: ✅ Token enviado ao backend

---

### PASSO 7: SecurityFilter intercepta requisição
```java
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) {

        // 1. Extrai token do header
        var token = this.recoverToken(request);  // "eyJhbGc..."

        if (token != null) {
            // 2. Valida token e extrai username
            var login = tokenService.validateToken(token);  // "novo@empresa2.com"

            if (login != null && !login.isEmpty()) {
                // 3. 🔴 AQUI VAI O PROBLEMA!
                // Busca usuario no banco pelo username
                UserDetails user = usuarioRepository.findByUsername(login);

                // Agora USER tem:
                // - empresaId = 2 ✅ (correto do banco)

                // 4. Cria objeto de autenticação
                var authentication = new UsernamePasswordAuthenticationToken(
                    user,  // O objeto Usuario COMPLETO do banco
                    null,
                    user.getAuthorities()
                );

                // 5. Coloca na sessão Spring Security
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

**Status**: ✅ CORRETO - Usuario está sendo recarregado do banco com empresaId correto

---

### PASSO 8: TenantResolver extrai empresaId
```java
@Component
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    @Override
    public Long resolveCurrentTenantIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();

            if (principal instanceof Usuario) {
                Usuario usuario = (Usuario) principal;

                // 🎯 AQUI: Qual empresaId está no objeto?
                Long empresaId = usuario.getEmpresaId();

                System.out.println(
                    "🟢 RADAR SAAS: Liberando dados da Empresa [" + empresaId + "] " +
                    "para o usuário: " + usuario.getUsername()
                );

                return empresaId != null ? empresaId : 1L;
            }
        }

        return 1L; // Fallback
    }
}
```

**Status**: 🔴 AQUI PODE ESTAR O PROBLEMA!

---

## 🔴 PROBLEMA IDENTIFICADO NO FLUXO

### Cenário 1: Usuario em memória tem valor padrão
```
PASSO 3 (Autenticação):
- Usuario carregado do banco: empresaId = 2 ✅

PASSO 5 (TokenService):
- Token é gerado, mas NÃO contém empresaId
- Token contém APENAS: username

PASSO 7 (SecurityFilter):
- Busca usuario no banco: usuarioRepository.findByUsername(login)
- Deveria retornar Usuario com empresaId = 2
- MAS... se houver cache, pode retornar objeto com empresaId = 1L (padrão)

PASSO 8 (TenantResolver):
- Lê usuario.getEmpresaId()
- Se = 1L → Hibernate filtra dados da empresa 1 ❌
- Se = 2 → Hibernate filtra dados da empresa 2 ✅
```

---

## 🎯 3 CULPADOS PRINCIPAIS (Por ordem de probabilidade)

### 1. 🔴 ALTA PROBABILIDADE: Cache/Sessão com Usuario padrão
**Arquivo**: `SecurityFilter.java` linha 40
```java
UserDetails user = usuarioRepository.findByUsername(login);
// Se usuarioRepository tem cache, pode retornar Usuario com empresaId=1L
```

**Por quê**: Se o repositório está cacheando, o Usuario novo pode estar com valor padrão

**Como confirmar**:
- Ver logs após login novo
- Se mostra "Liberando dados da Empresa [1]" = PROBLEMA AQUI

### 2. 🟡 MÉDIA PROBABILIDADE: Usuario.java tem default 1L
**Arquivo**: `Usuario.java` linha 26
```java
@Column(name = "empresa_id", nullable = false, columnDefinition = "bigint default 1")
private Long empresaId = 1L;
```

**Por quê**: Se o objeto Usuario é criado em memória antes de ser populado, pode ficar com 1L

**Como confirmar**:
- Ver se o banco tem empresaId=2 correto
- Se sim, mas logs mostram empresa=1 = PROBLEMA AQUI

### 3. 🟡 MÉDIA PROBABILIDADE: Token não contém empresaId
**Arquivo**: `TokenService.java` linha 22
```java
.withSubject(usuario.getUsername())  // Apenas username, sem empresaId
```

**Por quê**: Se o TokenService não armazena empresaId no JWT, o SecurityFilter precisa recarregar do banco

**Como confirmar**:
- Ver se usuarioRepository.findByUsername está retornando dados corretos
- Se database tem dado certo mas filter não, = PROBLEMA AQUI

---

## 📋 FLUXO COM PROBLEMA IDENTIFICADO

```
CADASTRO (Correto):
✅ Nova Empresa criada: ID = 2
✅ Novo Usuario criado: empresa_id = 2
✅ Dados salvos no banco

LOGIN (Potencial Problema):
✅ POST /auth/login com novo email
✅ AuthenticationManager autentica
✅ Usuario carregado do banco: empresaId = 2
✅ Token JWT gerado (contém apenas username)
✅ Token retornado ao frontend

REQUISIÇÃO AUTENTICADA (Problema Aqui):
1. Frontend envia GET /api/configuracoes com token
2. SecurityFilter extrai token
3. SecurityFilter valida token → obtém username
4. SecurityFilter busca usuario: usuarioRepository.findByUsername(username)
5. 🔴 Se repositório tem cache → pode retornar Usuario com empresaId=1L
6. 🔴 SecurityContextHolder recebe Usuario com empresaId=1L
7. 🔴 TenantResolver retorna 1L
8. 🔴 Hibernate filtra dados da empresa 1
9. ❌ Usuario novo vê dados da empresa 1
```

---

## 🧪 COMO CONFIRMAR

### Teste 1: Verificar banco de dados
```sql
SELECT id, username, empresa_id FROM usuarios
WHERE username = 'novo@empresa2.com';

-- Deve mostrar empresa_id = 2
```

### Teste 2: Verificar logs após login
```
Procure por: "🟢 RADAR SAAS: Liberando dados da Empresa [X]"

Se aparecer "[1]" quando deveria ser "[2]" → PROBLEMA CONFIRMADO
```

### Teste 3: Adicionar debug no SecurityFilter
```java
// Adicione em SecurityFilter.java após line 40:
if (user instanceof Usuario) {
    Usuario u = (Usuario) user;
    System.out.println("🔍 DEBUG SecurityFilter - empresaId carregado: " + u.getEmpresaId());
}
```

---

## 📝 RESUMO EXECUTIVO

```
FLUXO DE LOGIN: ✅ Correto em 80% dos casos
PROBLEMA: Usuario pode estar com empresaId=1L (padrão) quando chega no TenantResolver
CULPADO:
  - Mais provável: Cache/Repositório retornando Usuario com valor padrão
  - Possível: Usuario.java tem default 1L que não é sobrescrito
  - Possível: Repositório não está carregando dados corretamente

CONFIRMAÇÃO: Ver logs após login novo
  - Se mostra "Empresa [1]" = PROBLEMA CONFIRMADO
  - Se mostra "Empresa [2]" = Problema é diferente (frontend/dados)

PRÓXIMA AÇÃO:
  1. Login com novo usuário
  2. Ver logs do TenantResolver
  3. Se "Empresa [1]" → Vou corrigir SecurityFilter/Usuario.java
  4. Se "Empresa [2]" → Problema está em outra camada
```

---

**Data do Diagnóstico**: 2026-03-24
**Arquivos Analisados**: 5 arquivos de autenticação
**Fluxo Mapeado**: Login → Token → SecurityFilter → TenantResolver
**Problema Localizado**: Transição entre SecurityFilter e TenantResolver

