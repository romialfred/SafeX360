import { useEffect, useState } from 'react';
import { Loader, Timeline } from '@mantine/core';
import { IconHistory, IconArrowNarrowRight, IconUser } from '@tabler/icons-react';
import { getHistory, type ChangeLogEntry, type ChangeLogEntityType } from '../../services/ChangeLogService';
import { formatDate } from '../../utility/DateFormats';

/**
 * Journal d'audit champ-par-champ réutilisable (ISO 45001 §7.5.3).
 * Affiche QUI a changé QUOI, de quelle valeur À quelle valeur, QUAND — pour
 * n'importe quelle entité tracée (incident, action corrective…).
 */

// Libellés des champs tracés.
const FIELD_LABELS: Record<string, string> = {
  status: 'Statut',
  effectivenessVerdict: "Verdict d'efficacité",
};

// Libellés des valeurs (enums) → FR. Repli : la valeur brute.
const VALUE_LABELS: Record<string, string> = {
  // IncidentStatus
  PENDING: 'En attente',
  REPORTED: 'Déclaré',
  INVESTIGATION: 'Investigation',
  INVESTIGATION_COMPLETED: 'Investigation terminée',
  CORRECTIVE_ACTIONS: 'Actions correctives',
  CLOSED: 'Clôturé',
  REJECTED: 'Rejeté',
  // ActionStatus
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Réalisée',
  CANCELLED: 'Annulée',
  VERIFIED: 'Vérifiée efficace',
  REOPENED: 'Rouverte',
  // EffectivenessVerdict
  EFFECTIVE: 'Efficace',
  PARTIALLY_EFFECTIVE: 'Partiellement efficace',
  INEFFECTIVE: 'Inefficace',
};

const valueLabel = (v?: string | null) => (v == null || v === '' ? '—' : (VALUE_LABELS[v] || v));
const fieldLabel = (f: string) => FIELD_LABELS[f] || f;

interface ChangeHistoryProps {
  entityType: ChangeLogEntityType;
  entityId: number | string;
  /** Titre affiché (défaut : « Journal d'audit »). */
  title?: string;
}

const ChangeHistory = ({ entityType, entityId, title = "Journal d'audit" }: ChangeHistoryProps) => {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garde: entityId absent OU non numérique (Number(undefined) → NaN) évite un
    // GET /change-log/…/NaN (400 @PathVariable Long).
    if (entityId == null || (typeof entityId === 'number' && Number.isNaN(entityId))) return;
    setLoading(true);
    getHistory(entityType, entityId)
      .then((res) => setEntries(res))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <header className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
        <IconHistory size={15} className="text-slate-600" />
        <h3 className="text-xs uppercase tracking-wider text-slate-700 flex-1">{title}</h3>
        <span className="text-[10px] text-slate-400 italic hidden md:inline">ISO 45001 §7.5.3</span>
      </header>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader size="sm" /> Chargement…</div>
        ) : entries.length === 0 ? (
          <p className="text-[12.5px] text-slate-400 italic">Aucune modification tracée pour l'instant.</p>
        ) : (
          <Timeline active={entries.length} bulletSize={16} lineWidth={1} color="teal">
            {entries.map((e) => (
              <Timeline.Item key={e.id}>
                <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="text-slate-700 font-medium">{fieldLabel(e.field)}</span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50">{valueLabel(e.oldValue)}</span>
                    <IconArrowNarrowRight size={14} className="text-slate-400" />
                    <span className="px-1.5 py-0.5 rounded border border-teal-200 bg-teal-50 text-teal-700">{valueLabel(e.newValue)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <IconUser size={12} />
                  <span>{e.actorName || (e.actorId ? `Utilisateur #${e.actorId}` : 'Système')}</span>
                  <span>·</span>
                  <span>{formatDate(e.changedAt)}</span>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </div>
    </div>
  );
};

export default ChangeHistory;
