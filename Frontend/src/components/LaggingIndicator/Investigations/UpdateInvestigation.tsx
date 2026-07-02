import { Breadcrumbs, Text, Button, Select, NumberInput, Badge, Collapse, Slider } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  IconClock,
  IconCalendar,
  IconBulb,
  IconChevronDown,
  IconAlertTriangle,
  IconMapPin,
  IconSearch,
  IconHistory,
  IconExternalLink,
  IconCircleCheck,
  IconBan,
  IconHourglass,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FileDropzone from "../../UtilityComp/FileDropzone";
import { useForm } from "@mantine/form";
import { actionStatuses, investMethodMap } from "../../../Data/DropdownData";
import { actionStatusLabel, incidentStatusLabel } from "../IncidentManagement/incidentLabels";
import { formatDateShort } from "../../../utility/DateFormats";
import { addInvestigationProcess, getAllInvestigationProcessByInvestigationId } from "../../../services/InvestigationFileService";
import { getInvestigationById } from "../../../services/InvestigationService";
import { getIncidentById } from "../../../services/IncidentService";
import { convertFileToBase64DTO } from "../../../utility/DocumentUtility";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import TextEditor from "../../UtilityComp/TextEditor";
import SafeHtml from "../../UtilityComp/SafeHtml";
import IsoBadge from "../../UtilityComp/IsoBadge";
import { isValidRichText } from "../../../utility/OtherUtilities";
import dayjs from "dayjs";

/**
 * Mise à jour d'une investigation — LOT 57 (refonte premium ISO 45001 §10.2).
 *  • Panneau « Contexte de l'incident » repliable (les faits restent sous les yeux).
 *  • Résumé avec anneau de progression + jalons.
 *  • Formulaire de mise à jour raffiné (delta live, couplage % ↔ statut).
 *  • Historique en timeline verticale premium.
 * La logique métier (sync %↔statut, gardes d'état, addInvestigationProcess) est
 * conservée à l'identique — refonte purement présentationnelle.
 */

/** Anneau de progression SVG. */
const ProgressRing = ({ value, color }: { value: number; color: string }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg width={88} height={88} viewBox="0 0 88 88" className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
          {pct}%
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400">Avancement</span>
      </div>
    </div>
  );
};

const UpdateInvestigation = () => {
  const { id } = useParams();
  const [history, setHistory] = useState<any[]>([]);
  const [investigation, setInvestigation] = useState<any>({});
  const [incident, setIncident] = useState<any>(null);
  const [contextOpen, { toggle: toggleContext }] = useDisclosure(true);
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      status: '',
      description: '',
      progress: 0,
      date: new Date(),
      docs: [] as any[]
    },
    validate: {
      status: (value) => (value?.trim().length > 0 ? null : 'Le statut est requis'),
      progress: (value) => (value !== undefined && value !== null ? null : 'L\'avancement est requis'),
      description: (value) => (isValidRichText(value) ? null : 'La description est requise'),
      date: (value) => (value ? null : 'La date est requise'),
    }
  });

  const [initialStatus, setInitialStatus] = useState<string>('');
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const prevProgressRef = useRef<number>(0);
  const prevStatusRef = useRef<string>('');

  // UI sync: progress <-> status with revert (conservé)
  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();
    if (progress >= 100 && status !== 'COMPLETED') {
      form.setFieldValue('status', 'COMPLETED');
    }
    if (prevProgressRef.current === 100 && progress < 100 && initialStatus) {
      form.setFieldValue('status', initialStatus);
    }
    prevProgressRef.current = progress;
  }, [form.values.progress, initialStatus]);

  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();
    if (status === 'COMPLETED' && progress < 100) {
      form.setFieldValue('progress', 100);
    }
    if (prevStatusRef.current === 'COMPLETED' && status !== 'COMPLETED') {
      form.setFieldValue('progress', initialProgress);
    }
    prevStatusRef.current = status;
  }, [form.values.status, initialProgress]);

  const statusUpper = String(investigation?.status || '').toUpperCase();
  const isCompleted = (investigation?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
  const isCancelled = statusUpper === 'CANCELLED';
  const isPending = statusUpper === 'PENDING';
  const cannotUpdate = isCompleted || isCancelled || isPending;

  useEffect(() => {
    if (!id) return;
    getInvestigationById(id)
      .then((res) => {
        setInvestigation(res);
        form.setValues({
          status: res.status,
          description: res.description || '',
          progress: res.progress,
          date: new Date(),
          docs: []
        });
        setInitialStatus(res.status || '');
        setInitialProgress(Number(res.progress ?? 0));
        prevStatusRef.current = String(res.status || '').toUpperCase();
        prevProgressRef.current = Number(res.progress ?? 0);
        // Contexte de l'incident parent (best-effort).
        const incId = res.incidentId ?? res.incident?.id;
        if (incId) {
          getIncidentById(incId).then((inc) => setIncident(inc)).catch((err) => console.error(err));
        }
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Impossible de charger l\'investigation'));

    getAllInvestigationProcessByInvestigationId(Number(id))
      .then((res) => setHistory(res))
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Impossible de charger l\'historique'));
  }, [id]);

  const handleSubmit = async (values: any) => {
    const docs = await Promise.all(values.docs?.map(convertFileToBase64DTO));
    const sanitized = { ...values } as any;
    const numericProgress = Number(sanitized.progress ?? 0);
    if (numericProgress >= 100) {
      sanitized.progress = 100;
      sanitized.status = 'COMPLETED';
    }
    if (String(sanitized.status || '').toUpperCase() === 'COMPLETED') {
      sanitized.progress = 100;
    }
    const payload = {
      status: sanitized.status,
      progress: sanitized.progress,
      description: sanitized.description,
      date: dayjs(sanitized.date).format('YYYY-MM-DD'),
      docs,
      investigationId: id,
    };
    addInvestigationProcess(payload)
      .then(() => {
        successNotification('Investigation mise à jour.');
        navigate('/investigation');
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Une erreur est survenue'));
  };

  // Couleur dérivée de l'état pour l'anneau.
  const ringColor = isCompleted ? '#10b981' : isCancelled ? '#f43f5e' : isPending ? '#f59e0b' : '#0d9488';
  const currentProgress = Number(investigation?.progress ?? 0);
  const formProgress = Number(form.values.progress ?? 0);
  const delta = formProgress - currentProgress;
  const lastUpdate = history.length > 0 ? history[history.length - 1]?.date : null;

  // ─── Sous-élément : tuile de fait incident ───
  const Fact = ({ label, value, icon }: { label: string; value: any; icon?: any }) => (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}{label}
      </div>
      <div className="text-sm text-slate-800">{value || <span className="italic text-slate-400">—</span>}</div>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col gap-5 bg-[#FAF8F3] p-5 md:p-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '22px', fontWeight: 600 }}>
              Mise à jour de l'investigation
            </h1>
            <IsoBadge norm="ISO 45001" size="sm" />
          </div>
          <p className="mt-0.5 text-[13px] text-slate-500">Suivi de l'avancement et de l'efficacité de l'action — ISO 45001 §10.2</p>
          <Breadcrumbs mt="xs" className="!text-xs">
            <Link className="hover:!underline" to="/"><Text size="xs" c="dimmed">Accueil</Text></Link>
            <Link className="hover:!underline" to="/investigation"><Text size="xs" c="dimmed">Investigations</Text></Link>
            <Text size="xs" c="teal">Mise à jour</Text>
          </Breadcrumbs>
        </div>
      </div>

      {/* Contexte de l'incident — repliable */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          onClick={toggleContext}
          aria-expanded={contextOpen}
          className="flex w-full items-center gap-2 border-b border-red-200/70 bg-red-50/60 px-4 py-2.5 text-left"
        >
          <span className="rounded-lg bg-red-100 p-1.5 text-red-700"><IconAlertTriangle size={15} /></span>
          <span className="text-[11px] uppercase tracking-wider text-slate-700">Contexte de l'incident</span>
          {incident?.number && (
            <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-mono text-[11px] text-red-700">{incident.number}</span>
          )}
          {/* résumé condensé visible même replié */}
          <span className="ml-2 hidden items-center gap-2 text-[12px] text-slate-500 md:flex">
            {incident?.title && <span className="max-w-[280px] truncate">{incident.title}</span>}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[12px] text-slate-500">
            {contextOpen ? 'Masquer' : 'Afficher'}
            <IconChevronDown size={15} className={`transition-transform duration-300 ${contextOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        <Collapse in={contextOpen}>
          {incident ? (
            <div className="space-y-3 p-4">
              <h3 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', fontWeight: 600 }}>
                {incident.title || '—'}
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Fact label="Date" icon={<IconCalendar size={12} />} value={formatDateShort(incident.occurredAt || incident.incidentDate || incident.discoveryTime)} />
                <Fact label="Lieu" icon={<IconMapPin size={12} />} value={incident.location?.name || incident.locationName} />
                <Fact label="Catégorie" value={incident.incidentCategoryName} />
                <Fact label="Statut" value={incidentStatusLabel(incident.status)} />
              </div>
              {incident.description && (
                <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Description</div>
                  <SafeHtml html={incident.description} className="line-clamp-4 text-[13px] text-slate-700" />
                </div>
              )}
              {(incident.id || investigation?.incidentId) && (
                <Link to={`/incidents/${incident.id ?? investigation?.incidentId}`} className="inline-flex items-center gap-1 text-[12px] text-teal-700 hover:underline">
                  Voir la fiche complète <IconExternalLink size={12} />
                </Link>
              )}
            </div>
          ) : (
            <p className="p-4 text-[12.5px] italic text-slate-400">Contexte de l'incident indisponible.</p>
          )}
        </Collapse>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Résumé investigation */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 border-b border-teal-200/70 bg-teal-50/60 px-4 py-2.5">
              <span className="rounded-lg bg-teal-100 p-1.5 text-teal-700"><IconSearch size={15} /></span>
              <span className="text-[11px] uppercase tracking-wider text-slate-700">Méthode &amp; avancement</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 p-4">
              <ProgressRing value={currentProgress} color={ringColor} />
              <div className="grid min-w-[220px] flex-1 grid-cols-2 gap-3">
                <Fact label="Méthode" value={<span className="inline-flex items-center rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800">{investMethodMap[investigation?.method] || investigation?.method || '—'}</span>} />
                <Fact label="Statut" value={<Badge size="sm" radius="sm" variant="light" color={isCompleted ? 'green' : isCancelled ? 'red' : isPending ? 'yellow' : 'teal'} className="!capitalize">{actionStatusLabel(investigation?.status) || '—'}</Badge>} />
                <Fact label="Date de début" icon={<IconCalendar size={12} />} value={investigation?.startDate ? formatDateShort(investigation.startDate) : '—'} />
                <Fact label="Dernière MAJ" icon={<IconClock size={12} />} value={lastUpdate ? formatDateShort(lastUpdate) : 'Aucune'} />
              </div>
            </div>
            {/* jalons */}
            <div className="flex items-center gap-2 px-4 pb-4">
              {[0, 25, 50, 75, 100].map((m) => (
                <div key={m} className="flex flex-1 items-center gap-2 last:flex-none">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${currentProgress >= m ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  {m !== 100 && <span className={`h-px flex-1 ${currentProgress > m ? 'bg-teal-300' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire de mise à jour */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 border-b border-teal-200/70 bg-teal-50/60 px-4 py-2.5">
              <span className="rounded-lg bg-teal-100 p-1.5 text-teal-700"><IconClock size={15} /></span>
              <span className="text-[11px] uppercase tracking-wider text-slate-700">Nouvelle mise à jour</span>
              <span className="ml-auto text-[11px] text-slate-500">Documenter l'avancement et l'efficacité (§10.2)</span>
            </div>

            <div className="p-4">
              {cannotUpdate && (
                <div className={`mb-4 flex items-start gap-2 rounded-xl border-l-4 p-3 ${isCompleted ? 'border-emerald-400 bg-emerald-50' : isCancelled ? 'border-rose-400 bg-rose-50' : 'border-amber-400 bg-amber-50'}`}>
                  {isCompleted ? <IconCircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : isCancelled ? <IconBan size={18} className="mt-0.5 shrink-0 text-rose-600" /> : <IconHourglass size={18} className="mt-0.5 shrink-0 text-amber-600" />}
                  <p className={`text-[13px] ${isCompleted ? 'text-emerald-800' : isCancelled ? 'text-rose-800' : 'text-amber-800'}`}>
                    {isCompleted && "Cette investigation est terminée. Aucune mise à jour supplémentaire n'est autorisée."}
                    {isPending && "Cette investigation est en attente d'approbation. Les mises à jour seront possibles après validation."}
                    {isCancelled && "Cette investigation a été annulée. Aucune mise à jour supplémentaire n'est autorisée."}
                  </p>
                </div>
              )}

              <form className={`space-y-3 ${cannotUpdate ? 'pointer-events-none opacity-50' : ''}`} onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput size="sm" disabled={cannotUpdate} {...form.getInputProps('progress')} label="Avancement (%)" max={100} clampBehavior="blur" min={investigation.progress ?? 0} />
                  <Select size="sm" disabled={cannotUpdate} label="Statut" data={actionStatuses.slice(actionStatuses.findIndex((item) => item.value === (history?.length > 0 ? history[history.length - 1]?.status : investigation?.status))).map((item) => ({ value: item.value, label: actionStatusLabel(item.value) }))} {...form.getInputProps('status')} />
                </div>
                <Slider
                  color="teal"
                  size="sm"
                  disabled={cannotUpdate}
                  min={currentProgress}
                  max={100}
                  step={5}
                  marks={[{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }]}
                  value={formProgress}
                  onChange={(v) => form.setFieldValue('progress', v)}
                  className="mt-1"
                />
                <DateInput disabled={cannotUpdate} label="Date" valueFormat="YYYY-MM-DD" {...form.getInputProps('date')} minDate={history?.length > 0
                  ? new Date(Math.max(...history.map(h => new Date(h.date).getTime())))
                  : investigation?.startDate ? new Date(investigation?.startDate) : undefined} />
                <TextEditor form={form} id="description" title="Note de mise à jour" withAsterisk />
                {!cannotUpdate && <FileDropzone form={form} id="docs" />}

                {/* delta live + actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-[12px] ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {delta > 0 ? `+${delta}% depuis la dernière mise à jour` : 'Aucune progression saisie'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="default" onClick={() => navigate('/investigation')}>Annuler</Button>
                    <Button disabled={cannotUpdate} color="teal" type="submit">Enregistrer la mise à jour</Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Colonne droite — historique */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-4">
            <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/60 px-4 py-2.5">
              <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700"><IconHistory size={15} /></span>
              <span className="text-[11px] uppercase tracking-wider text-slate-700">Historique des mises à jour</span>
              <span className="ml-auto text-[11px] text-slate-500">{history.length}</span>
            </div>

            <div className="p-4">
              {history.length === 0 ? (
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                  <h4 className="mb-2 flex items-center gap-1 text-sm text-teal-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}><IconBulb size={16} /> Conseils</h4>
                  <ul className="space-y-1 text-xs text-teal-700">
                    <li>• Actualiser l'avancement régulièrement</li>
                    <li>• Détailler les obstacles rencontrés</li>
                    <li>• Joindre photos ou documents si nécessaire</li>
                    <li>• Documenter la preuve d'efficacité (§10.2)</li>
                  </ul>
                </div>
              ) : (
                <ol className="relative">
                  {history.slice().reverse().map((x: any, index: number, arr: any[]) => {
                    const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
                    const progressMade = x.progress - previousProgress;
                    const isLatest = index === 0;
                    const isLast = index === arr.length - 1;
                    return (
                      <li key={index} className="relative flex gap-3 pb-5 last:pb-0">
                        {!isLast && <span className="absolute left-[10px] top-6 bottom-0 w-px bg-slate-200" />}
                        <span className={`relative z-10 mt-0.5 h-[21px] w-[21px] shrink-0 rounded-full border-2 border-white shadow ring-1 ring-slate-200 ${isLatest ? 'bg-teal-600' : 'bg-white'}`} />
                        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-[12px] text-slate-500"><IconCalendar size={12} className="text-slate-400" />{formatDateShort(x.date)}</span>
                            <Badge radius="sm" size="xs" variant="light" color="teal" className="!capitalize">{actionStatusLabel(x.status)}</Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-teal-500" style={{ width: `${x.progress}%` }} />
                            </div>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10.5px] ${progressMade > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {progressMade > 0 ? `+${progressMade}%` : `${x.progress}%`}
                            </span>
                          </div>
                          <div className="mt-2 rounded-lg bg-slate-50/70 p-2">
                            <SafeHtml html={x.description || '—'} className="line-clamp-3 text-[12.5px] text-slate-700" />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateInvestigation;
