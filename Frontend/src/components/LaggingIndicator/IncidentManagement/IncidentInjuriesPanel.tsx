import { useEffect, useState } from 'react';
import { Button, Select, TextInput, NumberInput, Loader } from '@mantine/core';
import { IconHeartbeat, IconPlus, IconTrash, IconUser } from '@tabler/icons-react';
import {
  listInjuries, addInjury, deleteInjury, type IncidentInjury, type InjuryOutcome,
} from '../../../services/SafetyMetricsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { successNotification } from '../../../utility/NotificationUtility';
import { notifyError } from '../../../utility/notifyError';

/**
 * Capture des lésions par personne (ISO 45001 §9.1.1 — taxonomie ILO/OSHA).
 * Chaque personne blessée porte son issue normalisée, la nature de la lésion, la
 * partie du corps et les jours perdus — base des indicateurs LTIFR / TRIFR / gravité.
 */

export const OUTCOME_CONFIG: Record<InjuryOutcome, { label: string; chip: string }> = {
  FATALITY: { label: 'Décès', chip: 'bg-black text-white border-black' },
  LTI: { label: 'Accident avec arrêt (LTI)', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  RWC: { label: 'Travail restreint (RWC)', chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  MTC: { label: 'Soins médicaux (MTC)', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAC: { label: 'Premiers secours (FAC)', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  NEAR_MISS: { label: 'Presque-accident', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};
const OUTCOME_OPTIONS = (Object.keys(OUTCOME_CONFIG) as InjuryOutcome[]).map((v) => ({ value: v, label: OUTCOME_CONFIG[v].label }));

interface Props {
  incidentId: number | string;
  canEdit?: boolean;
}

const emptyForm = () => ({ employeeId: null as string | null, personName: '', outcome: '' as InjuryOutcome | '', natureOfInjury: '', bodyPart: '', lostDays: undefined as number | undefined });

const IncidentInjuriesPanel = ({ incidentId, canEdit = true }: Props) => {
  const [injuries, setInjuries] = useState<IncidentInjury[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = () => {
    setLoading(true);
    listInjuries(incidentId)
      .then((res) => setInjuries(res))
      .catch(() => setInjuries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Garde NaN (Number(undefined) → NaN) en plus de null.
    if (incidentId != null && !(typeof incidentId === 'number' && Number.isNaN(incidentId))) load();
    getEmployeeDropdown()
      .then((res: any) => setEmployees((res || []).filter((e: any) => e?.id && e?.name).map((e: any) => ({ value: String(e.id), label: e.name }))))
      .catch(() => setEmployees([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const handleAdd = () => {
    if (!form.outcome) return;
    setBusy(true);
    addInjury(incidentId, {
      outcome: form.outcome,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      personName: form.personName.trim() || null,
      natureOfInjury: form.natureOfInjury.trim() || null,
      bodyPart: form.bodyPart.trim() || null,
      lostDays: form.lostDays ?? null,
    })
      .then((created) => {
        setInjuries((prev) => [...prev, created]);
        setForm(emptyForm());
        successNotification('Lésion enregistrée');
      })
      .catch((e) => notifyError(e, "Enregistrement de la lésion impossible"))
      .finally(() => setBusy(false));
  };

  const handleDelete = (id: number) => {
    setBusy(true);
    deleteInjury(id)
      .then(() => setInjuries((prev) => prev.filter((i) => i.id !== id)))
      .catch((e) => notifyError(e, "Suppression impossible"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <header className="px-4 py-2.5 bg-rose-50/60 border-b border-rose-200/70 flex items-center gap-2">
        <IconHeartbeat size={15} className="text-rose-700" />
        <h3 className="text-xs uppercase tracking-wider text-slate-800 flex-1">Lésions & issues (classification ILO/OSHA)</h3>
        <span className="text-[10px] text-slate-500 italic hidden md:inline">ISO 45001 §9.1.1</span>
      </header>
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader size="sm" /> Chargement…</div>
        ) : injuries.length === 0 ? (
          <p className="text-[12.5px] text-slate-400 italic">Aucune lésion enregistrée pour cet incident.</p>
        ) : (
          <div className="space-y-2">
            {injuries.map((inj) => {
              const cfg = OUTCOME_CONFIG[inj.outcome];
              return (
                <div key={inj.id} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded border ${cfg?.chip || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{cfg?.label || inj.outcome}</span>
                  <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-700"><IconUser size={13} className="text-slate-400" /> {inj.employeeName || inj.personName || '—'}</span>
                  {inj.natureOfInjury && <span className="text-[12px] text-slate-500">· {inj.natureOfInjury}</span>}
                  {inj.bodyPart && <span className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">{inj.bodyPart}</span>}
                  {inj.lostDays != null && <span className="text-[11px] text-rose-700">{inj.lostDays} j perdus</span>}
                  {canEdit && (
                    <button type="button" onClick={() => handleDelete(inj.id as number)} className="ml-auto text-slate-400 hover:text-rose-600" aria-label="Supprimer">
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-t border-slate-200 pt-3">
            <Select size="xs" className="md:col-span-3" label="Issue" placeholder="Choisir" data={OUTCOME_OPTIONS}
              value={form.outcome || null} onChange={(v) => setForm((f) => ({ ...f, outcome: (v as InjuryOutcome) || '' }))} comboboxProps={{ withinPortal: true }} />
            <Select size="xs" className="md:col-span-3" label="Employé" placeholder="—" clearable searchable data={employees}
              value={form.employeeId} onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))} comboboxProps={{ withinPortal: true }} />
            <TextInput size="xs" className="md:col-span-2" label="Nature" placeholder="ex. fracture" value={form.natureOfInjury} onChange={(e) => setForm((f) => ({ ...f, natureOfInjury: e.currentTarget.value }))} />
            <TextInput size="xs" className="md:col-span-2" label="Partie du corps" placeholder="ex. main" value={form.bodyPart} onChange={(e) => setForm((f) => ({ ...f, bodyPart: e.currentTarget.value }))} />
            <NumberInput size="xs" className="md:col-span-1" label="Jours" min={0} value={form.lostDays} onChange={(v) => setForm((f) => ({ ...f, lostDays: typeof v === 'number' ? v : undefined }))} />
            <Button size="xs" color="rose" className="md:col-span-1" disabled={!form.outcome || busy} leftSection={<IconPlus size={13} />} onClick={handleAdd}>Ajouter</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentInjuriesPanel;
