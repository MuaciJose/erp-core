#!/bin/bash
# 📋 CHECKLIST DE AÇÕES - Projeto ERP
# Uso: bash ./CHECKLIST_ACOES.sh

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                   CHECKLIST DE AÇÕES - PROJETO ERP                        ║"
echo "║                        Data: 2026-03-26                                   ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}🔴 CRÍTICO - EXECUTAR HOJE (2 horas)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣  CORRIGIR VALIDAÇÃO DE EMPRESA_ID"
echo "   Arquivo: src/main/java/.../ConfiguracaoService.java"
echo "   Ação: Adicionar validação no método atualizarConfiguracao()"
echo ""
echo "   Código a adicionar (linhas ~150):"
echo "   ────────────────────────────────────────────────────────────────"
echo "   @Transactional"
echo "   public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema config) {"
echo "       Long empresaIdUsuario = obterEmpresaIdDoUsuario();"
echo "       "
echo "       if (!empresaIdUsuario.equals(config.getEmpresaId())) {"
echo "           throw new SecurityException("
echo "               \"❌ Tentativa de alterar config de outra empresa! \" +"
echo "               \"Esperado: \" + empresaIdUsuario + \", Recebido: \" + config.getEmpresaId()"
echo "           );"
echo "       }"
echo "       "
echo "       return repository.save(config);"
echo "   }"
echo "   ────────────────────────────────────────────────────────────────"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "2️⃣  CORRIGIR SEQUENCE GENERATOR"
echo "   Arquivo: src/main/java/.../ConfiguracaoSistema.java"
echo "   Ação: Adicionar initialValue = 1"
echo ""
echo "   Procure por:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   @SequenceGenerator(name = \"configuracoes_sistema_id_seq\","
echo "   ────────────────────────────────────────────────────────────────"
echo ""
echo "   E adicione: initialValue = 1"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "3️⃣  CRIAR MIGRATION FLYWAY"
echo "   Arquivo: src/main/resources/db/migration/V{VERSION}__Fix_Sequence.sql"
echo "   Ação: Copiar e executar SQL"
echo ""
echo "   SQL a executar:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   CREATE SEQUENCE IF NOT EXISTS configuracoes_sistema_id_seq"
echo "       START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;"
echo "   ────────────────────────────────────────────────────────────────"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "4️⃣  TESTAR ISOLAMENTO DE DADOS"
echo "   Comando:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   # Terminal 1: Login Empresa A"
echo "   TOKEN_A=\$(curl -s -X POST http://localhost:8080/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@empresa-a.com\",\"password\":\"senha123\"}' | jq -r '.token')"
echo "   "
echo "   # Terminal 2: Login Empresa B"
echo "   TOKEN_B=\$(curl -s -X POST http://localhost:8080/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@empresa-b.com\",\"password\":\"senha123\"}' | jq -r '.token')"
echo "   "
echo "   # Validar isolamento"
echo "   curl -H \"Authorization: Bearer \$TOKEN_A\" http://localhost:8080/api/configuracoes | jq '.empresaId'"
echo "   # Deve retornar: 1"
echo "   "
echo "   curl -H \"Authorization: Bearer \$TOKEN_B\" http://localhost:8080/api/configuracoes | jq '.empresaId'"
echo "   # Deve retornar: 2"
echo "   ────────────────────────────────────────────────────────────────"
echo ""
read -p "   Testado com sucesso? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo -e "${YELLOW}🟡 ALTO - EXECUTAR HOJE (1 hora)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "5️⃣  CORRIGIR CADASTRO EMPRESA"
echo "   Arquivo: grandport-frontend/src/pages/CadastroEmpresa.jsx"
echo "   Ação: Adicionar logout automático após criar empresa"
echo ""
echo "   Procure por: // Após criar empresa"
echo "   E adicione:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   localStorage.removeItem('token');"
echo "   localStorage.removeItem('empresaId');"
echo "   setTimeout(() => window.location.href = '/login', 1000);"
echo "   ────────────────────────────────────────────────────────────────"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "6️⃣  VERIFICAR ROLES DO USUÁRIO"
echo "   Comando SQL:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   SELECT id, email, roles FROM usuarios WHERE id = 1;"
echo "   ────────────────────────────────────────────────────────────────"
echo "   Esperado: roles contém ADMIN, GERENTE ou CONFIGURADOR"
echo ""
read -p "   Verificado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo -e "${GREEN}🟢 MÉDIO - PRÓXIMA SEMANA (1 hora)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "7️⃣  REMOVER LOGS DE DEBUG"
echo "   Arquivo: src/main/java/.../TenantResolver.java"
echo "   Ação: Comentar ou remover System.out.println()"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "8️⃣  ADICIONAR TESTES AUTOMATIZADOS"
echo "   Arquivo: src/test/java/.../ConfiguracaoServiceTest.java"
echo "   Ação: Criar testes para isolamento multi-empresa"
echo ""
read -p "   Executado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "   ${GREEN}✅ Concluído${NC}"
else
    echo -e "   ${RED}⏳ Pendente${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                          RESUMO DAS AÇÕES                                 ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Arquivo pom.xml: MODIFICADO E TESTADO${NC}"
echo -e "${GREEN}✅ Build Maven: SUCESSO${NC}"
echo -e "${GREEN}✅ JAR Gerado: erp-core-0.0.1-SNAPSHOT.jar${NC}"
echo ""
echo "📚 Referências:"
echo "   - GUIA_MULTI_EMPRESA.md (passo-a-passo detalhado)"
echo "   - DIAGNOSTICO_COMPLETO.md (análise técnica)"
echo "   - STATUS_PROJETO.md (executive summary)"
echo ""
echo "🚀 Próxima etapa:"
echo "   1. Aplicar correções acima"
echo "   2. Executar: mvn clean package -DskipTests"
echo "   3. Testar isolamento multi-empresa"
echo "   4. Deploy em homologação"
echo ""

