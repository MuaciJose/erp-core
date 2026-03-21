/**
 * 🎨 CENTRAL DE LAYOUTS - Gerenciador Visual de Templates HTML
 * * Componente React para gerenciar todos os layouts de impressão do sistema
 * incluindo Extratos Financeiros, Pedidos, Recibos, etc.
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, RotateCcw, Eye, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Lista de todos os layouts disponíveis
const TIPOS_LAYOUT = [
  { id: 'extratoCliente', nome: '📋 Extrato de Cliente', descricao: 'Extrato de contas a receber' },
  { id: 'extratoFornecedor', nome: '📦 Extrato de Fornecedor', descricao: 'Extrato de contas a pagar' },
  { id: 'os', nome: '🔧 Ordem de Serviço', descricao: 'Ordem de serviço (OS)' },
  { id: 'venda', nome: '🛒 Pedido de Venda', descricao: 'Pedido de venda / cotação' },
  { id: 'recibo', nome: '📄 Recibo', descricao: 'Recibo de recebimento' },
  { id: 'reciboPagamento', nome: '💳 Recibo de Pagamento', descricao: 'Recibo de pagamento de conta' },
  { id: 'fechamentoCaixa', nome: '💰 Fechamento de Caixa', descricao: 'Fechamento diário de caixa' },
  { id: 'espelhoNota', nome: '📋 Espelho de Nota', descricao: 'Espelho da Nota Fiscal' },
  { id: 'dre', nome: '📊 DRE', descricao: 'Demonstração de Resultado (DRE)' },
  { id: 'relatorioComissao', nome: '💼 Relatório de Comissão', descricao: 'Relatório de comissões' },
  { id: 'relatorioContasPagar', nome: '📋 Contas a Pagar', descricao: 'Relatório de contas a pagar' },
  { id: 'relatorioContasReceber', nome: '📋 Contas a Receber', descricao: 'Relatório de contas a receber' },
];

export const CentralDeLayouts = () => {
  const [tipoSelecionado, setTipoSelecionado] = useState('extratoCliente');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [previewAberta, setPreviewAberta] = useState(false);

  // Carregar layout ao selecionar tipo
  useEffect(() => {
    carregarLayout(tipoSelecionado);
  }, [tipoSelecionado]);

  const carregarLayout = async (tipo) => {
    setLoading(true);
    try {
      // 🚀 CORREÇÃO 1: Adicionado '/api' na rota GET
      const response = await api.get(`/api/configuracoes/layouts/${tipo}`);
      setHtml(response.data.html || '');
    } catch (error) {
      toast.error('Erro ao carregar layout');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const salvarLayout = async () => {
    if (!html.trim()) {
      toast.error('HTML não pode estar vazio');
      return;
    }

    setSalvando(true);
    try {
      // 🚀 CORREÇÃO 2: Adicionado '/api' na rota PUT
      const response = await api.put(`/api/configuracoes/layouts/${tipoSelecionado}`, {
        html: html
      });
      toast.success(response.data.mensagem || 'Layout salvo com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar layout');
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const resetarLayout = async () => {
    if (!window.confirm('Tem certeza que deseja resetar este layout para o padrão?')) {
      return;
    }

    setSalvando(true);
    try {
      // 🚀 CORREÇÃO 3: Adicionado '/api' na rota POST de reset
      const response = await api.post(`/api/configuracoes/layouts/reset/${tipoSelecionado}`);
      toast.success(response.data.mensagem);
      setHtml('');
      carregarLayout(tipoSelecionado);
    } catch (error) {
      toast.error('Erro ao resetar layout');
    } finally {
      setSalvando(false);
    }
  };

  const copiarParaClipboard = () => {
    navigator.clipboard.writeText(html);
    toast.success('HTML copiado para clipboard!');
  };

  const layoutInfo = TIPOS_LAYOUT.find(t => t.id === tipoSelecionado);

  return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🎨 Central de Layouts
            </h1>
            <p className="text-gray-600 mt-2">Gerencie os templates HTML de todos os documentos e extratos do sistema</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* COLUNA ESQUERDA: Lista de Layouts */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-6">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-900">Layouts Disponíveis</h2>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {TIPOS_LAYOUT.map(tipo => (
                      <button
                          key={tipo.id}
                          onClick={() => setTipoSelecionado(tipo.id)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition ${
                              tipoSelecionado === tipo.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">{tipo.nome}</div>
                        <div className="text-xs text-gray-500 mt-1">{tipo.descricao}</div>
                      </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Editor e Preview */}
            <div className="lg:col-span-3">
              {/* Info do Layout Selecionado */}
              {layoutInfo && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-blue-500 mt-1" size={20} />
                      <div>
                        <h3 className="font-bold text-blue-900">{layoutInfo.nome}</h3>
                        <p className="text-sm text-blue-800 mt-1">
                          Use variáveis Thymeleaf como <code className="bg-blue-200 px-2 py-1 rounded">${'${variavel}'}</code> para inserir dados dinâmicos
                        </p>
                      </div>
                    </div>
                  </div>
              )}

              {/* Editor de HTML */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-bold text-gray-900">Editar HTML</h2>
                  <button
                      onClick={copiarParaClipboard}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                      title="Copiar HTML para clipboard"
                  >
                    <Copy size={18} />
                    <span className="text-sm">Copiar</span>
                  </button>
                </div>

                <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    disabled={loading}
                    className="w-full p-4 font-mono text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-b-lg"
                    style={{ height: '400px', fontFamily: 'Monaco, Courier New, monospace' }}
                    placeholder="Paste seu HTML aqui... Você pode usar variáveis Thymeleaf"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                    onClick={salvarLayout}
                    disabled={salvando || loading || !html.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition font-semibold"
                >
                  <Save size={20} />
                  {salvando ? 'Salvando...' : 'Salvar Layout'}
                </button>

                <button
                    onClick={() => setPreviewAberta(!previewAberta)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold"
                >
                  <Eye size={20} />
                  {previewAberta ? 'Fechar' : 'Preview'}
                </button>

                <button
                    onClick={resetarLayout}
                    disabled={salvando || loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition font-semibold"
                >
                  <RotateCcw size={20} />
                  Resetar
                </button>
              </div>

              {/* Preview */}
              {previewAberta && (
                  <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Preview do HTML</h3>
                    <div
                        className="border border-gray-200 p-4 bg-gray-50 rounded overflow-auto max-h-[400px]"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default CentralDeLayouts;