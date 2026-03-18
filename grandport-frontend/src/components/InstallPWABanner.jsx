import React, { useState, useEffect } from 'react';
import { Download, MonitorSmartphone, X } from 'lucide-react';

export const InstallPWABanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [fechado, setFechado] = useState(false);

    useEffect(() => {
        // Captura o evento que o navegador dispara quando descobre que o site é um PWA
        const handleBeforeInstallPrompt = (e) => {
            // Impede que o mini-banner padrão do Chrome apareça sozinho (opcional, mas recomendado)
            e.preventDefault();
            // Guarda o evento no state para usarmos quando o usuário clicar no nosso botão
            setDeferredPrompt(e);
            // Mostra o nosso banner personalizado
            setIsInstallable(true);
        };

        // Escuta quando o app termina de ser instalado com sucesso
        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA instalado com sucesso!');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Dispara a janela de confirmação oficial do navegador (aquela com o ícone e nome do app)
        deferredPrompt.prompt();

        // Aguarda a resposta do usuário (se ele clicou em "Instalar" ou "Cancelar")
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Escolha do usuário: ${outcome}`);

        // Limpa o evento, pois ele só pode ser usado uma vez
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    // Se não for instalável (já está instalado ou não é suportado) ou se o usuário fechou no "X", não renderiza nada
    if (!isInstallable || fechado) return null;

    return (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border border-blue-500/50 animate-fade-in relative overflow-hidden">
            {/* Ícone de fundo decorativo */}
            <MonitorSmartphone className="absolute -right-4 -bottom-4 text-white/10" size={100} />

            <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                <div className="bg-white/20 p-3 rounded-xl shadow-inner backdrop-blur-sm shrink-0">
                    <Download size={24} className="text-blue-100" />
                </div>
                <div>
                    <h3 className="font-black text-lg tracking-wide flex items-center gap-2">
                        Instale o GrandPort ERP
                    </h3>
                    <p className="text-blue-200 text-sm font-medium mt-0.5">
                        Tenha acesso rápido, em tela cheia e off-line na sua área de trabalho ou tablet.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto bg-white text-blue-800 font-black px-6 py-3 rounded-xl hover:bg-blue-50 transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                    <Download size={18} /> INSTALAR AGORA
                </button>
                <button
                    onClick={() => setFechado(true)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-blue-100"
                    title="Agora não"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};