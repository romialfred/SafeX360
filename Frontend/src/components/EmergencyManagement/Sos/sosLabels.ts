import type { SosStatus } from '../../../services/SosService';

export const SOS_REASON_LABELS: Record<string, string> = {
    MEDICAL: 'Urgence médicale',
    ACCIDENT_TRAVAIL: 'Accident du travail',
    INCENDIE: 'Incendie',
    AGRESSION: 'Agression',
    FUITE_CHIMIQUE: 'Fuite chimique',
    EFFONDREMENT: 'Effondrement',
    AUTRE: 'Autre',
};

export const SOS_STATUS_LABELS: Record<SosStatus, string> = {
    RECEIVED: 'NOUVEAU',
    ACKNOWLEDGED: 'PRIS EN CHARGE',
    DISPATCHED: 'DISPATCHÉ',
    ON_SITE: 'SUR PLACE',
    CLOSED: 'CLÔTURÉ',
    FALSE_ALARM: 'FAUSSE ALERTE',
};

export const SOS_STATUS_COLORS: Record<string, string> = {
    RECEIVED: '#dc2626',
    ACKNOWLEDGED: '#f97316',
    DISPATCHED: '#eab308',
    ON_SITE: '#0ea5e9',
    CLOSED: '#10b981',
    FALSE_ALARM: '#64748b',
};
