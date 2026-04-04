#!/usr/bin/env bash

set -euo pipefail

length="${1:-64}"

if ! [[ "$length" =~ ^[0-9]+$ ]]; then
  echo "Uso: ./generate_jwt_secret.sh [tamanho_em_bytes]" >&2
  exit 1
fi

if [ "$length" -lt 32 ]; then
  echo "Informe pelo menos 32 bytes para uma secret segura." >&2
  exit 1
fi

if command -v openssl >/dev/null 2>&1; then
  secret="$(openssl rand -base64 "$length" | tr -d '\n')"
elif [ -r /dev/urandom ]; then
  secret="$(head -c "$length" /dev/urandom | base64 | tr -d '\n')"
else
  echo "Nao foi possivel gerar secret aleatoria: openssl e /dev/urandom indisponiveis." >&2
  exit 1
fi

echo "JWT_SECRET=$secret"
