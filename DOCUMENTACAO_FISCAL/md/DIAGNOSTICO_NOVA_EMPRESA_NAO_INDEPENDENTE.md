# 🔍 DIAGNÓSTICO: Por Que Novas Empresas Não São Independentes

## 🎯 PROBLEMA RELATADO
Ao cadastrar uma nova empresa via `CadastroEmpresa.jsx`, o usuário entra como se fosse da mesma empresa já cadastrada, não como uma nova empresa independente.

---

## 📋 ANÁLISE DO FLUXO

### 1. FRONTEND (CadastroEmpresa.jsx) ✅ CORRETO
```
POST /api/assinaturas/nova-empresa
{
  razaoSocial: string,
  cnpj: string,
  telefone: string,
  nomeAdmin: string,
  emailAdmin: string,
  senhaAdmin: string
}
```
**Status**: ✅ Dados estão sendo enviados corretamente

---

### 2. BACKEND - AssinaturaController.java ✅ CORRETO
```java
@PostMapping("/nova-empresa")
public ResponseEntity<?> registarEmpresa(@RequestBody NovaEmpresaDTO dto) {
    return ResponseEntity.ok(assinaturaService.registarNovaEmpresa(dto));
}
```
**Status**: ✅ Controller está chamando o service corretamente

---

### 3. BACKEND - AssinaturaService.java 🔍 ACHADO!
```java
@Transactional
public Empresa registarNovaEmpresa(NovaEmpresaDTO dto) {
    // ✅ 1. Valida CNPJ (ok)
    if (empresaRepository.existsByCnpj(dto.cnpj())) {
        throw new RuntimeException("Já existe empresa com este CNPJ");
    }

    // ✅ 2. Valida email (ok)
    if (usuarioRepository.findByUsername(dto.emailAdmin()) != null) {
        throw new RuntimeException("Email já em uso");
    }

    // ✅ 3. Cria nova EMPRESA
    Empresa empresa = new Empresa();
    empresa.setRazaoSocial(dto.razaoSocial());
    empresa.setCnpj(dto.cnpj());
    empresa.setTelefone(dto.telefone());
    Empresa empresaSalva = empresaRepository.save(empresa);

    // ✅ 4. Cria novo USUÁRIO ADMIN
    Usuario admin = new Usuario();
    admin.setNomeCompleto(dto.nomeAdmin());
    admin.setUsername(dto.emailAdmin());
    admin.setSenha(passwordEncoder.encode(dto.senhaAdmin()));

    // 🎯 CRÍTICO: Aqui define a empresa do usuário!
    admin.setEmpresaId(empresaSalva.getId()); // ← Deveria ser OK

    admin.setPermissoes(List.of("dash", "vendas", "estoque", ...));
    usuarioRepository.save(admin);

    return empresaSalva;
}
```
**Status**: ✅ Código está correto teoricamente

---

### 4. MODELO - Usuario.java 🔴 PROBLEMA ENCONTRADO!
```java
@Entity
@Table(name = "usuarios")
@Data
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔴 PROBLEMA: Valor padrão é 1L!
    @Column(name = "empresa_id", nullable = false, columnDefinition = "bigint default 1")
    private Long empresaId = 1L;  // ← AQUI!

    // ... resto do código
}
```

**Status**: 🔴 **ENCONTRADO!** O `empresaId` tem valor padrão `1L` no nível Java

---

### 5. MODELO - Empresa.java ✅ CORRETO
```java
@Entity
@Table(name = "empresas")
@Data
public class Empresa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String razaoSocial;

    @Column(unique = true, nullable = false)
    private String cnpj;

    // ✅ Sem valor padrão, gera IDs de forma independente
}
```

**Status**: ✅ Correto

---

### 6. TENANTRESOLVER - TenantResolver.java 🔍 POSSÍVEL CULPADO!
```java
@Component
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    @Override
    public Long resolveCurrentTenantIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            if (principal instanceof Usuario) {
                Usuario usuario = (Usuario) principal;
                // 🎯 AQUI: Se o usuário não foi recarregado do banco,
                // pode estar com empresaId = 1L do padrão Java
                return usuario.getEmpresaId() != null ? usuario.getEmpresaId() : 1L;
            }
        }

        return 1L; // ← Fallback para empresa 1
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false; // ✅ Correto para REST
    }
}
```

**Status**: 🔴 **POSSÍVEL PROBLEMA!** Se o objeto Usuario em memória tiver `empresaId = 1L` (valor padrão), o TenantResolver sempre retornará 1L

---

## 🔴 RAIZ DO PROBLEMA - CENÁRIO PROVÁVEL

1. ✅ Usuário preenche formulário em `CadastroEmpresa.jsx`
2. ✅ POST `/api/assinaturas/nova-empresa` é enviado
3. ✅ Backend CRIA nova Empresa (ex: ID = 2)
4. ✅ Backend CRIA novo Usuário com `empresaId = 2` e salva no banco
5. 🔴 **Frontend recebe sucesso e redireciona para Login**
6. 🔴 **Usuário faz LOGIN com novo email/senha**
7. 🔴 **Backend autentica usuário e carrega do banco (empresaId = 2) ✅**
8. 🔴 **MAS...**
   - Se houver um cache em memória
   - Ou se o objeto Usuario em sessão não for recarregado completamente
   - Pode estar usando empresaId = 1L (valor padrão Java)

---

## 🎯 SINTOMAS

Se você está vendo:
- ✅ Nova empresa criada no banco (em tabela `empresas`)
- ✅ Novo usuário criado no banco (em tabela `usuarios` com `empresa_id = 2`)
- ❌ MAS ao logar, vê dados da empresa 1 (empresa original)

**Causa provável**: TenantResolver retornando 1L porque o objeto Usuario em memória tem `empresaId = 1L`

---

## ✅ CONFIRMAÇÕES NECESSÁRIAS

Para confirmar, você deveria:

1. **Verificar no banco de dados**:
   ```sql
   SELECT id, username, empresa_id FROM usuarios;
   ```
   - Você verá múltiplos usuários com diferentes `empresa_id`?

2. **Verificar nos logs**:
   - Procure por: `"🟢 RADAR SAAS: Liberando dados da Empresa [X]"`
   - Qual número aparece depois de registrar nova empresa?

3. **Verificar no banco de dados**:
   ```sql
   SELECT * FROM empresas;
   ```
   - Você tem 2+ empresas criadas?

---

## 📊 HIPÓTESES DE FALHA

| Hipótese | Probabilidade | Causa |
|----------|---------------|-------|
| **Valor padrão `1L` em Usuario.java** | 🔴 ALTA | Pode estar retornando 1L sempre |
| **Login não está recarregando dados do banco** | 🟡 MÉDIA | Usuario em cache com empresaId=1L |
| **TenantResolver com fallback 1L** | 🟡 MÉDIA | Se auth falhar, sempre retorna 1L |
| **Frontend não fazendo logout antes de login** | 🟡 MÉDIA | Cookie/Token antigo sendo reutilizado |
| **Banco de dados não salvando empresaId** | 🟢 BAIXA | Menos provável |

---

## 📝 RESUMO EXECUTIVO

```
PROBLEMA: Nova empresa não é independente ao logar
          Usuário novo vê dados da Empresa 1

CAUSA PROVÁVEL:
  1. Usuario.java tem @Column(columnDefinition = "bigint default 1")
  2. Objeto Usuario em memória fica com empresaId = 1L
  3. TenantResolver usa esse valor
  4. Hibernate filtra dados da empresa 1

COMO COMPROVAR:
  1. Ver se empresaId no banco está correto
  2. Ver nos logs qual empresa TenantResolver retorna
  3. Verificar se Login está recarregando Usuario do banco

PRÓXIMO PASSO:
  Você quer que eu revise:
  A) Fluxo de LOGIN (pode estar não recarregando Usuario)
  B) Usuario.java (remover default 1L)
  C) TenantResolver (pode estar com cache)
```

---

**Data do Diagnóstico**: 2026-03-24
**Arquivos Analisados**: 6
**Problemas Encontrados**: 1 crítico + 2 suspeitos

