/**
 * 🎨 CENTRAL DE LAYOUTS - Gerenciador Visual de Templates HTML
 * * Componente React para gerenciar todos os layouts de impressão do sistema
 * incluindo Extratos Financeiros, Pedidos, Recibos, etc.
 */

import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  Save,
  RotateCcw,
  Eye,
  Copy,
  AlertCircle,
  Rocket,
  History,
  FileText,
  Receipt,
  ShoppingCart,
  Wallet,
  ClipboardList,
  BarChart3,
  Banknote,
  BadgeDollarSign,
  FileSpreadsheet,
  Library,
  Code2,
  ScanSearch,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIPOS_LAYOUT = [
  { id: 'extratoCliente', nome: 'Extrato de Cliente', descricao: 'Extrato de contas a receber', icon: FileText },
  { id: 'extratoFornecedor', nome: 'Extrato de Fornecedor', descricao: 'Extrato de contas a pagar', icon: ClipboardList },
  { id: 'os', nome: 'Ordem de Serviço', descricao: 'Documento operacional da oficina', icon: FileSpreadsheet },
  { id: 'venda', nome: 'Pedido de Venda', descricao: 'Pedido de venda e orçamento', icon: ShoppingCart },
  { id: 'recibo', nome: 'Recibo', descricao: 'Recibo de recebimento', icon: Receipt },
  { id: 'reciboPagamento', nome: 'Recibo de Pagamento', descricao: 'Pagamento de contas e fornecedores', icon: Wallet },
  { id: 'fechamentoCaixa', nome: 'Fechamento de Caixa', descricao: 'Resumo diário do caixa', icon: Banknote },
  { id: 'espelhoNota', nome: 'Espelho de Nota', descricao: 'Conferência da nota fiscal', icon: ClipboardList },
  { id: 'dre', nome: 'DRE', descricao: 'Demonstração de resultado', icon: BarChart3 },
  { id: 'relatorioComissao', nome: 'Relatório de Comissão', descricao: 'Comissões da equipe', icon: BadgeDollarSign },
  { id: 'relatorioContasPagar', nome: 'Contas a Pagar', descricao: 'Relatório financeiro de saídas', icon: FileText },
  { id: 'relatorioContasReceber', nome: 'Contas a Receber', descricao: 'Relatório financeiro de entradas', icon: FileText },
];

const TODAS_FAMILIAS = 'todas';
const ABAS_CENTRAL = [
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'diff', label: 'Diff', icon: ScanSearch },
];

const getFamiliaVisual = (styleId = '') => {
  const [, familia = styleId] = styleId.split('-', 2);
  return familia || styleId;
};

const getLabelFamilia = (familia = '') => {
  if (!familia) {
    return 'Sem categoria';
  }
  return familia.charAt(0).toUpperCase() + familia.slice(1);
};

export const CentralDeLayouts = () => {
  const [tipoSelecionado, setTipoSelecionado] = useState('extratoCliente');
  const [abaAtiva, setAbaAtiva] = useState('editor');
  const [buscaTipo, setBuscaTipo] = useState('');
  const [html, setHtml] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [templateOficial, setTemplateOficial] = useState(null);
  const [bibliotecaTemplates, setBibliotecaTemplates] = useState([]);
  const [filtroBiblioteca, setFiltroBiblioteca] = useState(TODAS_FAMILIAS);
  const [previewTemplateBiblioteca, setPreviewTemplateBiblioteca] = useState(null);
  const [previewBibliotecaUrl, setPreviewBibliotecaUrl] = useState('');
  const [thumbnailBibliotecaUrls, setThumbnailBibliotecaUrls] = useState({});
  const [historico, setHistorico] = useState([]);
  const [diffAtual, setDiffAtual] = useState(null);
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [gerandoPreview, setGerandoPreview] = useState(false);
  const [previewAberta, setPreviewAberta] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [estadoLayout, setEstadoLayout] = useState({
    hasDraft: false,
    draftVersion: '',
    publishedVersion: '',
    officialStyleId: '',
    officialLabel: '',
    isEditorUsingOfficial: false,
    isPublishedUsingOfficial: false,
  });

  useEffect(() => {
    carregarLayout(tipoSelecionado);
    carregarTemplateOficial(tipoSelecionado);
    carregarBiblioteca(tipoSelecionado);
    carregarMetadata(tipoSelecionado);
    carregarHistorico(tipoSelecionado);
    carregarDiff(tipoSelecionado);
  }, [tipoSelecionado]);

  const carregarLayout = async (tipo) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}`);
      setHtml(response.data.html || '');
      setEstadoLayout({
        hasDraft: !!response.data.hasDraft,
        draftVersion: response.data.draftVersion || '',
        publishedVersion: response.data.publishedVersion || '',
        officialStyleId: response.data.officialStyleId || '',
        officialLabel: response.data.officialLabel || '',
        isEditorUsingOfficial: !!response.data.isEditorUsingOfficial,
        isPublishedUsingOfficial: !!response.data.isPublishedUsingOfficial,
      });
    } catch (error) {
      toast.error('Erro ao carregar layout');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const carregarTemplateOficial = async (tipo) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}/official`);
      setTemplateOficial(response.data);
    } catch (error) {
      setTemplateOficial(null);
      console.error(error);
    }
  };

  const carregarBiblioteca = async (tipo) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}/library`);
      Object.values(thumbnailBibliotecaUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      setBibliotecaTemplates(response.data || []);
      setFiltroBiblioteca(TODAS_FAMILIAS);
      setPreviewTemplateBiblioteca(null);
      setPreviewBibliotecaUrl('');
      setThumbnailBibliotecaUrls({});
    } catch (error) {
      setBibliotecaTemplates([]);
      console.error(error);
    }
  };

  const carregarMetadata = async (tipo) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}/metadata`);
      setMetadata(response.data);
    } catch (error) {
      setMetadata(null);
      console.error(error);
    }
  };

  const carregarHistorico = async (tipo) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}/historico`);
      setHistorico(response.data || []);
    } catch (error) {
      setHistorico([]);
      console.error(error);
    }
  };

  const carregarDiff = async (tipo) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipo}/diff`);
      setDiffAtual(response.data);
    } catch (error) {
      setDiffAtual(null);
      console.error(error);
    }
  };

  const salvarLayout = async () => {
    if (!html.trim()) {
      toast.error('HTML não pode estar vazio');
      return;
    }

    setSalvando(true);
    try {
      const response = await api.put(`/api/configuracoes/layouts/${tipoSelecionado}`, { html, changeReason });
      toast.success(response.data.mensagem || 'Draft salvo com sucesso!');
      if (response.data.warnings?.length) {
        response.data.warnings.forEach((warning) => toast(warning, { icon: '⚠️' }));
      }
      await carregarLayout(tipoSelecionado);
      await carregarHistorico(tipoSelecionado);
      await carregarDiff(tipoSelecionado);
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData?.errors?.length) {
        responseData.errors.forEach((validationError) => toast.error(validationError));
      } else {
        toast.error(responseData?.error || 'Erro ao salvar layout');
      }
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const publicarLayout = async () => {
    setPublicando(true);
    try {
      const response = await api.post(`/api/configuracoes/layouts/${tipoSelecionado}/publish-with-reason`, {
        changeReason
      });
      toast.success(response.data.mensagem || 'Layout publicado com sucesso!');
      await carregarLayout(tipoSelecionado);
      await carregarHistorico(tipoSelecionado);
      await carregarDiff(tipoSelecionado);
      setChangeReason('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao publicar layout');
    } finally {
      setPublicando(false);
    }
  };

  const rollbackVersao = async (versionId) => {
    if (!window.confirm('Deseja publicar esta versão novamente como rollback?')) {
      return;
    }

    setPublicando(true);
    try {
      const reason = window.prompt('Motivo do rollback/publicação desta versão:', changeReason || '');
      const response = await api.post(`/api/configuracoes/layouts/${tipoSelecionado}/rollback/${versionId}/with-reason`, {
        changeReason: reason || ''
      });
      toast.success(response.data.mensagem || 'Rollback executado com sucesso!');
      await carregarLayout(tipoSelecionado);
      await carregarHistorico(tipoSelecionado);
      await carregarDiff(tipoSelecionado);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao executar rollback');
    } finally {
      setPublicando(false);
    }
  };

  const resetarLayout = async () => {
    if (!window.confirm('Tem certeza que deseja resetar este layout para o padrão?')) {
      return;
    }

    setSalvando(true);
    try {
      const response = await api.post(`/api/configuracoes/layouts/reset/${tipoSelecionado}`);
      toast.success(response.data.mensagem);
      setHtml('');
      await carregarLayout(tipoSelecionado);
      await carregarHistorico(tipoSelecionado);
      await carregarDiff(tipoSelecionado);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao resetar layout');
    } finally {
      setSalvando(false);
    }
  };

  const importarTemplateOficial = () => {
    if (!templateOficial?.html) {
      toast.error('Template oficial indisponível para este layout');
      return;
    }
    setHtml(templateOficial.html);
    setPreviewAberta(false);
    setChangeReason((valorAtual) => valorAtual || `Importação do template oficial ${templateOficial.styleId || ''}`.trim());
    toast.success('Template oficial carregado no editor');
  };

  const importarTemplateDaBiblioteca = async (styleId) => {
    try {
      const response = await api.get(`/api/configuracoes/layouts/${tipoSelecionado}/library/${styleId}`);
      setHtml(response.data.content || '');
      setPreviewAberta(false);
      setChangeReason((valorAtual) => valorAtual || `Importação do template premium ${styleId}`.trim());
      toast.success(`Template ${response.data.label || styleId} carregado no editor`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao importar template da biblioteca');
    }
  };

  const visualizarTemplateDaBiblioteca = async (styleId) => {
    try {
      const [metaResponse, pdfResponse] = await Promise.all([
        api.get(`/api/configuracoes/layouts/${tipoSelecionado}/library/${styleId}`),
        api.get(`/api/configuracoes/layouts/${tipoSelecionado}/library/${styleId}/preview-pdf`, {
          responseType: 'blob',
        }),
      ]);

      if (previewBibliotecaUrl) {
        URL.revokeObjectURL(previewBibliotecaUrl);
      }

      const url = URL.createObjectURL(new Blob([pdfResponse.data], { type: 'application/pdf' }));
      setPreviewBibliotecaUrl(url);
      setPreviewTemplateBiblioteca(metaResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao carregar preview do template');
    }
  };

  useEffect(() => {
    if (!bibliotecaTemplates.length) {
      return undefined;
    }

    let cancelled = false;
    const generatedUrls = [];

    const carregarMiniaturas = async () => {
      const entries = await Promise.all(
          bibliotecaTemplates.map(async (template) => {
            try {
              const response = await api.get(`/api/configuracoes/layouts/${tipoSelecionado}/library/${template.styleId}/preview-pdf`, {
                responseType: 'blob',
              });
              const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
              generatedUrls.push(url);
              return [template.styleId, url];
            } catch (error) {
              return [template.styleId, ''];
            }
          })
      );

      if (cancelled) {
        generatedUrls.forEach((url) => url && URL.revokeObjectURL(url));
        return;
      }

      setThumbnailBibliotecaUrls(Object.fromEntries(entries));
    };

    carregarMiniaturas();

    return () => {
      cancelled = true;
      generatedUrls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [bibliotecaTemplates, tipoSelecionado]);

  const copiarParaClipboard = () => {
    navigator.clipboard.writeText(html);
    toast.success('HTML copiado para clipboard!');
  };

  const alternarPreview = async () => {
    if (previewAberta) {
      setPreviewAberta(false);
      return;
    }

    if (!html.trim()) {
      toast.error('HTML não pode estar vazio');
      return;
    }

    setGerandoPreview(true);
    try {
      const response = await api.post(
          `/api/configuracoes/layouts/${tipoSelecionado}/preview-pdf`,
          { html },
          { responseType: 'blob' }
      );

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setPreviewAberta(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar preview em PDF');
    } finally {
      setGerandoPreview(false);
    }
  };

  const gruposDocumentos = [
    {
      id: 'operacional',
      label: 'Operacional',
      items: ['os', 'venda', 'recibo', 'reciboPagamento', 'fechamentoCaixa', 'espelhoNota'],
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: ['extratoCliente', 'extratoFornecedor', 'dre', 'relatorioComissao', 'relatorioContasPagar', 'relatorioContasReceber'],
    },
  ];
  const tiposFiltrados = TIPOS_LAYOUT.filter((tipo) => {
    const termo = buscaTipo.trim().toLowerCase();
    if (!termo) return true;
    return `${tipo.nome} ${tipo.descricao}`.toLowerCase().includes(termo);
  });
  const layoutInfo = TIPOS_LAYOUT.find((tipo) => tipo.id === tipoSelecionado);
  const LayoutIcon = layoutInfo?.icon || FileText;
  const familiasDisponiveis = [TODAS_FAMILIAS, ...new Set(bibliotecaTemplates.map((template) => getFamiliaVisual(template.styleId)))];
  const templatesFiltrados = filtroBiblioteca === TODAS_FAMILIAS
    ? bibliotecaTemplates
    : bibliotecaTemplates.filter((template) => getFamiliaVisual(template.styleId) === filtroBiblioteca);

  return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Central editorial
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-2xl bg-slate-900 p-3 text-white">
                    <LayoutIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold text-slate-950">{layoutInfo?.nome || 'Central de Layouts'}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      {layoutInfo?.descricao || 'Gerencie templates HTML publicados, rascunhos e padrões oficiais.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {estadoLayout.officialStyleId && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      Oficial {estadoLayout.officialStyleId}
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 font-semibold ${estadoLayout.isPublishedUsingOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {estadoLayout.isPublishedUsingOfficial ? 'Publicado no oficial' : 'Publicado customizado'}
                  </span>
                  <span className={`rounded-full px-3 py-1 font-semibold ${estadoLayout.isEditorUsingOfficial ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>
                    {estadoLayout.isEditorUsingOfficial ? 'Editor no oficial' : 'Editor alterado'}
                  </span>
                  {estadoLayout.hasDraft && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-800">
                      Draft v{estadoLayout.draftVersion}
                    </span>
                  )}
                  {estadoLayout.publishedVersion && (
                    <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
                      Publicado v{estadoLayout.publishedVersion}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
                <button
                  onClick={salvarLayout}
                  disabled={salvando || loading || !html.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {salvando ? 'Salvando...' : 'Salvar draft'}
                </button>
                <button
                  onClick={publicarLayout}
                  disabled={publicando || loading || !estadoLayout.hasDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Rocket size={16} />
                  {publicando ? 'Publicando...' : 'Publicar'}
                </button>
                <button
                  onClick={alternarPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye size={16} />
                  {gerandoPreview ? 'Gerando...' : previewAberta ? 'Fechar preview' : 'Preview PDF'}
                </button>
                <button
                  onClick={resetarLayout}
                  disabled={salvando || publicando || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Resetar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-9">
              <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Documento ativo</h2>
                      <p className="mt-1 text-sm text-slate-600">Escolha qual layout HTML você quer editar sem sair da central.</p>
                    </div>
                    <div className="w-full lg:w-[280px]">
                      <input
                        value={buscaTipo}
                        onChange={(e) => setBuscaTipo(e.target.value)}
                        placeholder="Buscar documento..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 px-5 py-5">
                  {gruposDocumentos.map((grupo) => {
                    const itensGrupo = tiposFiltrados.filter((tipo) => grupo.items.includes(tipo.id));
                    if (!itensGrupo.length) {
                      return null;
                    }
                    return (
                      <div key={grupo.id}>
                        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {grupo.label}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                          {itensGrupo.map((tipo) => {
                            const ItemIcon = tipo.icon || FileText;
                            return (
                              <button
                                key={tipo.id}
                                onClick={() => setTipoSelecionado(tipo.id)}
                                className={`rounded-2xl px-4 py-4 text-left transition ${
                                  tipoSelecionado === tipo.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'border border-slate-200 bg-slate-50 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`rounded-2xl p-2.5 ${tipoSelecionado === tipo.id ? 'bg-white/10 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>
                                    <ItemIcon size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-sm font-semibold leading-5 ${tipoSelecionado === tipo.id ? 'text-white' : 'text-slate-900'}`}>
                                      {tipo.nome}
                                    </div>
                                    <div className={`mt-1 text-xs leading-5 ${tipoSelecionado === tipo.id ? 'text-slate-200' : 'text-slate-500'}`}>
                                      {tipo.descricao}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {!tiposFiltrados.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Nenhum documento encontrado para essa busca.
                    </div>
                  )}
                </div>
              </div>

              {layoutInfo && (
                  <div className="mb-6 rounded-3xl border border-sky-200 bg-sky-50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-1 text-sky-600" size={20} />
                      <div>
                        <h3 className="font-semibold text-sky-950">{layoutInfo.nome}</h3>
                        <p className="mt-1 text-sm text-sky-900">
                          Use variáveis Thymeleaf como <code className="rounded bg-sky-100 px-2 py-1">${'${variavel}'}</code> para inserir dados dinâmicos.
                        </p>
                        {metadata?.notes?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {metadata.notes.map((note) => (
                                  <div key={note} className="text-xs text-sky-900">
                                    {note}
                                  </div>
                              ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
              )}

              <div className="mb-6 flex flex-wrap gap-2">
                {ABAS_CENTRAL.map((aba) => {
                  const AbaIcon = aba.icon;
                  return (
                    <button
                      key={aba.id}
                      onClick={() => setAbaAtiva(aba.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        abaAtiva === aba.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <AbaIcon size={15} />
                      {aba.label}
                    </button>
                  );
                })}
              </div>

              {abaAtiva === 'editor' && (
                <>
                  {metadata?.availableVariables?.length > 0 && (
                    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Variáveis liberadas</h2>
                          <p className="mt-1 text-sm text-slate-600">Use somente os campos homologados para esse documento.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {metadata.availableVariables.map((variable) => (
                          <code key={variable} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {'${' + variable + '}'}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {templateOficial && (
                    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Template oficial</h2>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {templateOficial.label} {templateOficial.styleId ? `| ${templateOficial.styleId}` : ''}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Importe o padrão oficial para começar um novo draft sem alterar o publicado atual.
                          </p>
                        </div>
                        <button
                          onClick={importarTemplateOficial}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Rocket size={16} />
                          Importar oficial
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Editor HTML</h2>
                        <p className="mt-1 text-sm text-slate-600">Edite o template do documento mantendo a sintaxe Thymeleaf válida.</p>
                      </div>
                      <button
                        onClick={copiarParaClipboard}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        title="Copiar HTML para clipboard"
                      >
                        <Copy size={16} />
                        Copiar
                      </button>
                    </div>

                    <textarea
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      disabled={loading}
                      className="w-full border-0 p-5 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      style={{ height: '460px', fontFamily: 'Monaco, Courier New, monospace' }}
                      placeholder="Cole ou edite aqui o HTML do documento. Use as variáveis homologadas acima."
                    />
                    <div className="border-t border-slate-200 px-5 py-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Motivo editorial da alteração
                      </label>
                      <textarea
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        rows={3}
                        placeholder="Ex.: ajuste de cabeçalho, correção de variável, padronização visual ou revisão de rodapé."
                      />
                    </div>
                  </div>
                </>
              )}

              {abaAtiva === 'biblioteca' && bibliotecaTemplates.length > 0 && (
                <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Biblioteca premium</h2>
                    <p className="mt-1 text-sm text-slate-600">Escolha uma linha visual pronta e carregue no editor sem mexer no publicado.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {familiasDisponiveis.map((familia) => (
                        <button
                          key={familia}
                          onClick={() => setFiltroBiblioteca(familia)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            filtroBiblioteca === familia
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {familia === TODAS_FAMILIAS ? 'Todas as linhas' : getLabelFamilia(familia)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {templatesFiltrados.map((template) => (
                      <div key={template.styleId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {thumbnailBibliotecaUrls[template.styleId] ? (
                            <iframe
                              title={`Thumb ${template.styleId}`}
                              src={thumbnailBibliotecaUrls[template.styleId]}
                              className="h-[440px] w-[320px] origin-top-left scale-[0.25] border-0 bg-white"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
                              Gerando miniatura...
                            </div>
                          )}
                        </div>
                        <div className="text-base font-semibold text-slate-900">{template.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{template.styleId}</div>
                        <div className="mt-2 text-xs text-slate-600">
                          Linha visual {getLabelFamilia(getFamiliaVisual(template.styleId))}
                        </div>
                        {template.official && (
                          <span className="mt-3 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-900">
                            Oficial do sistema
                          </span>
                        )}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => visualizarTemplateDaBiblioteca(template.styleId)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Eye size={15} />
                            Preview
                          </button>
                          <button
                            onClick={() => importarTemplateDaBiblioteca(template.styleId)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Rocket size={15} />
                            Importar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {previewTemplateBiblioteca && (
                    <div className="border-t border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">Preview do template</h3>
                          <p className="text-sm text-slate-500">
                            {previewTemplateBiblioteca.label} | {previewTemplateBiblioteca.styleId}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (previewBibliotecaUrl) {
                              URL.revokeObjectURL(previewBibliotecaUrl);
                            }
                            setPreviewBibliotecaUrl('');
                            setPreviewTemplateBiblioteca(null);
                          }}
                          className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                          Fechar
                        </button>
                      </div>
                      <iframe
                        title={`Preview ${previewTemplateBiblioteca.styleId}`}
                        src={previewBibliotecaUrl}
                        className="h-[520px] w-full rounded-2xl border border-slate-200 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {abaAtiva === 'diff' && (
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Diff editorial</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Compare o conteúdo do draft com a versão publicada antes de promover mudanças.
                    </p>
                  </div>
                  {diffAtual?.hasChanges ? (
                    <>
                      <p className="mb-4 text-sm text-slate-500">
                        Draft: {diffAtual.draftLineCount} linhas | Publicado: {diffAtual.publishedLineCount} linhas
                      </p>
                      <div className="max-h-[520px] space-y-1 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">
                        {diffAtual.lines?.map((line, index) => (
                          <div
                            key={`${line.type}-${index}`}
                            className={
                              line.type === 'added'
                                ? 'text-emerald-300'
                                : line.type === 'removed'
                                  ? 'text-rose-300'
                                  : 'text-amber-200'
                            }
                          >
                            {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '! '}
                            {line.content}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      Nenhuma divergência relevante entre draft e publicado no momento.
                    </div>
                  )}
                </div>
              )}

              {previewAberta && (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-slate-900">Preview real do PDF</h3>
                    <iframe
                        src={previewUrl}
                        title="Preview PDF"
                        className="h-[700px] w-full rounded-2xl border border-slate-200"
                    />
                  </div>
              )}
            </div>

            <div className="xl:col-span-3">
              <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
                  <History size={18} className="text-slate-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Histórico</h2>
                </div>
                <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
                  {historico.length === 0 && (
                      <div className="p-4 text-sm text-slate-500">
                        Nenhuma versão registrada ainda.
                      </div>
                  )}
                  {historico.map((versao) => (
                      <div key={versao.id} className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">v{versao.versionNumber}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              versao.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : versao.status === 'DRAFT'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-100 text-slate-700'
                          }`}>
                            {versao.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Criado por {versao.createdBy || 'sistema'}
                        </div>
                        {versao.changeReason && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                              {versao.changeReason}
                            </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {versao.createdAt ? new Date(versao.createdAt).toLocaleString() : 'Sem data'}
                        </div>
                        {versao.status !== 'DRAFT' && (
                            <button
                                onClick={() => rollbackVersao(versao.id)}
                                disabled={publicando}
                                className="text-xs font-semibold text-slate-900 transition hover:text-slate-600"
                            >
                              Publicar esta versão
                            </button>
                        )}
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CentralDeLayouts;
