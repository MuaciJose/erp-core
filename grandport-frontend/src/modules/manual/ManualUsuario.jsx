import React, { useState } from 'react';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    FileText,
    HelpCircle,
    Keyboard,
    LayoutDashboard,
    Package,
    Printer,
    ShoppingCart,
    Smartphone,
    Wrench
} from 'lucide-react';

export const ManualUsuario = ({ onVoltar }) => {
    const [secaoAtiva, setSecaoAtiva] = useState('introducao');

    const menu = [
        { id: 'introducao', icone: <BookOpen size={18} />, titulo: 'Introdução' },
        { id: 'dashboard', icone: <LayoutDashboard size={18} />, titulo: '1. Dashboard' },
        { id: 'agenda', icone: <Calendar size={18} />, titulo: '2. Agenda Corporativa' },
        { id: 'vendas', icone: <ShoppingCart size={18} />, titulo: '3. Vendas e Caixa' },
        { id: 'estoque', icone: <Package size={18} />, titulo: '4. Estoque e Catálogo' },
        { id: 'oficina', icone: <Wrench size={18} />, titulo: '5. Oficina e Recepção' },
        { id: 'impressao', icone: <Printer size={18} />, titulo: '6. Impressão e Layouts' },
        { id: 'mobile', icone: <Smartphone size={18} />, titulo: '7. Aplicativo Mobile' },
        { id: 'atalhos', icone: <Keyboard size={18} />, titulo: '8. Atalhos do Balcão' }
    ];

    const Tecla = ({ children }) => (
        <kbd className="bg-white border border-slate-300 border-b-2 text-slate-700 px-2 py-1 rounded-lg text-xs font-black shadow-sm font-mono mx-1">
            {children}
        </kbd>
    );

    const Card = ({ title, children }) => (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <strong className="text-slate-800 block mb-2">{title}</strong>
            <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
        </div>
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
                <div className="w-full md:w-80 bg-slate-900 p-6 flex flex-col">
                    <div className="mb-8 mt-2 px-2 text-white">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                            <HelpCircle size={24} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Central de Ajuda</h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">Manual operacional do GrandPort ERP</p>
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
                        <p>Versão funcional de março de 2026</p>
                        <p>ERP web + app mobile operacional</p>
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[85vh] custom-scrollbar bg-white">
                    {secaoAtiva === 'introducao' && (
                        <div className="animate-fade-in max-w-4xl space-y-6">
                            <h3 className="text-3xl font-black text-slate-800">Bem-vindo ao GrandPort ERP</h3>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                O sistema foi construído para operação automotiva de verdade: balcão, oficina, estoque, financeiro, fiscal, impressão e operação mobile. A melhor forma de usar o ERP é tratar cada área como um fluxo: atendimento, execução, recebimento e controle.
                            </p>

                            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-2xl">
                                <h4 className="font-black text-blue-800 flex items-center gap-2 mb-2">
                                    <HelpCircle size={20} /> Como usar este manual
                                </h4>
                                <p className="text-blue-700/80 font-medium">
                                    Use o menu lateral para navegar por área. Para operação de balcão, leia primeiro <strong>Vendas e Caixa</strong> e <strong>Atalhos do Balcão</strong>. Para parametrização, leia <strong>Impressão e Layouts</strong>. Para equipe de rua, leia <strong>Aplicativo Mobile</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card title="Fluxo Comercial">
                                    Orçamento, pedido, caixa, impressão de comprovante e envio por WhatsApp.
                                </Card>
                                <Card title="Fluxo Operacional">
                                    Recepção do veículo, checklist, OS, peças, serviços e andamento da oficina.
                                </Card>
                                <Card title="Fluxo Administrativo">
                                    Financeiro, fiscal, relatórios, layouts oficiais e configurações de empresa.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'dashboard' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <LayoutDashboard className="text-blue-600" /> Dashboard
                            </h3>
                            <p>O dashboard é a leitura executiva da operação. Ele centraliza indicadores, alertas, radar comercial, pendências financeiras e sinais de oficina.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="KPIs e alertas">
                                    Use os cards para acompanhar receita, contas em atraso, pedidos do dia, itens críticos e gargalos. Quando houver indicador de risco, trate como fila de ação, não como painel decorativo.
                                </Card>
                                <Card title="Agenda do Dia">
                                    O dashboard agora mostra compromissos de hoje. Você pode abrir a agenda já filtrada, ver atrasados ou iniciar um novo compromisso sem sair do painel principal.
                                </Card>
                                <Card title="Aviso no topo do ERP">
                                    Quando existirem compromissos atrasados, o sistema exibe um aviso operacional no topo da aplicação com atalho direto para a fila de atrasos.
                                </Card>
                                <Card title="Relatórios">
                                    A aba de relatórios permite imprimir resumos gerenciais e apoiar reuniões, fechamento de mês e prestação de contas.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'agenda' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Calendar className="text-blue-600" /> Agenda Corporativa
                            </h3>
                            <p>A agenda corporativa centraliza compromissos comerciais, de recepção, oficina e financeiro. Ela também recebe ações automáticas vindas de revisão, venda e ordem de serviço.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Criação rápida">
                                    Você pode abrir um novo compromisso pelo dashboard ou gerar automaticamente a partir de Revisões, Central de Vendas e OS.
                                </Card>
                                <Card title="Filtros prontos">
                                    Use os atalhos <strong>Hoje</strong>, <strong>Atrasados</strong> e <strong>Próximos 7 dias</strong> para tratar a agenda como fila operacional.
                                </Card>
                                <Card title="Edição e exclusão">
                                    Cada compromisso pode ser <strong>editado</strong>, <strong>confirmado</strong>, <strong>concluído</strong> ou <strong>excluído</strong> direto na listagem.
                                </Card>
                                <Card title="WhatsApp e responsável">
                                    Quando houver telefone no cadastro do cliente, o compromisso pode disparar confirmação via WhatsApp, inclusive no app mobile.
                                </Card>
                                <Card title="Origem por cliente">
                                    Na tela de parceiros, use o botão <strong>Agendar</strong> para abrir a agenda já com o cliente preenchido e um compromisso-base pronto para edição.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'vendas' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <ShoppingCart className="text-blue-600" /> Vendas e Caixa
                            </h3>
                            <p>O módulo de vendas foi dividido em quatro frentes: gestão comercial, orçamento/pedido, PDV e fila de caixa.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Central de Vendas">
                                    Use para consultar documentos, buscar por cliente, veículo ou número, abrir o espelho e reabrir orçamentos e pedidos quando o status permitir.
                                </Card>
                                <Card title="Orçamento / Pedido">
                                    Monte o documento, vincule cliente e veículo, adicione peças, registre desconto e observações. O documento pode ser salvo como orçamento ou convertido em pedido para seguir ao caixa.
                                </Card>
                                <Card title="PDV">
                                    O PDV é a frente de atendimento rápido. Ele aceita operação majoritária por teclado, dispara impressão, integra WhatsApp e prepara a venda para emissão e recebimento.
                                </Card>
                                <Card title="Fila de Caixa">
                                    Exibe pedidos aguardando pagamento. O caixa seleciona o documento, lança formas de pagamento, conclui a venda e imprime comprovante quando necessário.
                                </Card>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                                <strong className="text-emerald-800 block mb-2">Boas práticas de operação</strong>
                                <p className="text-emerald-700 text-sm font-medium">
                                    Orçamento serve para negociação. Pedido serve para compromisso comercial. Caixa serve para recebimento. Não misture os três momentos para não perder rastreabilidade.
                                </p>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'estoque' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Package className="text-blue-600" /> Estoque e Catálogo
                            </h3>
                            <p>O cadastro de peças alimenta vendas, compras, recebimento, inventário e fiscal.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Cadastro de Produto">
                                    Preencha descrição, SKU, EAN, referência original, marca, NCM, custos, preço de venda, estoque mínimo, localização e foto.
                                </Card>
                                <Card title="Inventário e conferência">
                                    O sistema possui fluxo web e fluxo mobile para scan, conferência de saldo e ajuste. Use sempre um motivo operacional claro nos ajustes.
                                </Card>
                                <Card title="Recebimento de mercadoria">
                                    No mobile, a entrada funciona por conferência cega: bipar a peça, montar o lote e confirmar o saldo final.
                                </Card>
                                <Card title="Busca">
                                    Pesquise por nome, SKU, EAN, referência e aplicação. Essa consistência é o que dá velocidade ao balcão e evita erro fiscal.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'oficina' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Wrench className="text-blue-600" /> Oficina e Recepção
                            </h3>
                            <p>A área de oficina conecta recepção do veículo, checklist, laudo, OS e acompanhamento da execução.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Recepção">
                                    Registre veículo, KM, combustível, avarias, fotos e assinatura. Esse registro protege a oficina e reduz conflito na entrega.
                                </Card>
                                <Card title="Checklist / Laudo">
                                    O laudo de vistoria usa template governado e pode ser padronizado pela central de impressão.
                                </Card>
                                <Card title="OS">
                                    A ordem de serviço consolida cliente, veículo, peças, serviços, observações e totais. Use o painel de OS para acompanhar o andamento.
                                </Card>
                                <Card title="Pátio e execução">
                                    O painel de OS deve ser usado como fila de produção: prioridade, gargalo, veículo parado e entrega.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'impressao' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Printer className="text-blue-600" /> Impressão e Layouts
                            </h3>
                            <p>O ERP possui governança de impressão para layouts HTML, laudo de vistoria e DANFE. O padrão correto de uso é: editar, salvar draft, publicar e validar preview.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Central de Layouts">
                                    Controla modelos HTML de OS, vendas, recibos, extratos e documentos similares. A biblioteca premium pode ser usada como base inicial.
                                </Card>
                                <Card title="Central de Laudos">
                                    Gerencia o template JRXML do laudo de vistoria, com preview, histórico, diff e rollback.
                                </Card>
                                <Card title="Central DANFE">
                                    Controla o template JRXML do DANFE com os mesmos recursos de biblioteca, preview e versionamento.
                                </Card>
                                <Card title="Regra operacional">
                                    Salvar cria draft. Publicar coloca o modelo em produção. Se o documento não refletir a alteração, confirme se o template foi realmente publicado.
                                </Card>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                                <strong className="text-amber-800 block mb-2">Atenção</strong>
                                <p className="text-amber-700 text-sm font-medium">
                                    Para a máquina de impressão funcionar corretamente em todos os ambientes, o banco precisa estar alinhado com as migrations de layout e versionamento.
                                </p>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'mobile' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Smartphone className="text-blue-600" /> Aplicativo Mobile
                            </h3>
                            <p>O projeto possui um app mobile próprio em React Native/Expo. Ele não é uma cópia do ERP web; é uma operação móvel para recepção, estoque, vendas e cadastro rápido.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card title="Home Mobile">
                                    Centraliza atalhos de operação e leitura rápida por papel do usuário.
                                </Card>
                                <Card title="Checklist Mobile">
                                    Fluxo de recepção em etapas: veículo, dados, avarias, fotos e assinatura.
                                </Card>
                                <Card title="Inventário Mobile">
                                    Consulta, conferência, scan e ajuste rápido de estoque no pátio ou depósito.
                                </Card>
                                <Card title="Balcão Mobile">
                                    Permite orçamento/pedido, parceiros, recebimento de mercadoria e cadastro rápido de produto no telefone.
                                </Card>
                            </div>
                        </div>
                    )}

                    {secaoAtiva === 'atalhos' && (
                        <div className="animate-fade-in max-w-4xl space-y-6 text-slate-600 leading-relaxed">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <Keyboard className="text-blue-600" /> Atalhos do Balcão
                            </h3>
                            <p>Esses atalhos aceleram o atendimento no balcão e reduzem dependência de mouse.</p>

                            <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden mt-6">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-200/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="p-4">Atalho</th>
                                            <th className="p-4">Uso principal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        <tr><td className="p-4"><Tecla>F2</Tecla></td><td className="p-4 font-medium text-slate-700">Foco no cliente.</td></tr>
                                        <tr><td className="p-4"><Tecla>F3</Tecla></td><td className="p-4 font-medium text-slate-700">Foco na busca de peças.</td></tr>
                                        <tr><td className="p-4"><Tecla>F4</Tecla></td><td className="p-4 font-medium text-slate-700">Campo de desconto.</td></tr>
                                        <tr><td className="p-4"><Tecla>F8</Tecla></td><td className="p-4 font-medium text-slate-700">Salvar orçamento / draft comercial.</td></tr>
                                        <tr><td className="p-4"><Tecla>F9</Tecla></td><td className="p-4 font-medium text-slate-700">Converter para pedido.</td></tr>
                                        <tr><td className="p-4"><Tecla>Ctrl</Tecla> + <Tecla>F9</Tecla></td><td className="p-4 font-medium text-slate-700">Enviar para o caixa.</td></tr>
                                        <tr><td className="p-4"><Tecla>F10</Tecla></td><td className="p-4 font-medium text-slate-700">Fluxo fiscal / emissão quando habilitado.</td></tr>
                                        <tr><td className="p-4"><Tecla>F11</Tecla></td><td className="p-4 font-medium text-slate-700">Disparo por WhatsApp.</td></tr>
                                        <tr><td className="p-4"><Tecla>Ctrl</Tecla> + <Tecla>P</Tecla></td><td className="p-4 font-medium text-slate-700">Impressão rápida.</td></tr>
                                        <tr><td className="p-4"><Tecla>Esc</Tecla></td><td className="p-4 font-medium text-slate-700">Fechar modal ou voltar.</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
                                <strong className="text-blue-800 block mb-2">Operação recomendada</strong>
                                <p className="text-blue-700 text-sm font-medium">
                                    Cliente, peça, desconto e fechamento devem seguir sempre a mesma ordem. Isso aumenta velocidade, reduz erro e melhora a curva de aprendizado da equipe.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400">
                        Manual atualizado com base no backend atual, frontend web e app mobile do projeto.
                    </div>
                </div>
            </div>
        </div>
    );
};
