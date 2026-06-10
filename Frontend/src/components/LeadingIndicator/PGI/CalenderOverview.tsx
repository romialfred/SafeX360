import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconCalendarStats, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import EmptyState from "../../UtilityComp/EmptyState";
import { getAllPgi } from "../../../services/PgiService";
import { errorNotification } from "../../../utility/NotificationUtility";
import { INSPECTION_STATUS_CONFIG, inspectionStatusConfig } from "./pgiLabels";

const WEEKDAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Clé locale yyyy-MM-dd (sans bascule UTC). */
const dayKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Calendrier mensuel des inspections HSE planifiées : chaque inspection est
 * positionnée sur sa date planifiée et renvoie vers son dossier.
 */
const CalenderOverview = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    useEffect(() => {
        setLoading(true);
        getAllPgi({})
            .then((res) => setData(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des inspections');
            })
            .finally(() => setLoading(false));
    }, []);

    /** Inspections indexées par jour (clé yyyy-MM-dd locale). */
    const inspectionsByDay = useMemo(() => {
        const map: Record<string, any[]> = {};
        data.forEach((item) => {
            if (!item.plannedDate) return;
            const date = new Date(item.plannedDate);
            if (Number.isNaN(date.getTime())) return;
            const key = dayKey(date);
            (map[key] = map[key] || []).push(item);
        });
        return map;
    }, [data]);

    /** Grille du mois courant : semaines complètes du lundi au dimanche. */
    const weeks = useMemo(() => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const gridStart = new Date(firstDay);
        // getDay() : 0=dimanche … on recale sur le lundi précédent
        const offset = (firstDay.getDay() + 6) % 7;
        gridStart.setDate(firstDay.getDate() - offset);

        const result: Date[][] = [];
        const cursor = new Date(gridStart);
        do {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(new Date(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
            result.push(week);
        } while (cursor.getMonth() === currentMonth.getMonth());
        return result;
    }, [currentMonth]);

    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const monthCount = data.filter((item) => {
        if (!item.plannedDate) return false;
        const date = new Date(item.plannedDate);
        return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth();
    }).length;

    const todayKey = dayKey(new Date());

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Inspections HSE', to: '/PGI' },
                    { label: 'Calendrier' },
                ]}
                icon={<IconCalendarStats size={22} stroke={2} />}
                iconColor="green"
                title="Calendrier des inspections"
                subtitle="Vue mensuelle des inspections HSE planifiées sur le site"
                actions={
                    <Button variant="default" size="sm" leftSection={<IconArrowLeft size={14} />} onClick={() => navigate('/PGI')}>
                        Retour au registre
                    </Button>
                }
            />

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Barre de navigation mensuelle */}
                <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Tooltip label="Mois précédent" withArrow>
                            <ActionIcon
                                variant="default"
                                size="sm"
                                onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                aria-label="Mois précédent"
                            >
                                <IconChevronLeft size={14} />
                            </ActionIcon>
                        </Tooltip>
                        <span
                            className="text-slate-800 capitalize min-w-[150px] text-center"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                        >
                            {monthLabel}
                        </span>
                        <Tooltip label="Mois suivant" withArrow>
                            <ActionIcon
                                variant="default"
                                size="sm"
                                onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                aria-label="Mois suivant"
                            >
                                <IconChevronRight size={14} />
                            </ActionIcon>
                        </Tooltip>
                        <Button
                            variant="subtle"
                            color="teal"
                            size="compact-xs"
                            onClick={() => {
                                const now = new Date();
                                setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                            }}
                        >
                            Aujourd'hui
                        </Button>
                    </div>
                    <span className="text-[11.5px] text-slate-500">
                        {monthCount} inspection{monthCount > 1 ? 's' : ''} ce mois-ci
                    </span>
                    {/* Légende des statuts */}
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        {Object.entries(INSPECTION_STATUS_CONFIG).map(([key, cfg]) => (
                            <span key={key} className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${cfg.chip}`}>
                                {cfg.label}
                            </span>
                        ))}
                    </div>
                </header>

                {loading ? (
                    <div className="p-4 grid grid-cols-7 gap-2" aria-busy="true">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !data.length ? (
                    <EmptyState
                        icon={<IconCalendarStats size={24} />}
                        title="Aucune inspection planifiée"
                        description="Le calendrier se remplit au fur et à mesure des planifications d'inspections HSE."
                        compact
                    />
                ) : (
                    <div className="p-3">
                        {/* En-têtes des jours */}
                        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                            {WEEKDAYS_FR.map((day) => (
                                <div key={day} className="text-center text-[10.5px] uppercase tracking-wider text-slate-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Grille des semaines */}
                        <div className="space-y-1.5">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="grid grid-cols-7 gap-1.5">
                                    {week.map((date) => {
                                        const key = dayKey(date);
                                        const inMonth = date.getMonth() === currentMonth.getMonth();
                                        const isToday = key === todayKey;
                                        const dayInspections = inspectionsByDay[key] ?? [];
                                        return (
                                            <div
                                                key={key}
                                                className={`min-h-[76px] rounded-lg border p-1.5 ${
                                                    inMonth ? 'bg-white border-slate-200' : 'bg-slate-50/60 border-slate-100'
                                                } ${isToday ? 'ring-1 ring-teal-400 border-teal-300' : ''}`}
                                            >
                                                <p
                                                    className={`text-[11px] tabular-nums mb-1 ${
                                                        isToday
                                                            ? 'text-teal-700 font-semibold'
                                                            : inMonth
                                                            ? 'text-slate-600'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {date.getDate()}
                                                </p>
                                                <div className="space-y-1">
                                                    {dayInspections.slice(0, 3).map((item: any) => {
                                                        const cfg = inspectionStatusConfig(item.status);
                                                        return (
                                                            <Tooltip
                                                                key={item.id}
                                                                label={`${item.title} — ${cfg.label}${item.siteName ? ` · ${item.siteName}` : ''}`}
                                                                withArrow
                                                            >
                                                                <Link
                                                                    to={`/PGI/details-pgi/${item.id}`}
                                                                    className={`block truncate rounded border px-1 py-0.5 text-[10px] leading-tight ${cfg.chip}`}
                                                                >
                                                                    {item.title}
                                                                </Link>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                    {dayInspections.length > 3 && (
                                                        <p className="text-[10px] text-slate-500 px-1">
                                                            +{dayInspections.length - 3} autre{dayInspections.length - 3 > 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CalenderOverview
