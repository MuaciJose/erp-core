import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, MessageCircle, AlertTriangle, User, Car, PlusSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios'; // 🚀 AQUI IMPORTAMOS O SEU MOTOR DE CONEXÃO COM O JAVA

export const PainelRevisoes = () => {
    // Começamos com uma lista vazia, pois agora os dados virão do banco real!
    const [revisoes, setRevisoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    // =========================================================================
    // 🚀 CONEXÃO 1: BUSCANDO OS DADOS NO JAVA QUANDO A TELA ABRE
    // =========================================================================
    const carregarDadosDoJava = async () => {
        try {
            setCarregando(true);
            // ESSA É A LINHA QUE CONVERSA COM O SEU RevisaoController.java
            const resposta = await api.get('/api/revisoes');
            setRevisoes(resposta.data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar revisões no servidor.");
        } finally {
            setCarregando(false);
        }
    };

    // O useEffect faz o React rodar a função acima automaticamente assim que você entra na tela
    useEffect(() => {
        carregarDadosDoJava();
    }, []);

    // =========================================================================
    // 🚀 CONEXÃO 2: MANDANDO O JAVA ATUALIZAR O STATUS NO BANCO
    // =========================================================================
    const atualizarStatusNoJava = async (id, novoStatus) => {
        const toastId = toast.loading("Atualizando status...");
        try {
            // ESSA É A LINHA QUE ORDENA O JAVA A SALVAR NO BANCO
            await api.put(`/api/revisoes/${id}/status`, { status: novoStatus });

            // Se o Java confirmou que salvou, a gente atualiza a tela na mesma hora
            setRevisoes(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));

            if (novoStatus === 'CONCLUIDO') {
                toast.success("Revisão concluída com sucesso!", { id: toastId });
                // Remove o concluído da tela, pois a nossa API só lista os "ativos"
                setRevisoes(prev => prev.filter(r => r.id !== id));
            } else {
                toast.success(`Status alterado para ${novoStatus}`, { id: toastId });
            }
        } catch (error) {
            toast.error("Falha ao atualizar no banco de dados.", { id: toastId });
        }
    };

    const chamarNoWhatsapp = (rev) => {
        const mensagem = `Olá, ${rev.clienteNome}! Tudo bem? Aqui é da [Sua Oficina]. Vimos no nosso sistema que está na hora de realizar a ${rev.servico} do seu ${rev.veiculoDescricao} (Placa: ${rev.veiculoPlaca}). Podemos agendar um horário para você não ter problemas com o carro?`;

        // Formata o número tirando espaços e traços
        const telefoneLimpo = rev.clienteTelefone ? rev.clienteTelefone.replace(/\D/g, '') : '';

        if (!telefoneLimpo) {
            return toast.error("Cliente não possui telefone cadastrado!");
        }

        const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');

        // Já atualiza o status no banco pra CONTATADO automaticamente
        atualizarStatusNoJava(rev.id, 'CONTATADO');
    };

    const enviarParaAgenda = async (rev) => {
        const toastId = toast.loading("Criando compromisso na agenda...");
        try {
            await api.post(`/api/agenda/origens/revisao/${rev.id}`);
            toast.success("Compromisso enviado para a agenda corporativa.", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Falha ao criar compromisso na agenda.", { id: toastId });
        }
    };

    const formatarData = (dataString) => {
        if (!dataString) return '--/--/----';
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    // =========================================================================
    // 🧠 O CÉREBRO DA TELA: Distribuindo os cartões nas colunas certas
    // =========================================================================
    const categorizarRevisao = (rev) => {
        // Se já ligou para o cliente, vai direto pra coluna de CONTATADOS
        if (rev.status === 'CONTATADO') return 'CONTATADO';

        // Pega a data de hoje (meia-noite, para comparar apenas os dias)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Converte a data que veio do Java (YYYY-MM-DD) para comparar
        if (!rev.dataPrevista) return 'PROXIMOS'; // Prevenção de erro
        const [ano, mes, dia] = rev.dataPrevista.split('-');
        const dataRev = new Date(ano, mes - 1, dia);
        dataRev.setHours(0, 0, 0, 0);

        if (dataRev < hoje) return 'ATRASADO';
        if (dataRev.getTime() === hoje.getTime()) return 'HOJE';
        return 'PROXIMOS';
    };

    // Separando os dados para as colunas
    const atrasados = revisoes.filter(r => categorizarRevisao(r) === 'ATRASADO');
    const urgentes = revisoes.filter(r => categorizarRevisao(r) === 'HOJE');
    const proximos = revisoes.filter(r => categorizarRevisao(r) === 'PROXIMOS');
    const contatados = revisoes.filter(r => categorizarRevisao(r) === 'CONTATADO');

    const CardRevisao = ({ rev, corBorda, corFundo, icone }) => (
        <div className={`bg-white p-5 rounded-2xl border-l-4 ${corBorda} shadow-sm hover:shadow-md transition-shadow mb-4 group`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${corFundo}`}>
                    {icone}
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data Prevista</span>
                    <span className="text-sm font-bold text-slate-700">{formatarData(rev.dataPrevista)}</span>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2"><User size={16} className="text-slate-400"/> {rev.clienteNome}</h4>
                <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1"><Car size={14} className="text-blue-500"/> {rev.veiculoDescricao} <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">{rev.veiculoPlaca}</span></p>
                <p className="text-sm text-slate-600 mt-3 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">{rev.servico}</p>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                    onClick={() => chamarNoWhatsapp(rev)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors"
                >
                    <MessageCircle size={16} /> WHATSAPP
                </button>
                <button
                    onClick={() => enviarParaAgenda(rev)}
                    title="Criar compromisso na agenda corporativa"
                    className="p-2 bg-blue-100 hover:bg-blue-500 hover:text-white text-blue-600 rounded-xl transition-colors shrink-0"
                >
                    <PlusSquare size={18} />
                </button>
                <button
                    onClick={() => atualizarStatusNoJava(rev.id, 'CONCLUIDO')}
                    title="O cliente veio! Marcar como Concluído"
                    className="p-2 bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-500 rounded-xl transition-colors shrink-0"
                >
                    <CheckCircle size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in h-[calc(100vh-100px)] flex flex-col">

            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Calendar size={28} /></div>
                        CRM de Revisões
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Acompanhe os clientes que precisam retornar à oficina e gere novas vendas.</p>
                </div>

                <button onClick={carregarDadosDoJava} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 shadow-sm">
                    Atualizar Tela
                </button>
            </div>

            {carregando ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest">Buscando dados no servidor...</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden">

                    {/* COLUNA 1: ATRASADOS */}
                    <div className="bg-slate-100/50 rounded-3xl p-4 flex flex-col overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                            <h3 className="font-black text-red-600 flex items-center gap-2"><AlertTriangle size={18}/> Atrasados</h3>
                            <span className="bg-red-200 text-red-800 text-xs font-black px-2 py-1 rounded-full">{atrasados.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                            {atrasados.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 font-medium">Nenhum atraso!</p>}
                            {atrasados.map(rev => <CardRevisao key={rev.id} rev={rev} corBorda="border-red-500" corFundo="bg-red-100 text-red-600" icone={<AlertTriangle size={20}/>} />)}
                        </div>
                    </div>

                    {/* COLUNA 2: HOJE / URGENTE */}
                    <div className="bg-slate-100/50 rounded-3xl p-4 flex flex-col overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                            <h3 className="font-black text-orange-600 flex items-center gap-2"><Clock size={18}/> Ligar Hoje</h3>
                            <span className="bg-orange-200 text-orange-800 text-xs font-black px-2 py-1 rounded-full">{urgentes.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                            {urgentes.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 font-medium">Tudo limpo hoje!</p>}
                            {urgentes.map(rev => <CardRevisao key={rev.id} rev={rev} corBorda="border-orange-500" corFundo="bg-orange-100 text-orange-600" icone={<Clock size={20}/>} />)}
                        </div>
                    </div>

                    {/* COLUNA 3: PRÓXIMOS */}
                    <div className="bg-slate-100/50 rounded-3xl p-4 flex flex-col overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                            <h3 className="font-black text-blue-600 flex items-center gap-2"><Calendar size={18}/> Próximos</h3>
                            <span className="bg-blue-200 text-blue-800 text-xs font-black px-2 py-1 rounded-full">{proximos.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                            {proximos.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 font-medium">Agenda vazia.</p>}
                            {proximos.map(rev => <CardRevisao key={rev.id} rev={rev} corBorda="border-blue-500" corFundo="bg-blue-100 text-blue-600" icone={<Calendar size={20}/>} />)}
                        </div>
                    </div>

                    {/* COLUNA 4: CONTATADOS AGUARDANDO */}
                    <div className="bg-slate-100/50 rounded-3xl p-4 flex flex-col overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                            <h3 className="font-black text-emerald-600 flex items-center gap-2"><CheckCircle size={18}/> Já Contatados</h3>
                            <span className="bg-emerald-200 text-emerald-800 text-xs font-black px-2 py-1 rounded-full">{contatados.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                            {contatados.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 font-medium">Ninguém contatado ainda.</p>}
                            {contatados.map(rev => <CardRevisao key={rev.id} rev={rev} corBorda="border-emerald-500" corFundo="bg-emerald-100 text-emerald-600" icone={<CheckCircle size={20}/>} />)}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
