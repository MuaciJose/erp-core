// 📱 EXEMPLO PRÁTICO: Integração do Cancelamento de NFC-e no Frontend (React)
// ============================================================================
// Este arquivo mostra como integrar o novo endpoint de cancelamento
// ao componente React de gerenciamento de notas fiscais

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  AlertTriangle
} from 'lucide-react';

/**
 * 🎯 COMPONENTE: Modal de Cancelamento de NFC-e
 * 
 * Props:
 *   - nota: Objeto NotaFiscal com id, numero, chaveAcesso, etc
 *   - isOpen: boolean - Modal visível?
 *   - onClose: função - Fechar modal
 *   - onSuccess: função - Callback quando cancelamento suceder
 */
export function ModalCancelarNfce({ nota, isOpen, onClose, onSuccess }) {
  
  // =========================================================================
  // 📊 STATES
  // =========================================================================
  
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // =========================================================================
  // ✅ VALIDAÇÕES DO FRONTEND
  // =========================================================================

  /**
   * Valida se a justificativa atende aos requisitos
   */
  const validarJustificativa = () => {
    if (!justificativa.trim()) {
      setErro('Digite uma justificativa');
      return false;
    }

    if (justificativa.length < 15) {
      setErro(`Justificativa muito curta (${justificativa.length}/15 caracteres)`);
      return false;
    }

    if (justificativa.length > 255) {
      setErro(`Justificativa muito longa (${justificativa.length}/255 caracteres)`);
      return false;
    }

    // Verifica se tem pelo menos uma letra
    if (!/[a-zA-ZáéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(justificativa)) {
      setErro('Justificativa deve conter pelo menos uma letra');
      return false;
    }

    return true;
  };

  // =========================================================================
  // 🚀 HANDLER DO CANCELAMENTO
  // =========================================================================

  /**
   * Executa o cancelamento via API
   */
  const handleCancelar = async () => {
    // Reset dos estados
    setErro('');
    setSuccessMessage('');

    // Validação local
    if (!validarJustificativa()) {
      return; // Erro já foi setado
    }

    setLoading(true);

    try {
      // 🔔 Toast de carregamento
      const toastId = toast.loading('Cancelando NFC-e na SEFAZ...');

      // 📡 Chamada para a API
      const response = await api.post(
        `/api/fiscal/cancelar-nfce/${nota.id}`,
        { justificativa },
        { timeout: 30000 } // Timeout de 30 segundos
      );

      // Toast do carregamento termina
      toast.dismiss(toastId);

      // ✅ Processa resposta
      if (response.data.status === 'SUCESSO') {
        
        // Mensagem de sucesso
        const mensagem = response.data.mensagem;
        setSuccessMessage(mensagem);

        // Toast visual
        toast.success('✅ NFC-e cancelada com sucesso!', {
          duration: 5000,
          icon: <CheckCircle className="text-green-500" />
        });

        // Callback para atualizar lista de notas
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Fecha modal após 3 segundos
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);

      } else {
        
        // ❌ Erro retornado pela API
        const mensagemErro = response.data.mensagem || 'Erro desconhecido';
        setErro(mensagemErro);

        toast.error('❌ ' + mensagemErro, {
          duration: 5000,
          icon: <AlertCircle className="text-red-500" />
        });
      }

    } catch (error) {
      
      // 🔴 Erro de rede ou timeout
      let mensagem = 'Erro ao comunicar com o servidor';

      if (error.response?.data?.mensagem) {
        mensagem = error.response.data.mensagem;
      } else if (error.code === 'ECONNABORTED') {
        mensagem = 'Timeout - SEFAZ não respondeu em tempo';
      } else if (!navigator.onLine) {
        mensagem = 'Sem conexão com a internet';
      }

      setErro(mensagem);

      toast.error('❌ ' + mensagem, {
        duration: 5000,
        icon: <AlertTriangle className="text-red-500" />
      });

    } finally {
      setLoading(false);
    }
  };

  /**
   * Reseta o formulário
   */
  const resetForm = () => {
    setJustificativa('');
    setErro('');
    setSuccessMessage('');
  };

  /**
   * Fecha modal e reseta
   */
  const handleFechar = () => {
    resetForm();
    onClose();
  };

  // =========================================================================
  // 🎨 RENDER
  // =========================================================================

  if (!isOpen) return null;

  return (
    // 🎭 Overlay do modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 animate-scale-in">
        
        {/* ========== HEADER ========== */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Cancelar NFC-e
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Nº {nota.numero} • {nota.chaveAcesso}
            </p>
          </div>
          <button
            onClick={handleFechar}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Fechar modal"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* ========== ALERTA DE AÇÃO IRREVERSÍVEL ========== */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Esta ação é irreversível. O documento será cancelado na SEFAZ e
            não poderá ser recuperado.
          </p>
        </div>

        {/* ========== MENSAGEM DE SUCESSO ========== */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <p className="text-sm text-green-800">
              <CheckCircle size={16} className="inline mr-2" />
              {successMessage}
            </p>
          </div>
        )}

        {/* ========== CAMPO DE JUSTIFICATIVA ========== */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            Justificativa do Cancelamento *
            <span className="text-xs text-slate-500 font-normal ml-1">
              (Mínimo 15, máximo 255 caracteres)
            </span>
          </label>

          <textarea
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value);
              setErro(''); // Limpa erro ao digitar
            }}
            placeholder="Explique o motivo do cancelamento..."
            className={`
              w-full p-3 border-2 rounded-lg font-medium resize-none
              transition-colors focus:outline-none
              ${erro 
                ? 'border-red-400 bg-red-50 text-red-900' 
                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500'
              }
            `}
            rows={4}
            disabled={loading}
          />

          {/* ========== CONTADOR DE CARACTERES ========== */}
          <div className="flex justify-between items-center text-xs">
            <span
              className={`font-bold ${
                justificativa.length < 15
                  ? 'text-red-500'
                  : justificativa.length > 240
                  ? 'text-orange-500'
                  : 'text-green-500'
              }`}
            >
              {justificativa.length} / 255 caracteres
            </span>

            {justificativa.length >= 15 && (
              <span className="text-green-600 font-bold">✅ Válido</span>
            )}
          </div>
        </div>

        {/* ========== MENSAGEM DE ERRO ========== */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {erro}
            </p>
          </div>
        )}

        {/* ========== DETALHES DA NOTA ========== */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Número:</span>
            <span className="font-bold text-slate-900">{nota.numero}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Chave de Acesso:</span>
            <span className="font-mono text-xs text-slate-900 break-all">
              {nota.chaveAcesso}
            </span>
          </div>
          {nota.protocolo && (
            <div className="flex justify-between">
              <span className="text-slate-600">Protocolo:</span>
              <span className="font-mono text-xs text-slate-900">
                {nota.protocolo}
              </span>
            </div>
          )}
        </div>

        {/* ========== BOTÕES DE AÇÃO ========== */}
        <div className="flex gap-3 pt-4 border-t">
          
          <button
            onClick={handleFechar}
            disabled={loading}
            className={`
              flex-1 py-3 px-4 rounded-lg font-bold text-sm
              transition-all duration-200
              ${loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }
            `}
          >
            Voltar
          </button>

          <button
            onClick={handleCancelar}
            disabled={loading || justificativa.length < 15}
            className={`
              flex-1 py-3 px-4 rounded-lg font-bold text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              ${loading || justificativa.length < 15
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
              }
            `}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                Cancelar NFC-e
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// 📋 EXEMPLO DE USO
// ============================================================================

export function GerenciadorNotas() {
  
  const [notas, setNotas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);

  // Abre o modal de cancelamento
  const abrirModalCancelamento = (nota) => {
    if (nota.status !== 'AUTORIZADA') {
      toast.error('Apenas notas autorizadas podem ser canceladas');
      return;
    }

    setNotaSelecionada(nota);
    setModalAberto(true);
  };

  // Callback quando cancelamento sucede
  const handleCancelamentoBemSucedido = (resultado) => {
    // Atualiza a nota na lista
    setNotas(notas.map(n => 
      n.id === resultado.notaId 
        ? { ...n, status: 'CANCELADA' } 
        : n
    ));

    // Recarrega dados do servidor (opcional)
    // carregarNotas();
  };

  return (
    <div className="space-y-4">
      
      {/* 📋 Tabela de notas */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-3 text-left font-bold">Nº</th>
              <th className="p-3 text-left font-bold">Chave</th>
              <th className="p-3 text-left font-bold">Status</th>
              <th className="p-3 text-center font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {notas.map(nota => (
              <tr key={nota.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-bold">{nota.numero}</td>
                <td className="p-3 font-mono text-sm">{nota.chaveAcesso}</td>
                <td className="p-3">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${nota.status === 'AUTORIZADA' 
                      ? 'bg-green-100 text-green-700' 
                      : nota.status === 'CANCELADA'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }
                  `}>
                    {nota.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {nota.status === 'AUTORIZADA' && (
                    <button
                      onClick={() => abrirModalCancelamento(nota)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 
                                 rounded text-xs font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🎭 Modal de cancelamento */}
      <ModalCancelarNfce
        nota={notaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={handleCancelamentoBemSucedido}
      />

    </div>
  );
}

// ============================================================================
// 🎨 CSS CUSTOMIZADO (em arquivo separado ou em seu arquivo de styles)
// ============================================================================

/*
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
*/

