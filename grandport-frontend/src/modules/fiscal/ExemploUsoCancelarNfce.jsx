/**
 * 📋 EXEMPLO: Como usar ModalCancelarNfce em seus componentes
 * 
 * Este arquivo mostra 3 maneiras de usar o componente
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ModalCancelarNfce } from '@/modules/fiscal';

/**
 * ✅ EXEMPLO 1: Uso Simples (Recomendado)
 * 
 * Copie este exemplo para seu componente
 */
export function GerenciadorNotasSimples() {
  
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [notas, setNotas] = useState([
    {
      id: 1,
      numero: '1234',
      chaveAcesso: '35230101234567890123456789012345678901234567',
      protocolo: 'SRE123456789012345',
      status: 'AUTORIZADA'
    }
  ]);

  // Abre o modal para cancelar uma nota
  const abrirModalCancelamento = (nota) => {
    if (nota.status !== 'AUTORIZADA') {
      toast.error('Apenas notas autorizadas podem ser canceladas');
      return;
    }
    setNotaSelecionada(nota);
    setModalAberto(true);
  };

  // Callback quando o cancelamento funciona
  const handleCancelamentoBemSucedido = (resultado) => {
    console.log('Cancelamento bem-sucedido:', resultado);
    
    // Atualiza a nota na lista
    setNotas(notas.map(n => 
      n.id === resultado.notaId 
        ? { ...n, status: 'CANCELADA' } 
        : n
    ));
  };

  return (
    <div className="space-y-4 p-4">
      
      <h1 className="text-2xl font-bold">Notas Fiscais</h1>

      {/* 📋 Tabela de notas */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
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
                <td className="p-3 font-mono text-sm">
                  {nota.chaveAcesso.substring(0, 20)}...
                </td>
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

/**
 * ✅ EXEMPLO 2: Usar em um Componente Existente
 * 
 * Se você já tem um gerenciador de notas, apenas adicione:
 */
export function AdicionarModalAComponenteExistente() {
  
  // ... seu código existente ...

  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);

  // Seu método de cancelar nota
  const cancelarNota = (nota) => {
    setNotaSelecionada(nota);
    setModalAberto(true);
  };

  const handleCancelamentoBemSucedido = (resultado) => {
    // Sua lógica de sucesso
    console.log('Nota cancelada:', resultado);
    
    // Recarregar lista de notas, atualizar estado, etc
  };

  return (
    <div>
      {/* Seu conteúdo existente */}
      
      {/* Adicione o modal aqui */}
      <ModalCancelarNfce
        nota={notaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={handleCancelamentoBemSucedido}
      />
    </div>
  );
}

/**
 * ✅ EXEMPLO 3: Com Endpoint Customizado
 * 
 * Se seu endpoint é diferente, passe como prop
 */
export function ComEndpointCustomizado() {
  
  const [modalAberto, setModalAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);

  return (
    <ModalCancelarNfce
      nota={notaSelecionada}
      isOpen={modalAberto}
      onClose={() => setModalAberto(false)}
      onSuccess={(resultado) => console.log('Sucesso:', resultado)}
      apiEndpoint="/api/nfce/cancelar" // Seu endpoint customizado
    />
  );
}

