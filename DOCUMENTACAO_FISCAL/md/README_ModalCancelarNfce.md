# 🎯 ModalCancelarNfce - Componente Reutilizável

## 📍 Localização

```
/src/modules/fiscal/ModalCancelarNfce.jsx
```

## 🚀 Como Usar (3 passos)

### 1️⃣ Importe o Componente

```jsx
import { ModalCancelarNfce } from '@/modules/fiscal';
// Ou
import { ModalCancelarNfce } from '../../modules/fiscal';
```

### 2️⃣ Use no seu Componente

```jsx
export function MinhaComponente() {
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);

  const abrirCancelamento = (nota) => {
    setNotaSelecionada(nota);
    setModalAberto(true);
  };

  return (
    <>
      {/* Seus botões/tabelas aqui */}

      <ModalCancelarNfce
        nota={notaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={(resultado) => {
          console.log('Cancelado:', resultado);
          // Recarregar notas aqui
        }}
      />
    </>
  );
}
```

### 3️⃣ Pronto! ✅

## 📦 Props do Componente

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `nota` | Object | ✅ | Objeto com `id`, `numero`, `chaveAcesso`, `protocolo` |
| `isOpen` | Boolean | ✅ | Modal está aberto? |
| `onClose` | Function | ✅ | Função para fechar modal |
| `onSuccess` | Function | ✅ | Callback quando cancelamento funciona |
| `apiEndpoint` | String | ❌ | Endpoint da API (padrão: `/api/fiscal/cancelar-nfce`) |

## 🔌 Estrutura do Objeto `nota`

```javascript
{
  id: 123,                                      // ID da nota (obrigatório)
  numero: '1234',                               // Número sequencial
  chaveAcesso: '35230101234567...',             // Chave de acesso NFe
  protocolo: 'SRE123456789012345',             // Protocolo (opcional)
  status: 'AUTORIZADA'                          // Status atual
}
```

## 📋 O que o Componente Faz

✅ **Validação de Entrada**
- Mínimo 15 caracteres
- Máximo 255 caracteres
- Deve ter pelo menos uma letra

✅ **Experiência do Usuário**
- Counter de caracteres em tempo real
- Mensagens de erro contextualizadas
- Loading state durante chamada API
- Toasts de sucesso/erro
- Fecha automaticamente após sucesso

✅ **Segurança**
- Timeout de 30 segundos na API
- Tratamento de erros de rede
- Validação no frontend e backend

✅ **Design**
- Interface moderna com Tailwind CSS
- Responsivo (mobile e desktop)
- Acessível (ARIA labels, keyboard support)
- Animações suaves

## 🔌 API Chamada

```
POST /api/fiscal/cancelar-nfce/{notaId}

Body:
{
  "justificativa": "Cliente solicitou o cancelamento"
}

Response:
{
  "status": "SUCESSO",
  "mensagem": "NFC-e cancelada com sucesso",
  "notaId": 123,
  "protocolo": "SRE123456789012345"
}
```

## 📚 Exemplos Completos

### Exemplo 1: Tabela com Botão de Cancelamento

```jsx
import React, { useState } from 'react';
import { ModalCancelarNfce } from '@/modules/fiscal';

export function TabelaNotas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [notas, setNotas] = useState([...]);

  const abrirModalCancelamento = (nota) => {
    setNotaSelecionada(nota);
    setModalAberto(true);
  };

  return (
    <>
      <table>
        <tbody>
          {notas.map(nota => (
            <tr key={nota.id}>
              <td>{nota.numero}</td>
              <td>
                <button
                  onClick={() => abrirModalCancelamento(nota)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ModalCancelarNfce
        nota={notaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={(resultado) => {
          // Atualizar lista
          setNotas(notas.map(n =>
            n.id === resultado.notaId
              ? { ...n, status: 'CANCELADA' }
              : n
          ));
        }}
      />
    </>
  );
}
```

### Exemplo 2: Com Carregamento de Notas do Servidor

```jsx
import React, { useState, useEffect } from 'react';
import { ModalCancelarNfce } from '@/modules/fiscal';
import api from '@/api/axios';

export function MinhasNotas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarNotas();
  }, []);

  const carregarNotas = async () => {
    try {
      const response = await api.get('/api/fiscal/notas');
      setNotas(response.data);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <>
      <div className="space-y-4">
        {notas.map(nota => (
          <div key={nota.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">NFC-e #{nota.numero}</h3>
                <p className="text-sm text-slate-600">{nota.chaveAcesso}</p>
              </div>
              {nota.status === 'AUTORIZADA' && (
                <button
                  onClick={() => {
                    setNotaSelecionada(nota);
                    setModalAberto(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ModalCancelarNfce
        nota={notaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => carregarNotas()} // Recarrega lista
      />
    </>
  );
}
```

### Exemplo 3: Endpoint Customizado

```jsx
<ModalCancelarNfce
  nota={notaSelecionada}
  isOpen={modalAberto}
  onClose={() => setModalAberto(false)}
  onSuccess={(resultado) => console.log(resultado)}
  apiEndpoint="/api/nfce/cancelar-documento" // Seu endpoint
/>
```

## 🎨 Customização

O componente usa Tailwind CSS. Se precisar customizar:

1. **Cores**: Procure por `bg-red-600`, `bg-green-50`, etc.
2. **Tamanhos**: Procure por `text-2xl`, `max-w-md`, etc.
3. **Espaçamento**: Procure por `p-6`, `gap-4`, etc.

Exemplo:

```jsx
// Antes
<button className="bg-red-600 text-white">

// Depois
<button className="bg-blue-600 text-white">
```

## 🚨 Troubleshooting

### "Module not found: @/modules/fiscal"

Verifique seu `vite.config.js` ou `tsconfig.json` e certifique-se de que o alias `@` está configurado:

```js
// vite.config.js
export default {
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}
```

### "toast is not defined"

Certifique-se de que você tem `react-hot-toast` instalado:

```bash
npm install react-hot-toast
```

### Modal não abre

Verifique:
1. `isOpen={true}` está sendo passado?
2. `nota` não está `null`?

```jsx
// ❌ Errado
<ModalCancelarNfce nota={null} isOpen={true} ... />

// ✅ Correto
<ModalCancelarNfce nota={minhaNotaValida} isOpen={true} ... />
```

## 📞 Suporte

Se tiver dúvidas:
1. Veja `ExemploUsoCancelarNfce.jsx` para exemplos práticos
2. Leia os comentários no código
3. Verifique a documentação original em `/DOCUMENTACAO_FISCAL/`

## 🎯 Resumo

| Aspecto | Status |
|--------|--------|
| Reutilizável | ✅ Sim, em qualquer componente |
| Validações | ✅ Frontend e Backend |
| Erros | ✅ Tratados completamente |
| Mobile | ✅ Responsivo |
| Acessível | ✅ ARIA labels |
| Teste | ✅ Pronto para produção |

---

**Criado em:** 20 de Março de 2026
**Status:** ✅ Pronto para Usar
**Versão:** 1.0

