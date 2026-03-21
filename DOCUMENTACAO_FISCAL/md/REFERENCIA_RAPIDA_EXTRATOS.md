# 🚀 REFERÊNCIA RÁPIDA - EXTRATOS FINANCEIROS

## 📍 Endpoints Principais

### Gerar PDF - Cliente
```
GET /api/financeiro/extrato-cliente/{id}/pdf?dataInicio=2026-01-01&dataFim=2026-03-31
```

### Gerar PDF - Fornecedor
```
GET /api/financeiro/extrato-fornecedor/{id}/pdf?dataInicio=2026-01-01&dataFim=2026-03-31
```

### Enviar WhatsApp - Cliente
```
POST /api/financeiro/extrato-cliente/{id}/whatsapp?telefone=11987654321&dataInicio=2026-01-01&dataFim=2026-03-31
```

### Enviar WhatsApp - Fornecedor
```
POST /api/financeiro/extrato-fornecedor/{id}/whatsapp?telefone=11987654321&dataInicio=2026-01-01&dataFim=2026-03-31
```

---

## 💻 Exemplo cURL

```bash
# Baixar extrato
curl -X GET "http://localhost:8080/api/financeiro/extrato-cliente/15/pdf" \
  -H "Authorization: Bearer seu-token" \
  -o extrato.pdf

# Enviar WhatsApp
curl -X POST "http://localhost:8080/api/financeiro/extrato-cliente/15/whatsapp?telefone=11987654321" \
  -H "Authorization: Bearer seu-token"
```

---

## 📱 React Hook Simples

```javascript
const baixarExtrato = async (parceiroId, tipo = 'cliente') => {
  const url = `http://localhost:8080/api/financeiro/extrato-${tipo}/${parceiroId}/pdf`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `extrato-${tipo}.pdf`;
  link.click();
};
```

---

## 🎨 Variáveis de Template

```html
<!-- Empresa -->
${empresa.nomeFantasia}
${empresa.cnpj}
${empresa.logoBase64}

<!-- Parceiro -->
${parceiro.nome}
${parceiro.documento}
${parceiro.email}
${parceiro.telefone}

<!-- Contas -->
${contas}                    <!-- Array de contas -->
${c.id}                      <!-- ID da conta -->
${c.descricao}               <!-- Descrição -->
${c.dataVencimento}          <!-- Data vencimento (dd/MM/yyyy) -->
${c.valor}                   <!-- Valor -->
${c.status}                  <!-- PENDENTE ou RECEBIDO -->
${c.diasAtraso}              <!-- Dias atrasado -->

<!-- Totais -->
${totalPendente}             <!-- Total pendente -->
${totalRecebido}             <!-- Total recebido (cliente) -->
${totalPago}                 <!-- Total pago (fornecedor) -->
${totalGeral}                <!-- Soma tudo -->

<!-- Data -->
${dataEmissao}               <!-- dd/MM/yyyy HH:mm -->
```

---

## 🔧 Configurar Layout Customizado

```sql
UPDATE configuracoes_sistema
SET layoutHtmlExtratoCliente = '<!DOCTYPE html>...'
WHERE id = 1;
```

---

## ✅ Checklist Pré-Produção

- [ ] Compilação sem erros: `./mvnw clean compile -DskipTests`
- [ ] Banco migrado com novas colunas
- [ ] Endpoints testados com curl
- [ ] WhatsApp configurado e testado
- [ ] Template HTML válido
- [ ] Dados de teste criados no banco
- [ ] Aplicação reiniciada

---

## 🐛 Debug

```bash
# Ver logs da aplicação
docker logs erp-core

# Testar conexão API
curl http://localhost:8080/api/financeiro/extrato-cliente/1/pdf

# Verificar dados no banco
SELECT * FROM contas_receber WHERE parceiro_id = 1;
```

---

## 📊 Dados Necessários

Para testar, precisam existir:

✅ Parceiro (cliente ou fornecedor)
✅ Contas a Receber OU Contas a Pagar
✅ Data de vencimento na conta

Se não houver, inserir:

```sql
INSERT INTO parceiros (nome, documento, tipo)
VALUES ('Teste', '123.456.789-00', 'CLIENTE');

INSERT INTO contas_receber (parceiro_id, descricao, valor_original, data_vencimento, status)
VALUES (1, 'Venda #001', 1000.00, '2026-02-15', 'PENDENTE');
```

---

## 🎯 Suporte

| Item | Referência |
|------|-----------|
| Documentação Completa | `DOCUMENTACAO_EXTRATOS_FINANCEIROS.md` |
| Exemplos de Código | `EXEMPLOS_EXTRATOS_API.js` |
| SQL Migrations | `MIGRATION_EXTRATOS_FINANCEIROS.sql` |
| Checklist | `CHECKLIST_EXTRATOS_FINANCEIROS.md` |

---

**Tudo pronto! 🚀**

