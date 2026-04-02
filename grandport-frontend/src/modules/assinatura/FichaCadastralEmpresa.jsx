import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

const maskPhone = (value = '') =>
    value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');

const maskCep = (value = '') =>
    value
        .replace(/\D/g, '')
        .slice(0, 8)
        .replace(/^(\d{5})(\d)/, '$1-$2');

const emptyForm = {
    nomeFantasia: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    regimeTributario: '',
    website: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    responsavelFinanceiroNome: '',
    responsavelFinanceiroEmail: '',
    responsavelFinanceiroTelefone: '',
    responsavelOperacionalNome: '',
    responsavelOperacionalEmail: '',
    responsavelOperacionalTelefone: '',
    aceiteLgpd: false,
    observacoes: ''
};

const onboardingTone = (status) => {
    if (status === 'COMPLETO') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (status === 'EM_PREENCHIMENTO') return 'border-blue-200 bg-blue-50 text-blue-800';
    if (status === 'VENCIDO') return 'border-red-200 bg-red-50 text-red-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
};

export const FichaCadastralEmpresa = () => {
    const [form, setForm] = useState(emptyForm);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [consultandoCep, setConsultandoCep] = useState(false);
    const [consultandoCnpj, setConsultandoCnpj] = useState(false);
    const ultimoCepConsultadoRef = useRef('');

    const carregar = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/assinaturas/minha-empresa/cadastro-complementar');
            const data = res.data || {};
            setMeta(data);
            ultimoCepConsultadoRef.current = (data.cep || '').replace(/\D/g, '');
            setForm({
                nomeFantasia: data.nomeFantasia || '',
                inscricaoEstadual: data.inscricaoEstadual || '',
                inscricaoMunicipal: data.inscricaoMunicipal || '',
                regimeTributario: data.regimeTributario || '',
                website: data.website || '',
                cep: data.cep || '',
                logradouro: data.logradouro || '',
                numero: data.numero || '',
                complemento: data.complemento || '',
                bairro: data.bairro || '',
                cidade: data.cidade || '',
                uf: data.uf || '',
                responsavelFinanceiroNome: data.responsavelFinanceiroNome || '',
                responsavelFinanceiroEmail: data.responsavelFinanceiroEmail || '',
                responsavelFinanceiroTelefone: data.responsavelFinanceiroTelefone || '',
                responsavelOperacionalNome: data.responsavelOperacionalNome || '',
                responsavelOperacionalEmail: data.responsavelOperacionalEmail || '',
                responsavelOperacionalTelefone: data.responsavelOperacionalTelefone || '',
                aceiteLgpd: !!data.aceiteLgpd,
                observacoes: data.observacoes || ''
            });
        } catch (error) {
            toast.error('Não foi possível carregar a ficha cadastral.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregar();
    }, []);

    const pendencias = meta?.pendencias || [];
    const percentual = meta?.percentualPreenchimento || 0;
    const diasRestantes = meta?.diasRestantes;

    const resumoPrazo = useMemo(() => {
        if (!meta?.prazoConclusao) return 'Prazo ainda não definido';
        const data = new Date(`${meta.prazoConclusao}T00:00:00`).toLocaleDateString('pt-BR');
        if (diasRestantes == null) return `Prazo final: ${data}`;
        if (diasRestantes < 0) return `Prazo encerrado em ${data}`;
        if (diasRestantes === 0) return `Prazo final hoje: ${data}`;
        return `Prazo final: ${data} (${diasRestantes} dia(s) restante(s))`;
    }, [meta?.prazoConclusao, diasRestantes]);

    const atualizarCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

    const salvar = async () => {
        setSalvando(true);
        const toastId = toast.loading('Salvando ficha cadastral...');
        try {
            await api.post('/api/assinaturas/minha-empresa/cadastro-complementar', form);
            await carregar();
            toast.success('Ficha cadastral atualizada com sucesso.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível salvar a ficha cadastral.', { id: toastId });
        } finally {
            setSalvando(false);
        }
    };

    const buscarCep = async () => {
        const cepLimpo = (form.cep || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            toast.error('Informe um CEP válido para consulta.');
            return;
        }

        setConsultandoCep(true);
        try {
            const res = await api.get(`/api/parceiros/consulta-cep/${cepLimpo}`);
            const dados = res.data || {};
            ultimoCepConsultadoRef.current = cepLimpo;
            setForm((prev) => ({
                ...prev,
                cep: maskCep(dados.cep || cepLimpo),
                logradouro: dados.street || prev.logradouro,
                bairro: dados.neighborhood || prev.bairro,
                cidade: dados.city || prev.cidade,
                uf: (dados.state || prev.uf || '').toUpperCase().slice(0, 2)
            }));
            toast.success('Endereço preenchido a partir do CEP.');
        } catch (error) {
            toast.error('Não foi possível consultar o CEP.');
        } finally {
            setConsultandoCep(false);
        }
    };

    const buscarCnpj = async () => {
        const cnpjLimpo = (meta?.cnpj || '').replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) {
            toast.error('CNPJ da empresa indisponível para consulta.');
            return;
        }

        setConsultandoCnpj(true);
        try {
            const res = await api.get(`/api/parceiros/consulta-cnpj/${cnpjLimpo}`);
            const dados = res.data || {};
            setForm((prev) => ({
                ...prev,
                nomeFantasia: prev.nomeFantasia || dados.nomeFantasia || dados.razaoSocial || prev.nomeFantasia,
                cep: prev.cep || maskCep(dados.cep || ''),
                logradouro: prev.logradouro || dados.logradouro || prev.logradouro,
                numero: prev.numero || dados.numero || prev.numero,
                bairro: prev.bairro || dados.bairro || prev.bairro,
                cidade: prev.cidade || dados.municipio || prev.cidade,
                uf: (prev.uf || dados.uf || '').toUpperCase().slice(0, 2),
                responsavelOperacionalTelefone: prev.responsavelOperacionalTelefone || maskPhone(dados.telefone || '')
            }));
            toast.success('Dados básicos preenchidos a partir do CNPJ.');
        } catch (error) {
            toast.error('Não foi possível consultar o CNPJ.');
        } finally {
            setConsultandoCnpj(false);
        }
    };

    useEffect(() => {
        const cepLimpo = (form.cep || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;
        if (consultandoCep) return;
        if (ultimoCepConsultadoRef.current === cepLimpo) return;

        const timeoutId = window.setTimeout(() => {
            buscarCep();
        }, 450);

        return () => window.clearTimeout(timeoutId);
    }, [form.cep]);

    if (loading) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
                Carregando ficha cadastral...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Onboarding da empresa</div>
                            <h1 className="mt-2 text-2xl font-black text-slate-900">Ficha Cadastral Completa</h1>
                            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
                                Complete os dados obrigatórios da empresa para concluir a implantação e evitar restrições futuras em módulos sensíveis.
                            </p>
                        </div>
                        <div className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${onboardingTone(meta?.statusOnboarding)}`}>
                            {meta?.statusOnboarding || 'PENDENTE_COMPLEMENTO'}
                        </div>
                        <div className="text-sm font-semibold text-slate-600">{resumoPrazo}</div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={buscarCnpj}
                                disabled={consultandoCnpj}
                                className="rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-black text-violet-800 transition hover:border-violet-400 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                {consultandoCnpj ? 'Consultando CNPJ...' : 'Atualizar dados pelo CNPJ'}
                            </button>
                        </div>
                        <div className="grid gap-2 text-sm font-semibold text-slate-600 md:grid-cols-2">
                            <div><span className="font-black text-slate-800">Razão social:</span> {meta?.razaoSocial || '-'}</div>
                            <div><span className="font-black text-slate-800">CNPJ:</span> {meta?.cnpj || '-'}</div>
                            <div><span className="font-black text-slate-800">E-mail:</span> {meta?.emailContato || '-'}</div>
                            <div><span className="font-black text-slate-800">Telefone:</span> {meta?.telefone || '-'}</div>
                        </div>
                    </div>
                    <div className="w-full rounded-[1.75rem] border border-sky-200 bg-sky-50 p-5 xl:max-w-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Progresso</div>
                                <div className="mt-2 text-3xl font-black text-slate-900">{percentual}%</div>
                            </div>
                            <div className="text-right text-sm font-semibold text-slate-600">
                                <div>{pendencias.length} pendência(s)</div>
                                <div>{diasRestantes == null ? '-' : `${diasRestantes} dia(s)`}</div>
                            </div>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100">
                            <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, percentual))}%` }} />
                        </div>
                    </div>
                </div>
            </section>

            {pendencias.length > 0 && (
                <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Pendências obrigatórias</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {pendencias.map((item) => (
                            <span key={item} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                                {item}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Dados da empresa</div>
                    <div className="mt-4 grid gap-4">
                        <input value={form.nomeFantasia} onChange={(e) => atualizarCampo('nomeFantasia', e.target.value)} placeholder="Nome fantasia" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <input value={form.inscricaoEstadual} onChange={(e) => atualizarCampo('inscricaoEstadual', e.target.value)} placeholder="Inscrição estadual" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.inscricaoMunicipal} onChange={(e) => atualizarCampo('inscricaoMunicipal', e.target.value)} placeholder="Inscrição municipal" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <select value={form.regimeTributario} onChange={(e) => atualizarCampo('regimeTributario', e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                                <option value="">Regime tributário</option>
                                <option value="MEI">MEI</option>
                                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                                <option value="LUCRO_REAL">Lucro Real</option>
                            </select>
                            <input value={form.website} onChange={(e) => atualizarCampo('website', e.target.value)} placeholder="Website" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Endereço fiscal / operacional</div>
                    <div className="mt-4 grid gap-4">
                        <div className="grid gap-4 md:grid-cols-[180px,1fr]">
                            <div className="flex gap-2">
                                <input value={form.cep} onChange={(e) => atualizarCampo('cep', maskCep(e.target.value))} placeholder="CEP" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                                <button
                                    onClick={buscarCep}
                                    disabled={consultandoCep}
                                    className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-sky-800 transition hover:border-sky-400 disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    {consultandoCep ? '...' : 'CEP'}
                                </button>
                            </div>
                            <input value={form.logradouro} onChange={(e) => atualizarCampo('logradouro', e.target.value)} placeholder="Logradouro" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-[160px,1fr]">
                            <input value={form.numero} onChange={(e) => atualizarCampo('numero', e.target.value)} placeholder="Número" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.complemento} onChange={(e) => atualizarCampo('complemento', e.target.value)} placeholder="Complemento" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <input value={form.bairro} onChange={(e) => atualizarCampo('bairro', e.target.value)} placeholder="Bairro" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.cidade} onChange={(e) => atualizarCampo('cidade', e.target.value)} placeholder="Cidade" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.uf} onChange={(e) => atualizarCampo('uf', e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold uppercase text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Responsável financeiro</div>
                    <div className="mt-4 grid gap-4">
                        <input value={form.responsavelFinanceiroNome} onChange={(e) => atualizarCampo('responsavelFinanceiroNome', e.target.value)} placeholder="Nome do responsável financeiro" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <input value={form.responsavelFinanceiroEmail} onChange={(e) => atualizarCampo('responsavelFinanceiroEmail', e.target.value)} placeholder="E-mail financeiro" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.responsavelFinanceiroTelefone} onChange={(e) => atualizarCampo('responsavelFinanceiroTelefone', maskPhone(e.target.value))} placeholder="Telefone financeiro" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Responsável operacional</div>
                    <div className="mt-4 grid gap-4">
                        <input value={form.responsavelOperacionalNome} onChange={(e) => atualizarCampo('responsavelOperacionalNome', e.target.value)} placeholder="Nome do responsável operacional" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <input value={form.responsavelOperacionalEmail} onChange={(e) => atualizarCampo('responsavelOperacionalEmail', e.target.value)} placeholder="E-mail operacional" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                            <input value={form.responsavelOperacionalTelefone} onChange={(e) => atualizarCampo('responsavelOperacionalTelefone', maskPhone(e.target.value))} placeholder="Telefone operacional" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Observações e aceite</div>
                <div className="mt-4 grid gap-4">
                    <textarea
                        value={form.observacoes}
                        onChange={(e) => atualizarCampo('observacoes', e.target.value)}
                        placeholder="Observações para a implantação, faturamento ou particularidades do cliente."
                        className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                    />
                    <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.aceiteLgpd}
                            onChange={(e) => atualizarCampo('aceiteLgpd', e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />
                        Confirmo que os dados informados podem ser usados pela plataforma para implantação, suporte, cobrança e rotinas administrativas relacionadas ao contrato.
                    </label>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            onClick={carregar}
                            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                        >
                            Recarregar
                        </button>
                        <button
                            onClick={salvar}
                            disabled={salvando}
                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                        >
                            Salvar ficha cadastral
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};
