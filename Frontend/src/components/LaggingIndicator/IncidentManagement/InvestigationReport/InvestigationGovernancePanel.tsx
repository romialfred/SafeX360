import { useEffect, useState } from 'react';
import { Button, Select, TextInput, Textarea, Checkbox, Loader } from '@mantine/core';
import { IconPlus, IconTrash, IconTimeline, IconMessage2, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  listTimeline, addTimelineEvent, deleteTimelineEvent,
  listWitnesses, addWitness, deleteWitness,
  type TimelineEventDTO, type WitnessStatementDTO, type TimelineEventType,
} from '../../../../services/InvestigationGovernanceService';
import { successNotification } from '../../../../utility/NotificationUtility';
import { notifyError } from '../../../../utility/notifyError';

interface Props {
  investigationId: number;
  canEdit?: boolean;
}

const TYPE_CHIP: Record<string, string> = {
  EVENT: 'bg-sky-50 text-sky-700 border-sky-200',
  CONDITION: 'bg-slate-50 text-slate-600 border-slate-200',
  BARRIER: 'bg-amber-50 text-amber-700 border-amber-200',
};

const InvestigationGovernancePanel = ({ investigationId, canEdit = true }: Props) => {
  const { t, i18n } = useTranslation('incidents');
  const TYPE_OPTIONS: { value: TimelineEventType; label: string }[] = [
    { value: 'EVENT', label: t('governance.type.EVENT') },
    { value: 'CONDITION', label: t('governance.type.CONDITION') },
    { value: 'BARRIER', label: t('governance.type.BARRIER') },
  ];
  const typeLabel = (tp?: string | null) => (tp ? t(`governance.type.${tp}`, { defaultValue: tp }) : '—');
  const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString(i18n.language) : '—');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEventDTO[]>([]);
  const [witnesses, setWitnesses] = useState<WitnessStatementDTO[]>([]);

  const [ev, setEv] = useState<TimelineEventDTO>({ description: '', eventType: 'EVENT', occurredAt: '', barrierFailed: false });
  const [wt, setWt] = useState<WitnessStatementDTO>({ statement: '', witnessName: '', witnessRole: '' });

  const load = () => {
    if (!investigationId) return;
    setLoading(true);
    Promise.all([listTimeline(investigationId), listWitnesses(investigationId)])
      .then(([tl, w]) => { setTimeline(tl); setWitnesses(w); })
      .catch(() => { /* affichage vide si erreur */ })
      .finally(() => setLoading(false));
  };
  useEffect(load, [investigationId]);

  const submitEvent = () => {
    if (!ev.description.trim()) return;
    setBusy(true);
    addTimelineEvent(investigationId, { ...ev, occurredAt: ev.occurredAt || null, description: ev.description.trim() })
      .then(() => { successNotification(t('governance.factAdded')); setEv({ description: '', eventType: 'EVENT', occurredAt: '', barrierFailed: false }); load(); })
      .catch((e) => notifyError(e))
      .finally(() => setBusy(false));
  };
  const removeEvent = (id?: number | null) => {
    if (!id) return;
    setBusy(true);
    deleteTimelineEvent(id).then(load).catch((e) => notifyError(e)).finally(() => setBusy(false));
  };

  const submitWitness = () => {
    if (!wt.statement.trim()) return;
    setBusy(true);
    addWitness(investigationId, { ...wt, statement: wt.statement.trim() })
      .then(() => { successNotification(t('governance.witnessSaved')); setWt({ statement: '', witnessName: '', witnessRole: '' }); load(); })
      .catch((e) => notifyError(e))
      .finally(() => setBusy(false));
  };
  const removeWitness = (id?: number | null) => {
    if (!id) return;
    setBusy(true);
    deleteWitness(id).then(load).catch((e) => notifyError(e)).finally(() => setBusy(false));
  };

  if (loading) return <div className="flex justify-center py-6"><Loader size="sm" /></div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Frise chronologique (ECFC) */}
      <section className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
        <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-3">
          <IconTimeline size={16} className="text-slate-500" /> {t('governance.timelineTitle')}
        </h4>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-400 mb-2">{t('governance.timelineEmpty')}</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-2 mb-3 flex flex-col gap-3">
            {timeline.map((tl) => (
              <li key={tl.id} className="ml-4">
                <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] rounded border px-1.5 py-0.5 ${TYPE_CHIP[tl.eventType || ''] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{typeLabel(tl.eventType)}</span>
                      {tl.barrierFailed && <span className="inline-flex items-center gap-1 text-[10px] rounded border border-rose-200 bg-rose-50 text-rose-700 px-1.5 py-0.5"><IconAlertTriangle size={11} /> {t('governance.barrierFailedChip')}</span>}
                      <span className="text-[11px] text-slate-400">{fmt(tl.occurredAt)}</span>
                    </div>
                    <p className="text-[13px] text-slate-700 mt-0.5">{tl.description}</p>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => removeEvent(tl.id)} disabled={busy}
                      className="text-slate-400 hover:text-rose-600 shrink-0" aria-label={t('governance.add')}><IconTrash size={14} /></button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end pt-1 border-t border-slate-100">
            <Textarea size="xs" autosize minRows={1} className="md:col-span-5" label={t('governance.factLabel')} placeholder={t('governance.factPlaceholder')}
              value={ev.description} onChange={(e) => setEv({ ...ev, description: e.currentTarget.value })} />
            <Select size="xs" className="md:col-span-2" label={t('governance.typeLabel')} data={TYPE_OPTIONS}
              value={ev.eventType} onChange={(v) => setEv({ ...ev, eventType: (v as TimelineEventType) || 'EVENT' })} />
            <TextInput size="xs" type="datetime-local" className="md:col-span-3" label={t('governance.whenLabel')}
              value={ev.occurredAt || ''} onChange={(e) => setEv({ ...ev, occurredAt: e.currentTarget.value })} />
            <Button size="xs" variant="light" color="teal" className="md:col-span-2" disabled={!ev.description.trim() || busy}
              leftSection={<IconPlus size={13} />} onClick={submitEvent}>{t('governance.add')}</Button>
            {ev.eventType === 'BARRIER' && (
              <Checkbox size="xs" color="red" className="md:col-span-12" label={t('governance.barrierFailedCheck')}
                checked={!!ev.barrierFailed} onChange={(e) => setEv({ ...ev, barrierFailed: e.currentTarget.checked })} />
            )}
          </div>
        )}
      </section>

      {/* Témoignages */}
      <section className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
        <h4 className="text-sm text-gray-700 flex items-center gap-2 mb-3">
          <IconMessage2 size={16} className="text-slate-500" /> {t('governance.witnessesTitle')}
        </h4>
        {witnesses.length === 0 ? (
          <p className="text-xs text-slate-400 mb-2">{t('governance.witnessesEmpty')}</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 mb-3">
            {witnesses.map((w) => (
              <div key={w.id} className="py-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] text-slate-800">{w.witnessEmployeeName || w.witnessName || t('governance.witnessFallback')}</span>
                    {w.witnessRole && <span className="text-[10.5px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">{w.witnessRole}</span>}
                    <span className="text-[11px] text-slate-400">{fmt(w.takenAt)}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 mt-0.5 whitespace-pre-wrap">{w.statement}</p>
                </div>
                {canEdit && (
                  <button type="button" onClick={() => removeWitness(w.id)} disabled={busy}
                    className="text-slate-400 hover:text-rose-600 shrink-0" aria-label={t('governance.save')}><IconTrash size={14} /></button>
                )}
              </div>
            ))}
          </div>
        )}
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end pt-1 border-t border-slate-100">
            <TextInput size="xs" className="md:col-span-4" label={t('governance.witnessNameLabel')} placeholder={t('governance.witnessNamePlaceholder')}
              value={wt.witnessName || ''} onChange={(e) => setWt({ ...wt, witnessName: e.currentTarget.value })} />
            <TextInput size="xs" className="md:col-span-3" label={t('governance.witnessRoleLabel')} placeholder={t('governance.witnessRolePlaceholder')}
              value={wt.witnessRole || ''} onChange={(e) => setWt({ ...wt, witnessRole: e.currentTarget.value })} />
            <Textarea size="xs" autosize minRows={1} className="md:col-span-12" label={t('governance.statementLabel')} placeholder={t('governance.statementPlaceholder')}
              value={wt.statement} onChange={(e) => setWt({ ...wt, statement: e.currentTarget.value })} />
            <Button size="xs" variant="light" color="teal" className="md:col-span-3" disabled={!wt.statement.trim() || busy}
              leftSection={<IconPlus size={13} />} onClick={submitWitness}>{t('governance.save')}</Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default InvestigationGovernancePanel;
