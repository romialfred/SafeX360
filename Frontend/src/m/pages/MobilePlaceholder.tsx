/**
 * MobilePlaceholder — Ecran d'attente professionnel pour les modules
 * embarques dont la vue mobile native sera livree en Phase M2.
 *
 * Volontairement sobre : pas de "Coming soon" marketing. Indique simplement
 * que le contenu est prepare pour la prochaine livraison.
 */

import { useNavigate } from 'react-router-dom';
import { IconCircleDashed, IconArrowLeft } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';

interface MobilePlaceholderProps {
    title: string;
    subtitle?: string;
    phaseTag?: string;
    accent?: string;
}

export default function MobilePlaceholder({
    title,
    subtitle,
    phaseTag = 'Phase M2',
    accent = '#0E7490',
}: MobilePlaceholderProps) {
    useStatusBarColor(accent, 'LIGHT');
    const navigate = useNavigate();

    return (
        <>
            <MobileTopBar
                title={title}
                subtitle={subtitle}
                accent={accent}
                onBack={() => navigate(-1)}
            />
            <section className="px-4 pt-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                    <IconCircleDashed size={28} stroke={1.6} className="text-slate-400" />
                </div>
                <p
                    className="text-slate-900 mb-1"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '18px',
                    }}
                >
                    Écran en cours de préparation
                </p>
                <p className="text-[13px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Ce module sera livré dans la {phaseTag} du chantier mobile.
                    La fondation est en place, la connexion aux données arrivera
                    dans la prochaine itération.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
                    className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-cyan-700 text-white text-[13px] font-medium"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Retour à l'accueil
                </button>
            </section>
        </>
    );
}
