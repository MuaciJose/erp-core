import React, { useState } from 'react';
import {
    BookOpen, LayoutDashboard, Package, ShoppingCart,
    Keyboard, Info, ArrowLeft, Terminal, Printer, Smartphone, HelpCircle,
    FileText // 🚀 O ícone que estava faltando e causando a tela branca!
} from 'lucide-react';

export const ManualUsuario = ({ onVoltar }) => {
    const [secaoAtiva, setSecaoAtiva] = useState('introducao');

    const menu = [
        { id: 'introducao', icone: <BookOpen size={18} />, titulo: 'Introdução' },
        { id: 'dashboard', icone: <LayoutDashboard size={18} />, titulo: '1. Dashboard' },
        { id: 'estoque', icone: <Package size={18} />, titulo: '2. Gestão de Peças' },
        { id: 'pdv', icone: <ShoppingCart size={18} />, titulo: '3. Frente de Caixa (PDV)' },
        { id: 'atalhos', icone: <Keyboard size={18} />, titulo: '4. Guia de Atalhos' },
    ];

    // Componente visual para as "Teclas"
    const Tecla = ({ children }) => (
        <kbd className="bg-white border border-slate-300 border-b-2 text-slate-700 px-2 py-1 rounded-lg text-xs font-black shadow-sm font-mono mx-1">
            {children}
        </kbd>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in flex flex-col h-full min-h-screen bg-gray-50/50">

            {onVoltar && (
                <div className="mb-6">
                    <button
                        onClick={onVoltar}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold transition-colors w-max"
                    >
                        <ArrowLeft size={18} /> Voltar para o Sistema
                    </button>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col md:flex-row">

                {/* MENU LATERAL */}
                <div className="w-full md:w-80 bg-slate-900 p-6 flex flex-col">
                    <div className="mb-8 mt-2 px-2 text-white">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                            <HelpCircle size={24} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Central de Ajuda</h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">Manual de Operação STM Sistemas</p>
                    </div>

                    <div className="space-y-2 flex-1">
                        {menu.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSecaoAtiva(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors ${
                                    secaoAtiva === item.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {item.icone} {item.titulo}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-slate-500 text-xs font-bold text-center">
                        <p>Versão 1.0.0</p>
                        <p>Desde Fevereiro, 2026</p>
                    </div>
                </div>

                {/* ÁREA DE CONTEÚDO */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[85vh] custom-scrollbar bg-white">

                    {secaoAtiva === 'introducao' && (
                        <div className="animate-fade-in max-w-3xl">
                            <h3 className="text-3xl font-black text-slate-800 mb-4">Bem-vindo ao seu ERP! 🚀</h3>
                            <p className="text-slate-600 leading-relaxed text-lg mb-6">
                                Este sistema foi desenhado do zero para a realidade de uma Auto Peças moderna. Nosso maior objetivo é <strong>eliminar cliques desnecessários</strong> e garantir extrema velocidade no atendimento de balcão.
                            </p>
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-2xl">
                                <h4 className="font-black text-blue-800 flex items-center gap-2 mb-2">
                                    <Info size={20} /> Como usar este manual?
                                </h4>
                                <p className="text-blue-700/80 font-medium">
                                    Navegue pelo menu lateral para entender o funcionamento de cada tela. Recomendamos fortemente a leitura da aba <strong>"Guia de Atalhos"</strong> para todos os vendedores e caixas.
                                </p>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'dashboard' && (
                        <div className="animate-fade-in max-w-3xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3"><LayoutDashboard className="text-blue-600" /> Visão do Negócio</h3>
                            <p>O painel de controle é a central de inteligência da sua loja. Ele é atualizado em tempo real.</p>

                            <ul className="space-y-4 mt-6">
                                <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <strong className="text-slate-800 block mb-1">Indicadores (KPIs)</strong>
                                    Mostra instantaneamente a Receita Mensal, Contas em Atraso, Pedidos do Dia e Peças em Falta. Você pode clicar nos cards vermelhos ou laranjas para ir direto para as telas de resolução.
                                </li>
                                <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <strong className="text-slate-800 block mb-1">Top Performance & Logs</strong>
                                    Acompanhe o ranking dos produtos mais vendidos (Curva A). O painel de Log avisará automaticamente sobre contas vencidas ou peças precisando de reposição.
                                </li>
                                <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <strong className="text-slate-800 block mb-1">Impressão Rápida</strong>
                                    Na aba de Relatórios, clique no botão "Imprimir" para gerar um espelho A4 da saúde da sua empresa, pronto para a contabilidade.
                                </li>
                            </ul>
                        </div>
                    )}

                    {secaoAtiva === 'estoque' && (
                        <div className="animate-fade-in max-w-3xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3"><Package className="text-blue-600" /> Gestão de Peças</h3>
                            <p>O coração da sua loja. Um cadastro unificado que alimenta o PDV e as Notas Fiscais.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="border-2 border-slate-100 p-5 rounded-2xl">
                                    <h4 className="font-black text-slate-800 mb-2">Busca & Fotos</h4>
                                    <p className="text-sm">Use a barra de pesquisa para achar peças por Nome, Código, EAN ou Referência Original.</p>
                                    <p className="text-sm mt-2 text-blue-600 font-bold bg-blue-50 p-2 rounded-lg">Dica: Passe o mouse sobre a miniatura da foto na lista para dar Zoom imediato sem precisar abrir o cadastro!</p>
                                </div>
                                <div className="border-2 border-slate-100 p-5 rounded-2xl">
                                    <h4 className="font-black text-slate-800 mb-2">Precificação Automática</h4>
                                    <p className="text-sm">Digite o Preço de Custo e a Margem (%), e o sistema calcula o Preço de Venda sozinho. Defina também um "Preço Mínimo" para travar descontos no balcão.</p>
                                </div>
                                <div className="border-2 border-slate-100 p-5 rounded-2xl">
                                    <h4 className="font-black text-slate-800 mb-2">Dados Fiscais (NCM)</h4>
                                    <p className="text-sm">O campo NCM tem pesquisa inteligente. Se uma peça não tiver NCM, o sistema bloqueará a emissão da NF-e para evitar multas.</p>
                                </div>
                                <div className="border-2 border-slate-100 p-5 rounded-2xl">
                                    <h4 className="font-black text-slate-800 mb-2">Extrato de Movimentação</h4>
                                    <p className="text-sm">Clique no ícone de "Relógio" ao lado de qualquer peça na lista para ver o histórico completo de entradas, saídas e ajustes manuais.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'pdv' && (
                        <div className="animate-fade-in max-w-3xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3"><ShoppingCart className="text-blue-600" /> Frente de Caixa</h3>
                            <p>Desenhada para vendas ultrarrápidas, você pode operar esta tela 100% pelo teclado.</p>

                            <ul className="space-y-4 mt-6">
                                <li className="flex gap-4 items-start">
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mt-1"><Terminal size={20}/></div>
                                    <div>
                                        <strong className="text-slate-800 block">Pesquisa Eficiente</strong>
                                        Pressione <Tecla>F3</Tecla> para focar na busca de peças. Ao achar a peça, se ela tiver foto, passe o mouse em cima para confirmar visualmente antes de dar Enter.
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg mt-1"><FileText size={20}/></div>
                                    <div>
                                        <strong className="text-slate-800 block">Emissão e Cancelamento de NF-e</strong>
                                        A emissão requer Cliente com CPF/CNPJ. Após gerar, você pode imprimir o DANFE, baixar o XML ou Cancelar. <strong>Atenção:</strong> A SEFAZ exige justificativa de no mínimo 15 caracteres para cancelamentos.
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-lg mt-1"><Smartphone size={20}/></div>
                                    <div>
                                        <strong className="text-slate-800 block">Integração WhatsApp</strong>
                                        O sistema está ligado ao motor do WhatsApp. Você pode enviar orçamentos em PDF direto para o cliente com um clique ou pressionando <Tecla>F11</Tecla>.
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="bg-red-100 text-red-600 p-2 rounded-lg mt-1"><BookOpen size={20}/></div>
                                    <div>
                                        <strong className="text-slate-800 block">Vendas Perdidas</strong>
                                        Se o cliente achar caro ou faltar estoque, pressione <Tecla>F7</Tecla> e registre o motivo. Isso ajuda a diretoria a ajustar preços e comprar melhor.
                                    </div>
                                </li>
                            </ul>
                        </div>
                    )}

                    {secaoAtiva === 'atalhos' && (
                        <div className="animate-fade-in max-w-3xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3"><Keyboard className="text-blue-600" /> Guia de Atalhos (PDV)</h3>
                            <p>Decore estes atalhos para se tornar um mestre na frente de caixa.</p>

                            <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden mt-6">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-200/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                    <tr><th className="p-4">Atalho</th><th className="p-4">Ação / Funcionalidade</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F2</Tecla></td><td className="p-4 font-medium text-slate-700">Focar no campo de Busca de <strong>Cliente</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F3</Tecla></td><td className="p-4 font-medium text-slate-700">Focar no campo de Busca de <strong>Peças</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F4</Tecla></td><td className="p-4 font-medium text-slate-700">Focar no campo de <strong>Desconto</strong> (Alterna entre R$ e %).</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F5</Tecla></td><td className="p-4 font-medium text-slate-700">Atualizar Estoque (Força a sincronização com o servidor).</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F6</Tecla></td><td className="p-4 font-medium text-slate-700">Abrir janela de <strong>Orçamentos Salvos</strong> (Pendentes).</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F7</Tecla></td><td className="p-4 font-medium text-slate-700 text-red-600">Registrar Venda Perdida.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F8</Tecla></td><td className="p-4 font-medium text-slate-700">Salvar Rascunho / Orçamento.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F9</Tecla></td><td className="p-4 font-medium text-slate-700 text-orange-600">Converter Orçamento em <strong>Pedido</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>Ctrl</Tecla> + <Tecla>F9</Tecla></td><td className="p-4 font-medium text-slate-700 text-emerald-600">Finalizar venda e Enviar pro <strong>Caixa</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F10</Tecla></td><td className="p-4 font-medium text-slate-700 text-purple-600">Emitir <strong>Nota Fiscal Eletrônica (NF-e)</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>F11</Tecla></td><td className="p-4 font-medium text-slate-700 text-green-600">Disparar PDF pelo <strong>WhatsApp</strong>.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>Ctrl</Tecla> + <Tecla>P</Tecla></td><td className="p-4 font-medium text-slate-700">Impressão rápida via Iframe (Bobina/A4).</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>Alt</Tecla> + <Tecla>L</Tecla></td><td className="p-4 font-medium text-slate-700">Limpar a tela para novo atendimento.</td></tr>
                                    <tr className="hover:bg-white"><td className="p-4"><Tecla>Esc</Tecla></td><td className="p-4 font-medium text-slate-700">Fechar modais / Voltar tela anterior.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};