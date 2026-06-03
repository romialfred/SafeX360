import { Button } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft, IconHome } from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * Page 404 sobre — affichée pour toute URL non définie.
 * Remplace l'ancien écran "Coming Soon" qui faisait croire à des fonctionnalités manquantes.
 */
const ComingSoonPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex w-full flex-col items-center justify-center min-h-[calc(100vh-60px)] bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-white border-b border-amber-200/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 border border-amber-200">
                            <IconAlertTriangle size={22} className="text-amber-700" stroke={2} />
                        </div>
                        <div>
                            <h1 className="text-base text-slate-900">Page introuvable</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Erreur 404 · Ressource non disponible</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        La page demandée n'existe pas ou a été déplacée. Vérifiez l'URL ou utilisez
                        les liens de navigation pour retourner à une zone fonctionnelle.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                            Adresse demandée
                        </p>
                        <p className="text-xs font-mono text-slate-700 break-all">
                            {location.pathname}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            variant="default"
                            size="sm"
                            leftSection={<IconArrowLeft size={14} />}
                            onClick={() => navigate(-1)}
                        >
                            Page précédente
                        </Button>
                        <Button
                            component={Link}
                            to="/"
                            color="teal"
                            size="sm"
                            leftSection={<IconHome size={14} />}
                        >
                            Tableau de bord
                        </Button>
                    </div>
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
                    Si cette page devrait exister, signalez-le à l'équipe HSE Platform.
                </div>
            </div>
        </div>
    );
};

export default ComingSoonPage;
