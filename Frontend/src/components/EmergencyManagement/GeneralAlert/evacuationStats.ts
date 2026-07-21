/**
 * evacuationStats — couche de calcul PARTAGÉE de l'appel d'évacuation.
 *
 * Une seule source de vérité pour les deux vues temps réel : le tableau de bord
 * intégré (onglet du centre de commande) et l'écran géant détaché. Les deux
 * doivent afficher EXACTEMENT les mêmes chiffres — d'où cette fonction pure,
 * sans React, testable et réutilisable.
 *
 * Règles métier (identiques à l'appel nominatif) :
 *  - « Reste à pointer » (pending) = employé SANS pointage. Ce n'est PAS un
 *    statut ; ne jamais le fusionner avec MISSING (absence constatée).
 *  - « Non concerné » (NOT_APPLICABLE) est retiré de l'effectif à sécuriser :
 *    on ne cherche pas quelqu'un en congé pendant une évacuation.
 *  - Le taux de mise en sécurité se calcule sur l'effectif CONCERNÉ
 *    (total − non concernés), pas sur l'effectif brut.
 */

export type EvacStatus = 'SAFE' | 'INJURED' | 'MISSING' | 'NOT_APPLICABLE';

export interface EvacEmployee {
    id: number;
    name: string;
    department?: string;
    position?: string;
}

export interface EvacCheckIn {
    employeeId: number;
    status: EvacStatus;
    checkedAt?: string;
    assemblyPointId?: number | null;
    assemblyPointName?: string | null;
    note?: string | null;
}

export interface EvacAssemblyPoint {
    id?: number;
    name?: string;
    evacuationPriority?: number;
}

export const STATUS_COLOR: Record<EvacStatus | 'PENDING', string> = {
    SAFE: '#10b981', // emerald-500
    INJURED: '#f59e0b', // amber-500
    MISSING: '#ef4444', // red-500
    NOT_APPLICABLE: '#94a3b8', // slate-400
    PENDING: '#64748b', // slate-500
};

export const STATUS_LABEL: Record<EvacStatus | 'PENDING', string> = {
    SAFE: 'En sécurité',
    INJURED: 'Blessés',
    MISSING: 'Absents',
    NOT_APPLICABLE: 'Non concernés',
    PENDING: 'Reste à pointer',
};

export interface DeptRow {
    department: string;
    total: number;
    safe: number;
    injured: number;
    missing: number;
    notApplicable: number;
    pending: number;
    concerned: number;
    /** Localisés = tout sauf « reste à pointer ». */
    accounted: number;
    /** Taux de mise en sécurité sur l'effectif concerné (0–100). */
    pct: number;
}

export interface CriticalPerson {
    id: number;
    name: string;
    department: string;
    kind: 'pending' | 'missing' | 'injured';
    assemblyPointName?: string | null;
}

export interface RosterPerson {
    id: number;
    name: string;
    department: string;
}

export type RosterByStatus = Record<EvacStatus | 'PENDING', RosterPerson[]>;

export interface ProgressPoint {
    /** Minutes écoulées depuis le déclenchement. */
    tMin: number;
    /** Horodatage lisible (HH:MM). */
    label: string;
    /** Cumul des personnes mises en sécurité à cet instant. */
    safe: number;
    /** Cumul des personnes localisées (tout pointage) à cet instant. */
    accounted: number;
}

export interface EvacuationStats {
    total: number;
    concerned: number;
    safe: number;
    injured: number;
    missing: number;
    notApplicable: number;
    pending: number;
    accounted: number;
    /** Taux de mise en sécurité (safe / concerné), 0–100. */
    securedPct: number;
    /** Taux de personnes localisées (accounted / total), 0–100. */
    accountedPct: number;
    /** Non localisés = reste à pointer. Le chiffre qui doit tomber à 0. */
    unaccounted: number;
    donut: { key: EvacStatus | 'PENDING'; label: string; value: number; color: string }[];
    byAssemblyPoint: { id: number | null; name: string; priority?: number; count: number }[];
    byDepartment: DeptRow[];
    injuredList: CriticalPerson[];
    criticalList: CriticalPerson[];
    /** Liste des employés par statut (pour les popovers de survol). */
    rosterByStatus: RosterByStatus;
    progression: ProgressPoint[];
    /** Cadence moyenne de localisation (personnes / minute). */
    ratePerMin: number;
    elapsedSec: number;
}

const NO_DEPT = 'Sans département';

function minutesBetween(fromIso: string | undefined, toMs: number): number {
    if (!fromIso) return 0;
    const from = new Date(fromIso).getTime();
    if (Number.isNaN(from)) return 0;
    return Math.max(0, (toMs - from) / 60000);
}

export function computeEvacuationStats(
    employees: EvacEmployee[],
    checkIns: EvacCheckIn[],
    assemblyPoints: EvacAssemblyPoint[] = [],
    triggeredAt?: string,
    nowMs: number = Date.now(),
): EvacuationStats {
    // Un pointage par employé (le plus récent l'emporte).
    const byEmp = new Map<number, EvacCheckIn>();
    checkIns.forEach((c) => byEmp.set(c.employeeId, c));

    let safe = 0, injured = 0, missing = 0, notApplicable = 0, pending = 0;
    const injuredList: CriticalPerson[] = [];
    const criticalList: CriticalPerson[] = [];
    const rosterByStatus: RosterByStatus = { SAFE: [], INJURED: [], MISSING: [], NOT_APPLICABLE: [], PENDING: [] };

    employees.forEach((e) => {
        const dept = e.department?.trim() || NO_DEPT;
        const person: RosterPerson = { id: e.id, name: e.name, department: dept };
        const ci = byEmp.get(e.id);
        if (!ci) {
            pending++;
            rosterByStatus.PENDING.push(person);
            criticalList.push({ id: e.id, name: e.name, department: dept, kind: 'pending' });
            return;
        }
        switch (ci.status) {
            case 'SAFE': safe++; rosterByStatus.SAFE.push(person); break;
            case 'INJURED':
                injured++;
                rosterByStatus.INJURED.push(person);
                injuredList.push({ id: e.id, name: e.name, department: dept, kind: 'injured', assemblyPointName: ci.assemblyPointName });
                break;
            case 'MISSING':
                missing++;
                rosterByStatus.MISSING.push(person);
                criticalList.push({ id: e.id, name: e.name, department: dept, kind: 'missing' });
                break;
            case 'NOT_APPLICABLE': notApplicable++; rosterByStatus.NOT_APPLICABLE.push(person); break;
        }
    });
    // Tri alphabétique de chaque liste (lecture au survol).
    (Object.keys(rosterByStatus) as (EvacStatus | 'PENDING')[]).forEach((k) =>
        rosterByStatus[k].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })));

    const total = employees.length;
    const concerned = total - notApplicable;
    const accounted = total - pending;
    const securedPct = concerned === 0 ? 100 : Math.round((safe / concerned) * 100);
    const accountedPct = total === 0 ? 0 : Math.round((accounted / total) * 100);

    // Absents d'abord (critique), puis blessés — pour l'affichage prioritaire.
    criticalList.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, 'fr') : a.kind === 'missing' ? -1 : 1));

    // ── Répartition (donut) ──
    const donut = ([
        ['SAFE', safe], ['INJURED', injured], ['MISSING', missing],
        ['PENDING', pending], ['NOT_APPLICABLE', notApplicable],
    ] as [EvacStatus | 'PENDING', number][])
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ key, value, label: STATUS_LABEL[key], color: STATUS_COLOR[key] }));

    // ── Par point de rassemblement (présents = SAFE ou INJURED avec point) ──
    const apName = new Map<number, { name: string; priority?: number }>();
    assemblyPoints.forEach((p) => { if (p.id != null) apName.set(p.id, { name: p.name || `Point #${p.id}`, priority: p.evacuationPriority }); });
    const apCount = new Map<number | null, number>();
    checkIns.forEach((c) => {
        if (c.status !== 'SAFE' && c.status !== 'INJURED') return;
        const key = c.assemblyPointId ?? null;
        apCount.set(key, (apCount.get(key) || 0) + 1);
    });
    const byAssemblyPoint = Array.from(apCount.entries())
        .map(([id, count]) => ({
            id,
            count,
            name: id == null ? 'Point non précisé' : (apName.get(id)?.name || `Point #${id}`),
            priority: id == null ? undefined : apName.get(id)?.priority,
        }))
        .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99) || b.count - a.count);

    // ── Par département ──
    const deptMap = new Map<string, DeptRow>();
    const ensure = (d: string): DeptRow => {
        if (!deptMap.has(d)) deptMap.set(d, { department: d, total: 0, safe: 0, injured: 0, missing: 0, notApplicable: 0, pending: 0, concerned: 0, accounted: 0, pct: 0 });
        return deptMap.get(d)!;
    };
    employees.forEach((e) => {
        const row = ensure(e.department?.trim() || NO_DEPT);
        row.total++;
        const ci = byEmp.get(e.id);
        if (!ci) { row.pending++; return; }
        if (ci.status === 'SAFE') row.safe++;
        else if (ci.status === 'INJURED') row.injured++;
        else if (ci.status === 'MISSING') row.missing++;
        else if (ci.status === 'NOT_APPLICABLE') row.notApplicable++;
    });
    const byDepartment = Array.from(deptMap.values()).map((r) => {
        r.concerned = r.total - r.notApplicable;
        r.accounted = r.total - r.pending;
        r.pct = r.concerned === 0 ? 100 : Math.round((r.safe / r.concerned) * 100);
        return r;
    }).sort((a, b) => a.pct - b.pct || b.total - a.total); // les moins avancés en tête

    // ── Progression temporelle (cumul sécurisés + localisés) ──
    const timed = checkIns
        .filter((c) => c.checkedAt)
        .slice()
        .sort((a, b) => new Date(a.checkedAt!).getTime() - new Date(b.checkedAt!).getTime());
    const progression: ProgressPoint[] = [{ tMin: 0, label: '0', safe: 0, accounted: 0 }];
    let cumSafe = 0, cumAcc = 0;
    timed.forEach((c) => {
        cumAcc++;
        if (c.status === 'SAFE') cumSafe++;
        const tMin = triggeredAt ? Math.round(minutesBetween(triggeredAt, new Date(c.checkedAt!).getTime()) * 10) / 10 : progression.length;
        const label = c.checkedAt ? new Date(c.checkedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        progression.push({ tMin, label, safe: cumSafe, accounted: cumAcc });
    });
    // Point courant (plateau jusqu'à maintenant) pour que la courbe "vive".
    const elapsedMin = triggeredAt ? minutesBetween(triggeredAt, nowMs) : progression.length;
    if (triggeredAt) {
        progression.push({
            tMin: Math.round(elapsedMin * 10) / 10,
            label: new Date(nowMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            safe: cumSafe, accounted: cumAcc,
        });
    }

    const elapsedSec = triggeredAt ? Math.max(0, Math.round((nowMs - new Date(triggeredAt).getTime()) / 1000)) : 0;
    const ratePerMin = elapsedMin > 0.5 ? Math.round((accounted / elapsedMin) * 10) / 10 : 0;

    return {
        total, concerned, safe, injured, missing, notApplicable, pending, accounted,
        securedPct, accountedPct, unaccounted: pending,
        donut, byAssemblyPoint, byDepartment, injuredList, criticalList, rosterByStatus, progression,
        ratePerMin, elapsedSec,
    };
}

export function formatClock(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    return `${m}:${String(ss).padStart(2, '0')}`;
}
