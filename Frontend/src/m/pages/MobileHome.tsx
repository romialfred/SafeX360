/**
 * MobileHome — Tableau de bord personnel terrain.
 *
 * Sections de la v1 :
 *   1. Salutation + identite (nom, role, mine)
 *   2. Prochain tir confirme (compte a rebours + zone)
 *   3. Mes inspections du jour
 *   4. Raccourcis tactiles (4 tuiles)
 *   5. Mes 3 derniers constats / incidents
 *
 * La M0 livre la structure visuelle + le squelette de donnees vide. La
 * connexion API arrivera en Phase M2.
 */

import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
    IconExclamationCircle,
    IconShield,
    IconCertificate,
    IconBolt,
    IconChevronRight,
    IconCalendarStats,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';

export default function MobileHome() {
    useStatusBarColor('#0E7490', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);

    const displayName = user?.firstName
        ? `${user.firstName} ${user.familyName || ''}`.trim()
        : user?.name || 'Bonjour';
    const role = user?.role || 'Personnel HSE';

    const go = (path: string) => {
        haptic('light');
        navigate(path);
    };

    return (
        <>
            <MobileTopBar title="SafeX 360 Field" subtitle={role} accent="#0E7490" />

            {/* Salutation */}
            <section className="px-4 pt-4 pb-2">
                <p className="text-[12px] uppercase tracking-[0.14em] text-slate-500">
                    Bonjour,
                </p>
                <h2
                    className="text-slate-900 mt-0.5"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '22px',
                        letterSpacing: '-0.015em',
                    }}
                >
                    {displayName}
                </h2>
            </section>

            {/* Carte prochain tir (placeholder M0) */}
            <section className="px-4 pt-3">
                <article className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <IconBolt size={18} stroke={1.8} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10.5px] uppercase tracking-[0.16em] text-amber-700">
                                Prochain tir
                            </p>
                            <p
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: '15px',
                                }}
                            >
                                Aucun tir programmé
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => go('/m/blast/next')}
                        className="text-[12.5px] text-amber-800 font-medium inline-flex items-center gap-1"
                    >
                        Voir le planning des tirs
                        <IconChevronRight size={14} stroke={1.8} />
                    </button>
                </article>
            </section>

            {/* Mes inspections du jour */}
            <section className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em]">
                        Mes inspections du jour
                    </h3>
                    <button
                        type="button"
                        onClick={() => go('/m/inspections')}
                        className="text-[12px] text-cyan-700 font-medium"
                    >
                        Tout voir
                    </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center text-[13px] text-slate-500">
                    <IconCalendarStats size={22} stroke={1.6} className="text-slate-300 mx-auto mb-1.5" />
                    Aucune inspection planifiée aujourd'hui.
                </div>
            </section>

            {/* Raccourcis */}
            <section className="px-4 pt-5">
                <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em] mb-2">
                    Raccourcis
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <ShortcutTile
                        icon={<IconClipboardList size={22} stroke={1.8} />}
                        label="Inspecter"
                        sublabel="Démarrer une inspection"
                        accent="from-cyan-500 to-blue-600"
                        onClick={() => go('/m/inspections')}
                    />
                    <ShortcutTile
                        icon={<IconExclamationCircle size={22} stroke={1.8} />}
                        label="Incident"
                        sublabel="Déclarer en 90 s"
                        accent="from-amber-500 to-orange-600"
                        onClick={() => go('/m/incident/new')}
                    />
                    <ShortcutTile
                        icon={<IconShield size={22} stroke={1.8} />}
                        label="Mes EPI"
                        sublabel="Dotation personnelle"
                        accent="from-emerald-500 to-teal-600"
                        onClick={() => go('/m/profile/ppe')}
                    />
                    <ShortcutTile
                        icon={<IconCertificate size={22} stroke={1.8} />}
                        label="Mes formations"
                        sublabel="Habilitations à jour"
                        accent="from-violet-500 to-purple-600"
                        onClick={() => go('/m/profile/trainings')}
                    />
                </div>
            </section>
        </>
    );
}

function ShortcutTile({
    icon,
    label,
    sublabel,
    accent,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    accent: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 text-left active:scale-[0.98] transition shadow-sm"
            style={{ minHeight: 96 }}
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <div className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                {label}
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                {sublabel}
            </div>
        </button>
    );
}
