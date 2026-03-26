# 🧪 GUIA DE TESTE - MÓDULO DE BOLETO

**Data**: 2026-03-26
**Objetivo**: Validar funcionamento completo do módulo de boleto

---

## 📋 Pré-Requisitos

- ✅ Backend rodando: `java -jar target/erp-core-0.0.1-SNAPSHOT.jar`
- ✅ Frontend rodando: `npm run dev` (na pasta `grandport-frontend`)
- ✅ Banco de dados PostgreSQL ativo
- ✅ Usuário autenticado no sistema

---

## 🧪 Teste 1: Gerar Boleto (PDF)

### Passo 1: Acessar Contas a Receber
```
1. No menu principal, clique em "Financeiro"
2. Selecione "Contas a Receber"
```

### Passo 2: Selecionar uma Conta
```
1. Na tabela de contas, identifique uma conta com status "PENDENTE"
2. Nessa linha, procure pelo botão "GERAR BOLETO" ou ícone de impressora
```

### Passo 3: Gerar PDF
```
1. Clique em "GERAR BOLETO"
2. Modal abre com opção de selecionar banco
3. Selecione um banco (ex: Itaú)
4. Clique em "IMPRIMIR BOLETO"
5. ✅ Um novo PDF deve abrir no navegador com o boleto
```

### Resultado Esperado
```
✅ PDF abre em nova aba
✅ Boleto tem formatação padrão FEBRABAN
✅ Contém dados:
   - Nosso Número (ID da conta)
   - Valor do boleto
   - Data de vencimento
   - Agência e conta bancária
   - Código de barras
```

### Se não funcionar:
```
❌ Erro: "Conta a Receber não encontrada"
   → Verifique se a conta com ID existe no banco

❌ Erro: "Conta Bancária emissora não encontrada"
   → Verifique se a conta bancária existe em Configurações → Contas Bancárias

❌ PDF em branco ou sem formatação
   → Verifique logs do backend para erros da biblioteca Stella Boleto
```

---

## 🧪 Teste 2: Gerar Remessa (CNAB 400)

### Passo 1: Preparar Contas
```
1. Certifique-se de ter pelo menos 1 conta com status "PENDENTE"
2. Acesse: Financeiro → Contas a Receber
```

### Passo 2: Gerar Remessa
```
1. Procure pelo botão "Gerar Remessa CNAB" (geralmente no topo)
2. Clique para abrir modal
3. Selecione uma Conta Bancária
4. Clique em "GERAR REMESSA"
```

### Passo 3: Download Automático
```
1. ✅ Arquivo REMESSA_DDMMYY.txt deve fazer download automaticamente
```

### Verificar Conteúdo do Arquivo
```
abra com notepad/editor e verifique:

- Linha 1 (Tipo 0): Cabeçalho
  Formato: 01REMESSA01COBRANCA...

- Linhas 2+ (Tipo 1): Detalhe (um por boleto)
  Contém: Agência, Conta, Nosso Número, Valor, Vencimento

- Última linha (Tipo 9): Rodapé
  Contém: Quantidade total e valor total

✅ Cada linha deve ter exatamente 400 caracteres
✅ Deve haver uma linha para cada boleto PENDENTE
```

### Resultado Esperado
```
✅ Arquivo com formatação CNAB 400 correto
✅ 400 caracteres por linha
✅ Tipos de registro: 0 (header), 1 (detalhe), 9 (trailer)
✅ Pronto para enviar ao banco
```

### Se não funcionar:
```
❌ Erro: "Não há boletos pendentes para gerar remessa"
   → Crie contas a receber com status PENDENTE primeiro

❌ Arquivo vazio ou corrompido
   → Verifique logs do backend
   → Verifique se ContaBancaria tem dados preenchidos

❌ Linhas com tamanho incorreto
   → Verifique padron CNAB 400 no EdiRemessaService
```

---

## 🧪 Teste 3: Importar Retorno (CNAB 400)

### Passo 1: Obter Arquivo de Retorno
```
OPÇÃO A: Usar arquivo de teste
  - Criar arquivo RETORNO_TEST.txt com formatação CNAB 400
  - Incluir linhas com tipo "1" (detalhe)
  - Colocar código de ocorrência "06" (pago) na posição 108-110

OPÇÃO B: Usar arquivo real do banco
  - Baixar arquivo de retorno do site do banco
```

### Passo 2: Preparar Dados de Teste
```
Se estiver testando com arquivo customizado:

1. Crie um arquivo com conteúdo similar:
```
01RETORNOBANCARIO...                                                                                                  000001
1000000000001          0000000000123456                      0000000000000150006201160101010000000000000000000000000000000000000
9000001                                                                                                               000002
```
   - Linha 1: Header (tipo 0)
   - Linha 2: Detalhe (tipo 1)
     * Posição 1: tipo "1" ✓
     * Posição 108-110: "06" (pago) ✓
     * Posição 85-93: ID do boleto (ex: 00000001)
     * Posição 253-266: Valor (ex: 0000000150000 = R$ 1500,00)
   - Linha 3: Rodapé (tipo 9)
```

### Passo 3: Importar Arquivo
```
1. Em Contas a Receber, clique em "LER RETORNO"
2. Selecione o arquivo de retorno
3. ✅ Mensagem de sucesso: "X boletos baixados"
```

### Verificar Resultado
```
1. Recarregue a tabela de Contas a Receber (F5)
2. ✅ A conta que foi "paga" no arquivo deve ter status "PAGO"
3. ✅ Campo "Data Pagamento" deve estar preenchido
```

### Resultado Esperado
```
✅ Arquivo processado com sucesso
✅ Contas correspondentes ao "Nosso Número" têm status alterado para "PAGO"
✅ Mensagem: "X boletos baixados, Y erros"
```

### Se não funcionar:
```
❌ Erro: "Boleto não encontrado"
   → Verifique se o ID no arquivo (posição 85-93) existe no banco

❌ Nenhum boleto foi baixado
   → Verifique se código de ocorrência é "06" ou "00" na posição 108-110
   → Verifique tamanho da linha (deve ser 400 caracteres)

❌ Erro ao processar arquivo
   → Verifique encoding do arquivo (deve ser UTF-8 ou ASCII)
   → Verifique se é realmente arquivo de retorno CNAB 400
```

---

## 📊 Testes via CURL (Para Developers)

### Teste Gerar PDF
```bash
curl -X GET "http://localhost:8080/api/financeiro/boletos/1/gerar-pdf/1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Accept: application/pdf" \
  --output boleto.pdf

# Se sucesso: arquivo boleto.pdf criado
# Se erro: resposta HTTP com mensagem de erro
```

### Teste Gerar Remessa
```bash
curl -X GET "http://localhost:8080/api/financeiro/edi/remessa/gerar/1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Accept: text/plain" \
  --output remessa.txt

# Se sucesso: arquivo remessa.txt criado
# Se erro: resposta HTTP com mensagem de erro
```

### Teste Importar Retorno
```bash
curl -X POST "http://localhost:8080/api/financeiro/edi/retorno/importar" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@retorno.txt"

# Se sucesso: JSON com mensagem
# Se erro: resposta HTTP com mensagem de erro
```

---

## ✅ Checklist Final

- [ ] Teste 1: Gerar Boleto (PDF) → OK
- [ ] Teste 2: Gerar Remessa (CNAB 400) → OK
- [ ] Teste 3: Importar Retorno (CNAB 400) → OK
- [ ] Frontend mostra mensagens de sucesso → OK
- [ ] Backend não tem erros de compilação → OK
- [ ] Build Maven: `mvn clean package` → SUCCESS
- [ ] Todas as URLs correspondem corretamente → OK

---

## 🔍 Debug (Se algo não funcionar)

### 1. Verificar Logs Backend
```bash
# Terminal onde o Java está rodando
# Procure por linhas como:
# >>> INICIANDO GERAÇÃO DE REMESSA
# >>> RECEBENDO ARQUIVO DE RETORNO
# ❌ ERRO NA REMESSA: [mensagem]
```

### 2. Verificar Logs Frontend
```bash
# Console do navegador (F12)
# Procure por erros em Network ou Console
# Verifique resposta HTTP (200 = OK, 400 = erro, 500 = erro servidor)
```

### 3. Verificar Banco de Dados
```sql
-- Verificar se contas a receber existem
SELECT id, status, valor_original FROM contas_receber LIMIT 5;

-- Verificar se contas bancárias existem
SELECT id, nome, agencia, numero_conta FROM contas_bancarias LIMIT 5;

-- Verificar se status foi alterado após importar retorno
SELECT id, status FROM contas_receber WHERE status = 'PAGO';
```

### 4. Verificar Arquivos Gerados
```bash
# Remessa gerada
cat remessa.txt | head -3

# Deve mostrar 3 primeiras linhas com 400 caracteres cada
```

---

## 🎯 Fluxo Completo de Teste (30 minutos)

```
1. (5 min) Compilar: mvn clean package -DskipTests
2. (5 min) Iniciar servidor: java -jar ...
3. (5 min) Iniciar frontend: npm run dev
4. (5 min) Teste 1: Gerar boleto PDF
5. (5 min) Teste 2: Gerar remessa CNAB
6. (5 min) Teste 3: Importar retorno CNAB
7. (2 min) Validar resultados
8. (3 min) Documentar problemas (se houver)

Total: ~40 minutos
```

---

## 📞 Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| PDF não abre | ContaReceber não existe | Verifique ID na URL |
| Remessa vazia | Nenhum boleto PENDENTE | Crie contas com status PENDENTE |
| Retorno não importa | Arquivo formato incorreto | Use arquivo CNAB 400 válido |
| 401 Unauthorized | Token expirado | Faça login novamente |
| 403 Forbidden | Sem permissão | Verifique roles do usuário |
| 500 Internal Error | Erro no backend | Verifique logs do Java |

---

**Data**: 2026-03-26
**Versão**: erp-core-0.0.1-SNAPSHOT
**Status**: Pronto para teste ✅

