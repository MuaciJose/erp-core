# 📋 EXTRATO FINANCEIRO - GUIA DE IMPLEMENTAÇÃO E USO

## 🎯 O Que Foi Implementado

Um sistema completo de **extratos financeiros** para clientes e fornecedores com:

✅ **Endpoints REST** para gerar PDFs de extratos
✅ **Integração com WhatsApp** para enviar extratos
✅ **Layouts personalizáveis** via configuração no banco de dados
✅ **Templates padrão profissionalizados** (se não houver layout personalizado)
✅ **Cálculo automático** de dias em atraso
✅ **Suporte a filtros** por período de data

---

## 🔌 ENDPOINTS DISPONÍVEIS

### 1️⃣ **Gerar PDF - Extrato do Cliente (Contas a Receber)**

```
GET /api/financeiro/extrato-cliente/{parceiroId}/pdf
Query Parameters:
  - dataInicio (opcional): YYYY-MM-DD (ex: 2026-01-01)
  - dataFim (opcional): YYYY-MM-DD (ex: 2026-03-21)

Resposta: PDF (application/pdf)
Exemplo: /api/financeiro/extrato-cliente/15/pdf?dataInicio=2026-01-01&dataFim=2026-03-31
```

**O que mostra:**
- Nome e documento do cliente
- Todas as contas a receber (pendentes + recebidas)
- Data de vencimento, status e valor
- Dias em atraso (para contas pendentes)
- Totais: pendente, recebido e geral

---

### 2️⃣ **Gerar PDF - Extrato do Fornecedor (Contas a Pagar)**

```
GET /api/financeiro/extrato-fornecedor/{parceiroId}/pdf
Query Parameters:
  - dataInicio (opcional): YYYY-MM-DD (ex: 2026-01-01)
  - dataFim (opcional): YYYY-MM-DD (ex: 2026-03-21)

Resposta: PDF (application/pdf)
Exemplo: /api/financeiro/extrato-fornecedor/8/pdf?dataInicio=2026-01-01&dataFim=2026-03-31
```

**O que mostra:**
- Nome e documento do fornecedor
- Todas as contas a pagar (pendentes + pagas)
- Data de vencimento, status e valor
- Dias em atraso (para contas pendentes)
- Totais: a pagar, pago e geral

---

### 3️⃣ **Enviar Extrato do Cliente via WhatsApp**

```
POST /api/financeiro/extrato-cliente/{parceiroId}/whatsapp
Query Parameters:
  - telefone (obrigatório): Número com DDD (ex: 11987654321)
  - dataInicio (opcional): YYYY-MM-DD
  - dataFim (opcional): YYYY-MM-DD

Resposta JSON:
{
  "mensagem": "Extrato enviado para o WhatsApp com sucesso!"
}

Exemplo:
POST /api/financeiro/extrato-cliente/15/whatsapp?telefone=11987654321&dataInicio=2026-01-01&dataFim=2026-03-31
```

---

### 4️⃣ **Enviar Extrato do Fornecedor via WhatsApp**

```
POST /api/financeiro/extrato-fornecedor/{parceiroId}/whatsapp
Query Parameters:
  - telefone (obrigatório): Número com DDD (ex: 11987654321)
  - dataInicio (opcional): YYYY-MM-DD
  - dataFim (opcional): YYYY-MM-DD

Resposta JSON:
{
  "mensagem": "Extrato enviado para o WhatsApp com sucesso!"
}

Exemplo:
POST /api/financeiro/extrato-fornecedor/8/whatsapp?telefone=11987654321&dataInicio=2026-01-01&dataFim=2026-03-31
```

---

## 🎨 PERSONALIZAÇÃO DE LAYOUTS

### Como Modificar o Modelo do Extrato

Os layouts HTML são armazenados na tabela `configuracoes_sistema`:

- **Extrato Cliente**: `layoutHtmlExtratoCliente`
- **Extrato Fornecedor**: `layoutHtmlExtratoFornecedor`

### Variáveis Disponíveis no Template (Thymeleaf)

#### Para o Cliente:
```html
${empresa.nomeFantasia}          <!-- Nome da empresa -->
${empresa.cnpj}                  <!-- CNPJ -->
${empresa.logoBase64}            <!-- Logo em base64 -->
${empresa.telefone}              <!-- Telefone -->

${parceiro.nome}                 <!-- Nome do cliente -->
${parceiro.documento}            <!-- CPF/CNPJ do cliente -->
${parceiro.email}                <!-- Email do cliente -->
${parceiro.telefone}             <!-- Telefone do cliente -->

${contas}                        <!-- Lista de contas a receber -->
  - ${c.id}                      <!-- ID da conta -->
  - ${c.descricao}               <!-- Descrição -->
  - ${c.dataVencimento}          <!-- Data de vencimento (dd/MM/yyyy) -->
  - ${c.dataPagamento}           <!-- Data de pagamento (dd/MM/yyyy) -->
  - ${c.valor}                   <!-- Valor -->
  - ${c.status}                  <!-- PENDENTE ou RECEBIDO -->
  - ${c.diasAtraso}              <!-- Dias em atraso -->

${totalPendente}                 <!-- Total pendente -->
${totalRecebido}                 <!-- Total recebido -->
${totalGeral}                    <!-- Total geral -->
${dataEmissao}                   <!-- Data/hora da emissão -->
```

#### Para o Fornecedor:
Mesmas variáveis do cliente, mas:
- `${c.status}` será "PENDENTE" ou "PAGO"
- `${totalPago}` em vez de `${totalRecebido}`

### Exemplo: Modificar via SQL

```sql
UPDATE configuracoes_sistema
SET layoutHtmlExtratoCliente = '<!DOCTYPE html>...'
WHERE id = 1;
```

### Formatação de Valores

Use Thymeleaf para formatar:

```html
<!-- Moeda brasileira -->
R$ <span th:text="${#numbers.formatDecimal(valor, 1, 'POINT', 2, 'COMMA')}">0,00</span>

<!-- Data formatada -->
<span th:text="${#dates.format(data, 'dd/MM/yyyy')}"></span>

<!-- Textos em maiúsculas -->
<span th:text="${#strings.toUpperCase(texto)}"></span>
```

---

## 📱 INTEGRAÇÃO NO FRONTEND (React)

### Exemplo 1: Gerar e Baixar PDF

```javascript
// No seu componente React
import { Download, Send } from 'lucide-react';

const baixarExtratoCliente = async (parceiroId) => {
  try {
    const response = await fetch(
      `/api/financeiro/extrato-cliente/${parceiroId}/pdf?dataInicio=2026-01-01&dataFim=2026-03-31`,
      { method: 'GET' }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extrato-cliente-${parceiroId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erro ao baixar extrato:', error);
  }
};
```

### Exemplo 2: Enviar via WhatsApp

```javascript
const enviarExtratoWhatsApp = async (parceiroId, telefone) => {
  try {
    const response = await fetch(
      `/api/financeiro/extrato-cliente/${parceiroId}/whatsapp?telefone=${telefone}`,
      { method: 'POST' }
    );

    const dados = await response.json();
    alert(dados.mensagem);
  } catch (error) {
    console.error('Erro ao enviar:', error);
  }
};
```

### Exemplo 3: Botões no Componente

```jsx
<button onClick={() => baixarExtratoCliente(cliente.id)} className="flex items-center gap-2">
  <Download size={18} />
  Baixar Extrato
</button>

<button onClick={() => enviarExtratoWhatsApp(cliente.id, cliente.telefone)} className="flex items-center gap-2">
  <Send size={18} />
  Enviar por WhatsApp
</button>
```

---

## 🗂️ ESTRUTURA DE DADOS

### Tabela: `configuracoes_sistema`

Novos campos adicionados:

```sql
layoutHtmlExtratoCliente LONGTEXT           -- HTML template para extrato cliente
layoutHtmlExtratoFornecedor LONGTEXT        -- HTML template para extrato fornecedor
```

### Fluxo de Dados:

```
Cliente faz requisição
        ↓
FinanceiroController recebe parceiroId
        ↓
Busca todas as ContaReceber/ContaPagar do parceiro
        ↓
Filtra por período (se informado)
        ↓
Busca template HTML do banco (ou usa padrão)
        ↓
Injeta dados via Thymeleaf
        ↓
PdfService converte HTML → PDF
        ↓
Devolve ao cliente (download ou WhatsApp)
```

---

## ⚠️ TRATAMENTO DE ERROS

### Erros Comuns e Soluções:

| Erro | Causa | Solução |
|------|-------|--------|
| `Cliente não encontrado` | Parceiro ID inválido | Verificar ID do cliente/fornecedor |
| `Erro ao disparar WhatsApp` | Token não configurado | Verificar configurações de WhatsApp |
| `Erro ao gerar PDF` | Template HTML inválido | Validar sintaxe do template no banco |
| Nenhuma conta listada | Sem contas no período | Expandir período de datas ou criar contas |

---

## 🔧 CONFIGURAÇÃO NO BANCO

### Para Adicionar Layout Personalizado:

1. Abra a ferramenta de administração do banco (pgAdmin, MySQL Workbench, etc)
2. Localize a tabela `configuracoes_sistema` (ID = 1)
3. Edite a coluna `layoutHtmlExtratoCliente` ou `layoutHtmlExtratoFornecedor`
4. Cole seu HTML (que pode incluir variáveis Thymeleaf)
5. Salve as alterações

### Template Mínimo:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial; }
    @page { size: A4; margin: 1cm; }
  </style>
</head>
<body>
  <h1 th:text="${empresa.nomeFantasia}">Empresa</h1>
  <p>Cliente: <span th:text="${parceiro.nome}"></span></p>

  <table border="1" width="100%">
    <tr th:each="c : ${contas}">
      <td th:text="${c.descricao}"></td>
      <td th:text="${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}"></td>
    </tr>
  </table>
</body>
</html>
```

---

## 📊 EXEMPLO COMPLETO DE USO

### Cenário: Emitir extrato mensal para cliente

```bash
# 1. Gerar PDF do extrato de janeiro
curl -X GET "http://localhost:8080/api/financeiro/extrato-cliente/15/pdf?dataInicio=2026-01-01&dataFim=2026-01-31" \
  -o extrato-janeiro.pdf

# 2. Enviar via WhatsApp
curl -X POST "http://localhost:8080/api/financeiro/extrato-cliente/15/whatsapp?telefone=11987654321&dataInicio=2026-01-01&dataFim=2026-01-31"

# Resposta:
# {"mensagem": "Extrato enviado para o WhatsApp com sucesso!"}
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Frontend Integration**: Adicionar botões nos componentes de clientes/fornecedores
2. **Agendamento**: Criar job para enviar extratos mensais automaticamente
3. **Email**: Adicionar suporte para enviar via e-mail
4. **Relatórios**: Criar dashboard com estatísticas dos extratos enviados

---

## 📝 NOTAS IMPORTANTES

⚠️ **Backup**: Sempre faça backup do banco antes de modificar templates HTML

⚠️ **Thymeleaf**: Aprenda a sintaxe Thymeleaf para personalizar templates

⚠️ **Segurança**: Nunca exponha dados sensíveis nos templates

✅ **Performance**: A geração de PDF é realizada em tempo real, considere cache para muitos acessos

---

## 🆘 SUPORTE

Para dúvidas ou problemas:

1. Verifique os logs da aplicação: `docker logs erp-core`
2. Consulte a seção "Tratamento de Erros" acima
3. Revise os dados de entrada (parceiroId, telefone, datas)

---

**Versão**: 1.0
**Data**: 21/03/2026
**Status**: ✅ Pronto para Produção

