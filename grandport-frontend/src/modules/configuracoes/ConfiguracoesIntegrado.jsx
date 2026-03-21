/**
 * 📋 EXEMPLO DE INTEGRAÇÃO - Central de Layouts em Configurações
 * 
 * Este arquivo mostra como integrar a CentralDeLayouts
 * no seu componente de Configurações existente
 */

import React, { useState } from 'react';
import { Layout, Palette, Settings, Database, Bell } from 'lucide-react';
import CentralDeLayouts from './CentralDeLayouts';

/**
 * Componente principal de Configurações
 * Integra várias abas: Geral, Layouts, Banco de Dados, etc.
 */
export const Configuracoes = () => {
  const [abaSelecionada, setAbaSelecionada] = useState('geral');

  const ABAS = [
    {
      id: 'geral',
      nome: '⚙️ Geral',
      icone: Settings,
      componente: <ConfiguracoesGerais />
    },
    {
      id: 'layouts',
      nome: '🎨 Layouts',
      icone: Palette,
      componente: <CentralDeLayouts />
    },
    {
      id: 'banco',
      nome: '🗄️ Banco de Dados',
      icone: Database,
      componente: <ConfiguracoesBanco />
    },
    {
      id: 'notificacoes',
      nome: '🔔 Notificações',
      icone: Bell,
      componente: <ConfiguracoesNotificacoes />
    }
  ];

  const abaAtiva = ABAS.find(a => a.id === abaSelecionada);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Settings className="text-gray-900" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600 mt-2">Gerencie todas as configurações do sistema ERP</p>
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {ABAS.map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaSelecionada(aba.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition ${
                  abaSelecionada === aba.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <aba.icone size={20} />
                {aba.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo da Aba */}
        {abaAtiva && abaAtiva.componente}
      </div>
    </div>
  );
};

/**
 * Componente de Configurações Gerais (Placeholder)
 */
const ConfiguracoesGerais = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Configurações Gerais</h2>
    <p className="text-gray-600">Coloque aqui as configurações gerais da empresa</p>
  </div>
);

/**
 * Componente de Configurações de Banco (Placeholder)
 */
const ConfiguracoesBanco = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Banco de Dados</h2>
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="font-semibold text-gray-900">Backup</h3>
        <p className="text-sm text-gray-600 mt-2">Faça backup do seu banco de dados</p>
        <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Fazer Backup
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="font-semibold text-gray-900">Restaurar</h3>
        <p className="text-sm text-gray-600 mt-2">Restaure um backup anterior</p>
        <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Restaurar Backup
        </button>
      </div>
    </div>
  </div>
);

/**
 * Componente de Configurações de Notificações (Placeholder)
 */
const ConfiguracoesNotificacoes = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Notificações</h2>
    <p className="text-gray-600">Configure suas preferências de notificações</p>
  </div>
);

export default Configuracoes;

