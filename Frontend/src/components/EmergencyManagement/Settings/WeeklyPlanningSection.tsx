import { useEffect, useMemo, useState } from 'react';
import {
    IconCalendarStats,
    IconSun,
    IconMoon,
    IconChevronLeft,
    IconChevronRight,
    IconEdit,
    IconCheck,
    IconX,
    IconUsersGroup,
} from '@tabler/icons-react';
import {
    listRescueTeams,
    listRescueWeeklyPlanning,
    upsertRescueWeeklyPlanning,
    type RescueTeamDTO,
    type RescueWeeklyPlanningDTO,
} from '../../../services/EmergencyService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';

/**
 * Section « Planification hebdomadaire » (LOT 48 Phase 1.c.2).
 *
 * <p>Remplace l'ancien concept de « Roulements » au niveau équipe par une
 * planification au niveau <strong>mine</strong>. Chaque semaine, on désigne :</p>
 * <ul>
 *   <li>L'équipe en charge du <strong>shift jour</strong> (06:00 → 18:00 par défaut)</li>
 *   <li>L'équipe en charge du <strong>shift nuit</strong> (18:00 → 06:00 par défaut)</li>
 * </ul>
 *
 * <p>Navigation par semaines : vue principale = semaine courante + 4 semaines
 * suivantes. Chaque carte peut être éditée pour assigner ou changer l'équipe.</p>
 */

interface Props {
    companyId: number;
}

// ── Utilitaires dates ──
const toIso = (d: Date) => d.toISOString().slice(0, 10);

const startOfWeek = (d: Date) => {
    const dd = new Date(d);
    const day = dd.getDay();
    const diff = day === 0 ? -6 : 1 - day; // lundi = 1
    dd.setDate(dd.getDate() + diff);
    dd.setHours(0, 0, 0, 0);
    return dd;
};

const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
};

const formatRange = (startIso: string) => {
    const start = new Date(startIso + 'T00:00:00');
    const end = addDays(start, 6);
    const fmt = (d: Date) =>
        d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `${fmt(start)} → ${fmt(end)}`;
};

const formatWeekShort = (startIso: string) => {
    const start = new Date(startIso + 'T00:00:00');
    const week = Math.ceil(
        ((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000 +
            new Date(start.getFullYear(), 0, 1).getDay() +
            1) /
            7
    );
    return `S${week} · ${start.getFullYear()}`;
};

const isCurrentWeek = (startIso: string) => {
    const today = startOfWeek(new Date());
    return toIso(today) === startIso;
};

// ── Composant ──
const WeeklyPlanningSection = ({ companyId }: Props) => {
    const currentUser = useAppSelector((state: any) => state.user);

    const [anchorMonday, setAnchorMonday] = useState<Date>(startOfWeek(new Date()));
    const [teams, setTeams] = useState<RescueTeamDTO[]>([]);
    const [plannings, setPlannings] = useState<Record<string, RescueWeeklyPlanningDTO>>({});
    const [loading, setLoading] = useState(true);
    const [editingWeek, setEditingWeek] = useState<string | null>(null);
    const [draftDay, setDraftDay] = useState<string>('');
    const [draftNight, setDraftNight] = useState<string>('');
    const [draftDayStart, setDraftDayStart] = useState('06:00');
    const [draftDayEnd, setDraftDayEnd] = useState('18:00');
    const [draftNightStart, setDraftNightStart] = useState('18:00');
    const [draftNightEnd, setDraftNightEnd] = useState('06:00');
    const [draftNotes, setDraftNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const weeks = useMemo(() => {
        // 5 semaines à partir de l'ancre (semaine 1 = anchor - 1, courante au centre)
        const list: string[] = [];
        for (let i = -1; i <= 3; i++) {
            list.push(toIso(addDays(anchorMonday, i * 7)));
        }
        return list;
    }, [anchorMonday]);

    // ── Chargement teams + plannings ──
    useEffect(() => {
        if (!companyId) return;
        listRescueTeams(companyId)
            .then((list) => setTeams(list.filter((t) => t.status !== 'INACTIVE')))
            .catch(() => setTeams([]));
    }, [companyId]);

    useEffect(() => {
        if (!companyId || weeks.length === 0) return;
        setLoading(true);
        const from = weeks[0];
        const to = weeks[weeks.length - 1];
        listRescueWeeklyPlanning(companyId, from, to)
            .then((list) => {
                const map: Record<string, RescueWeeklyPlanningDTO> = {};
                list.forEach((p) => {
                    if (p.weekStartDate) map[p.weekStartDate] = p;
                });
                setPlannings(map);
            })
            .catch(() => setPlannings({}))
            .finally(() => setLoading(false));
    }, [companyId, weeks]);

    const teamName = (id?: number | null) => {
        if (!id) return null;
        return teams.find((t) => t.id === id)?.name ?? `#${id}`;
    };

    // ── Édition ──
    const openEdit = (weekIso: string) => {
        const existing = plannings[weekIso];
        setEditingWeek(weekIso);
        setDraftDay(existing?.dayTeamId ? String(existing.dayTeamId) : '');
        setDraftNight(existing?.nightTeamId ? String(existing.nightTeamId) : '');
        setDraftDayStart(existing?.dayStartHour ?? '06:00');
        setDraftDayEnd(existing?.dayEndHour ?? '18:00');
        setDraftNightStart(existing?.nightStartHour ?? '18:00');
        setDraftNightEnd(existing?.nightEndHour ?? '06:00');
        setDraftNotes(existing?.notes ?? '');
    };

    const cancelEdit = () => {
        setEditingWeek(null);
    };

    const handleSave = async () => {
        if (!editingWeek) return;
        setSaving(true);
        try {
            const saved = await upsertRescueWeeklyPlanning(
                {
                    companyId,
                    weekStartDate: editingWeek,
                    dayTeamId: draftDay ? Number(draftDay) : null,
                    nightTeamId: draftNight ? Number(draftNight) : null,
                    dayStartHour: draftDayStart,
                    dayEndHour: draftDayEnd,
                    nightStartHour: draftNightStart,
                    nightEndHour: draftNightEnd,
                    notes: draftNotes || null,
                },
                currentUser?.id
            );
            setPlannings((prev) => ({ ...prev, [editingWeek]: saved }));
            setEditingWeek(null);
            successNotification('Planning enregistré');
        } catch (err) {
            errorNotification(extractErrorMessage(err, "Échec de l'enregistrement du planning"));
        } finally {
            setSaving(false);
        }
    };

    // ── Navigation ──
    const prevPage = () => setAnchorMonday((d) => addDays(d, -7));
    const nextPage = () => setAnchorMonday((d) => addDays(d, 7));
    const goToday = () => setAnchorMonday(startOfWeek(new Date()));

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-cyan-400 rounded-xl p-5 shadow-sm">
            <header className="flex items-start justify-between gap-3 mb-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 flex-shrink-0" aria-hidden="true">
                        <IconCalendarStats size={15} stroke={1.6} />
                    </span>
                    <div>
                        <h3
                            className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            Planification hebdomadaire
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            Affectation des équipes par semaine — shift jour & nuit
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={prevPage}
                        title="Semaine précédente"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                        <IconChevronLeft size={13} stroke={1.8} />
                    </button>
                    <button
                        type="button"
                        onClick={goToday}
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 text-[11px] font-medium hover:bg-slate-50"
                    >
                        Aujourd'hui
                    </button>
                    <button
                        type="button"
                        onClick={nextPage}
                        title="Semaine suivante"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                        <IconChevronRight size={13} stroke={1.8} />
                    </button>
                </div>
            </header>

            {loading ? (
                <p className="text-[12px] text-slate-400 italic">Chargement…</p>
            ) : teams.length === 0 ? (
                <div className="text-center py-8 bg-amber-50/60 border border-dashed border-amber-200 rounded-lg">
                    <IconUsersGroup size={24} className="text-amber-500 mx-auto mb-2" stroke={1.5} />
                    <p className="text-[12px] text-slate-700 mb-1">
                        Aucune équipe de secours configurée.
                    </p>
                    <p className="text-[11px] text-slate-500">
                        Créez d'abord des équipes pour pouvoir établir une planification.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {weeks.map((weekIso) => {
                        const planning = plannings[weekIso];
                        const isEditing = editingWeek === weekIso;
                        const dayName = planning?.dayTeamName || teamName(planning?.dayTeamId);
                        const nightName = planning?.nightTeamName || teamName(planning?.nightTeamId);
                        const current = isCurrentWeek(weekIso);

                        return (
                            <article
                                key={weekIso}
                                className={`border rounded-lg overflow-hidden bg-white transition-colors ${
                                    current
                                        ? 'border-cyan-300 ring-1 ring-cyan-100'
                                        : 'border-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50/60 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${
                                                current ? 'text-cyan-700' : 'text-slate-600'
                                            }`}
                                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                        >
                                            {formatWeekShort(weekIso)}
                                        </span>
                                        <span className="text-[11.5px] text-slate-500">
                                            {formatRange(weekIso)}
                                        </span>
                                        {current && (
                                            <span className="text-[9.5px] uppercase tracking-wider font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                                                Semaine en cours
                                            </span>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => openEdit(weekIso)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-cyan-700 border border-cyan-200 bg-white hover:bg-cyan-50"
                                        >
                                            <IconEdit size={10} stroke={1.8} />
                                            {planning ? 'Modifier' : 'Planifier'}
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="p-3 space-y-3 bg-slate-50/40">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* Shift jour */}
                                            <div className="border border-amber-200 rounded-lg bg-amber-50/40 p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IconSun size={14} stroke={1.7} className="text-amber-600" />
                                                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-800">
                                                        Shift Jour
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <select
                                                        value={draftDay}
                                                        onChange={(e) => setDraftDay(e.target.value)}
                                                        className="w-full px-2.5 py-1.5 text-[12.5px] border border-amber-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                                    >
                                                        <option value="">— Aucune équipe —</option>
                                                        {teams.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name}{' '}
                                                                {t.memberCount ? `· ${t.memberCount} membres` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] text-amber-700 mb-0.5">Début</label>
                                                            <input
                                                                type="time"
                                                                value={draftDayStart}
                                                                onChange={(e) => setDraftDayStart(e.target.value)}
                                                                className="w-full px-2 py-1 text-[12px] border border-amber-200 bg-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-amber-700 mb-0.5">Fin</label>
                                                            <input
                                                                type="time"
                                                                value={draftDayEnd}
                                                                onChange={(e) => setDraftDayEnd(e.target.value)}
                                                                className="w-full px-2 py-1 text-[12px] border border-amber-200 bg-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shift nuit */}
                                            <div className="border border-indigo-200 rounded-lg bg-indigo-50/40 p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IconMoon size={14} stroke={1.7} className="text-indigo-600" />
                                                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-800">
                                                        Shift Nuit
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <select
                                                        value={draftNight}
                                                        onChange={(e) => setDraftNight(e.target.value)}
                                                        className="w-full px-2.5 py-1.5 text-[12.5px] border border-indigo-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                                    >
                                                        <option value="">— Aucune équipe —</option>
                                                        {teams.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name}{' '}
                                                                {t.memberCount ? `· ${t.memberCount} membres` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] text-indigo-700 mb-0.5">Début</label>
                                                            <input
                                                                type="time"
                                                                value={draftNightStart}
                                                                onChange={(e) => setDraftNightStart(e.target.value)}
                                                                className="w-full px-2 py-1 text-[12px] border border-indigo-200 bg-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-indigo-700 mb-0.5">Fin</label>
                                                            <input
                                                                type="time"
                                                                value={draftNightEnd}
                                                                onChange={(e) => setDraftNightEnd(e.target.value)}
                                                                className="w-full px-2 py-1 text-[12px] border border-indigo-200 bg-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] text-slate-500 mb-1">
                                                Notes (optionnel)
                                            </label>
                                            <textarea
                                                value={draftNotes}
                                                onChange={(e) => setDraftNotes(e.target.value)}
                                                rows={2}
                                                placeholder="Astreinte WE, jour férié, formation, etc."
                                                className="w-full px-3 py-1.5 text-[12.5px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 bg-white"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={cancelEdit}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-[12px] text-slate-700 hover:bg-slate-50"
                                            >
                                                <IconX size={11} stroke={2} />
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                                            >
                                                <IconCheck size={11} stroke={2.4} />
                                                {saving ? '…' : 'Enregistrer'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        {/* Aperçu jour */}
                                        <div className="px-3 py-2.5 flex items-center gap-2.5">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex-shrink-0">
                                                <IconSun size={14} stroke={1.8} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                                                    Jour
                                                    {planning?.dayStartHour && (
                                                        <span className="ml-1 text-slate-500 normal-case font-normal tracking-normal">
                                                            {planning.dayStartHour} → {planning.dayEndHour}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[12.5px] text-slate-800 truncate">
                                                    {dayName ?? (
                                                        <span className="text-slate-400 italic">Non assigné</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Aperçu nuit */}
                                        <div className="px-3 py-2.5 flex items-center gap-2.5">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex-shrink-0">
                                                <IconMoon size={14} stroke={1.8} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase tracking-wider text-indigo-700 font-semibold">
                                                    Nuit
                                                    {planning?.nightStartHour && (
                                                        <span className="ml-1 text-slate-500 normal-case font-normal tracking-normal">
                                                            {planning.nightStartHour} → {planning.nightEndHour}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[12.5px] text-slate-800 truncate">
                                                    {nightName ?? (
                                                        <span className="text-slate-400 italic">Non assigné</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isEditing && planning?.notes && (
                                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 italic">
                                        ⓘ {planning.notes}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default WeeklyPlanningSection;
