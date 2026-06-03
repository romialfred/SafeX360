import { useNavigate } from "react-router-dom";
import {
    IconActivity, IconAlertTriangle, IconClipboardCheck, IconReportAnalytics, IconUserCheck,
    IconChartHistogram, IconChecks, IconClipboardList, IconRoute, IconSearch,
    IconArrowUpRight, IconArrowDownRight, IconClock, IconUser, IconFileText,
    IconBolt, IconShieldCheck, IconUsers,
} from "@tabler/icons-react";
import IncidentBodyMap from "../components/IncidentBodyMap/IncidentBodyMap";

/**
 * Tableau de bord HSE — page d'accueil opérationnelle.
 * Synthétise les KPIs ISO 45001 et offre des raccourcis vers les actions
 * attendues de l'utilisateur connecté (investigations, CAPA, tournées, audits).
 *
 * Données fictives crédibles (mine Citizen Mining, mai 2026).
 * À brancher sur les services HSE en Phase 2.
 */

const OhsDashboardPage = () => {
    const navigate = useNavigate();

    // === KPIs principaux ISO 45001 ===
    const kpis = [
        {
            label: "Taux de fréquence LTI", short: "LTIFR",
            value: "1,2", unit: "/ 200 000 h", trend: "-0,8",
            trendDir: "down" as const, target: "Cible 2,0",
            color: "red", icon: IconAlertTriangle,
        },
        {
            label: "Taux d'incidents enregistrables", short: "TRIFR",
            value: "2,8", unit: "/ 200 000 h", trend: "-0,3",
            trendDir: "down" as const, target: "Cible 3,5",
            color: "orange", icon: IconClipboardCheck,
        },
        {
            label: "Signalements quasi-accidents", short: "Near Miss",
            value: "45", unit: "/ mois", trend: "+12",
            trendDir: "up" as const, target: "Cible 40",
            color: "blue", icon: IconReportAnalytics,
        },
        {
            label: "Taux de formation HSE", short: "Formation",
            value: "96", unit: "%", trend: "+4",
            trendDir: "up" as const, target: "Cible 95 %",
            color: "green", icon: IconUserCheck,
        },
        {
            label: "Jours sans incident", short: "Sans incident",
            value: "47", unit: "jours", trend: "+47",
            trendDir: "up" as const, target: "Record 92 j",
            color: "teal", icon: IconActivity,
        },
    ];

    // === Actions attendues de l'utilisateur ===
    const myActions = [
        {
            id: "inv-2026-018",
            title: "Investigation incident INC-2026-018",
            description: "Chute d'objet en zone de stockage atelier 2. Analyse causale ICAM à compléter.",
            dueText: "Échéance dans 2 jours",
            due: "urgent",
            type: "Investigation",
            icon: IconSearch,
            color: "red",
            path: "/incidents/18",
        },
        {
            id: "capa-145",
            title: "CAPA-2026-145 à valider",
            description: "Renforcement signalisation passage piéton. Vérification d'efficacité requise.",
            dueText: "Échéance dans 5 jours",
            due: "warning",
            type: "Action corrective",
            icon: IconChecks,
            color: "orange",
            path: "/non-conformity",
        },
        {
            id: "tour-006",
            title: "Tournée Leadership TDM-2026-006",
            description: "Visite sécurité atelier maintenance. Vous êtes désigné sponsor direction.",
            dueText: "Planifiée demain 09:00",
            due: "info",
            type: "Tournée",
            icon: IconRoute,
            color: "indigo",
            path: "/steering-tours",
        },
        {
            id: "audit-2026-q2",
            title: "Audit interne AUD-2026-Q2-03",
            description: "Audit conformité ISO 45001. Phase préparation à finaliser.",
            dueText: "Lancement dans 8 jours",
            due: "info",
            type: "Audit",
            icon: IconClipboardList,
            color: "violet",
            path: "/audit-management",
        },
    ];

    // === Synthèse des activités récentes ===
    const recentActivity = [
        {
            time: "Il y a 12 min",
            type: "Incident",
            label: "INC-2026-019 déclaré",
            description: "Quasi-accident, chute évitée en zone de stockage.",
            user: "Hamidou Cissé",
            severity: "warning",
            icon: IconAlertTriangle,
        },
        {
            time: "Il y a 38 min",
            type: "Inspection",
            label: "IGP-2026-042 clôturée",
            description: "Inspection LOTO atelier maintenance. 0 non-conformité.",
            user: "John Johnson",
            severity: "success",
            icon: IconShieldCheck,
        },
        {
            time: "Il y a 1 h",
            type: "Réunion",
            label: "RSS-2026-031 tenue",
            description: "Causerie sécurité sur les risques de chute en hauteur (24 participants).",
            user: "Aïcha Diallo",
            severity: "info",
            icon: IconUsers,
        },
        {
            time: "Il y a 2 h",
            type: "CAPA",
            label: "CAPA-2026-144 clôturée",
            description: "Remplacement extincteur expiré atelier 3. Efficacité vérifiée.",
            user: "Moussa Traoré",
            severity: "success",
            icon: IconChecks,
        },
        {
            time: "Il y a 3 h",
            type: "Audit",
            label: "AUD-2026-Q2-02 en exécution",
            description: "Audit fournisseur SECURIMINE, visite site en cours.",
            user: "Fatou Sow",
            severity: "info",
            icon: IconClipboardList,
        },
    ];

    // === Statistiques de mon département ===
    const departmentStats = [
        { label: "Incidents déclarés", value: 7, period: "30 j", change: "-2", trendDir: "down" as const, color: "blue" },
        { label: "Investigations clôturées", value: 5, period: "30 j", change: "+5", trendDir: "up" as const, color: "green" },
        { label: "CAPA en retard", value: 2, period: "Actuel", change: "-1", trendDir: "down" as const, color: "red" },
        { label: "Conformité formations", value: "94 %", period: "Actuel", change: "+2 pts", trendDir: "up" as const, color: "teal" },
    ];

    // === Échéances à venir ===
    const upcomingEvents = [
        { date: "22 mai", title: "Tournée Leadership atelier maintenance", category: "TDM", color: "indigo" },
        { date: "23 mai", title: "Réunion CHSCT mensuelle", category: "RSS", color: "green" },
        { date: "26 mai", title: "Audit interne ISO 45001 trimestriel", category: "Audit", color: "violet" },
        { date: "28 mai", title: "Inspection HSE zone stockage carburant", category: "IGP", color: "blue" },
        { date: "31 mai", title: "Revue de direction mensuelle", category: "Direction", color: "amber" },
    ];

    const colorMap: Record<string, { bg: string; text: string; border: string; accent: string }> = {
        red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", accent: "bg-red-500" },
        orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", accent: "bg-orange-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-500" },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", accent: "bg-yellow-500" },
        green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", accent: "bg-green-500" },
        teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", accent: "bg-teal-500" },
        blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-500" },
        indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", accent: "bg-indigo-500" },
        violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", accent: "bg-violet-500" },
        slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", accent: "bg-slate-500" },
    };

    const severityColor: Record<string, string> = {
        warning: "text-orange-600 bg-orange-50 border-orange-200",
        success: "text-green-600 bg-green-50 border-green-200",
        info: "text-blue-600 bg-blue-50 border-blue-200",
        urgent: "text-red-600 bg-red-50 border-red-200",
    };

    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            {/* =========================================================
                BLOC 1 — KPIs principaux (5 tuiles raffinées)
                ========================================================= */}
            <section>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpis.map((k, i) => {
                        const c = colorMap[k.color];
                        const Icon = k.icon;
                        return (
                            <div
                                key={i}
                                className={`group bg-white rounded-lg border ${c.border} hover:shadow-md transition-all overflow-hidden`}
                            >
                                <div className={`h-1 ${c.accent}`}></div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p-1.5 rounded-md ${c.bg} ${c.border} border`}>
                                            <Icon size={15} className={c.text} />
                                        </div>
                                        <div className={`inline-flex items-center gap-0.5 text-[10px] ${k.trendDir === "down" ? "text-green-700" : "text-blue-700"}`}>
                                            {k.trendDir === "down" ? <IconArrowDownRight size={11} /> : <IconArrowUpRight size={11} />}
                                            <span>{k.trend}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl ${c.text} tabular-nums`}>{k.value}</span>
                                        <span className="text-[10px] text-slate-500">{k.unit}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-800 mt-1.5 leading-tight">{k.label}</p>
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-500">{k.target}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* =========================================================
                BLOC 2 — Mes actions attendues + Activité récente
                ========================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mes actions (2/3 largeur) */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-teal-100">
                            <IconBolt size={14} className="text-teal-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Mes actions attendues
                        </h2>
                        <span className="ml-auto text-[11px] text-slate-500">
                            {myActions.length} en cours
                        </span>
                    </header>
                    <div className="divide-y divide-slate-100">
                        {myActions.map((a) => {
                            const c = colorMap[a.color];
                            const Icon = a.icon;
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => navigate(a.path)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                                >
                                    <div className={`p-2 rounded-md ${c.bg} ${c.border} border flex-shrink-0`}>
                                        <Icon size={16} className={c.text} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] uppercase tracking-wider ${c.text}`}>
                                                {a.type}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityColor[a.due]}`}>
                                                {a.dueText}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-900 mt-0.5 leading-tight">
                                            {a.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                            {a.description}
                                        </p>
                                    </div>
                                    <IconArrowUpRight size={14} className="text-slate-300 group-hover:text-teal-600 flex-shrink-0 mt-1" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Activité récente (1/3 largeur) */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-200">
                            <IconActivity size={14} className="text-slate-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Activité récente
                        </h2>
                        <span className="ml-auto text-[11px] text-slate-500">Citizen Mining</span>
                    </header>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {recentActivity.map((a, i) => {
                            const Icon = a.icon;
                            return (
                                <div key={i} className="px-4 py-2.5">
                                    <div className="flex items-start gap-2.5">
                                        <div className={`p-1 rounded border ${severityColor[a.severity]} flex-shrink-0 mt-0.5`}>
                                            <Icon size={11} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-600">
                                                    {a.type}
                                                </span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-[10px] text-slate-500">{a.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-900 mt-0.5 leading-tight">
                                                {a.label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                                {a.description}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                                <IconUser size={10} />
                                                <span>{a.user}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* =========================================================
                BLOC 3 — Statistiques département + Échéances à venir
                ========================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Statistiques département */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-100">
                            <IconReportAnalytics size={14} className="text-blue-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Synthèse de mon département
                        </h2>
                        <span className="ml-auto text-[11px] text-slate-500">HSE — Direction</span>
                    </header>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {departmentStats.map((s, i) => {
                            const c = colorMap[s.color];
                            return (
                                <div key={i} className={`rounded-md border ${c.border} bg-white p-3 hover:shadow-sm transition-shadow`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{s.period}</span>
                                        <div className={`inline-flex items-center gap-0.5 text-[10px] ${s.trendDir === "down" ? "text-green-700" : "text-blue-700"}`}>
                                            {s.trendDir === "down" ? <IconArrowDownRight size={10} /> : <IconArrowUpRight size={10} />}
                                            <span>{s.change}</span>
                                        </div>
                                    </div>
                                    <p className={`text-2xl ${c.text} tabular-nums leading-none`}>{s.value}</p>
                                    <p className="text-[11px] text-slate-700 mt-1.5 leading-tight">{s.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Échéances à venir */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-100">
                            <IconClock size={14} className="text-amber-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Échéances à venir (10 jours)
                        </h2>
                        <span className="ml-auto text-[11px] text-slate-500">{upcomingEvents.length} planifiées</span>
                    </header>
                    <div className="divide-y divide-slate-100">
                        {upcomingEvents.map((e, i) => {
                            const c = colorMap[e.color];
                            return (
                                <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div className={`flex flex-col items-center justify-center w-12 py-1 rounded-md ${c.bg} ${c.border} border flex-shrink-0`}>
                                        <span className={`text-[10px] uppercase tracking-wider ${c.text}`}>
                                            {e.date.split(' ')[1].slice(0, 3)}
                                        </span>
                                        <span className={`text-base ${c.text} leading-none`}>
                                            {e.date.split(' ')[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-900 leading-tight line-clamp-1">{e.title}</p>
                                        <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider ${c.text}`}>
                                            {e.category}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* =========================================================
                BLOC 3bis — Cartographie anatomique des incidents
                ========================================================= */}
            <section>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-200">
                            <IconShieldCheck size={14} className="text-slate-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                            Carte anatomique des incidents
                        </h2>
                        <span className="ml-auto text-[11px] text-slate-500">12 derniers mois</span>
                    </header>
                    <div className="p-3">
                        <IncidentBodyMap height={580} />
                    </div>
                </div>
            </section>

            {/* =========================================================
                BLOC 4 — Accès rapides modules
                ========================================================= */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xs text-slate-700 uppercase tracking-wider">Accès rapides</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: "Déclarer incident", icon: IconAlertTriangle, path: "/incidents/report", color: "red" },
                        { label: "Constat central", icon: IconFileText, path: "/non-conformity/create", color: "violet" },
                        { label: "Inspection HSE", icon: IconSearch, path: "/PGI/report", color: "green" },
                        { label: "Tournée Leadership", icon: IconRoute, path: "/add-tour", color: "indigo" },
                        { label: "Réunion sécurité", icon: IconUsers, path: "/add-NewActivity", color: "teal" },
                        { label: "Plan annuel HSE", icon: IconChartHistogram, path: "/hs-activities-planning", color: "amber" },
                    ].map((q, i) => {
                        const c = colorMap[q.color];
                        const Icon = q.icon;
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => navigate(q.path)}
                                className={`group bg-white rounded-lg border ${c.border} hover:border-transparent hover:shadow-md transition-all p-3 flex items-center gap-3 text-left`}
                            >
                                <div className={`p-2 rounded-md ${c.bg} ${c.border} border group-hover:scale-110 transition-transform`}>
                                    <Icon size={16} className={c.text} />
                                </div>
                                <span className="text-xs text-slate-800 leading-tight flex-1">{q.label}</span>
                                <IconArrowUpRight size={12} className="text-slate-300 group-hover:text-teal-600" />
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default OhsDashboardPage;
