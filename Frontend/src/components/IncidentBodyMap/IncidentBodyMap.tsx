import { useState, useMemo } from 'react';
import { IconUser, IconBone, IconArrowsHorizontal } from '@tabler/icons-react';
import HumanBody, { type BodyView } from './HumanBody';

/**
 * IncidentBodyMap — Carte anatomique interactive HSE
 *
 * Pattern :
 *  - SVG humain stylisé réaliste, vue Face / Dos / Squelette
 *  - Toutes les zones anatomiques étiquetées en français (sauf organes génitaux exclus)
 *  - Heatmap proportionnelle à la fréquence des incidents par zone
 *  - Tooltip professionnel au survol : nombre, types, derniers cas
 *  - Filtres par type d'incident (Tous / NM / FAC / MTC / RWC / LTI)
 */

export type IncidentZoneStat = {
    /** Identifiant zone (snake_case) */
    zoneId: string;
    /** Libellé français complet */
    label: string;
    /** Nombre total d'incidents touchant cette zone */
    count: number;
    /** Répartition par sévérité */
    severity: 'low' | 'medium' | 'high';
    /** Derniers incidents pour le tooltip */
    incidents?: Array<{
        ref: string;
        title: string;
        type: 'NM' | 'FAC' | 'MTC' | 'RWC' | 'LTI';
        date: string;
        severity?: 'low' | 'medium' | 'high';
    }>;
};

const INCIDENT_TYPES = [
    { key: 'ALL', label: 'Tous', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { key: 'NM', label: 'NM', tooltip: 'Quasi-accident (Near Miss)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'FAC', label: 'FAC', tooltip: 'Premiers soins (First Aid Case)', color: 'bg-green-50 text-green-700 border-green-200' },
    { key: 'MTC', label: 'MTC', tooltip: 'Soins médicaux (Medical Treatment Case)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'RWC', label: 'RWC', tooltip: 'Travail aménagé (Restricted Work Case)', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { key: 'LTI', label: 'LTI', tooltip: 'Accident avec arrêt (Lost Time Injury)', color: 'bg-red-50 text-red-700 border-red-200' },
];

interface IncidentBodyMapProps {
    /** Statistiques par zone (depuis backend ou seed) */
    stats?: IncidentZoneStat[];
    /** Hauteur du SVG (défaut 540px) */
    height?: number;
    className?: string;
}

const IncidentBodyMap = ({ stats: providedStats, height = 540, className = '' }: IncidentBodyMapProps) => {
    const [view, setView] = useState<BodyView>('front');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);

    // Données fictives crédibles si aucune stat fournie (à brancher backend en Phase 2)
    const stats = useMemo<IncidentZoneStat[]>(() => providedStats ?? [
        { zoneId: 'head', label: 'Tête', count: 14, severity: 'medium',
          incidents: [
            { ref: 'INC-2026-018', title: 'Chute objet zone stockage', type: 'MTC', date: '2026-05-19' },
            { ref: 'INC-2026-014', title: 'Heurt poutre métallique', type: 'FAC', date: '2026-05-08' },
          ] },
        { zoneId: 'neck', label: 'Cou / nuque', count: 7, severity: 'low',
          incidents: [
            { ref: 'INC-2026-012', title: 'Torsion cervicale port de charge', type: 'NM', date: '2026-05-02' },
          ] },
        { zoneId: 'shoulder_left', label: 'Épaule gauche', count: 9, severity: 'medium' },
        { zoneId: 'shoulder_right', label: 'Épaule droite', count: 11, severity: 'medium',
          incidents: [
            { ref: 'INC-2026-009', title: 'Élongation épaule manutention', type: 'MTC', date: '2026-04-22' },
          ] },
        { zoneId: 'chest', label: 'Thorax', count: 5, severity: 'low' },
        { zoneId: 'arm_left', label: 'Bras gauche', count: 8, severity: 'low' },
        { zoneId: 'arm_right', label: 'Bras droit', count: 10, severity: 'medium' },
        { zoneId: 'abdomen', label: 'Abdomen', count: 3, severity: 'low' },
        { zoneId: 'elbow_left', label: 'Coude gauche', count: 12, severity: 'medium' },
        { zoneId: 'elbow_right', label: 'Coude droit', count: 18, severity: 'medium' },
        { zoneId: 'hand_left', label: 'Main gauche', count: 24, severity: 'high',
          incidents: [
            { ref: 'INC-2026-007', title: 'Coupure paume', type: 'MTC', date: '2026-04-12' },
            { ref: 'INC-2026-003', title: 'Écrasement doigt', type: 'LTI', date: '2026-03-18' },
          ] },
        { zoneId: 'hand_right', label: 'Main droite', count: 31, severity: 'high',
          incidents: [
            { ref: 'INC-2026-019', title: 'Brûlure main droite', type: 'LTI', date: '2026-05-21' },
            { ref: 'INC-2026-011', title: 'Écorchure dos main', type: 'FAC', date: '2026-04-29' },
          ] },
        { zoneId: 'hip_left', label: 'Hanche gauche', count: 4, severity: 'low' },
        { zoneId: 'hip_right', label: 'Hanche droite', count: 5, severity: 'low' },
        { zoneId: 'thigh_left', label: 'Cuisse gauche', count: 11, severity: 'medium' },
        { zoneId: 'thigh_right', label: 'Cuisse droite', count: 13, severity: 'medium' },
        { zoneId: 'knee_left', label: 'Genou gauche', count: 6, severity: 'low' },
        { zoneId: 'knee_right', label: 'Genou droit', count: 7, severity: 'low' },
        { zoneId: 'foot_left', label: 'Pied gauche', count: 9, severity: 'low' },
        { zoneId: 'foot_right', label: 'Pied droit', count: 11, severity: 'medium' },
    ], [providedStats]);

    // Filtre par type
    const filteredStats = useMemo(() => {
        if (typeFilter === 'ALL') return stats;
        return stats.map(s => ({
            ...s,
            count: s.incidents?.filter(i => i.type === typeFilter).length || 0,
            incidents: s.incidents?.filter(i => i.type === typeFilter),
        })).filter(s => s.count > 0);
    }, [stats, typeFilter]);

    const hoveredStat = filteredStats.find(s => s.zoneId === hoveredZone);
    const totalIncidents = filteredStats.reduce((sum, s) => sum + s.count, 0);

    const now = new Date();
    const scanTime = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return (
        <div className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                <div className="p-1 rounded bg-teal-100">
                    <IconUser size={14} className="text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider leading-tight">
                        Carte anatomique interactive
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Cliquez sur une zone pour voir le détail · Couleur = sévérité · Taille = fréquence
                    </p>
                </div>
                {/* Toggle vue */}
                <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-md">
                    <button
                        type="button"
                        onClick={() => setView('front')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all ${view === 'front' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <IconUser size={11} />
                        Face
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('back')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all ${view === 'back' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <IconArrowsHorizontal size={11} />
                        Dos
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('skeleton')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all ${view === 'skeleton' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <IconBone size={11} />
                        Squelette
                    </button>
                </div>
            </header>

            {/* Mini scan info bar */}
            <div className="px-4 py-1.5 bg-slate-900 text-slate-300 text-[10px] font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                    <span className="uppercase tracking-wider">Scan mode</span>
                    <span className="opacity-60">·</span>
                    <span>{filteredStats.length} zones</span>
                </span>
                <span className="text-slate-400">{scanTime}</span>
            </div>

            {/* Container scène anatomique */}
            <div className="relative bg-gradient-to-br from-slate-50 via-white to-teal-50/30 overflow-hidden">
                <div className="flex items-stretch">
                    {/* Corps humain SVG */}
                    <div className="flex-1 relative" style={{ minHeight: height }}>
                        <HumanBody
                            view={view}
                            stats={filteredStats}
                            hoveredZone={hoveredZone}
                            onHover={setHoveredZone}
                            height={height}
                        />

                        {/* Tooltip dynamique au survol */}
                        {hoveredStat && (
                            <div className="absolute top-3 right-3 max-w-[280px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-30 pointer-events-none">
                                <div className={`px-3 py-2 border-b ${
                                    hoveredStat.severity === 'high' ? 'bg-red-50/70 border-red-200/70' :
                                    hoveredStat.severity === 'medium' ? 'bg-amber-50/70 border-amber-200/70' :
                                    'bg-green-50/70 border-green-200/70'
                                } flex items-center gap-2`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                        hoveredStat.severity === 'high' ? 'bg-red-500' :
                                        hoveredStat.severity === 'medium' ? 'bg-amber-500' :
                                        'bg-green-500'
                                    }`}></span>
                                    <h4 className="text-xs text-slate-900 flex-1 truncate">{hoveredStat.label}</h4>
                                    <span className="text-xs text-slate-800 tabular-nums">{hoveredStat.count}</span>
                                </div>
                                <div className="p-3 space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                        Derniers incidents
                                    </p>
                                    {(hoveredStat.incidents && hoveredStat.incidents.length > 0) ? (
                                        hoveredStat.incidents.slice(0, 3).map((inc) => (
                                            <div key={inc.ref} className="border-l-2 border-slate-200 pl-2 py-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono text-slate-600">{inc.ref}</span>
                                                    <span className={`inline-flex items-center px-1 py-0 rounded text-[9px] ${
                                                        inc.type === 'LTI' ? 'bg-red-100 text-red-700' :
                                                        inc.type === 'RWC' ? 'bg-orange-100 text-orange-700' :
                                                        inc.type === 'MTC' ? 'bg-amber-100 text-amber-700' :
                                                        inc.type === 'FAC' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>{inc.type}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-700 leading-tight mt-0.5 line-clamp-1">{inc.title}</p>
                                                <p className="text-[9px] text-slate-400">{inc.date}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[11px] text-slate-500 italic">Aucun détail disponible pour cette zone</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer bar : légende + filtres */}
                <div className="px-3 py-2 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between flex-wrap gap-2 text-white">
                    {/* Légende sévérité */}
                    <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Faible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Modéré</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span>Élevé</span>
                        </div>
                        <span className="ml-2 text-slate-400">Total : <span className="text-white tabular-nums">{totalIncidents}</span></span>
                    </div>

                    {/* Filtres type d'incident */}
                    <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-800 rounded-md">
                        {INCIDENT_TYPES.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTypeFilter(t.key)}
                                title={t.tooltip}
                                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                                    typeFilter === t.key
                                        ? 'bg-teal-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentBodyMap;
