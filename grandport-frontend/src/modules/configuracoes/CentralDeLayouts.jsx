/**
 * 🎨 CENTRAL DE LAYOUTS - Gerenciador Visual de Templates HTML
 * * Componente React para gerenciar todos os layouts de impressão do sistema
 * incluindo Extratos Financeiros, Pedidos, Recibos, etc.
 */

import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Save, RotateCcw, Eye, Copy, AlertCircle, Rocket, History } from 'lucide-react';
import toast from 'react-hot-toast';

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

const TODAS_FAMILIAS = 'todas';

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

  const layoutInfo = TIPOS_LAYOUT.find((tipo) => tipo.id === tipoSelecionado);
  const familiasDisponiveis = [TODAS_FAMILIAS, ...new Set(bibliotecaTemplates.map((template) => getFamiliaVisual(template.styleId)))];
  const templatesFiltrados = filtroBiblioteca === TODAS_FAMILIAS
    ? bibliotecaTemplates
    : bibliotecaTemplates.filter((template) => getFamiliaVisual(template.styleId) === filtroBiblioteca);

  return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🎨 Central de Layouts
            </h1>
            <p className="text-gray-600 mt-2">Gerencie os templates HTML de todos os documentos e extratos do sistema</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-6">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-900">Layouts Disponíveis</h2>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {TIPOS_LAYOUT.map((tipo) => (
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

            <div className="lg:col-span-3">
              {layoutInfo && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-blue-500 mt-1" size={20} />
                      <div>
                        <h3 className="font-bold text-blue-900">{layoutInfo.nome}</h3>
                        <p className="text-sm text-blue-800 mt-1">
                          Use variáveis Thymeleaf como <code className="bg-blue-200 px-2 py-1 rounded">${'${variavel}'}</code> para inserir dados dinâmicos
                        </p>
                        {metadata?.notes?.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {metadata.notes.map((note) => (
                                  <div key={note} className="text-xs text-blue-900">
                                    - {note}
                                  </div>
                              ))}
                            </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {estadoLayout.officialStyleId && (
                              <span className="bg-slate-100 text-slate-900 px-2 py-1 rounded-full">
                                Oficial {estadoLayout.officialStyleId}
                              </span>
                          )}
                          {estadoLayout.isPublishedUsingOfficial ? (
                              <span className="bg-sky-100 text-sky-900 px-2 py-1 rounded-full">
                                Publicado segue oficial
                              </span>
                          ) : (
                              <span className="bg-rose-100 text-rose-900 px-2 py-1 rounded-full">
                                Publicado customizado
                              </span>
                          )}
                          {estadoLayout.isEditorUsingOfficial ? (
                              <span className="bg-cyan-100 text-cyan-900 px-2 py-1 rounded-full">
                                Editor com oficial
                              </span>
                          ) : (
                              <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-full">
                                Editor alterado
                              </span>
                          )}
                          {estadoLayout.hasDraft && (
                              <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-full">
                                Draft v{estadoLayout.draftVersion}
                              </span>
                          )}
                          {estadoLayout.publishedVersion && (
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-1 rounded-full">
                                Publicado v{estadoLayout.publishedVersion}
                              </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {metadata?.availableVariables?.length > 0 && (
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h2 className="font-bold text-gray-900">Variáveis Disponíveis</h2>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {metadata.availableVariables.map((variable) => (
                          <code key={variable} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            {'${' + variable + '}'}
                          </code>
                      ))}
                    </div>
                  </div>
              )}

              {templateOficial && (
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-gray-900">Template Oficial</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {templateOficial.label} {templateOficial.styleId ? `| estilo ${templateOficial.styleId}` : ''}
                        </p>
                      </div>
                      <button
                          onClick={importarTemplateOficial}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-semibold"
                      >
                        <Rocket size={16} />
                        Importar Oficial
                      </button>
                    </div>
                    <div className="p-4 text-sm text-gray-600">
                      Use esta ação para começar um draft a partir do padrão oficial premium do sistema, sem resetar a versão publicada.
                    </div>
                  </div>
              )}

              {bibliotecaTemplates.length > 0 && (
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h2 className="font-bold text-gray-900">Biblioteca Premium</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Escolha um estilo pronto e carregue no editor sem mexer no publicado atual.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {familiasDisponiveis.map((familia) => (
                            <button
                                key={familia}
                                onClick={() => setFiltroBiblioteca(familia)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
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
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templatesFiltrados.map((template) => (
                          <div key={template.styleId} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3">
                            <div>
                              <div className="mb-3 h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                              <div className="font-semibold text-gray-900">{template.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{template.styleId}</div>
                              <div className="text-xs text-slate-600 mt-2">
                                Linha visual {getLabelFamilia(getFamiliaVisual(template.styleId))}
                              </div>
                              {template.official && (
                                  <span className="inline-flex mt-2 bg-sky-100 text-sky-900 px-2 py-1 rounded-full text-[11px] font-semibold">
                                    Oficial do sistema
                                  </span>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col gap-2">
                              <button
                                  onClick={() => visualizarTemplateDaBiblioteca(template.styleId)}
                                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-semibold"
                              >
                                Preview
                              </button>
                              <button
                                  onClick={() => importarTemplateDaBiblioteca(template.styleId)}
                                  className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-semibold"
                              >
                                Importar
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                    {previewTemplateBiblioteca && (
                        <div className="border-t p-4 bg-slate-50">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-bold text-slate-900">Preview do Template</h3>
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
                                className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                            >
                              Fechar
                            </button>
                          </div>
                          <iframe
                              title={`Preview ${previewTemplateBiblioteca.styleId}`}
                              src={previewBibliotecaUrl}
                              className="w-full h-[520px] border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                    )}
                  </div>
              )}

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
                <div className="border-t p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Motivo da alteração
                  </label>
                  <textarea
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Ex.: ajuste de identidade visual, correção de campos, padronização do cabeçalho..."
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                    onClick={salvarLayout}
                    disabled={salvando || loading || !html.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition font-semibold"
                >
                  <Save size={20} />
                  {salvando ? 'Salvando...' : 'Salvar Draft'}
                </button>

                <button
                    onClick={publicarLayout}
                    disabled={publicando || loading || !estadoLayout.hasDraft}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition font-semibold"
                >
                  <Rocket size={20} />
                  {publicando ? 'Publicando...' : 'Publicar Draft'}
                </button>

                <button
                    onClick={alternarPreview}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold"
                >
                  <Eye size={20} />
                  {gerandoPreview ? 'Gerando...' : (previewAberta ? 'Fechar Preview' : 'Preview PDF')}
                </button>

                <button
                    onClick={resetarLayout}
                    disabled={salvando || publicando || loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition font-semibold"
                >
                  <RotateCcw size={20} />
                  Resetar
                </button>
              </div>

              {previewAberta && (
                  <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Preview real do PDF</h3>
                    <iframe
                        src={previewUrl}
                        title="Preview PDF"
                        className="w-full h-[700px] border border-gray-200 rounded"
                    />
                  </div>
              )}

              {diffAtual?.hasChanges && (
                  <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-gray-900 mb-2">Diff Draft vs Publicado</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Draft: {diffAtual.draftLineCount} linhas | Publicado: {diffAtual.publishedLineCount} linhas
                    </p>
                    <div className="bg-gray-950 text-gray-100 rounded-lg p-4 max-h-[420px] overflow-auto font-mono text-xs space-y-1">
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
                  </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-6">
                <div className="p-4 border-b flex items-center gap-2">
                  <History size={18} className="text-gray-600" />
                  <h2 className="font-bold text-gray-900">Histórico</h2>
                </div>
                <div className="max-h-[700px] overflow-y-auto divide-y">
                  {historico.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">
                        Nenhuma versão registrada ainda.
                      </div>
                  )}
                  {historico.map((versao) => (
                      <div key={versao.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-gray-900">v{versao.versionNumber}</span>
                          <span className={`text-[10px] px-2 py-1 rounded-full ${
                              versao.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : versao.status === 'DRAFT'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-gray-100 text-gray-700'
                          }`}>
                            {versao.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Criado por {versao.createdBy || 'sistema'}
                        </div>
                        {versao.changeReason && (
                            <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2">
                              {versao.changeReason}
                            </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {versao.createdAt ? new Date(versao.createdAt).toLocaleString() : 'Sem data'}
                        </div>
                        {versao.status !== 'DRAFT' && (
                            <button
                                onClick={() => rollbackVersao(versao.id)}
                                disabled={publicando}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
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
