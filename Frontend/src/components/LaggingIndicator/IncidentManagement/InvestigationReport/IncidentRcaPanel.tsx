import { useEffect, useState } from 'react';
import { Button, Select, TextInput, Textarea, Loader, Checkbox } from '@mantine/core';
import {
  IconSitemap, IconPlus, IconTrash, IconChevronRight, IconAlertTriangle, IconBinaryTree2,
} from '@tabler/icons-react';
import {
  listAnalyses, addAnalysis, listCauses, addCause, deleteCause,
  type CausalAnalysisDTO, type CauseDTO, type CausalMethod, type CauseLevel,
} from '../../../../services/IncidentCauseService';
import { successNotification } from '../../../../utility/NotificationUtility';
import { notifyError } from '../../../../utility/notifyError';

/**
 * Atelier d'analyse causale STRUCTURÉE d'un incident (ISO 45001 §10.2 a-b).
 *
 * Contrairement à l'ancien atelier (5 pourquoi / Ishikawa / arbre en état local,
 * aplatis en HTML ICAM puis perdus), chaque méthode devient ici une ANALYSE
 * persistée portant N causes hiérarchisées (niveau + catégorie + parent) —
 * requêtables et reliables à une action corrective (champ causeId).
 */

const METHOD_LABELS: Record<CausalMethod, string> = {
  FIVE_WHYS: '5 Pourquoi',
  ISHIKAWA: 'Ishikawa (6M)',
  CAUSE_TREE: 'Arbre des causes',
  ICAM: 'ICAM',
};
const METHOD_OPTIONS = (Object.keys(METHOD_LABELS) as CausalMethod[]).map((v) => ({ value: v, label: METHOD_LABELS[v] }));

const LEVEL_LABELS: Record<CauseLevel, string> = {
  IMMEDIATE: 'Immédiate',
  ROOT: 'Racine',
  SYSTEMIC: 'Systémique',
};
const LEVEL_ORDER: CauseLevel[] = ['IMMEDIATE', 'ROOT', 'SYSTEMIC'];
const LEVEL_OPTIONS = LEVEL_ORDER.map((v) => ({ value: v, label: LEVEL_LABELS[v] }));
const LEVEL_CHIP: Record<CauseLevel, string> = {
  IMMEDIATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ROOT: 'bg-orange-50 text-orange-700 border-orange-200',
  SYSTEMIC: 'bg-rose-50 text-rose-700 border-rose-200',
};

// Ishikawa 6M — familles de causes.
const ISHIKAWA_6M = ["Main-d'œuvre", 'Matériel', 'Méthode', 'Milieu', 'Matière', 'Management'];

interface IncidentRcaPanelProps {
  incidentId: number;
  canEdit?: boolean;
}

interface CauseFormState {
  label: string;
  level: CauseLevel | '';
  category: string;
  parentCauseId: string | null;
  failedControl: boolean;
}
const emptyCauseForm = (): CauseFormState => ({ label: '', level: '', category: '', parentCauseId: null, failedControl: false });

const IncidentRcaPanel = ({ incidentId, canEdit = true }: IncidentRcaPanelProps) => {
  const [analyses, setAnalyses] = useState<CausalAnalysisDTO[]>([]);
  const [causesByAnalysis, setCausesByAnalysis] = useState<Record<number, CauseDTO[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Formulaire « nouvelle analyse ».
  const [newMethod, setNewMethod] = useState<CausalMethod | ''>('');
  const [newSummary, setNewSummary] = useState('');

  // Formulaire « nouvelle cause » par analyse (id d'analyse → état).
  const [causeForms, setCauseForms] = useState<Record<number, CauseFormState>>({});

  const load = () => {
    setLoading(true);
    listAnalyses(incidentId)
      .then(async (list) => {
        setAnalyses(list);
        const entries = await Promise.all(
          list.filter((a) => a.id != null).map(async (a) => [a.id as number, await listCauses(a.id as number)] as const),
        );
        setCausesByAnalysis(Object.fromEntries(entries));
      })
      .catch((e) => notifyError(e, "Chargement des analyses causales impossible"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (incidentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const handleAddAnalysis = () => {
    if (!newMethod) return;
    setBusy(true);
    addAnalysis(incidentId, { method: newMethod, summary: newSummary.trim() || null })
      .then((created) => {
        setAnalyses((prev) => [...prev, created]);
        if (created.id != null) setCausesByAnalysis((prev) => ({ ...prev, [created.id as number]: [] }));
        setNewMethod('');
        setNewSummary('');
        successNotification('Analyse causale créée');
      })
      .catch((e) => notifyError(e, "Création de l'analyse impossible"))
      .finally(() => setBusy(false));
  };

  const formFor = (analysisId: number) => causeForms[analysisId] ?? emptyCauseForm();
  const patchForm = (analysisId: number, patch: Partial<CauseFormState>) =>
    setCauseForms((prev) => ({ ...prev, [analysisId]: { ...formFor(analysisId), ...patch } }));

  const handleAddCause = (analysisId: number) => {
    const f = formFor(analysisId);
    if (!f.label.trim()) return;
    setBusy(true);
    addCause(analysisId, {
      label: f.label.trim(),
      level: f.level || null,
      category: f.category.trim() || null,
      parentCauseId: f.parentCauseId ? Number(f.parentCauseId) : null,
      failedControl: f.failedControl,
    })
      .then((created) => {
        setCausesByAnalysis((prev) => ({ ...prev, [analysisId]: [...(prev[analysisId] ?? []), created] }));
        setCauseForms((prev) => ({ ...prev, [analysisId]: emptyCauseForm() }));
      })
      .catch((e) => notifyError(e, "Ajout de la cause impossible"))
      .finally(() => setBusy(false));
  };

  const handleDeleteCause = (analysisId: number, causeId: number) => {
    setBusy(true);
    deleteCause(causeId)
      .then(() => setCausesByAnalysis((prev) => ({
        ...prev,
        [analysisId]: (prev[analysisId] ?? []).filter((c) => c.id !== causeId),
      })))
      .catch((e) => notifyError(e, "Suppression impossible"))
      .finally(() => setBusy(false));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm p-4">
        <Loader size="sm" /> Chargement de l'analyse causale…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconSitemap size={18} className="text-teal-600" />
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Analyse causale structurée</h3>
          <p className="text-[11.5px] text-slate-500">ISO 45001 §10.2 — causes hiérarchisées, persistées et reliables aux actions.</p>
        </div>
      </div>

      {/* Nouvelle analyse */}
      {canEdit && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col md:flex-row gap-3 md:items-end">
          <Select size="sm" className="md:w-56" label="Méthode d'analyse" placeholder="Choisir" data={METHOD_OPTIONS}
            value={newMethod || null} onChange={(v) => setNewMethod((v as CausalMethod) || '')} />
          <TextInput size="sm" className="flex-1" label="Synthèse (facultatif)" placeholder="Objet / conclusion de l'analyse"
            value={newSummary} onChange={(e) => setNewSummary(e.currentTarget.value)} />
          <Button size="sm" color="teal" disabled={!newMethod || busy} leftSection={<IconPlus size={15} />} onClick={handleAddAnalysis}>
            Ajouter l'analyse
          </Button>
        </div>
      )}

      {analyses.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-[13px] text-slate-500">
          Aucune analyse causale. Choisissez une méthode (5 Pourquoi, Ishikawa, arbre…) pour structurer les causes.
        </div>
      )}

      {analyses.map((a) => {
        const aid = a.id as number;
        const causes = causesByAnalysis[aid] ?? [];
        const f = formFor(aid);
        const isIshikawa = a.method === 'ISHIKAWA';
        const isTree = a.method === 'CAUSE_TREE';
        return (
          <div key={aid} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded border bg-teal-50 text-teal-700 border-teal-200">
                <IconBinaryTree2 size={13} /> {METHOD_LABELS[a.method]}
              </span>
              {a.summary && <span className="text-[12px] text-slate-500 truncate max-w-[60%]">{a.summary}</span>}
            </div>

            {/* Causes groupées par niveau */}
            {causes.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic">Aucune cause saisie pour cette analyse.</p>
            ) : (
              <div className="space-y-3">
                {LEVEL_ORDER.filter((lvl) => causes.some((c) => c.level === lvl)).map((lvl) => (
                  <div key={lvl}>
                    <p className="text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">{LEVEL_LABELS[lvl]}</p>
                    <div className="space-y-1.5">
                      {causes.filter((c) => c.level === lvl).map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 px-2.5 py-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded border ${LEVEL_CHIP[c.level as CauseLevel] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {c.level ? LEVEL_LABELS[c.level] : '—'}
                          </span>
                          {c.parentCauseId && <IconChevronRight size={13} className="text-slate-300" />}
                          <span className="text-[13px] text-slate-700 flex-1">{c.label}</span>
                          {c.failedControl && <span className="inline-flex items-center gap-1 text-[10px] rounded border border-orange-200 bg-orange-50 text-orange-700 px-1.5 py-0.5" title="Contrôle / barrière défaillant(e)">⚠ contrôle défaillant</span>}
                          {c.category && <span className="text-[10.5px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">{c.category}</span>}
                          {canEdit && (
                            <button type="button" onClick={() => handleDeleteCause(aid, c.id as number)}
                              className="text-slate-400 hover:text-rose-600" aria-label="Supprimer la cause">
                              <IconTrash size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Causes sans niveau */}
                {causes.some((c) => !c.level) && (
                  <div>
                    <p className="text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">Non classée</p>
                    <div className="space-y-1.5">
                      {causes.filter((c) => !c.level).map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 px-2.5 py-1.5">
                          <span className="text-[13px] text-slate-700 flex-1">{c.label}</span>
                          {c.failedControl && <span className="inline-flex items-center gap-1 text-[10px] rounded border border-orange-200 bg-orange-50 text-orange-700 px-1.5 py-0.5" title="Contrôle / barrière défaillant(e)">⚠ contrôle défaillant</span>}
                          {c.category && <span className="text-[10.5px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">{c.category}</span>}
                          {canEdit && (
                            <button type="button" onClick={() => handleDeleteCause(aid, c.id as number)}
                              className="text-slate-400 hover:text-rose-600" aria-label="Supprimer la cause">
                              <IconTrash size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ajout de cause */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end pt-1">
                <TextInput size="xs" className="md:col-span-4" label="Cause" placeholder="Décrire la cause"
                  value={f.label} onChange={(e) => patchForm(aid, { label: e.currentTarget.value })} />
                <Select size="xs" className="md:col-span-3" label="Niveau" placeholder="—" clearable data={LEVEL_OPTIONS}
                  value={f.level || null} onChange={(v) => patchForm(aid, { level: (v as CauseLevel) || '' })} />
                {isIshikawa ? (
                  <Select size="xs" className="md:col-span-3" label="Famille 6M" placeholder="—" clearable
                    data={ISHIKAWA_6M.map((m) => ({ value: m, label: m }))}
                    value={f.category || null} onChange={(v) => patchForm(aid, { category: v || '' })} />
                ) : isTree ? (
                  <Select size="xs" className="md:col-span-3" label="Cause parente" placeholder="—" clearable
                    data={causes.filter((c) => c.id != null).map((c) => ({ value: String(c.id), label: c.label }))}
                    value={f.parentCauseId} onChange={(v) => patchForm(aid, { parentCauseId: v })} />
                ) : (
                  <TextInput size="xs" className="md:col-span-3" label="Catégorie" placeholder="Facultatif"
                    value={f.category} onChange={(e) => patchForm(aid, { category: e.currentTarget.value })} />
                )}
                <Button size="xs" variant="light" color="teal" className="md:col-span-2" disabled={!f.label.trim() || busy}
                  leftSection={<IconPlus size={13} />} onClick={() => handleAddCause(aid)}>
                  Ajouter
                </Button>
                {/* Contrôle/barrière défaillant(e) (ISO 45001 §10.2 a-b · ICAM). */}
                <Checkbox size="xs" className="md:col-span-12" color="orange"
                  label="Cette cause est un contrôle / une barrière défaillant(e)"
                  checked={f.failedControl}
                  onChange={(e) => patchForm(aid, { failedControl: e.currentTarget.checked })} />
              </div>
            )}
          </div>
        );
      })}

      <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
        <IconAlertTriangle size={13} className="mt-0.5 shrink-0" />
        Les causes saisies ici sont persistées et pourront être reliées aux actions correctives (traçabilité cause → action).
      </p>
    </div>
  );
};

export default IncidentRcaPanel;
