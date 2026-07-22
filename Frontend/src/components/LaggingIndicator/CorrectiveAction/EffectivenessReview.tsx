import { Button, Select, Textarea, NumberInput } from '@mantine/core';
import {
  IconShieldCheck,
  IconClipboardCheck,
  IconUser,
  IconCalendar,
  IconAlertTriangle,
  IconRotateClockwise2,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { useAppSelector } from '../../../slices/hooks';
import {
  getActionEffectiveness,
  reviewActionEffectiveness,
} from '../../../services/CorrectiveActionService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { formatDateShort } from '../../../utility/DateFormats';
import {
  EFFECTIVENESS_VERDICT_OPTIONS,
  effectivenessVerdictConfig,
  SERIF,
} from './correctiveLabels';

/**
 * Revue d'efficacité d'une action corrective — ISO 45001 §10.2 e.
 *
 * Une action ne s'arrête plus à « Réalisée » : on prouve qu'elle a bien
 * supprimé/réduit le risque. Un vérificateur enregistre un verdict et
 * ré-évalue le risque résiduel. Efficace → l'action est « Vérifiée efficace » ;
 * inefficace → l'action est « Rouverte » et repart dans le cycle.
 */

// Bandes du niveau de risque résiduel (matrice 5×5, produit P×G).
const residualBand = (probability?: number | null, severity?: number | null) => {
  const p = Number(probability ?? 0);
  const s = Number(severity ?? 0);
  if (!p || !s) return null;
  const score = p * s;
  if (score <= 4) return { score, label: 'Faible', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score <= 9) return { score, label: 'Modéré', chip: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (score <= 14) return { score, label: 'Élevé', chip: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { score, label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200' };
};

interface EffectivenessReviewProps {
  actionId: number | string;
  /** Statut courant de l'action (COMPLETED / VERIFIED / REOPENED…). */
  actionStatus?: string;
  /** Appelé après un enregistrement réussi (recharge l'action côté parent). */
  onReviewed?: () => void;
}

const EffectivenessReview = ({ actionId, actionStatus, onReviewed }: EffectivenessReviewProps) => {
  const currentUser = useAppSelector((state: any) => state.user);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      verdict: '',
      comment: '',
      residualProbability: undefined as number | undefined,
      residualSeverity: undefined as number | undefined,
    },
    validate: {
      verdict: (v) => (v ? null : 'Le verdict est requis'),
      comment: (v) => (v && v.trim().length >= 10 ? null : 'Justifiez le verdict (10 caractères min.)'),
    },
  });

  const loadReview = () => {
    setLoading(true);
    getActionEffectiveness(actionId)
      .then((res) => setReview(res))
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId]);

  const handleSubmit = (values: typeof form.values) => {
    setSubmitting(true);
    reviewActionEffectiveness(
      actionId,
      {
        verdict: values.verdict,
        comment: values.comment,
        residualProbability: values.residualProbability ?? null,
        residualSeverity: values.residualSeverity ?? null,
      },
      currentUser?.id,
    )
      .then((res) => {
        setReview(res);
        successNotification(
          values.verdict === 'INEFFECTIVE'
            ? "Action rouverte : la revue conclut à une efficacité insuffisante"
            : "Efficacité vérifiée et enregistrée",
        );
        onReviewed?.();
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "L'enregistrement de la revue a échoué");
      })
      .finally(() => setSubmitting(false));
  };

  const statusUpper = String(actionStatus || '').toUpperCase();
  const alreadyReviewed = Boolean(review?.reviewed);

  const header = (
    <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <IconShieldCheck className="w-5 h-5 text-teal-600" aria-hidden="true" />
        <div>
          <p className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>
            Revue d'efficacité
          </p>
          <p className="text-[11.5px] text-slate-500">
            ISO 45001 §10.2 — prouver que l'action a bien maîtrisé le risque.
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {header}
        <div className="h-16 rounded-lg bg-slate-50 border border-slate-200 animate-pulse" />
      </div>
    );
  }

  // ── Revue déjà enregistrée : affichage en lecture seule ────────────────────
  if (alreadyReviewed) {
    const verdictCfg = effectivenessVerdictConfig(review?.verdict);
    const band = residualBand(review?.residualProbability, review?.residualSeverity);
    const reopened = String(review?.status || '').toUpperCase() === 'REOPENED';
    return (
      <div className="space-y-3">
        {header}
        <div
          className={`rounded-lg border p-4 space-y-3 ${
            reopened ? 'border-orange-200 bg-orange-50/50' : 'border-teal-200 bg-teal-50/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
              <IconClipboardCheck size={15} aria-hidden="true" /> Verdict
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${verdictCfg.chip}`}
            >
              {verdictCfg.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-[12.5px] text-slate-700">
              <IconUser size={15} className="text-slate-400" aria-hidden="true" />
              <span>Vérifiée par : {review?.reviewedByName || (review?.reviewedBy ? `#${review.reviewedBy}` : '—')}</span>
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-slate-700">
              <IconCalendar size={15} className="text-slate-400" aria-hidden="true" />
              <span>Le {review?.reviewedAt ? formatDateShort(review.reviewedAt) : '—'}</span>
            </div>
          </div>

          {review?.comment && (
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Commentaire</p>
              <p className="text-[12.5px] text-slate-700 whitespace-pre-line">{review.comment}</p>
            </div>
          )}

          {band && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                <IconAlertTriangle size={15} className="text-slate-400" aria-hidden="true" /> Risque résiduel
              </span>
              <span className="text-[12px] text-slate-700 tabular-nums">
                P {review.residualProbability} × G {review.residualSeverity} = {band.score}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${band.chip}`}>
                {band.label}
              </span>
            </div>
          )}

          {reopened && (
            <div className="flex items-start gap-2 text-[12px] text-orange-700 bg-orange-50 border border-orange-200 rounded-md p-2.5">
              <IconRotateClockwise2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                L'action a été <strong>rouverte</strong> : elle est repartie dans le cycle de traitement pour
                renforcer les mesures.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Pas encore revue : n'ouvrir la revue que si l'action est « Réalisée » ──
  if (statusUpper !== 'COMPLETED') {
    return (
      <div className="space-y-3">
        {header}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[12.5px] text-slate-500">
          La revue d'efficacité devient possible une fois l'action <strong>réalisée</strong> (100 %).
        </div>
      </div>
    );
  }

  const band = residualBand(form.values.residualProbability, form.values.residualSeverity);

  return (
    <div className="space-y-3">
      {header}
      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={form.onSubmit(handleSubmit)}>
        <Select
          size="sm"
          label="Verdict d'efficacité"
          placeholder="Sélectionner"
          withAsterisk
          data={EFFECTIVENESS_VERDICT_OPTIONS}
          {...form.getInputProps('verdict')}
        />
        <Textarea
          size="sm"
          label="Justification / éléments de preuve"
          placeholder="Comment l'efficacité a-t-elle été constatée (indicateurs, absence de récurrence, contrôle terrain…) ?"
          autosize
          minRows={3}
          withAsterisk
          {...form.getInputProps('comment')}
        />
        <div>
          <p className="text-[12px] font-medium text-slate-700 mb-1.5">Risque résiduel après mesures</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <NumberInput
              size="sm"
              label="Probabilité (1–5)"
              min={1}
              max={5}
              clampBehavior="strict"
              {...form.getInputProps('residualProbability')}
            />
            <NumberInput
              size="sm"
              label="Gravité (1–5)"
              min={1}
              max={5}
              clampBehavior="strict"
              {...form.getInputProps('residualSeverity')}
            />
            <div className="pb-1">
              {band ? (
                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] uppercase tracking-wider rounded border ${band.chip}`}>
                  Niveau {band.label} · {band.score}
                </span>
              ) : (
                <span className="text-[11.5px] text-slate-400">Niveau calculé automatiquement</span>
              )}
            </div>
          </div>
        </div>

        {form.values.verdict === 'INEFFECTIVE' && (
          <div className="flex items-start gap-2 text-[12px] text-orange-700 bg-orange-50 border border-orange-200 rounded-md p-2.5">
            <IconRotateClockwise2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Un verdict <strong>Inefficace</strong> rouvre l'action : elle repartira à 0 % pour renforcer les mesures.
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" color="teal" loading={submitting} leftSection={<IconShieldCheck size={16} />}>
            Enregistrer la revue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EffectivenessReview;
