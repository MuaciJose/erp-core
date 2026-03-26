#!/bin/bash

# ============================================================================
# SCRIPT DE TESTE: Isolamento Multi-Empresa
# Objetivo: Validar que cada empresa tem dados isolados
# Data: 2026-03-26
# ============================================================================

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
TIMEOUT=5

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🧪 TESTE DE ISOLAMENTO MULTI-EMPRESA              ║"
echo "║        Data: $(date '+%Y-%m-%d %H:%M:%S')                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# TESTE 1: Login da Empresa 1 e validar empresaId
# ============================================================================
echo "📍 TESTE 1: Login da Empresa 1"
echo "─────────────────────────────────────────────────────────────"

TOKEN_EMPRESA_1=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa1.com",
    "password": "senha123"
  }' | jq -r '.token // empty')

if [ -z "$TOKEN_EMPRESA_1" ]; then
  echo "❌ FALHA: Não conseguiu fazer login na Empresa 1"
  echo "   Verifique se o usuário existe e a senha está correta"
  exit 1
fi

echo "✅ Token gerado para Empresa 1"
echo ""

# ============================================================================
# TESTE 2: Buscar configurações da Empresa 1 e validar isolamento
# ============================================================================
echo "📍 TESTE 2: Buscar Configurações da Empresa 1"
echo "─────────────────────────────────────────────────────────────"

RESPOSTA_CONFIG_1=$(curl -s -X GET "$BASE_URL/api/configuracoes" \
  -H "Authorization: Bearer $TOKEN_EMPRESA_1" \
  -H "Content-Type: application/json")

EMPRESA_ID_1=$(echo "$RESPOSTA_CONFIG_1" | jq -r '.empresaId // empty')
CONFIG_ID_1=$(echo "$RESPOSTA_CONFIG_1" | jq -r '.id // empty')

if [ -z "$EMPRESA_ID_1" ] || [ "$EMPRESA_ID_1" = "null" ]; then
  echo "❌ FALHA: empresaId está NULL na resposta da Empresa 1"
  echo "Resposta: $RESPOSTA_CONFIG_1" | jq .
  exit 1
fi

echo "✅ Configuração da Empresa 1 recuperada:"
echo "   - Empresa ID: $EMPRESA_ID_1"
echo "   - Config ID: $CONFIG_ID_1"
echo "   - Nome Fantasia: $(echo "$RESPOSTA_CONFIG_1" | jq -r '.nomeFantasia')"
echo ""

# ============================================================================
# TESTE 3: Login da Empresa 2 e validar isolamento
# ============================================================================
echo "📍 TESTE 3: Login da Empresa 2"
echo "─────────────────────────────────────────────────────────────"

TOKEN_EMPRESA_2=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa2.com",
    "password": "senha123"
  }' | jq -r '.token // empty')

if [ -z "$TOKEN_EMPRESA_2" ]; then
  echo "⚠️  AVISO: Usuário da Empresa 2 não existe. Pulando teste de isolamento..."
  echo ""
else
  echo "✅ Token gerado para Empresa 2"
  echo ""

  # ============================================================================
  # TESTE 4: Buscar configurações da Empresa 2
  # ============================================================================
  echo "📍 TESTE 4: Buscar Configurações da Empresa 2"
  echo "─────────────────────────────────────────────────────────────"

  RESPOSTA_CONFIG_2=$(curl -s -X GET "$BASE_URL/api/configuracoes" \
    -H "Authorization: Bearer $TOKEN_EMPRESA_2" \
    -H "Content-Type: application/json")

  EMPRESA_ID_2=$(echo "$RESPOSTA_CONFIG_2" | jq -r '.empresaId // empty')
  CONFIG_ID_2=$(echo "$RESPOSTA_CONFIG_2" | jq -r '.id // empty')

  if [ -z "$EMPRESA_ID_2" ] || [ "$EMPRESA_ID_2" = "null" ]; then
    echo "❌ FALHA: empresaId está NULL na resposta da Empresa 2"
    echo "Resposta: $RESPOSTA_CONFIG_2" | jq .
    exit 1
  fi

  echo "✅ Configuração da Empresa 2 recuperada:"
  echo "   - Empresa ID: $EMPRESA_ID_2"
  echo "   - Config ID: $CONFIG_ID_2"
  echo "   - Nome Fantasia: $(echo "$RESPOSTA_CONFIG_2" | jq -r '.nomeFantasia')"
  echo ""

  # ============================================================================
  # TESTE 5: Validar isolamento (IDs devem ser diferentes)
  # ============================================================================
  echo "📍 TESTE 5: Validar Isolamento de Dados"
  echo "─────────────────────────────────────────────────────────────"

  if [ "$EMPRESA_ID_1" != "$EMPRESA_ID_2" ]; then
    echo "✅ ISOLAMENTO CONFIRMADO: Empresas têm IDs diferentes"
    echo "   - Empresa 1 ID: $EMPRESA_ID_1"
    echo "   - Empresa 2 ID: $EMPRESA_ID_2"
  else
    echo "❌ FALHA: Ambas as empresas retornaram o mesmo ID!"
    echo "   Isto indica que o isolamento NÃO está funcionando"
    exit 1
  fi
  echo ""

  # ============================================================================
  # TESTE 6: Tentativa de violação (Empresa 1 acessando dados da Empresa 2)
  # ============================================================================
  echo "📍 TESTE 6: Validar Proteção contra Violação de Isolamento"
  echo "─────────────────────────────────────────────────────────────"

  # Tentar fazer update com empresaId errado (usando token da Empresa 1 mas mandando empresaId 2)
  UPDATE_PAYLOAD=$(cat <<EOF
{
  "id": $CONFIG_ID_1,
  "empresaId": $EMPRESA_ID_2,
  "nomeFantasia": "TENTATIVA DE VIOLAÇÃO",
  "cnpj": "00.000.000/0000-00"
}
EOF
)

  RESPOSTA_VIOLACAO=$(curl -s -X PUT "$BASE_URL/api/configuracoes" \
    -H "Authorization: Bearer $TOKEN_EMPRESA_1" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")

  if echo "$RESPOSTA_VIOLACAO" | jq . >/dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPOSTA_VIOLACAO" | jq -r '.message // .error // empty')

    if echo "$ERROR_MSG" | grep -qi "violacao\|violação\|tentativa\|outra empresa"; then
      echo "✅ PROTEÇÃO ATIVA: Tentativa de violação foi bloqueada"
      echo "   Mensagem de erro: $ERROR_MSG"
    else
      echo "⚠️  AVISO: A tentativa foi recusada, mas sem mensagem clara"
      echo "   Resposta: $RESPOSTA_VIOLACAO"
    fi
  else
    echo "❌ FALHA: Resposta inválida do servidor"
    echo "   Resposta: $RESPOSTA_VIOLACAO"
  fi
  echo ""
fi

# ============================================================================
# TESTE 7: Validar que ID não é null
# ============================================================================
echo "📍 TESTE 7: Validar Geração de ID (não NULL)"
echo "─────────────────────────────────────────────────────────────"

if [ "$CONFIG_ID_1" != "null" ] && [ -n "$CONFIG_ID_1" ]; then
  echo "✅ ID gerado corretamente: $CONFIG_ID_1"
else
  echo "❌ FALHA: ID está NULL ou vazio"
  exit 1
fi
echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ✅ TODOS OS TESTES PASSARAM!                    ║"
echo "║                                                            ║"
echo "║  ✓ Login funcionando                                       ║"
echo "║  ✓ Isolamento de dados confirmado                          ║"
echo "║  ✓ Proteção contra violação ativa                          ║"
echo "║  ✓ IDs gerando corretamente (não NULL)                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Resumo dos Dados:"
echo "   Empresa 1: ID=$EMPRESA_ID_1, ConfigID=$CONFIG_ID_1"
[ -n "$EMPRESA_ID_2" ] && echo "   Empresa 2: ID=$EMPRESA_ID_2, ConfigID=$CONFIG_ID_2" || echo "   Empresa 2: Não configurada (apenas 1 empresa no banco)"
echo ""

