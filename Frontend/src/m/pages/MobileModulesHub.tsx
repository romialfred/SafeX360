/**
 * MobileModulesHub — Grille de TOUS les modules métier SafeX 360 Field.
 *
 * Porte d'entrée exhaustive vers la richesse fonctionnelle de la
 * plateforme (hors Paramétrage / Administration, réservés au web) :
 * chaque tuile ouvre le registre mobile du module. Organisation par
 * domaine métier, identique à la sémantique de la sidebar web.
 */

import { useNavigate } from 'react-router-dom';
import {
    IconClipboardCheck, IconAlertTriangle, IconShieldExclamation, IconClipboardList,
    IconUsersGroup, IconListCheck, IconAlertOctagon, IconCertificate,
    IconShieldHalf, IconFileText, IconSpeakerphone, IconChartBar,
    IconBulb, IconCalendarStats, IconBomb, IconUrgent, IconRadioactive,
    IconBrain,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { SERIF } from '../components/MobileUI';

interface ModuleTile {
    label: string;
    hint: string;
    route: string;
    icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
    /** classes tailwind du carré d'icône (bg + texte) */
    tone: string;
}

interface ModuleGroup { title: string; tiles: ModuleTile[] }

const GROUPS: ModuleGroup[] = [
    {
        title: 'Opérations terrain',
        tiles: [
            { label: 'Inspections', hint: 'Planifiées, en cours, constats', route: '/m/inspections', icon: IconClipboardCheck, tone: 'bg-cyan-50 text-cyan-700' },
            { label: 'Incidents', hint: 'Mes signalements, déclaration', route: '/m/incidents/history', icon: IconAlertTriangle, tone: 'bg-amber-50 text-amber-700' },
            { label: 'Incident IA', hint: 'Déclaration assistée par IA', route: '/m/incident/ai', icon: IconBrain, tone: 'bg-violet-50 text-violet-700' },
            { label: 'Dynamitage', hint: 'Registre des tirs, prochain tir', route: '/m/blast/registry', icon: IconBomb, tone: 'bg-orange-50 text-orange-700' },
            { label: 'Urgences', hint: 'SOS, alerte générale', route: '/m/sos', icon: IconUrgent, tone: 'bg-rose-50 text-rose-700' },
        ],
    },
    {
        title: 'Qualité & conformité',
        tiles: [
            { label: 'Audits', hint: 'Registre ISO 19011', route: '/m/audits', icon: IconClipboardList, tone: 'bg-sky-50 text-sky-700' },
            { label: 'Non-conformités', hint: 'Registre, déclaration', route: '/m/non-conformities', icon: IconAlertOctagon, tone: 'bg-red-50 text-red-700' },
            { label: 'Actions correctives', hint: 'Plans d\'action CAPA', route: '/m/corrective-actions', icon: IconListCheck, tone: 'bg-amber-50 text-amber-700' },
            { label: 'Erreurs · Just Culture', hint: 'Événements, analyse', route: '/m/errors', icon: IconAlertOctagon, tone: 'bg-pink-50 text-pink-700' },
            { label: 'Ma conformité', hint: 'Exigences, documents', route: '/m/compliance', icon: IconCertificate, tone: 'bg-violet-50 text-violet-700' },
        ],
    },
    {
        title: 'Prévention',
        tiles: [
            { label: 'Risques', hint: 'Registre ISO 45001', route: '/m/risks', icon: IconShieldExclamation, tone: 'bg-purple-50 text-purple-700' },
            { label: 'Opportunités SST', hint: 'Améliorations 6.1.2.3', route: '/m/opportunities', icon: IconBulb, tone: 'bg-teal-50 text-teal-700' },
            { label: 'Réunions HSE', hint: 'Réunions, tournées leadership', route: '/m/meetings', icon: IconUsersGroup, tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Planification', hint: 'Activités HSE de l\'année', route: '/m/planning', icon: IconCalendarStats, tone: 'bg-indigo-50 text-indigo-700' },
        ],
    },
    {
        title: 'Ressources & information',
        tiles: [
            { label: 'EPI', hint: 'Catalogue, demandes', route: '/m/ppe/catalog', icon: IconShieldHalf, tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Documents', hint: 'Documents HSE approuvés', route: '/m/documents', icon: IconFileText, tone: 'bg-sky-50 text-sky-700' },
            { label: 'Communications', hint: 'Messages, consignes', route: '/m/communications', icon: IconSpeakerphone, tone: 'bg-blue-50 text-blue-700' },
            { label: 'Tableau de bord', hint: 'Indicateurs SST du site', route: '/m/dashboard', icon: IconChartBar, tone: 'bg-cyan-50 text-cyan-700' },
            { label: 'Ma dosimétrie', hint: 'Cumul annuel, exposition', route: '/m/profile/dosimetry', icon: IconRadioactive, tone: 'bg-amber-50 text-amber-700' },
        ],
    },
];

export default function MobileModulesHub() {
    useStatusBarColor('#0F766E', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();

    const open = (route: string) => {
        haptic('light');
        navigate(route);
    };

    return (
        <>
            <MobileTopBar title="Tous les modules" subtitle="SafeX 360 — plateforme complète" accent="#0F766E" onBack={() => navigate('/m/home')} />

            <div className="px-4 pb-6">
                {GROUPS.map((group) => (
                    <section key={group.title} className="pt-4">
                        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
                            {group.title}
                        </h2>
                        <div className="grid grid-cols-2 gap-2.5">
                            {group.tiles.map((tile) => {
                                const Icon = tile.icon;
                                return (
                                    <button
                                        key={tile.route + tile.label}
                                        type="button"
                                        onClick={() => open(tile.route)}
                                        className="bg-white border border-slate-200 rounded-2xl p-3.5 text-left shadow-sm active:scale-[0.98] transition"
                                        style={{ minHeight: 104 }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${tile.tone}`}>
                                            <Icon size={20} stroke={1.8} />
                                        </div>
                                        <p className="text-[13.5px] font-semibold text-slate-900 leading-tight" style={{ fontFamily: SERIF }}>
                                            {tile.label}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tile.hint}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </>
    );
}
