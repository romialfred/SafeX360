import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Group, Select, Textarea, Tooltip } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendarCheck, IconShieldCheck } from '@tabler/icons-react';
import {
    EffectivenessCheckDTO,
    getEffectivenessChecksByRecommendation,
    planEffectivenessCheck,
    concludeEffectivenessCheck,
} from '../../../services/AuditIsoService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

/**
 * LOT 52 — Vérification d'efficacité d'une recommandation d'audit
 * (ISO 19011:2018 §6.6). Panneau autonome monté dans la mise à jour d'une
 * recommandation : planification (échéance), puis verdict — un verdict
 * INEFFICACE rouvre automatiquement la recommandation côté backend.
 */

const VERDICT_META: Record<string, { label: string; color: string }> = {
    EFFICACE: { label: 'Efficace', color: 'teal' },
    PARTIELLEMENT_EFFICACE: { label: 'Partiellement efficace', color: 'yellow' },
    INEFFICACE: { label: 'Inefficace', color: 'red' },
};

const EffectivenessPanel = ({ recommendationId }: { recommendationId: number }) => {
    const [checks, setChecks] = useState<EffectivenessCheckDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [comment, setComment] = useState('');

    const reload = useCallback(async () => {
        try {
            setChecks(await getEffectivenessChecksByRecommendation(recommendationId));
        } catch (_e) {
            // silencieux : panneau secondaire, ne bloque pas la modale
        }
    }, [recommendationId]);

    useEffect(() => {
        reload();
    }, [reload]);

    const pending = checks.find((c) => !c.verdict);

    const handlePlan = async () => {
        if (!dueDate) {
            errorNotification("Sélectionnez l'échéance de la vérification");
            return;
        }
        setLoading(true);
        try {
            await planEffectivenessCheck(recommendationId, dueDate.toISOString().slice(0, 10));
            successNotification('Vérification d\'efficacité planifiée');
            setDueDate(null);
            await reload();
        } catch (e: any) {
            const code = e?.response?.data?.errorMessage;
            errorNotification(code === 'EFFECTIVENESS_REQUIRES_COMPLETED_RECOMMENDATION'
                ? 'La vérification ne se planifie que sur une recommandation terminée'
                : 'Échec de la planification');
        } finally {
            setLoading(false);
        }
    };

    const handleVerdict = async () => {
        if (!pending || !verdict) {
            errorNotification('Sélectionnez un verdict');
            return;
        }
        setLoading(true);
        try {
            await concludeEffectivenessCheck(pending.id as number, verdict, comment);
            successNotification(verdict === 'INEFFICACE'
                ? 'Verdict enregistré — la recommandation est rouverte automatiquement'
                : 'Verdict d\'efficacité enregistré');
            setVerdict(null);
            setComment('');
            await reload();
        } catch (_e) {
            errorNotification('Échec de l\'enregistrement du verdict');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <IconShieldCheck size={17} className="text-teal-700" />
                Vérification d'efficacité (ISO 19011 §6.6)
            </p>

            {/* Historique des vérifications */}
            {checks.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                    {checks.map((check) => (
                        <div key={check.id} className="flex items-center justify-between text-sm bg-white rounded-md border border-slate-200 px-3 py-1.5">
                            <span className="text-slate-600">Échéance {check.dueDate ?? '—'}</span>
                            {check.verdict ? (
                                <Tooltip label={check.comment || 'Sans commentaire'} withArrow>
                                    <Badge variant="light" color={VERDICT_META[check.verdict]?.color ?? 'gray'}>
                                        {VERDICT_META[check.verdict]?.label ?? check.verdict}
                                    </Badge>
                                </Tooltip>
                            ) : (
                                <Badge variant="light" color="violet">À vérifier</Badge>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {pending ? (
                /* Verdict sur la vérification en attente */
                <div className="flex flex-col gap-2">
                    <Select
                        label="Verdict"
                        placeholder="Sélectionner le verdict"
                        value={verdict}
                        onChange={setVerdict}
                        data={[
                            { value: 'EFFICACE', label: 'Efficace' },
                            { value: 'PARTIELLEMENT_EFFICACE', label: 'Partiellement efficace' },
                            { value: 'INEFFICACE', label: 'Inefficace (rouvre la recommandation)' },
                        ]}
                    />
                    <Textarea
                        label="Commentaire"
                        placeholder="Constats de la vérification sur le terrain"
                        autosize minRows={2}
                        value={comment}
                        onChange={(e) => setComment(e.currentTarget.value)}
                    />
                    <Group justify="end">
                        <Button size="xs" color="teal" loading={loading} onClick={handleVerdict}>
                            Enregistrer le verdict
                        </Button>
                    </Group>
                </div>
            ) : (
                /* Planification d'une nouvelle vérification */
                <div className="flex items-end gap-2">
                    <DateInput
                        label="Échéance de vérification"
                        placeholder="jj/mm/aaaa"
                        leftSection={<IconCalendarCheck size={16} />}
                        value={dueDate}
                        onChange={setDueDate}
                        className="flex-1"
                    />
                    <Button size="sm" variant="light" color="teal" loading={loading} onClick={handlePlan}>
                        Planifier
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EffectivenessPanel;
