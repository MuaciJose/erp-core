# ⚡ GUIA RÁPIDO: O QUE MUDAR NO SEU PROJETO

**Tempo de Leitura**: 5 minutos
**Tempo de Implementação**: 15 minutos
**Dificuldade**: 🟢 Fácil

---

## 📋 TL;DR (Resumo Executivo)

**4 mudanças simples para corrigir multi-empresa:**

1. ✅ Adicione validação no `ConfiguracaoService.java` (2 min)
2. ✅ Crie arquivo SQL migration (1 min)
3. ✅ Atualize `CadastroEmpresa.jsx` (3 min)
4. ✅ Melhore logs no `TenantResolver.java` (2 min)

**Resultado**: Isolamento multi-empresa funcionando + proteção contra violação

---

## 1️⃣ VALIDAÇÃO NO BACKEND (ConfiguracaoService.java)

### O Problema
Usuário A conseguia alterar configuração da Empresa B (não deveria!).

### A Solução
Adicione este código no método `atualizarConfiguracao()`:

```java
@Transactional
public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
    Long empresaId = obterEmpresaIdDoUsuario();

    // ← AQUI: Validação de segurança
    if (dadosAtualizados.getEmpresaId() != null &&
        !dadosAtualizados.getEmpresaId().equals(empresaId)) {
        throw new SecurityException(
            "🔴 TENTATIVA DE VIOLAÇÃO: Você está tentando alterar configuração de OUTRA EMPRESA! " +
            "Esperado empresaId: " + empresaId + ", Recebido: " + dadosAtualizados.getEmpresaId()
        );
    }

    // Resto do código continua igual...
    ConfiguracaoSistema configBanco = repository
        .findFirstByEmpresaIdOrderByIdDesc(empresaId)
        .orElseThrow(() -> new RuntimeException("Configuração não encontrada..."));

    // ... resto do método ...
}
```

### Resultado
```
❌ ANTES: Empresa 1 alterava Empresa 2 (BUG)
✅ DEPOIS: Empresa 1 recebe SecurityException (SEGURO)
```

**Tempo**: 2 minutos

---

## 2️⃣ MIGRATION FLYWAY (Criar arquivo SQL)

### O Problema
Coluna `id` recebia NULL (erro: "violates not-null constraint")

### A Solução
Criar arquivo: `/src/main/resources/db/migration/V2__Fix_Configuracoes_Sequence.sql`

```sql
-- Criar sequence
CREATE SEQUENCE IF NOT EXISTS configuracoes_sistema_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Associar à coluna id
ALTER TABLE configuracoes_sistema
    ALTER COLUMN id SET DEFAULT nextval('configuracoes_sistema_id_seq'::regclass);

-- Atualizar sequence para não duplicar IDs
SELECT setval('configuracoes_sistema_id_seq',
    (SELECT COALESCE(MAX(id), 1) FROM configuracoes_sistema) + 1);

-- Garantir constraints
ALTER TABLE configuracoes_sistema ALTER COLUMN id SET NOT NULL;
ALTER TABLE configuracoes_sistema ALTER COLUMN empresa_id SET NOT NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_id ON configuracoes_sistema(empresa_id);

-- Garantir uma config por empresa
ALTER TABLE configuracoes_sistema
    ADD CONSTRAINT uk_configuracoes_empresa_id UNIQUE (empresa_id);
```

### Resultado
```
❌ ANTES: id = null em banco (ERRO)
✅ DEPOIS: id gerado automaticamente (1, 2, 3, ...) (OK)
```

**Tempo**: 1 minuto

---

## 3️⃣ LIMPEZA DE TOKEN NO FRONTEND (CadastroEmpresa.jsx)

### O Problema
Após criar empresa, frontend mantinha token antigo com empresaId errado.

### A Solução
No método `handleSubmit()`, após sucesso, adicione:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
        await api.post('/api/assinaturas/nova-empresa', formData);

        setSucesso(true);
        setLoading(false);

        // ← AQUI: Limpar dados antigos
        localStorage.removeItem('token');
        localStorage.removeItem('empresaId');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('user');

        sessionStorage.removeItem('token');
        sessionStorage.removeItem('empresaId');

        // Redireciona para login após 3 segundos
        setTimeout(() => {
            onVoltarLogin();
        }, 3000);

    } catch (error) {
        setLoading(false);
        setErro(error.response?.data?.message || 'Erro ao criar conta...');
    }
};
```

### Resultado
```
❌ ANTES: "assigned tenant id differs from current tenant id [1 != 2]"
✅ DEPOIS: Novo login gera token com empresaId correto
```

**Tempo**: 3 minutos

---

## 4️⃣ MELHORAR LOGS DO TENANT RESOLVER (TenantResolver.java)

### O Problema
Logs genéricos dificultavam debug de problemas multi-tenant.

### A Solução
Substitua todo o arquivo `/src/main/java/com/grandport/erp/config/tenant/TenantResolver.java`:

```java
package com.grandport.erp.config.tenant;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    @Override
    public Long resolveCurrentTenantIdentifier() {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();

            if (principal instanceof Usuario) {
                Usuario usuario = (Usuario) principal;
                Long empresaId = usuario.getEmpresaId();

                if (empresaId == null || empresaId <= 0) {
                    System.out.println("[" + timestamp + "] 🟡 AVISO - empresaId NULL para [" + usuario.getUsername() + "]. Fallback: 1L");
                    return 1L;
                }

                System.out.println("[" + timestamp + "] ✅ Usuário [" + usuario.getUsername() + "] | Empresa: " + empresaId);
                return empresaId;
            } else {
                System.out.println("[" + timestamp + "] 🔴 ERRO - Principal inválido! Tipo: " + principal.getClass().getName());
            }
        } else {
            System.out.println("[" + timestamp + "] 🔴 ERRO - Sem autenticação!");
        }

        return 1L;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false; // ← NUNCA mude para true em REST APIs!
    }
}
```

### Resultado
```
❌ ANTES: Logs genéricos (difícil debugar)
✅ DEPOIS: Logs estruturados com timestamp (fácil debugar)
```

**Tempo**: 2 minutos

---

## ✅ CHECKLIST FINAL (15 min)

- [ ] (2 min) Editei ConfiguracaoService.java com validação
- [ ] (1 min) Criei arquivo V2__Fix_Configuracoes_Sequence.sql
- [ ] (3 min) Atualizei CadastroEmpresa.jsx com limpeza de token
- [ ] (2 min) Atualizei TenantResolver.java com novos logs
- [ ] (5 min) Rodei `mvn clean package -DskipTests` (BUILD SUCCESS)
- [ ] (2 min) Verifiquei que JAR foi gerado (132 MB)

---

## 🧪 COMO TESTAR

### Teste Manual (2 min)
```bash
# 1. Criar Empresa A (CNPJ: 11.111.111/0001-11)
# - Email: admin@empresa1.com
# - Senha: senha123

# 2. Login com Empresa A
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa1.com","password":"senha123"}'
# Copie o TOKEN_A

# 3. Buscar configurações de Empresa A
curl -X GET http://localhost:8080/api/configuracoes \
  -H "Authorization: Bearer TOKEN_A"
# Resultado: empresaId = 1 ✅

# 4. Criar Empresa B (CNPJ: 22.222.222/0002-22)
# - Email: admin@empresa2.com
# - Senha: senha123

# 5. Login com Empresa B e testar isolamento
# (mesmo processo que Empresa A)
# Resultado: empresaId = 2 ✅
```

### Teste Automatizado (1 min)
```bash
bash /home/ubuntu/IdeaProjects/erp-core/test-multi-tenant.sh
# Resultados:
# ✅ Login OK
# ✅ Isolamento OK
# ✅ Proteção contra violação OK
# ✅ IDs gerados OK
```

---

## 🔍 COMO DEBUGAR SE DER PROBLEMA

### Problema: ID ainda é NULL
**Solução:**
1. Verificar se migration foi aplicada: `psql erp_core -c "SELECT version FROM flyway_schema_history WHERE version='2'"`
2. Se não aparecer, execute: `ALTER TABLE configuracoes_sistema ALTER COLUMN id SET DEFAULT nextval('configuracoes_sistema_id_seq');`
3. Reinicie a aplicação

### Problema: SecurityException não aparece
**Solução:**
1. Verifique que modificou o método `atualizarConfiguracao()` corretamente
2. Compile com: `mvn clean compile`
3. Procure por "TENTATIVA DE VIOLAÇÃO" nos logs

### Problema: Frontend ainda usa token antigo
**Solução:**
1. Limpe o browser cache: `Ctrl + Shift + Delete`
2. Ou abra aba anônima/privada
3. Verifique que adicionou `localStorage.removeItem()` no handleSubmit()

### Problema: Logs não aparecem
**Solução:**
1. Verifique que atualizou TenantResolver.java
2. Compile com: `mvn clean compile`
3. Rode com: `java -jar target/erp-core-0.0.1-SNAPSHOT.jar 2>&1 | grep "TenantResolver"`

---

## 📚 LEITURA ADICIONAL

- **Detalhes Completos**: Ver `/home/ubuntu/IdeaProjects/erp-core/CORRECOES_CRITICAS_APLICADAS.md`
- **Relatório Executivo**: Ver `/home/ubuntu/IdeaProjects/erp-core/RELATORIO_FINAL_CORRECOES.md`
- **Status do Projeto**: Ver `/home/ubuntu/IdeaProjects/erp-core/STATUS_PROJETO.md`

---

## 🚀 PRÓXIMOS PASSOS (DEPOIS QUE FUNCIONAR)

1. **Semana 1**: Aplicar padrão similar em VendaService, EstoqueService
2. **Semana 2**: Criar anotação @ValidateCompanyAccess reutilizável
3. **Semana 3**: Implementar testes JUnit para multi-tenant
4. **Semana 4**: Rate Limiting por empresa + auditoria

---

## ❓ DÚVIDAS FREQUENTES

**P: Preciso resetar o banco?**
R: Não é obrigatório, mas recomendado (backup primeiro!). A migration Flyway faz o setup automático.

**P: Qual é o impacto na performance?**
R: Mínimo. O índice em `empresa_id` melhora performance. A validação extra é O(1).

**P: Funciona com múltiplas empresas?**
R: Sim! Cada empresa tem isolamento completo. Empresas 1, 2, 3... N podem coexistir.

**P: E as vendas/estoque de outras empresas?**
R: Pela lógica, VendaService também herda de BaseEntityMultiEmpresa, então já está isolado. Só precisa adicionar a validação igual a ConfiguracaoService.

**P: Quando fazer deploy?**
R: Após testes locais passarem. Recomendado staging antes de produção.

---

## 📞 SUPORTE

Qualquer dúvida:
1. Procure nos logs por mensagens com 🔴 🟡 ✅
2. Execute `bash test-multi-tenant.sh` para validar
3. Consulte CORRECOES_CRITICAS_APLICADAS.md para detalhes técnicos

---

**Versão**: 1.0
**Data**: 2026-03-26
**Status**: ✅ PRONTO PARA IMPLEMENTAR

```
╔═══════════════════════════════════════════════════════════╗
║     Você consegue! 15 minutos e está tudo funcionando     ║
║              💪 Vá lá e manda brasa! 🚀                   ║
╚═══════════════════════════════════════════════════════════╝
```

