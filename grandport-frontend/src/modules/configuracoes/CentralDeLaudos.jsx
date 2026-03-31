import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FileCode2, Save, RotateCcw, Eye, Rocket, History } from 'lucide-react';
import toast from 'react-hot-toast';

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

export const CentralDeLaudos = () => {
  const [jrxml, setJrxml] = useState('');
  const [templateOficial, setTemplateOficial] = useState(null);
  const [bibliotecaTemplates, setBibliotecaTemplates] = useState([]);
  const [filtroBiblioteca, setFiltroBiblioteca] = useState(TODAS_FAMILIAS);
  const [previewTemplateBiblioteca, setPreviewTemplateBiblioteca] = useState(null);
  const [previewBibliotecaUrl, setPreviewBibliotecaUrl] = useState('');
  const [thumbnailBibliotecaUrls, setThumbnailBibliotecaUrls] = useState({});
  const [previewContexts, setPreviewContexts] = useState([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState('');
  const [diffAtual, setDiffAtual] = useState(null);
  const [customizado, setCustomizado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewAberto, setPreviewAberto] = useState(false);
  const [gerandoPreview, setGerandoPreview] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [changeReason, setChangeReason] = useState('');
  const [estadoTemplate, setEstadoTemplate] = useState({
    hasDraft: false,
    draftVersion: '',
    publishedVersion: '',
    officialStyleId: '',
    officialLabel: '',
    isEditorUsingOfficial: false,
    isPublishedUsingOfficial: false,
  });

  useEffect(() => {
    carregarTemplate();
    carregarTemplateOficial();
    carregarBiblioteca();
    carregarHistorico();
    carregarContextosPreview();
    carregarDiff();
  }, []);

  const carregarTemplate = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template');
      setJrxml(response.data.jrxml || '');
      setCustomizado(!!response.data.customizado);
      setEstadoTemplate({
        hasDraft: !!response.data.hasDraft,
        draftVersion: response.data.draftVersion || '',
        publishedVersion: response.data.publishedVersion || '',
        officialStyleId: response.data.officialStyleId || '',
        officialLabel: response.data.officialLabel || '',
        isEditorUsingOfficial: !!response.data.isEditorUsingOfficial,
        isPublishedUsingOfficial: !!response.data.isPublishedUsingOfficial,
      });
    } catch (error) {
      toast.error('Erro ao carregar template do laudo');
    } finally {
      setLoading(false);
    }
  };

  const carregarTemplateOficial = async () => {
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/official');
      setTemplateOficial(response.data);
    } catch (error) {
      setTemplateOficial(null);
    }
  };

  const carregarBiblioteca = async () => {
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/library');
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
    }
  };

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/historico');
      setHistorico(response.data || []);
    } catch (error) {
      setHistorico([]);
    }
  };

  const carregarContextosPreview = async () => {
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/preview-contexts');
      setPreviewContexts(response.data || []);
    } catch (error) {
      setPreviewContexts([]);
    }
  };

  const carregarDiff = async () => {
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/diff');
      setDiffAtual(response.data);
    } catch (error) {
      setDiffAtual(null);
    }
  };

  const salvarTemplate = async () => {
    if (!jrxml.trim()) {
      toast.error('JRXML não pode estar vazio');
      return;
    }

    setSalvando(true);
    try {
      const response = await api.put('/api/configuracoes/laudo-vistoria/template', { jrxml, changeReason });
      toast.success(response.data.mensagem || 'Draft do laudo salvo com sucesso!');
      await carregarTemplate();
      await carregarHistorico();
      await carregarDiff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar template do laudo');
    } finally {
      setSalvando(false);
    }
  };

  const publicarTemplate = async () => {
    setPublicando(true);
    try {
      const response = await api.post('/api/configuracoes/laudo-vistoria/template/publish', { changeReason });
      toast.success(response.data.mensagem || 'Template do laudo publicado com sucesso!');
      await carregarTemplate();
      await carregarHistorico();
      await carregarDiff();
      setChangeReason('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao publicar template do laudo');
    } finally {
      setPublicando(false);
    }
  };

  const rollbackTemplate = async (versionId) => {
    const reason = window.prompt('Motivo do rollback/publicação desta versão:', changeReason || '');
    setPublicando(true);
    try {
      const response = await api.post(`/api/configuracoes/laudo-vistoria/template/rollback/${versionId}`, {
        changeReason: reason || '',
      });
      toast.success(response.data.mensagem || 'Rollback do laudo executado com sucesso!');
      await carregarTemplate();
      await carregarHistorico();
      await carregarDiff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao executar rollback do laudo');
    } finally {
      setPublicando(false);
    }
  };

  const resetarTemplate = async () => {
    if (!window.confirm('Deseja resetar o laudo para o template padrão do sistema?')) {
      return;
    }

    setSalvando(true);
    try {
      const response = await api.post('/api/configuracoes/laudo-vistoria/template/reset');
      toast.success(response.data.mensagem || 'Template do laudo resetado');
      await carregarTemplate();
      await carregarHistorico();
      await carregarDiff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao resetar template do laudo');
    } finally {
      setSalvando(false);
    }
  };

  const importarTemplateOficial = () => {
    if (!templateOficial?.jrxml) {
      toast.error('Template oficial do laudo indisponível');
      return;
    }
    setJrxml(templateOficial.jrxml);
    setPreviewAberto(false);
    setChangeReason((valorAtual) => valorAtual || `Importação do template oficial ${templateOficial.styleId || ''}`.trim());
    toast.success('Template oficial do laudo carregado no editor');
  };

  const importarTemplateDaBiblioteca = async (styleId) => {
    try {
      const response = await api.get(`/api/configuracoes/laudo-vistoria/template/library/${styleId}`);
      setJrxml(response.data.content || '');
      setPreviewAberto(false);
      setChangeReason((valorAtual) => valorAtual || `Importação do template premium ${styleId}`.trim());
      toast.success(`Template ${response.data.label || styleId} carregado no editor`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao importar template da biblioteca');
    }
  };

  const visualizarTemplateDaBiblioteca = async (styleId) => {
    try {
      const [metaResponse, pdfResponse] = await Promise.all([
        api.get(`/api/configuracoes/laudo-vistoria/template/library/${styleId}`),
        api.get(`/api/configuracoes/laudo-vistoria/template/library/${styleId}/preview`, {
          params: selectedChecklistId ? { checklistId: selectedChecklistId } : undefined,
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
              const response = await api.get(`/api/configuracoes/laudo-vistoria/template/library/${template.styleId}/preview`, {
                params: selectedChecklistId ? { checklistId: selectedChecklistId } : undefined,
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
  }, [bibliotecaTemplates, selectedChecklistId]);

  const alternarPreview = async () => {
    if (previewAberto) {
      setPreviewAberto(false);
      return;
    }

    setGerandoPreview(true);
    try {
      const response = await api.get('/api/configuracoes/laudo-vistoria/template/preview', {
        params: selectedChecklistId ? { checklistId: selectedChecklistId } : undefined,
        responseType: 'blob',
      });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setPreviewAberto(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar preview do laudo');
    } finally {
      setGerandoPreview(false);
    }
  };

  const familiasDisponiveis = [TODAS_FAMILIAS, ...new Set(bibliotecaTemplates.map((template) => getFamiliaVisual(template.styleId)))];
  const templatesFiltrados = filtroBiblioteca === TODAS_FAMILIAS
    ? bibliotecaTemplates
    : bibliotecaTemplates.filter((template) => getFamiliaVisual(template.styleId) === filtroBiblioteca);

  return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FileCode2 className="text-orange-500" />
              Laudo de Vistoria
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Editor dedicado de JRXML para o laudo. Esse fluxo é separado da central HTML porque usa JasperReports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end text-xs">
            {estadoTemplate.officialStyleId && (
                <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full font-bold">
                  Oficial {estadoTemplate.officialStyleId}
                </span>
            )}
            <span className={`px-3 py-1 rounded-full font-bold ${
              customizado ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {customizado ? 'Template customizado' : 'Template padrão'}
            </span>
            {estadoTemplate.isPublishedUsingOfficial ? (
                <span className="bg-sky-100 text-sky-900 px-3 py-1 rounded-full font-bold">
                  Publicado segue oficial
                </span>
            ) : (
                <span className="bg-rose-100 text-rose-900 px-3 py-1 rounded-full font-bold">
                  Publicado customizado
                </span>
            )}
            {estadoTemplate.isEditorUsingOfficial ? (
                <span className="bg-cyan-100 text-cyan-900 px-3 py-1 rounded-full font-bold">
                  Editor com oficial
                </span>
            ) : (
                <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                  Editor alterado
                </span>
            )}
            {estadoTemplate.hasDraft && (
                <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                  Draft v{estadoTemplate.draftVersion}
                </span>
            )}
            {estadoTemplate.publishedVersion && (
                <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold">
                  Publicado v{estadoTemplate.publishedVersion}
                </span>
            )}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-900 mb-4">
          O backend compila o JRXML ao salvar e o preview usa checklist informado, checklist recente da empresa ou dados mockados.
        </div>

        {templateOficial && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Template Oficial do Laudo</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {templateOficial.label} {templateOficial.styleId ? `| estilo ${templateOficial.styleId}` : ''}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  Importe o oficial no editor para iniciar um novo draft a partir do padrao premium do sistema.
                </p>
              </div>
              <button
                  onClick={importarTemplateOficial}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold text-sm"
              >
                <Rocket size={16} />
                Importar Oficial
              </button>
            </div>
        )}

        {bibliotecaTemplates.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900">Biblioteca Premium do Laudo</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Importe um estilo pronto de JRXML para iniciar o draft com uma base visual diferente.
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {templatesFiltrados.map((template) => (
                    <div key={template.styleId} className="border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-3 h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          {thumbnailBibliotecaUrls[template.styleId] ? (
                              <iframe
                                  title={`Thumb ${template.styleId}`}
                                  src={thumbnailBibliotecaUrls[template.styleId]}
                                  className="h-[520px] w-[320px] origin-top-left scale-[0.25] border-0 bg-white"
                              />
                          ) : (
                              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
                                Gerando miniatura...
                              </div>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900">{template.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{template.styleId}</div>
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
                            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-bold"
                        >
                          Preview
                        </button>
                        <button
                            onClick={() => importarTemplateDaBiblioteca(template.styleId)}
                            className="px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition text-sm font-bold"
                        >
                          Importar
                        </button>
                      </div>
                    </div>
                ))}
              </div>
              {previewTemplateBiblioteca && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">Preview do JRXML</h4>
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
                          className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      >
                        Fechar
                      </button>
                    </div>
                    <iframe
                        title={`Preview ${previewTemplateBiblioteca.styleId}`}
                        src={previewBibliotecaUrl}
                        className="w-full h-[640px] border border-slate-200 rounded-2xl bg-white"
                    />
                  </div>
              )}
            </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <textarea
                value={jrxml}
                onChange={(e) => setJrxml(e.target.value)}
                disabled={loading}
                className="w-full min-h-[420px] p-4 font-mono text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Cole aqui o JRXML do laudo de vistoria..."
            />

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Motivo da alteração
              </label>
              <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Ex.: ajuste do cabeçalho, correção de posicionamento das fotos, mudança da assinatura..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Checklist usado no preview
              </label>
              <select
                  value={selectedChecklistId}
                  onChange={(e) => setSelectedChecklistId(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Automático: mais recente ou dados mockados</option>
                {previewContexts.map((context) => (
                    <option key={context.id} value={context.id}>
                      #{context.id} | {context.placa} | {context.modelo} | {context.cliente}
                    </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Selecione um checklist real para validar o JRXML com dados concretos da empresa.
              </p>
            </div>

            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                  onClick={salvarTemplate}
                  disabled={salvando || loading || !jrxml.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-bold transition"
              >
                <Save size={18} />
                {salvando ? 'Salvando...' : 'Salvar Draft'}
              </button>

              <button
                  onClick={publicarTemplate}
                  disabled={publicando || loading || !estadoTemplate.hasDraft}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold transition"
              >
                <Rocket size={18} />
                {publicando ? 'Publicando...' : 'Publicar Draft'}
              </button>

              <button
                  onClick={alternarPreview}
                  disabled={loading || gerandoPreview}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold transition"
              >
                <Eye size={18} />
                {gerandoPreview ? 'Gerando...' : previewAberto ? 'Fechar Preview' : 'Preview PDF'}
              </button>

              <button
                  onClick={resetarTemplate}
                  disabled={salvando || publicando || loading}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 font-bold transition"
              >
                <RotateCcw size={18} />
                Resetar para padrão
              </button>
            </div>

            {previewAberto && (
                <div className="mt-6">
                  <iframe
                      src={previewUrl}
                      title="Preview do Laudo de Vistoria"
                      className="w-full h-[760px] border border-slate-200 rounded-2xl"
                  />
                </div>
            )}

            {diffAtual?.hasChanges && (
                <div className="mt-6 bg-slate-950 text-slate-100 rounded-2xl p-4">
                  <h3 className="font-bold text-white mb-2">Diff Draft vs Publicado</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Draft: {diffAtual.draftLineCount} linhas | Publicado: {diffAtual.publishedLineCount} linhas
                  </p>
                  <div className="max-h-[420px] overflow-auto font-mono text-xs space-y-1">
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

          <div className="xl:col-span-1">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                <History size={16} className="text-slate-600" />
                <h3 className="font-bold text-slate-800">Histórico</h3>
              </div>
              <div className="max-h-[780px] overflow-y-auto divide-y">
                {historico.length === 0 && (
                    <div className="p-4 text-sm text-slate-500">
                      Nenhuma versão do laudo registrada ainda.
                    </div>
                )}
                {historico.map((versao) => (
                    <div key={versao.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900">v{versao.versionNumber}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${
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
                          <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">
                            {versao.changeReason}
                          </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {versao.createdAt ? new Date(versao.createdAt).toLocaleString() : 'Sem data'}
                      </div>
                      {versao.status !== 'DRAFT' && (
                          <button
                              onClick={() => rollbackTemplate(versao.id)}
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
  );
};

export default CentralDeLaudos;
