import React, { useState } from 'react';
import api from '../../api/axios';
import { 
    UploadCloud, 
    CheckCircle, 
    AlertCircle, 
    Link as LinkIcon, 
    Landmark,
    Check
} from 'lucide-react';

export const ConciliacaoBancaria = () => {
    const [arquivo, setArquivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [conciliacao, setConciliacao] = useState(null);

    const handleUpload = async () => {
        if (!arquivo) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            const res = await api.post('/api/financeiro/conciliacao/importar-ofx', formData);
            setConciliacao(res.data);
        } catch (err) {
            alert("Erro ao processar o arquivo OFX.");
        } finally {
            setLoading(false);
        }
    };

    const confirmarConciliacao = async (txn) => {
        try {
            // Aqui chamamos a API para liquidar a conta sugerida
            await api.patch(`/api/financeiro/contas-a-pagar/${txn.sugestaoSistema.id}/baixar`);
            
            // Atualiza visualmente
            const novasTransacoes = conciliacao.transacoes.map(t => 
                t.idBanco === txn.idBanco ? { ...t, status: 'CONCILIADO' } : t
            );
            setConciliacao({ ...conciliacao, transacoes: novasTransacoes });
        } catch (error) {
            alert("Erro ao conciliar transação.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <LinkIcon className="text-indigo-600 bg-indigo-100 p-1 rounded-lg" size={36} /> 
                        CONCILIAÇÃO BANCÁRIA
                    </h1>
                    <p className="text-slate-500 mt-1">Sincronize o extrato do banco com o ERP GrandPort</p>
                </div>
            </div>

            {!conciliacao && (
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-2xl mx-auto mt-10">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Landmark size={48} className="text-indigo-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Importar Extrato (OFX)</h2>
                    <p className="text-slate-500 mb-8">Faça o download do arquivo .ofx no seu Internet Banking e envie aqui.</p>
                    <input type="file" accept=".ofx" onChange={e => setArquivo(e.target.files[0])} className="mb-6 block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                    <button onClick={handleUpload} disabled={loading || !arquivo} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all disabled:opacity-50">
                        {loading ? 'A PROCESSAR EXTRATO...' : 'INICIAR CONCILIAÇÃO INTELIGENTE'}
                    </button>
                </div>
            )}

            {conciliacao && (
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-4">
                            <Landmark size={32} className="text-indigo-400" />
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Conta Identificada</p>
                                <h2 className="text-2xl font-black">{conciliacao.contaBancaria}</h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Saldo do Extrato</p>
                            <h2 className="text-2xl font-black text-green-400">R$ {conciliacao.saldoBanco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-2 bg-slate-100 p-4 border-b font-black text-slate-500 text-xs uppercase tracking-widest">
                            <div className="pl-4">Extrato do Banco (OFX)</div>
                            <div className="pl-4">Sistema GrandPort</div>
                        </div>

                        {conciliacao.transacoes.map((txn, index) => (
                            <div key={index} className="grid grid-cols-2 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="p-6 border-r border-dashed">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-slate-500">{new Date(txn.data).toLocaleDateString()}</span>
                                        <span className={`font-black text-lg ${txn.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                            {txn.tipo === 'ENTRADA' ? '+' : '-'} R$ {txn.valor.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800">{txn.descricaoBanco}</p>
                                </div>

                                <div className="p-6 flex flex-col justify-center">
                                    {txn.status === 'SUGERIDO' && (
                                        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 mb-1"><CheckCircle size={12}/> Match Encontrado</p>
                                                <p className="font-bold text-slate-800 text-sm">{txn.sugestaoSistema.descricao}</p>
                                            </div>
                                            <button onClick={() => confirmarConciliacao(txn)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 shadow-md">CONFIRMAR</button>
                                        </div>
                                    )}

                                    {txn.status === 'DESCONHECIDO' && (
                                        <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-4 rounded-xl">
                                            <div>
                                                <p className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1 mb-1"><AlertCircle size={12}/> Sem correspondência</p>
                                                <p className="text-slate-600 text-xs font-medium">Nenhuma conta com este valor exato.</p>
                                            </div>
                                            <button className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-100">CRIAR DESPESA</button>
                                        </div>
                                    )}

                                    {txn.status === 'CONCILIADO' && (
                                        <div className="flex items-center justify-center gap-2 text-green-600 font-black p-4 bg-green-50 rounded-xl border border-green-100">
                                            <Check size={20} /> CONCILIADO COM SUCESSO
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setConciliacao(null)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">CANCELAR</button>
                        <button onClick={() => setConciliacao(null)} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 shadow-lg flex items-center gap-2">
                            <CheckCircle size={20}/> FINALIZAR CONCILIAÇÃO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
