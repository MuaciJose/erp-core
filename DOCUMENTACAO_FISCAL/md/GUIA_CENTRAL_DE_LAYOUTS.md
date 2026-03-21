# 🎨 CENTRAL DE LAYOUTS - GUIA DE USO

**Status**: ✅ Implementado
**Data**: 21/03/2026

---

## 📍 ACESSO

### No Backend (Java)
```
GET    /api/configuracoes/layouts                    → Lista todos os layouts
GET    /api/configuracoes/layouts/{tipoLayout}       → Obtém um layout específico
PUT    /api/configuracoes/layouts/{tipoLayout}       → Atualiza um layout
POST   /api/configuracoes/layouts/reset/{tipoLayout} → Reseta para padrão
```

### No Frontend (React)
```
<CentralDeLayouts />
```

---

## 🎯 TIPOS DE LAYOUT DISPONÍVEIS

| ID | Nome | Descrição |
|---|---|---|
| `extratoCliente` | 📋 Extrato de Cliente | Extrato de contas a receber |
| `extratoFornecedor` | 📦 Extrato de Fornecedor | Extrato de contas a pagar |
| `os` | 🔧 Ordem de Serviço | Ordem de serviço |
| `venda` | 🛒 Pedido de Venda | Pedido de venda/cotação |
| `recibo` | 📄 Recibo | Recibo de recebimento |
| `reciboPagamento` | 💳 Recibo de Pagamento | Recibo de pagamento |
| `fechamentoCaixa` | 💰 Fechamento de Caixa | Fechamento diário de caixa |
| `espelhoNota` | 📋 Espelho de Nota | Espelho da Nota Fiscal |
| `dre` | 📊 DRE | Demonstração de Resultado |
| `relatorioComissao` | 💼 Relatório de Comissão | Relatório de comissões |
| `relatorioContasPagar` | 📋 Contas a Pagar | Relatório de contas a pagar |
| `relatorioContasReceber` | 📋 Contas a Receber | Relatório de contas a receber |

---

## 📖 COMO USAR

### 1. Abrir Central de Layouts
No menu de **Configurações** → **Central de Layouts**

### 2. Selecionar Layout
Clique em um dos layouts da lista à esquerda

### 3. Editar HTML
No editor à direita, coloque seu HTML customizado

### 4. Usar Variáveis Thymeleaf
```html
<!-- Para dados simples -->
${empresa.nomeFantasia}
${parceiro.nome}
${totalGeral}

<!-- Para listas -->
<tr th:each="item : ${contas}">
  <td th:text="${item.descricao}"></td>
  <td th:text="${#numbers.formatDecimal(item.valor, 1, 'POINT', 2, 'COMMA')}"></td>
</tr>

<!-- Para condições -->
<span th:if="${status == 'PENDENTE'}" class="badge-red">PENDENTE</span>
<span th:unless="${status == 'PENDENTE'}" class="badge-green">RECEBIDO</span>
```

### 5. Preview
Clique em **Preview** para ver como ficará

### 6. Salvar
Clique em **Salvar Layout**

### 7. Testar
Use o endpoint correspondente para gerar o PDF

---

## 🔄 ENDPOINTS EM DETALHES

### GET - Obter Todos os Layouts
```bash
curl -X GET "http://localhost:8080/api/configuracoes/layouts"
```

**Resposta**:
```json
{
  "extratoCliente": "<!DOCTYPE html>...",
  "extratoFornecedor": "<!DOCTYPE html>...",
  "os": null,
  "venda": null,
  ...
}
```

### GET - Obter Layout Específico
```bash
curl -X GET "http://localhost:8080/api/configuracoes/layouts/extratoCliente"
```

**Resposta**:
```json
{
  "tipoLayout": "extratoCliente",
  "html": "<!DOCTYPE html>..."
}
```

### PUT - Atualizar Layout
```bash
curl -X PUT "http://localhost:8080/api/configuracoes/layouts/extratoCliente" \
  -H "Content-Type: application/json" \
  -d '{"html": "<!DOCTYPE html>..."}'
```

**Resposta**:
```json
{
  "mensagem": "Layout atualizado com sucesso!",
  "tipoLayout": "extratoCliente"
}
```

### POST - Resetar para Padrão
```bash
curl -X POST "http://localhost:8080/api/configuracoes/layouts/reset/extratoCliente"
```

**Resposta**:
```json
{
  "mensagem": "Layout resetado para padrão!",
  "tipoLayout": "extratoCliente"
}
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Layout Simples de Extrato
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
    <tr th:each="conta : ${contas}">
      <td th:text="${conta.descricao}"></td>
      <td th:text="${#numbers.formatDecimal(conta.valor, 1, 'POINT', 2, 'COMMA')}"></td>
      <td th:text="${conta.status}"></td>
    </tr>
  </table>

  <h3>Total: R$ <span th:text="${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}">0,00</span></h3>
</body>
</html>
```

### Exemplo 2: Layout com Estilos Profissionais
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #333;
      margin: 0;
    }
    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 { margin: 0; color: #0f172a; }
    .header p { margin: 2px 0; font-size: 10px; color: #666; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 11px;
    }
    thead { background-color: #0f172a; }
    th { padding: 10px 8px; text-align: left; color: #fff; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tbody tr:nth-child(even) { background-color: #f8f8f8; }

    .totais { margin-top: 20px; border-top: 2px solid #000; padding-top: 15px; text-align: right; }
    .totais p { margin: 5px 0; }
    .valor-total { font-size: 18px; font-weight: bold; color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <h1 th:text="${empresa.nomeFantasia}">Empresa</h1>
    <p th:text="'CNPJ: ' + ${empresa.cnpj}">CNPJ</p>
  </div>

  <h2>Extrato Financeiro</h2>
  <p><strong>Cliente:</strong> <span th:text="${parceiro.nome}"></span></p>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Descrição</th>
        <th>Vencimento</th>
        <th>Status</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr th:each="c : ${contas}">
        <td th:text="${c.id}"></td>
        <td th:text="${c.descricao}"></td>
        <td th:text="${c.dataVencimento}"></td>
        <td th:text="${c.status}"></td>
        <td th:text="${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}"></td>
      </tr>
    </tbody>
  </table>

  <div class="totais">
    <p>Total: <span class="valor-total">R$ <span th:text="${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}">0,00</span></span></p>
  </div>
</body>
</html>
```

---

## 🎨 VARIÁVEIS DISPONÍVEIS

### Empresa
```
${empresa.nomeFantasia}
${empresa.razaoSocial}
${empresa.cnpj}
${empresa.inscricaoEstadual}
${empresa.telefone}
${empresa.email}
${empresa.logoBase64}
${empresa.cep}
${empresa.logradouro}
${empresa.numero}
${empresa.bairro}
${empresa.cidade}
${empresa.uf}
```

### Parceiro (Cliente/Fornecedor)
```
${parceiro.nome}
${parceiro.documento}
${parceiro.email}
${parceiro.telefone}
${parceiro.endereco.logradouro}
${parceiro.endereco.numero}
${parceiro.endereco.cidade}
${parceiro.endereco.estado}
```

### Contas (Lista)
```
${contas}                    <!-- Array de contas -->
${c.id}                      <!-- ID -->
${c.descricao}               <!-- Descrição -->
${c.dataVencimento}          <!-- Data vencimento -->
${c.dataPagamento}           <!-- Data pagamento -->
${c.valor}                   <!-- Valor -->
${c.valorOriginal}           <!-- Valor original -->
${c.valorPago}               <!-- Valor pago -->
${c.status}                  <!-- Status -->
${c.diasAtraso}              <!-- Dias em atraso -->
```

### Totais
```
${totalGeral}
${totalPendente}
${totalRecebido}
${totalPago}
```

### Data/Hora
```
${dataEmissao}               <!-- dd/MM/yyyy HH:mm -->
```

---

## 🔧 INTEGRAÇÃO NO COMPONENTE DE CONFIGURAÇÕES

### 1. Importe o componente
```javascript
import CentralDeLayouts from './modules/configuracoes/CentralDeLayouts';
```

### 2. Adicione às rotas
```javascript
<Route path="/configuracoes/layouts" element={<CentralDeLayouts />} />
```

### 3. Adicione ao menu
```javascript
<NavLink to="/configuracoes/layouts">
  🎨 Central de Layouts
</NavLink>
```

---

## ✅ CHECKLIST

- [x] Endpoints implementados
- [x] Componente React criado
- [x] GET todos os layouts
- [x] GET um layout específico
- [x] PUT para atualizar
- [x] POST para resetar
- [x] Preview em tempo real
- [x] Documentação completa

---

## 📞 SUPORTE

### Erro ao Salvar?
- Verifique se o HTML é válido
- Verifique se há fechamento correto de tags
- Veja os logs no console do navegador

### Variáveis Não Aparecem?
- Use a sintaxe correta: `${variavel}`
- Verifique o nome da variável disponível
- Veja a lista de variáveis acima

### Preview Não Funciona?
- Certifique-se que o HTML é válido
- Use HTML simples sem scripts
- Teste no navegador

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Acesse o menu de Configurações
2. ✅ Clique em "Central de Layouts"
3. ✅ Selecione o tipo de layout
4. ✅ Edite o HTML
5. ✅ Clique em Preview
6. ✅ Salve o layout
7. ✅ Teste gerando um PDF

---

**Tudo pronto! Agora você pode customizar todos os layouts do sistema via interface visual! 🎉**

