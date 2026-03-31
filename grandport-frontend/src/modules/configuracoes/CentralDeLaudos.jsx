import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FileCode2, Save, RotateCcw, Eye, Rocket, History, Library, Code2, ScanSearch } from 'lucide-react';
import toast from 'react-hot-toast';

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

export const CentralDeLaudos = () => {
  const [abaAtiva, setAbaAtiva] = useState('editor');
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
              JasperReports
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-orange-500 p-3 text-white">
                <FileCode2 size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Laudo de Vistoria</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Editor dedicado do JRXML do laudo. O preview pode usar checklist real ou dados mockados.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {estadoTemplate.officialStyleId && <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Oficial {estadoTemplate.officialStyleId}</span>}
              <span className={`rounded-full px-3 py-1 font-semibold ${customizado ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'}`}>{customizado ? 'Template customizado' : 'Template padrão'}</span>
              <span className={`rounded-full px-3 py-1 font-semibold ${estadoTemplate.isPublishedUsingOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{estadoTemplate.isPublishedUsingOfficial ? 'Publicado no oficial' : 'Publicado customizado'}</span>
              <span className={`rounded-full px-3 py-1 font-semibold ${estadoTemplate.isEditorUsingOfficial ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>{estadoTemplate.isEditorUsingOfficial ? 'Editor no oficial' : 'Editor alterado'}</span>
              {estadoTemplate.hasDraft && <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-800">Draft v{estadoTemplate.draftVersion}</span>}
              {estadoTemplate.publishedVersion && <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">Publicado v{estadoTemplate.publishedVersion}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
            <button onClick={salvarTemplate} disabled={salvando || loading || !jrxml.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"><Save size={16} />{salvando ? 'Salvando...' : 'Salvar draft'}</button>
            <button onClick={publicarTemplate} disabled={publicando || loading || !estadoTemplate.hasDraft} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"><Rocket size={16} />{publicando ? 'Publicando...' : 'Publicar'}</button>
            <button onClick={alternarPreview} disabled={loading || gerandoPreview} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><Eye size={16} />{gerandoPreview ? 'Gerando...' : previewAberto ? 'Fechar preview' : 'Preview PDF'}</button>
            <button onClick={resetarTemplate} disabled={salvando || publicando || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"><RotateCcw size={16} />Resetar</button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {ABAS_CENTRAL.map((aba) => {
          const AbaIcon = aba.icon;
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${abaAtiva === aba.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
              <AbaIcon size={15} />
              {aba.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-9">
          {abaAtiva === 'editor' && (
            <>
              {templateOficial && (
                <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Template oficial</h3>
                      <p className="mt-2 text-base font-semibold text-slate-900">{templateOficial.label} {templateOficial.styleId ? `| ${templateOficial.styleId}` : ''}</p>
                    </div>
                    <button onClick={importarTemplateOficial} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"><Rocket size={16} />Importar oficial</button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Editor JRXML</h3>
                </div>
                <textarea value={jrxml} onChange={(e) => setJrxml(e.target.value)} disabled={loading} className="min-h-[460px] w-full border-0 p-5 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Cole aqui o JRXML do laudo de vistoria..." />
                <div className="border-t border-slate-200 px-5 py-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Motivo editorial da alteração</label>
                  <textarea value={changeReason} onChange={(e) => setChangeReason(e.target.value)} className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} placeholder="Ex.: ajuste do cabeçalho, correção de posicionamento das fotos, mudança da assinatura..." />
                </div>
                <div className="border-t border-slate-200 px-5 py-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Checklist usado no preview</label>
                  <select value={selectedChecklistId} onChange={(e) => setSelectedChecklistId(e.target.value)} className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Automático: mais recente ou dados mockados</option>
                    {previewContexts.map((context) => <option key={context.id} value={context.id}>#{context.id} | {context.placa} | {context.modelo} | {context.cliente}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {abaAtiva === 'biblioteca' && bibliotecaTemplates.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Biblioteca premium</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {familiasDisponiveis.map((familia) => (
                    <button key={familia} onClick={() => setFiltroBiblioteca(familia)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filtroBiblioteca === familia ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{familia === TODAS_FAMILIAS ? 'Todas as linhas' : getLabelFamilia(familia)}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {templatesFiltrados.map((template) => (
                  <div key={template.styleId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {thumbnailBibliotecaUrls[template.styleId] ? <iframe title={`Thumb ${template.styleId}`} src={thumbnailBibliotecaUrls[template.styleId]} className="h-[520px] w-[320px] origin-top-left scale-[0.25] border-0 bg-white" /> : <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">Gerando miniatura...</div>}
                    </div>
                    <div className="text-base font-semibold text-slate-900">{template.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{template.styleId}</div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => visualizarTemplateDaBiblioteca(template.styleId)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"><Eye size={15} />Preview</button>
                      <button onClick={() => importarTemplateDaBiblioteca(template.styleId)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"><Rocket size={15} />Importar</button>
                    </div>
                  </div>
                ))}
              </div>
              {previewTemplateBiblioteca && <div className="border-t border-slate-200 bg-slate-50 p-5"><iframe title={`Preview ${previewTemplateBiblioteca.styleId}`} src={previewBibliotecaUrl} className="h-[640px] w-full rounded-2xl border border-slate-200 bg-white" /></div>}
            </div>
          )}

          {abaAtiva === 'diff' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              {diffAtual?.hasChanges ? <div className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">{diffAtual.lines?.map((line, index) => <div key={`${line.type}-${index}`} className={line.type === 'added' ? 'text-emerald-300' : line.type === 'removed' ? 'text-rose-300' : 'text-amber-200'}>{line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '! '}{line.content}</div>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">Nenhuma divergência relevante entre draft e publicado no momento.</div>}
            </div>
          )}

          {previewAberto && <div className="mt-6"><iframe src={previewUrl} title="Preview do Laudo de Vistoria" className="h-[760px] w-full rounded-2xl border border-slate-200" /></div>}
        </div>

        <div className="xl:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
              <History size={16} className="text-slate-600" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Histórico</h3>
            </div>
            <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
              {historico.length === 0 && <div className="p-4 text-sm text-slate-500">Nenhuma versão do laudo registrada ainda.</div>}
              {historico.map((versao) => (
                <div key={versao.id} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">v{versao.versionNumber}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${versao.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-900' : versao.status === 'DRAFT' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{versao.status}</span>
                  </div>
                  {versao.changeReason && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{versao.changeReason}</div>}
                  <div className="text-xs text-slate-500">{versao.createdAt ? new Date(versao.createdAt).toLocaleString() : 'Sem data'}</div>
                  {versao.status !== 'DRAFT' && <button onClick={() => rollbackTemplate(versao.id)} disabled={publicando} className="text-xs font-semibold text-slate-900 transition hover:text-slate-600">Publicar esta versão</button>}
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
