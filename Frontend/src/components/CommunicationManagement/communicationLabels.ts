/**
 * Libellés et conventions du module Communication Sécurité.
 *
 * Le backend conserve des codes historiques en anglais (types, catégories,
 * statuts de planification, statuts de notification). Toute la traduction et
 * la palette de statuts (charte R7) sont centralisées ici : un seul endroit
 * à maintenir pour l'ensemble des pages du module.
 */

// ─── Types de communication (codes backend = libellés anglais historiques) ──

export const TYPE_LABELS: Record<string, string> = {
    'Blasting Notification': 'Annonce de tir',
    'New Procedure': 'Nouvelle procédure',
    'HSE Update': 'Actualité HSE',
    'Safety Briefing': 'Briefing sécurité',
    'Training Announcement': 'Annonce de formation',
    'Policy Update': 'Mise à jour de politique',
    'Emergency Drill': "Exercice d'urgence",
    'Equipment Update': 'Mise à jour équipement',
};

export const CATEGORY_LABELS: Record<string, string> = {
    Safety: 'Sécurité',
    Operations: 'Opérations',
    Training: 'Formation',
    Administrative: 'Administratif',
    Emergency: 'Urgence',
};

/** Couleurs Mantine par catégorie (badges). */
export const CATEGORY_COLORS: Record<string, string> = {
    Safety: 'red',
    Operations: 'blue',
    Training: 'teal',
    Administrative: 'gray',
    Emergency: 'orange',
};

/** Options prêtes pour <Select> : valeur = code backend, libellé = FR. */
export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export const typeLabel = (code?: string | null) => (code ? TYPE_LABELS[code] ?? code : '—');
export const categoryLabel = (code?: string | null) => (code ? CATEGORY_LABELS[code] ?? code : '—');

// ─── Planification ──────────────────────────────────────────────────────────

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
    ONE_TIME: 'Envoi unique',
    WEEKLY: 'Hebdomadaire',
    BI_WEEKLY: 'Toutes les deux semaines',
    MONTHLY: 'Mensuel',
};

export const SCHEDULE_TYPE_OPTIONS = Object.entries(SCHEDULE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const WEEKLY_DAY_LABELS: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche',
};

export const WEEKLY_DAY_OPTIONS = Object.entries(WEEKLY_DAY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const scheduleTypeLabel = (code?: string | null) =>
    code ? SCHEDULE_TYPE_LABELS[code] ?? code : '—';
export const weeklyDayLabel = (code?: string | null) =>
    code ? WEEKLY_DAY_LABELS[code] ?? code : '—';

// ─── Statuts de communication (planification) — palette charte R7 ───────────

export interface ChipConfig {
    label: string;
    /** Classes Tailwind du chip bordé. */
    chip: string;
}

const CHIP_NEUTRE = 'bg-slate-50 text-slate-600 border-slate-200';

export const COMM_STATUS_CONFIG: Record<string, ChipConfig> = {
    ACTIVE: { label: 'Active', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SCHEDULED: { label: 'Planifiée', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    RUNNING: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    PAUSED: { label: 'En pause', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Terminée', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    CANCELED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    FAILED: { label: 'Échec', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    SENT: { label: 'Envoyée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const commStatusConfig = (status?: string | null): ChipConfig =>
    COMM_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ? String(status) : 'Sans planification',
        chip: CHIP_NEUTRE,
    };

// ─── Statuts de notification (envois) ────────────────────────────────────────

export const NOTIF_STATUS_CONFIG: Record<string, ChipConfig> = {
    SUCCESS: { label: 'Envoyée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SENT: { label: 'Envoyée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DELIVERED: { label: 'Délivrée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Terminée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    QUEUED: { label: "En file d'envoi", chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    SENDING: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    FAILED: { label: 'Échec', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    FAILURE: { label: 'Échec', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    ERROR: { label: 'Échec', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
    CANCELED: { label: 'Annulée', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const notifStatusConfig = (status?: string | null): ChipConfig =>
    NOTIF_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ? String(status) : '—',
        chip: CHIP_NEUTRE,
    };

export const isNotifFailure = (status?: string | null) =>
    ['FAILED', 'FAILURE', 'ERROR'].includes((status ?? '').toUpperCase());

// ─── Urgence ─────────────────────────────────────────────────────────────────

export const URGENCY_CONFIG: Record<string, ChipConfig> = {
    URGENT: { label: 'Urgente', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    CRITICAL: { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    HIGH: { label: 'Élevée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    MEDIUM: { label: 'Moyenne', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    LOW: { label: 'Faible', chip: CHIP_NEUTRE },
    NORMAL: { label: 'Normale', chip: CHIP_NEUTRE },
};

export const urgencyConfig = (urgency?: string | null): ChipConfig =>
    URGENCY_CONFIG[(urgency ?? '').toUpperCase()] ?? { label: 'Normale', chip: CHIP_NEUTRE };

export const isUrgentValue = (urgency?: string | null) =>
    ['URGENT', 'HIGH', 'CRITICAL'].includes((urgency ?? '').toUpperCase());

// ─── Destinataires ───────────────────────────────────────────────────────────

/** Normalise la liste des destinataires (tableau, JSON sérialisé ou CSV). */
export const parseRecipientIds = (recipients: unknown): string[] => {
    if (!recipients) return [];
    if (Array.isArray(recipients)) return recipients.map((r) => String(r));
    if (typeof recipients === 'string') {
        const trimmed = recipients.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.map((r) => String(r));
        } catch (_err) {
            // pas du JSON : repli sur une liste séparée par des virgules
        }
        return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (typeof recipients === 'object') {
        return Object.values(recipients as Record<string, unknown>).map((r) => String(r));
    }
    return [];
};

// ─── Formatage ───────────────────────────────────────────────────────────────

export const formatDateFr = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTimeFr = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

/**
 * Sérialise une Date en 'yyyy-MM-ddTHH:mm:ss' en fuseau LOCAL (jamais UTC) :
 * attendu par le backend pour les LocalDateTime de planification.
 */
export const toLocalDateTime = (date: Date): string => {
    const pad = (val: number) => val.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/** Normalise une heure saisie en 'HH:mm:ss'. */
export const normalizeTimeOfDay = (time: string): string => {
    if (!time) return '';
    const segments = time.split(':');
    if (segments.length === 3) {
        return `${segments[0].padStart(2, '0')}:${segments[1].padStart(2, '0')}:${segments[2].padStart(2, '0')}`;
    }
    if (segments.length === 2) {
        return `${segments[0].padStart(2, '0')}:${segments[1].padStart(2, '0')}:00`;
    }
    return time;
};
