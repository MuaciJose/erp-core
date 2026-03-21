/**
 * 📋 EXEMPLOS DE USO - EXTRATO FINANCEIRO
 * 
 * Arquivo com exemplos práticos de como usar os endpoints de extrato
 * tanto em código Node.js/Backend quanto em React Frontend
 */

// ========================================================================
// 1️⃣ EXEMPLOS BACKEND (Node.js / TypeScript)
// ========================================================================

/**
 * Exemplo 1: Gerar PDF do Extrato do Cliente
 * 
 * Este exemplo mostra como fazer uma requisição para gerar o PDF
 * do extrato de um cliente e salvá-lo localmente.
 */
const axios = require('axios');
const fs = require('fs');

async function gerarExtratoClientePDF(parceiroId, dataInicio, dataFim) {
  try {
    const response = await axios.get(
      `http://localhost:8080/api/financeiro/extrato-cliente/${parceiroId}/pdf`,
      {
        params: {
          dataInicio: dataInicio,  // ex: "2026-01-01"
          dataFim: dataFim         // ex: "2026-03-31"
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Salva o PDF localmente
    const caminhoArquivo = `extratos/extrato-cliente-${parceiroId}.pdf`;
    fs.writeFileSync(caminhoArquivo, response.data);
    
    console.log(`✅ PDF gerado com sucesso: ${caminhoArquivo}`);
    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    throw error;
  }
}

// Uso:
// await gerarExtratoClientePDF(15, '2026-01-01', '2026-03-31');


/**
 * Exemplo 2: Gerar PDF do Extrato do Fornecedor
 */
async function gerarExtratoFornecedorPDF(parceiroId, dataInicio, dataFim) {
  try {
    const response = await axios.get(
      `http://localhost:8080/api/financeiro/extrato-fornecedor/${parceiroId}/pdf`,
      {
        params: {
          dataInicio: dataInicio,
          dataFim: dataFim
        },
        responseType: 'arraybuffer'
      }
    );
    
    const caminhoArquivo = `extratos/extrato-fornecedor-${parceiroId}.pdf`;
    fs.writeFileSync(caminhoArquivo, response.data);
    
    console.log(`✅ PDF gerado com sucesso: ${caminhoArquivo}`);
    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    throw error;
  }
}

// Uso:
// await gerarExtratoFornecedorPDF(8, '2026-01-01', '2026-03-31');


/**
 * Exemplo 3: Enviar Extrato via WhatsApp (Backend)
 */
async function enviarExtratoClienteWhatsApp(parceiroId, telefone, dataInicio, dataFim) {
  try {
    const response = await axios.post(
      `http://localhost:8080/api/financeiro/extrato-cliente/${parceiroId}/whatsapp`,
      {},
      {
        params: {
          telefone: telefone,           // ex: "11987654321"
          dataInicio: dataInicio,
          dataFim: dataFim
        }
      }
    );
    
    console.log(`✅ Extrato enviado para WhatsApp: ${response.data.mensagem}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error.message);
    throw error;
  }
}

// Uso:
// await enviarExtratoClienteWhatsApp(15, '11987654321', '2026-01-01', '2026-03-31');


/**
 * Exemplo 4: Gerar Extratos para Todos os Clientes (Batch)
 * 
 * Útil para processos automatizados mensais
 */
async function gerarExtratosEmLote(clientes, dataInicio, dataFim) {
  const resultados = {
    sucesso: [],
    erro: []
  };
  
  for (const cliente of clientes) {
    try {
      const pdf = await gerarExtratoClientePDF(cliente.id, dataInicio, dataFim);
      resultados.sucesso.push({
        clienteId: cliente.id,
        cliente: cliente.nome,
        arquivo: pdf
      });
      
      console.log(`✅ ${cliente.nome} - OK`);
    } catch (error) {
      resultados.erro.push({
        clienteId: cliente.id,
        cliente: cliente.nome,
        erro: error.message
      });
      
      console.log(`❌ ${cliente.nome} - ERRO`);
    }
  }
  
  console.log(`\n📊 Resumo: ${resultados.sucesso.length} ok, ${resultados.erro.length} erros`);
  return resultados;
}

// Uso:
/*
const clientes = [
  { id: 1, nome: 'Cliente A' },
  { id: 2, nome: 'Cliente B' },
  { id: 3, nome: 'Cliente C' }
];
await gerarExtratosEmLote(clientes, '2026-01-01', '2026-03-31');
*/


/**
 * Exemplo 5: Enviar Extratos para WhatsApp em Lote (Batch)
 */
async function enviarExtratosWhatsAppEmLote(parceiros, dataInicio, dataFim) {
  const resultados = {
    enviados: [],
    falhados: []
  };
  
  // Delay entre envios para não sobrecarregar a API
  const DELAY_MS = 1000;
  
  for (const parceiro of parceiros) {
    try {
      await enviarExtratoClienteWhatsApp(
        parceiro.id,
        parceiro.telefone,
        dataInicio,
        dataFim
      );
      
      resultados.enviados.push({
        parceiroId: parceiro.id,
        nome: parceiro.nome,
        telefone: parceiro.telefone
      });
      
      console.log(`✅ Enviado para ${parceiro.nome}`);
      
      // Aguarda antes do próximo envio
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    } catch (error) {
      resultados.falhados.push({
        parceiroId: parceiro.id,
        nome: parceiro.nome,
        erro: error.message
      });
      
      console.log(`❌ Falha ao enviar para ${parceiro.nome}`);
    }
  }
  
  return resultados;
}


/**
 * Exemplo 6: Integração com Email (usando nodemailer)
 */
const nodemailer = require('nodemailer');

async function enviarExtratoViaEmail(parceiroId, emailDestino, dataInicio, dataFim) {
  try {
    // 1. Gerar o PDF
    const caminhoArquivo = await gerarExtratoClientePDF(parceiroId, dataInicio, dataFim);
    
    // 2. Configurar transporte de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // 3. Enviar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailDestino,
      subject: `Extrato Financeiro - ${new Date().toLocaleDateString('pt-BR')}`,
      html: `
        <h2>Olá!</h2>
        <p>Segue em anexo seu extrato financeiro atualizado.</p>
        <p>Período: ${dataInicio} a ${dataFim}</p>
        <p>Qualquer dúvida, não hesite em nos contatar.</p>
        <br>
        <p>Atenciosamente,<br>Sistema ERP</p>
      `,
      attachments: [
        {
          filename: `extrato-${parceiroId}.pdf`,
          path: caminhoArquivo
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    throw error;
  }
}


// ========================================================================
// 2️⃣ EXEMPLOS FRONTEND (React / TypeScript)
// ========================================================================

/**
 * Exemplo 7: Hook React para Baixar Extrato
 */
import React, { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';

function useBaixarExtrato() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  
  const baixarExtrato = async (tipo, parceiroId, dataInicio, dataFim) => {
    setCarregando(true);
    setErro(null);
    
    try {
      const url = `http://localhost:8080/api/financeiro/extrato-${tipo}/${parceiroId}/pdf`;
      const params = new URLSearchParams({
        dataInicio: dataInicio || '',
        dataFim: dataFim || ''
      });
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `extrato-${tipo}-${parceiroId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      setErro(error.message);
      console.error('Erro ao baixar:', error);
    } finally {
      setCarregando(false);
    }
  };
  
  return { baixarExtrato, carregando, erro };
}

// Uso:
/*
const { baixarExtrato, carregando, erro } = useBaixarExtrato();

<button 
  onClick={() => baixarExtrato('cliente', 15, '2026-01-01', '2026-03-31')}
  disabled={carregando}
>
  {carregando ? 'Gerando...' : <Download size={18} />}
</button>

{erro && <div className="text-red-500 flex items-center gap-2"><AlertCircle /> {erro}</div>}
*/


/**
 * Exemplo 8: Componente React para Exibir Botões de Extrato
 */
function ExtratoClienteActions({ cliente, onSucesso }) {
  const { baixarExtrato, carregando, erro } = useBaixarExtrato();
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  const handleBaixarExtrato = () => {
    baixarExtrato('cliente', cliente.id, dataInicio, dataFim);
    setShowDatePicker(false);
  };
  
  const handleEnviarWhatsApp = async () => {
    setEnviandoWhatsApp(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/financeiro/extrato-cliente/${cliente.id}/whatsapp?telefone=${cliente.telefone}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Erro ao enviar');
      
      const dados = await response.json();
      alert(dados.mensagem);
      onSucesso?.();
    } catch (error) {
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setEnviandoWhatsApp(false);
    }
  };
  
  return (
    <div className="flex gap-2 items-center">
      {showDatePicker && (
        <div className="flex gap-2 bg-gray-50 p-2 rounded">
          <input 
            type="date" 
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            placeholder="Data Início"
          />
          <input 
            type="date" 
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            placeholder="Data Fim"
          />
          <button 
            onClick={handleBaixarExtrato}
            disabled={carregando}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            {carregando ? 'Gerando...' : 'Gerar'}
          </button>
        </div>
      )}
      
      <button 
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
      >
        <Download size={18} />
        Extrato
      </button>
      
      {cliente.telefone && (
        <button 
          onClick={handleEnviarWhatsApp}
          disabled={enviandoWhatsApp}
          className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
        >
          📱 {enviandoWhatsApp ? 'Enviando...' : 'WhatsApp'}
        </button>
      )}
      
      {erro && <span className="text-red-500 text-sm">{erro}</span>}
    </div>
  );
}

export default ExtratoClienteActions;


/**
 * Exemplo 9: Componente para Listar Clientes com Ações de Extrato
 */
function ListaClientesComExtrato() {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  
  React.useEffect(() => {
    // Buscar clientes
    fetch('/api/parceiros?tipo=CLIENTE')
      .then(r => r.json())
      .then(dados => setClientes(dados))
      .catch(e => console.error('Erro ao buscar clientes:', e));
  }, []);
  
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  );
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes - Extratos Financeiros</h1>
      
      <input
        type="text"
        placeholder="Filtrar por nome..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
      />
      
      <table className="w-full border-collapse border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Cliente</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Telefone</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map(cliente => (
            <tr key={cliente.id} className="hover:bg-gray-50">
              <td className="border p-2">{cliente.nome}</td>
              <td className="border p-2">{cliente.email}</td>
              <td className="border p-2">{cliente.telefone}</td>
              <td className="border p-2">
                <ExtratoClienteActions 
                  cliente={cliente}
                  onSucesso={() => alert('✅ Operação concluída!')}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListaClientesComExtrato;


/**
 * Exemplo 10: Integração com API Axios Centralizada
 */
import api from './api'; // seu axios configurado

async function extratoAPI() {
  // Gerar extrato
  const gerarExtrato = async (tipo, parceiroId, dataInicio, dataFim) => {
    try {
      const { data } = await api.get(
        `/financeiro/extrato-${tipo}/${parceiroId}/pdf`,
        {
          params: { dataInicio, dataFim },
          responseType: 'blob'
        }
      );
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };
  
  // Enviar WhatsApp
  const enviarWhatsApp = async (tipo, parceiroId, telefone, dataInicio, dataFim) => {
    try {
      const { data } = await api.post(
        `/financeiro/extrato-${tipo}/${parceiroId}/whatsapp`,
        {},
        {
          params: { telefone, dataInicio, dataFim }
        }
      );
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };
  
  return { gerarExtrato, enviarWhatsApp };
}

export default extratoAPI;


// ========================================================================
// 3️⃣ EXEMPLOS DE TESTES UNITÁRIOS
// ========================================================================

/**
 * Exemplo 11: Testes com Jest
 */
describe('API de Extratos', () => {
  const BASE_URL = 'http://localhost:8080/api/financeiro';
  
  test('deve gerar PDF do extrato cliente', async () => {
    const response = await fetch(
      `${BASE_URL}/extrato-cliente/15/pdf?dataInicio=2026-01-01&dataFim=2026-03-31`
    );
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
  });
  
  test('deve enviar extrato via WhatsApp', async () => {
    const response = await fetch(
      `${BASE_URL}/extrato-cliente/15/whatsapp?telefone=11987654321`,
      { method: 'POST' }
    );
    
    expect(response.status).toBe(200);
    const dados = await response.json();
    expect(dados.mensagem).toContain('sucesso');
  });
  
  test('deve retornar erro para parceiro inexistente', async () => {
    const response = await fetch(
      `${BASE_URL}/extrato-cliente/99999/pdf`
    );
    
    expect(response.status).toBe(404);
  });
});


// ========================================================================
// 4️⃣ CONFIGURAÇÕES (.env)
// ========================================================================

/*
# Backend API
API_URL=http://localhost:8080

# Email (para envio via email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app

# WhatsApp (já deve estar em configuracoes_sistema)
WHATSAPP_API_URL=https://seu-provedor-whatsapp.com
WHATSAPP_TOKEN=seu-token
*/


// ========================================================================
// 5️⃣ COMANDOS ÚTEIS (CURL)
// ========================================================================

/*
# Gerar PDF do extrato cliente
curl -X GET "http://localhost:8080/api/financeiro/extrato-cliente/15/pdf?dataInicio=2026-01-01&dataFim=2026-03-31" \
  -H "Authorization: Bearer seu-token" \
  -o extrato-cliente.pdf

# Enviar extrato via WhatsApp
curl -X POST "http://localhost:8080/api/financeiro/extrato-cliente/15/whatsapp?telefone=11987654321" \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json"

# Gerar extrato fornecedor
curl -X GET "http://localhost:8080/api/financeiro/extrato-fornecedor/8/pdf" \
  -H "Authorization: Bearer seu-token" \
  -o extrato-fornecedor.pdf
*/

