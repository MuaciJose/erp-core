import React, { useEffect, useState } from 'react';
import { CheckCircle2, DraftingCompass, FileWarning, Layers3, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statCardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';

export const LayoutGovernanceDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarResumo = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/configuracoes/layouts/overview');
      setOverview(response.data);
    } catch (error) {
      toast.error('Erro ao carregar o resumo de governanca dos layouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResumo();
  }, []);

  if (loading && !overview) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-500">Carregando resumo da governanca de impressao...</div>
        </div>
    );
  }

  const documents = overview?.documents || [];
  const laudo = overview?.laudo;
  const danfe = overview?.danfe;
  const allDocuments = [...documents, ...(laudo ? [laudo] : []), ...(danfe ? [danfe] : [])];

  return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Layers3 className="text-violet-600" />
              Governanca de Impressao
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Veja rapidamente quais documentos estao no padrao oficial, customizados ou com draft pendente.
            </p>
          </div>
          <button
              onClick={carregarResumo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition text-sm font-bold"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={statCardClass}>
            <div className="text-xs font-bold uppercase text-slate-400">Documentos</div>
            <div className="text-3xl font-black text-slate-900 mt-2">{overview?.totalDocuments || allDocuments.length}</div>
          </div>
          <div className={statCardClass}>
            <div className="text-xs font-bold uppercase text-slate-400">Publicados Oficiais</div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{overview?.publishedOfficialCount || 0}</div>
          </div>
          <div className={statCardClass}>
            <div className="text-xs font-bold uppercase text-slate-400">Publicados Customizados</div>
            <div className="text-3xl font-black text-amber-600 mt-2">{overview?.publishedCustomCount || 0}</div>
          </div>
          <div className={statCardClass}>
            <div className="text-xs font-bold uppercase text-slate-400">Drafts Pendentes</div>
            <div className="text-3xl font-black text-sky-600 mt-2">{overview?.draftsCount || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {allDocuments.map((document) => (
              <div key={document.tipo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">{document.label}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {document.templateType === 'jrxml' ? 'JRXML Jasper' : 'HTML Thymeleaf'} | oficial {document.officialStyleId}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 text-[11px]">
                    {document.publishedUsingOfficial ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-900">
                          <CheckCircle2 size={12} />
                          Publicado oficial
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-900">
                          <FileWarning size={12} />
                          Publicado customizado
                        </span>
                    )}
                    {document.hasDraft && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 font-bold text-sky-900">
                          <DraftingCompass size={12} />
                          Draft v{document.draftVersion}
                        </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[11px] font-bold uppercase text-slate-400">Editor</div>
                    <div className={`mt-2 font-bold ${document.editorUsingOfficial ? 'text-slate-900' : 'text-amber-700'}`}>
                      {document.editorUsingOfficial ? 'Seguindo oficial' : 'Alterado'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[11px] font-bold uppercase text-slate-400">Publicado</div>
                    <div className={`mt-2 font-bold ${document.publishedUsingOfficial ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {document.publishedUsingOfficial ? 'Oficial' : 'Customizado'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  {document.publishedVersion && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                        Publicado v{document.publishedVersion}
                      </span>
                  )}
                  {!document.publishedVersion && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                        Sem versao publicada registrada
                      </span>
                  )}
                  {!document.hasDraft && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                        Sem draft pendente
                      </span>
                  )}
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};

export default LayoutGovernanceDashboard;
