import React, { useRef, useState } from 'react';
import api from '../../api/axios';
import { UploadCloud, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const BotaoImportarRetorno = ({ onSucesso }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        const idToast = toast.loading(`A analisar arquivo ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/api/financeiro/edi/retorno/importar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(response.data, { id: idToast, duration: 6000 });

            // Recarrega a tabela de Contas a Receber
            if (onSucesso) onSucesso();

        } catch (error) {
            let msg = "Erro ao importar o arquivo de retorno.";
            const data = error.response?.data;

            // 🛡️ Se o Java mandar um Objeto JSON, extraímos só o texto!
            if (data) {
                if (typeof data === 'string') msg = data;
                else if (data.message) msg = data.message;
                else if (data.error) msg = data.error;
            }

            toast.error(msg, { id: idToast });
        } finally {
            setLoading(false);
            if (event.target) event.target.value = null;
        }
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".txt,.ret"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full md:w-auto bg-slate-900 text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                LER RETORNO
            </button>
        </div>
    );
};