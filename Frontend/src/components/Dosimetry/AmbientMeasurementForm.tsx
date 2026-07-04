/**
 * AmbientMeasurementForm — Phase 6 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Modal reutilisable pour la saisie d'une mesure d'ambiance H*(10) sur un point de mesure.
 *
 * <p>Cas d'usage :
 *   - Depuis la fiche d'un point de mesure (MeasurementPointDetailPage)
 *   - Depuis la fiche d'une campagne (MonitoringCampaignDetailPage) — pre-remplit
 *     {@code campaignId} et limite la liste des points au perimetre de la campagne.
 *
 * <p>Champs :
 *   - measurementPointId : lookup Select (obligatoire) — fixe si {@code lockedPointId}.
 *   - value              : NumberInput uSv/h (obligatoire, > 0).
 *   - uncertainty        : NumberInput uSv/h (optionnel).
 *   - instrumentId       : Select dosimetres de type SURVEY_METER. Fallback texte
 *                          si aucun instrument enregistre (saisie libre du serial).
 *   - context            : Select MeasurementContext.
 *   - campaignId         : auto si lance depuis une campagne (read-only).
 *   - notes              : Textarea.
 *
 * <p>Validation :
 *   - {@code value > 0} obligatoire.
 *   - Si la valeur > {@code referenceLevel} du point, une modal de confirmation
 *     est affichee avant submit (acquisition de la confirmation explicite).
 *
 * <p>Submit : appelle {@code recordAmbientMeasurement} via le prop {@code onSubmit}
 * ou directement le service si {@code onSubmit} non fourni.
 *
 * <p>Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    Select,
    NumberInput,
    Textarea,
    TextInput,
    Group,
    Button,
    Alert,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
    IconPlus,
    IconDeviceFloppy,
    IconAlertOctagon,
    IconShieldCheck,
} from '@tabler/icons-react';
import { Z } from '../../constants/zIndex';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    recordAmbientMeasurement,
    listMeasurementPoints,
    getAllDosimeters,
    type AmbientMeasurementDTO,
    type MeasurementContext,
    type MeasurementPointDTO,
    type DosimeterDTO,
} from '../../services/DosimetryService';
import DosimetryOfflineService from '../../services/DosimetryOfflineService';
import { useOnlineStatus } from './OfflineSyncBanner';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AmbientMeasurementFormProps {
    /** Affichage de la modal. */
    opened: boolean;
    /** Callback de fermeture (Cancel ou succes). */
    onClose: () => void;
    /** mineId courant — injecte dans le payload (multi-tenant). */
    mineId: number;
    /** Pre-selectionne et verrouille un point de mesure (depuis MeasurementPointDetail). */
    lockedPointId?: number | null;
    /** Pre-selectionne et verrouille une campagne (depuis MonitoringCampaignDetail). */
    lockedCampaignId?: number | null;
    /** Restreint la liste de points selectionnables (perimetre de la campagne). */
    pointIdAllowList?: number[] | null;
    /** Liste pre-calculee de points a afficher (evite un appel reseau). */
    pointsOverride?: MeasurementPointDTO[];
    /**
     * Callback d'execution custom — si non fourni, la modal appelle directement
     * {@code recordAmbientMeasurement(payload)} via le service. Utile pour
     * permettre au parent de recharger ses donnees apres succes.
     */
    onSubmit?: (payload: AmbientMeasurementDTO) => Promise<void>;
    /** Callback notifie apres un succes (parent peut rafraichir sa liste). */
    onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant
// ─────────────────────────────────────────────────────────────────────────────

const AmbientMeasurementForm = ({
    opened,
    onClose,
    mineId,
    lockedPointId = null,
    lockedCampaignId = null,
    pointIdAllowList = null,
    pointsOverride,
    onSubmit,
    onSuccess,
}: AmbientMeasurementFormProps) => {
    const { t } = useTranslation('dosimetry');
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.userId ?? 0);
    const online = useOnlineStatus();

    // ─── Form state ───
    const [measurementPointId, setMeasurementPointId] = useState<string>('');
    const [value, setValue] = useState<number | ''>('');
    const [uncertainty, setUncertainty] = useState<number | ''>('');
    const [instrumentId, setInstrumentId] = useState<string>('');
    const [instrumentSerial, setInstrumentSerial] = useState('');
    const [context, setContext] = useState<MeasurementContext>(
        lockedCampaignId ? 'CAMPAIGN' : 'ROUTINE',
    );
    const [notes, setNotes] = useState('');
    const [measuredAt, setMeasuredAt] = useState<Date | null>(new Date());

    // ─── Lookups ───
    const [points, setPoints] = useState<MeasurementPointDTO[]>([]);
    const [instruments, setInstruments] = useState<DosimeterDTO[]>([]);
    const [loadingLookups, setLoadingLookups] = useState(false);

    // ─── Submission ───
    const [submitting, setSubmitting] = useState(false);
    const [confirmOverModal, setConfirmOverModal] = useState(false);

    // ─── Reset form on open ───
    useEffect(() => {
        if (!opened) return;
        setMeasurementPointId(lockedPointId != null ? String(lockedPointId) : '');
        setValue('');
        setUncertainty('');
        setInstrumentId('');
        setInstrumentSerial('');
        setContext(lockedCampaignId ? 'CAMPAIGN' : 'ROUTINE');
        setNotes('');
        setMeasuredAt(new Date());
        setConfirmOverModal(false);
    }, [opened, lockedPointId, lockedCampaignId]);

    // ─── Load lookups (points + instruments) ───
    useEffect(() => {
        if (!opened) return;
        let cancelled = false;
        setLoadingLookups(true);

        const pointsPromise = pointsOverride
            ? Promise.resolve(pointsOverride)
            : listMeasurementPoints(mineId).catch(() => [] as MeasurementPointDTO[]);
        const instrumentsPromise = getAllDosimeters().catch(() => [] as DosimeterDTO[]);

        Promise.all([pointsPromise, instrumentsPromise])
            .then(([pts, instrs]) => {
                if (cancelled) return;
                const ptsList: MeasurementPointDTO[] = Array.isArray(pts)
                    ? pts
                    : (((pts as any)?.content ?? []) as MeasurementPointDTO[]);
                const instrList: DosimeterDTO[] = Array.isArray(instrs)
                    ? instrs
                    : (((instrs as any)?.content ?? []) as DosimeterDTO[]);
                // Filtre allowList si fourni
                const filtered = pointIdAllowList && pointIdAllowList.length > 0
                    ? ptsList.filter((p) => p.id != null && pointIdAllowList.includes(Number(p.id)))
                    : ptsList;
                setPoints(filtered);
                // Filtre instruments : SURVEY_METER prioritaire — on tolere
                // une absence de type SURVEY_METER en gardant tous les
                // dosimetres EPD (qui peuvent aussi mesurer le debit de dose).
                const survey = instrList.filter(
                    (d) => (d as any).type === 'SURVEY_METER' || d.type === 'EPD',
                );
                setInstruments(survey.length > 0 ? survey : instrList);
            })
            .finally(() => {
                if (!cancelled) setLoadingLookups(false);
            });

        return () => {
            cancelled = true;
        };
    }, [opened, mineId, pointIdAllowList, pointsOverride]);

    // ─── Helpers ───
    const pointById = useMemo(() => {
        const m = new Map<number, MeasurementPointDTO>();
        points.forEach((p) => {
            if (p.id != null) m.set(Number(p.id), p);
        });
        return m;
    }, [points]);

    const selectedPoint = measurementPointId
        ? pointById.get(Number(measurementPointId)) ?? null
        : null;

    const pointOptions = useMemo(
        () =>
            points
                .map((p) => ({
                    value: String(p.id ?? ''),
                    label: `${p.code ?? '—'} — ${p.label ?? ''}`,
                }))
                .filter((o) => o.value),
        [points],
    );

    const instrumentOptions = useMemo(
        () =>
            instruments
                .map((d) => ({
                    value: String(d.id ?? ''),
                    label: `${d.serial ?? '—'} (${d.type})`,
                }))
                .filter((o) => o.value),
        [instruments],
    );

    // ─── Validation ───
    const validate = (): boolean => {
        if (!measurementPointId) {
            errorNotification(t('ambient.measurement.errors.pointRequired'));
            return false;
        }
        if (value === '' || value == null) {
            errorNotification(t('ambient.measurement.errors.valueRequired'));
            return false;
        }
        const n = Number(value);
        if (Number.isNaN(n) || n <= 0) {
            errorNotification(t('ambient.measurement.errors.valuePositive'));
            return false;
        }
        if (!measuredAt) {
            errorNotification(t('ambient.measurement.errors.measuredAtRequired'));
            return false;
        }
        return true;
    };

    const shouldConfirmOverReference = (): boolean => {
        if (value === '' || value == null) return false;
        const n = Number(value);
        if (Number.isNaN(n)) return false;
        const ref = selectedPoint?.referenceLevel;
        return ref != null && Number(ref) > 0 && n > Number(ref);
    };

    // ─── Submit ───
    const buildPayload = (): AmbientMeasurementDTO => {
        const n = Number(value);
        return {
            mineId,
            measurementPointId: Number(measurementPointId),
            measuredAt: (measuredAt ?? new Date()).toISOString(),
            measuredBy: userId || 0,
            value: n,
            uncertainty:
                uncertainty !== '' && uncertainty != null ? Number(uncertainty) : null,
            instrumentId: instrumentId ? Number(instrumentId) : null,
            instrumentSerial: instrumentSerial.trim() || null,
            context,
            campaignId: lockedCampaignId ?? null,
            notes: notes.trim() || null,
        };
    };

    const performSubmit = async () => {
        const payload = buildPayload();
        setSubmitting(true);

        // ─── Mode offline : queue locale IndexedDB (Phase 10-B) ──────────
        if (!online && !onSubmit) {
            try {
                await DosimetryOfflineService.queueMeasurement(payload);
                successNotification(t('ambient.measurement.queuedOffline'));
                if (onSuccess) onSuccess();
                onClose();
            } catch {
                errorNotification(t('ambient.measurement.error'));
            } finally {
                setSubmitting(false);
                setConfirmOverModal(false);
            }
            return;
        }

        try {
            if (onSubmit) {
                await onSubmit(payload);
            } else {
                await recordAmbientMeasurement(payload);
                successNotification(t('ambient.measurement.success'));
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            // Tolerance reseau : queue locale si erreur reseau / timeout.
            if (
                !onSubmit &&
                (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network'))
            ) {
                try {
                    await DosimetryOfflineService.queueMeasurement(payload);
                    successNotification(t('ambient.measurement.queuedOffline'));
                    if (onSuccess) onSuccess();
                    onClose();
                    return;
                } catch {
                    // fallthrough
                }
            }
            errorNotification(t('ambient.measurement.error'));
        } finally {
            setSubmitting(false);
            setConfirmOverModal(false);
        }
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (shouldConfirmOverReference()) {
            setConfirmOverModal(true);
            return;
        }
        void performSubmit();
    };

    // ─── Rendering ───
    return (
        <>
            <Modal
                opened={opened}
                onClose={onClose}
                title={
                    <div className="flex items-center gap-2">
                        <IconPlus size={16} className="text-indigo-600" />
                        <span className="font-semibold">
                            {t('ambient.measurement.title')}
                        </span>
                    </div>
                }
                size="lg"
                centered
                zIndex={Z.critical}
            >
                {lockedCampaignId && (
                    <Alert
                        color="indigo"
                        variant="light"
                        icon={<IconShieldCheck size={14} />}
                        mb="sm"
                    >
                        {t('ambient.measurement.lockedCampaign', { id: lockedCampaignId })}
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <Select
                            label={t('ambient.measurement.fields.point')}
                            description={t('ambient.measurement.fields.pointDesc')}
                            placeholder={
                                loadingLookups
                                    ? t('ambient.measurement.loading')
                                    : t('ambient.measurement.fields.pointPlaceholder')
                            }
                            value={measurementPointId}
                            onChange={(v) => setMeasurementPointId(v ?? '')}
                            data={pointOptions}
                            disabled={lockedPointId != null || loadingLookups}
                            searchable
                            required
                            withAsterisk
                            nothingFoundMessage={t('ambient.measurement.fields.pointNotFound')}
                        />
                    </div>

                    <NumberInput
                        label={t('ambient.measurement.fields.value')}
                        description={t('ambient.measurement.fields.valueDesc')}
                        placeholder="2.50"
                        value={value}
                        onChange={(v) => setValue(typeof v === 'number' ? v : '')}
                        decimalScale={3}
                        step={0.1}
                        min={0}
                        suffix=" µSv/h"
                        required
                        withAsterisk
                    />

                    <NumberInput
                        label={t('ambient.measurement.fields.uncertainty')}
                        description={t('ambient.measurement.fields.uncertaintyDesc')}
                        placeholder="0.05"
                        value={uncertainty}
                        onChange={(v) => setUncertainty(typeof v === 'number' ? v : '')}
                        decimalScale={3}
                        step={0.01}
                        min={0}
                        suffix=" µSv/h"
                    />

                    <DateTimePicker
                        label={t('ambient.measurement.fields.measuredAt')}
                        value={measuredAt}
                        onChange={(d) => setMeasuredAt(d as Date | null)}
                        required
                        withAsterisk
                        valueFormat="DD/MM/YYYY HH:mm"
                    />

                    <Select
                        label={t('ambient.measurement.fields.context')}
                        value={context}
                        onChange={(v) =>
                            setContext((v ?? 'ROUTINE') as MeasurementContext)
                        }
                        data={[
                            { value: 'ROUTINE', label: t('ambient.context.ROUTINE') },
                            { value: 'CAMPAIGN', label: t('ambient.context.CAMPAIGN') },
                            {
                                value: 'INCIDENT_RESPONSE',
                                label: t('ambient.context.INCIDENT_RESPONSE'),
                            },
                            {
                                value: 'COMMISSIONING',
                                label: t('ambient.context.COMMISSIONING'),
                            },
                        ]}
                        disabled={lockedCampaignId != null}
                        required
                        withAsterisk
                    />

                    <Select
                        label={t('ambient.measurement.fields.instrument')}
                        description={t('ambient.measurement.fields.instrumentDesc')}
                        placeholder={t('ambient.measurement.fields.instrumentPlaceholder')}
                        value={instrumentId}
                        onChange={(v) => setInstrumentId(v ?? '')}
                        data={instrumentOptions}
                        searchable
                        clearable
                        nothingFoundMessage={t(
                            'ambient.measurement.fields.instrumentNotFound',
                        )}
                    />

                    {!instrumentId && (
                        <TextInput
                            label={t('ambient.measurement.fields.instrumentSerial')}
                            description={t(
                                'ambient.measurement.fields.instrumentSerialDesc',
                            )}
                            placeholder="SN-XXXX"
                            value={instrumentSerial}
                            onChange={(e) => setInstrumentSerial(e.currentTarget.value)}
                        />
                    )}

                    <div className="md:col-span-2">
                        <Textarea
                            label={t('ambient.measurement.fields.notes')}
                            placeholder={t('ambient.measurement.fields.notesPlaceholder')}
                            value={notes}
                            onChange={(e) => setNotes(e.currentTarget.value)}
                            autosize
                            minRows={2}
                            maxRows={5}
                        />
                    </div>
                </div>

                {selectedPoint?.referenceLevel != null && value !== '' && value != null && (
                    <p className="text-[11px] text-slate-500 mt-3">
                        {t('ambient.measurement.referenceHint', {
                            reference: Number(selectedPoint.referenceLevel).toFixed(2),
                        })}
                    </p>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose} disabled={submitting}>
                        {t('ambient.measurement.cancel')}
                    </Button>
                    <Button
                        color="indigo"
                        leftSection={<IconDeviceFloppy size={14} />}
                        onClick={handleSubmit}
                        loading={submitting}
                    >
                        {t('ambient.measurement.submit')}
                    </Button>
                </Group>
            </Modal>

            {/* Modal de confirmation depassement reference */}
            <Modal
                opened={confirmOverModal}
                onClose={() => setConfirmOverModal(false)}
                title={
                    <div className="flex items-center gap-2 text-red-700">
                        <IconAlertOctagon size={16} />
                        <span className="font-semibold">
                            {t('ambient.measurement.overConfirm.title')}
                        </span>
                    </div>
                }
                size="md"
                centered
                zIndex={Z.criticalNested}
            >
                <Alert
                    color="red"
                    variant="light"
                    icon={<IconAlertOctagon size={14} />}
                    mb="sm"
                >
                    {t('ambient.measurement.overConfirm.message', {
                        value: value !== '' && value != null ? Number(value).toFixed(2) : '—',
                        reference:
                            selectedPoint?.referenceLevel != null
                                ? Number(selectedPoint.referenceLevel).toFixed(2)
                                : '—',
                    })}
                </Alert>
                <p className="text-[12.5px] text-slate-700 leading-relaxed mb-3">
                    {t('ambient.measurement.overConfirm.question')}
                </p>
                <Group justify="flex-end">
                    <Button
                        variant="default"
                        onClick={() => setConfirmOverModal(false)}
                        disabled={submitting}
                    >
                        {t('ambient.measurement.cancel')}
                    </Button>
                    <Button
                        color="red"
                        leftSection={<IconDeviceFloppy size={14} />}
                        onClick={() => void performSubmit()}
                        loading={submitting}
                    >
                        {t('ambient.measurement.overConfirm.confirm')}
                    </Button>
                </Group>
            </Modal>
        </>
    );
};

export default AmbientMeasurementForm;
