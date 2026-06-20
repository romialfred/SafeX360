/**
 * ErrorDeclarationPage — Déclaration d'un événement (vue INTÉGRÉE 2 colonnes).
 *
 * Route : /error-management/declare (atteinte via le bouton « Déclarer un
 * événement » du registre — ce n'est pas une entrée de menu).
 *
 * Mise en page : pleine largeur (pas de marges géantes), deux colonnes —
 *  • Gauche : le formulaire (contexte, qualification, description + anonymat) ;
 *  • Droite : VOLET DE DROITE collant — aperçu de la criticité calculée en
 *    direct (matrice 5×5), repère Just Culture, récapitulatif et actions
 *    (Enregistrer / Annuler).
 * Sur mobile, les deux colonnes s'empilent.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Loader, Switch, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
    IconArrowLeft,
    IconChevronRight,
    IconClipboardList,
    IconEyeOff,
    IconGauge,
    IconInfoCircle,
    IconPaperclip,
    IconScale,
    IconSend,
    IconShieldExclamation,
} from '@tabler/icons-react';
import {
    createEvent,
    listCriticalityMatrix,
    listEventTypes,
    listProbabilities,
    listSeverities,
    resolveCriticalityCell,
    toLocalDateTime,
    type ErrorCriticalityMatrixCell,
    type ErrorEventDTO,
    type ErrorEventType,
    type ErrorProbability,
    type ErrorSeverity,
} from '../../services/ErrorManagementService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { CRITICALITY_LABELS, NAVY, NAVY_DEEP, TEAL } from './errorManagementLabels';
import { useAppSelector } from '../../slices/hooks';

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const Section = ({ icon, title, subtitle, children }: SectionProps) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})` }}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">{title}</h2>
                {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5 truncate" title={subtitle}>{subtitle}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const selectClass =
    'w-full px-2.5 py-2 text-[13px] bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/25 focus:border-[#1E3A5F] min-h-[42px]';

const fmtDate = (d: Date | null): string =>
    d
        ? d.toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Non définie';

const ErrorDeclarationPage = () => {
    const navigate = useNavigate();
    const currentUserId: number | null = useAppSelector(
        (state: any) => state?.user?.accountId ?? state?.user?.id ?? null,
    );

    const [eventTypes, setEventTypes] = useState<ErrorEventType[]>([]);
    const [severities, setSeverities] = useState<ErrorSeverity[]>([]);
    const [probabilities, setProbabilities] = useState<ErrorProbability[]>([]);
    const [matrix, setMatrix] = useState<ErrorCriticalityMatrixCell[]>([]);
    const [loadingRefs, setLoadingRefs] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Champs du formulaire
    const [title, setTitle] = useState<string>('');
    const [eventTypeId, setEventTypeId] = useState<string>('');
    const [occurredAt, setOccurredAt] = useState<Date | null>(new Date());
    const [zoneId, setZoneId] = useState<string>('');
    const [actualSeverityId, setActualSeverityId] = useState<string>('');
    const [potentialSeverityId, setPotentialSeverityId] = useState<string>('');
    const [probabilityId, setProbabilityId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [anonymous, setAnonymous] = useState<boolean>(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setLoadingRefs(true);
        Promise.allSettled([
            listEventTypes(),
            listSeverities(),
            listProbabilities(),
            listCriticalityMatrix(),
        ])
            .then(([types, sev, prob, mtx]) => {
                if (types.status === 'fulfilled') setEventTypes(types.value.filter((t) => t.active !== false));
                if (sev.status === 'fulfilled')
                    setSeverities([...sev.value].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)));
                if (prob.status === 'fulfilled')
                    setProbabilities([...prob.value].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)));
                if (mtx.status === 'fulfilled') setMatrix(mtx.value);
                if (types.status === 'rejected') {
                    errorNotification('Impossible de charger les référentiels (types / gravités).');
                }
            })
            .finally(() => setLoadingRefs(false));
    }, []);

    const sevLevelById = useMemo(() => {
        const map = new Map<number, number>();
        severities.forEach((s) => map.set(s.id, s.level ?? 0));
        return map;
    }, [severities]);

    const probLevelById = useMemo(() => {
        const map = new Map<number, number>();
        probabilities.forEach((p) => map.set(p.id, p.level ?? 0));
        return map;
    }, [probabilities]);

    /**
     * Aperçu de la criticité : on croise la gravité POTENTIELLE (au sens
     * prévention) avec la probabilité ; à défaut, la gravité réelle.
     */
    const previewCell = useMemo(() => {
        const sevId = potentialSeverityId || actualSeverityId;
        if (!sevId || !probabilityId) return null;
        const sevLevel = sevLevelById.get(Number(sevId));
        const probLevel = probLevelById.get(Number(probabilityId));
        return resolveCriticalityCell(matrix, sevLevel, probLevel);
    }, [potentialSeverityId, actualSeverityId, probabilityId, sevLevelById, probLevelById, matrix]);

    const selectedTypeLabel = useMemo(
        () => eventTypes.find((t) => String(t.id) === eventTypeId)?.label ?? null,
        [eventTypes, eventTypeId],
    );

    const validate = useCallback((): boolean => {
        const next: Record<string, string> = {};
        if (!title.trim()) next.title = "L'intitulé de l'événement est requis.";
        if (!eventTypeId) next.eventTypeId = "Le type d'événement est requis.";
        if (!occurredAt) next.occurredAt = 'La date de survenue est requise.';
        if (zoneId.trim()) {
            const z = Number(zoneId);
            if (!Number.isInteger(z) || z < 1) {
                next.zoneId = "L'identifiant de zone doit être un entier positif.";
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }, [title, eventTypeId, occurredAt, zoneId]);

    const handleSubmit = useCallback(async () => {
        if (!validate()) {
            errorNotification('Veuillez compléter les champs obligatoires.');
            return;
        }
        setSubmitting(true);
        const dto: ErrorEventDTO = {
            title: title.trim(),
            eventTypeId: Number(eventTypeId),
            occurredAt: occurredAt ? toLocalDateTime(occurredAt) : null,
            description: description.trim() || null,
            zoneId: zoneId ? Number(zoneId) : null,
            actualSeverityId: actualSeverityId ? Number(actualSeverityId) : null,
            potentialSeverityId: potentialSeverityId ? Number(potentialSeverityId) : null,
            probabilityId: probabilityId ? Number(probabilityId) : null,
            isAnonymous: anonymous,
            declaredBy: anonymous ? null : currentUserId,
            sourceModule: 'MANUAL',
        };
        try {
            const created = await createEvent(dto);
            successNotification('Événement déclaré avec succès.');
            navigate(created?.id ? `/error-management/${created.id}` : '/error-management');
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 403) {
                errorNotification('Accès refusé : la déclaration est réservée aux administrateurs.');
            } else {
                errorNotification('La déclaration a échoué. Veuillez réessayer.');
            }
            setSubmitting(false);
        }
    }, [
        validate,
        title,
        eventTypeId,
        occurredAt,
        description,
        zoneId,
        actualSeverityId,
        potentialSeverityId,
        probabilityId,
        anonymous,
        currentUserId,
        navigate,
    ]);

    if (loadingRefs) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6 flex flex-col items-center justify-center">
                <Loader color={NAVY} size="sm" />
                <p className="text-[12.5px] text-slate-500 mt-3">Chargement des référentiels…</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6 w-full">
            {/* ─── Breadcrumb ─── */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                <button
                    type="button"
                    onClick={() => navigate('/error-management')}
                    className="uppercase tracking-[0.16em] font-medium hover:text-slate-800 transition"
                >
                    Registre des événements
                </button>
                <IconChevronRight size={10} className="text-slate-400" />
                <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">Nouvelle déclaration</span>
            </div>

            {/* ─── Hero compact ─── */}
            <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="relative px-5 py-4 flex items-center gap-3">
                    <span
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${NAVY}, ${TEAL})` }}
                        aria-hidden="true"
                    />
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shadow-slate-300 flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})` }}
                    >
                        <IconShieldExclamation size={20} stroke={1.8} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(20px, 2.2vw, 26px)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Déclarer un événement
                        </h1>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 truncate" title="Signalez tôt : la démarche est apprenante, jamais accusatoire.">
                            Signalez tôt : la démarche est apprenante, jamais accusatoire.
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── 2 colonnes : formulaire | volet de droite ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* ── Colonne formulaire ── */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Section 1 : Contexte */}
                    <Section
                        icon={<IconClipboardList size={17} stroke={1.8} />}
                        title="Contexte de l'événement"
                        subtitle="Décrivez le cadre du signal."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <TextInput
                                    label="Intitulé de l'événement"
                                    placeholder="Ex. : Chute de hauteur évitée près du convoyeur C3"
                                    value={title}
                                    onChange={(e) => setTitle(e.currentTarget.value)}
                                    error={errors.title}
                                    withAsterisk
                                    classNames={{ input: 'min-h-[42px]' }}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                    Type d'événement <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={eventTypeId}
                                    onChange={(e) => setEventTypeId(e.target.value)}
                                    className={`${selectClass} ${errors.eventTypeId ? 'border-red-400' : 'border-slate-300'}`}
                                    aria-label="Type d'événement"
                                >
                                    <option value="">Sélectionner un type</option>
                                    {eventTypes.map((t) => (
                                        <option key={t.id} value={String(t.id)}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.eventTypeId && (
                                    <p className="text-[11.5px] text-red-600 mt-1">{errors.eventTypeId}</p>
                                )}
                            </div>
                            <div>
                                <DateTimePicker
                                    label="Date et heure de survenue"
                                    placeholder="Sélectionner…"
                                    value={occurredAt}
                                    onChange={(v: any) =>
                                        setOccurredAt(v instanceof Date ? v : v ? new Date(v) : null)
                                    }
                                    valueFormat="DD/MM/YYYY HH:mm"
                                    error={errors.occurredAt}
                                    withAsterisk
                                    clearable
                                    classNames={{ input: 'min-h-[42px]' }}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <TextInput
                                    label="Zone / lieu (identifiant)"
                                    placeholder="Identifiant de zone (optionnel)"
                                    value={zoneId}
                                    onChange={(e) => setZoneId(e.currentTarget.value.replace(/[^0-9]/g, ''))}
                                    description="Identifiant numérique de la zone si connu."
                                    error={errors.zoneId}
                                    classNames={{ input: 'min-h-[42px]' }}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Section 2 : Qualification */}
                    <Section
                        icon={<IconGauge size={17} stroke={1.8} />}
                        title="Qualification du risque"
                        subtitle="La criticité est calculée automatiquement."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1">Gravité réelle</label>
                                <select
                                    value={actualSeverityId}
                                    onChange={(e) => setActualSeverityId(e.target.value)}
                                    className={`${selectClass} border-slate-300`}
                                    aria-label="Gravité réelle"
                                >
                                    <option value="">Non évaluée</option>
                                    {severities.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.level} · {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                    Gravité potentielle
                                </label>
                                <select
                                    value={potentialSeverityId}
                                    onChange={(e) => setPotentialSeverityId(e.target.value)}
                                    className={`${selectClass} border-slate-300`}
                                    aria-label="Gravité potentielle"
                                >
                                    <option value="">Non évaluée</option>
                                    {severities.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.level} · {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1">Probabilité</label>
                                <select
                                    value={probabilityId}
                                    onChange={(e) => setProbabilityId(e.target.value)}
                                    className={`${selectClass} border-slate-300`}
                                    aria-label="Probabilité"
                                >
                                    <option value="">Non évaluée</option>
                                    {probabilities.map((p) => (
                                        <option key={p.id} value={String(p.id)}>
                                            {p.level} · {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Section>

                    {/* Section 3 : Description + anonymat */}
                    <Section
                        icon={<IconShieldExclamation size={17} stroke={1.8} />}
                        title="Description et confidentialité"
                        subtitle="Décrivez les faits ; choisissez le mode de déclaration."
                    >
                        <Textarea
                            label="Description des faits"
                            placeholder="Décrivez objectivement ce qui s'est passé : circonstances, déroulé, conséquences observées…"
                            value={description}
                            onChange={(e) => setDescription(e.currentTarget.value)}
                            autosize
                            minRows={4}
                            maxRows={10}
                        />

                        <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <Switch
                                checked={anonymous}
                                onChange={(e) => setAnonymous(e.currentTarget.checked)}
                                color="dark"
                                size="md"
                                aria-label="Déclaration anonyme"
                            />
                            <div>
                                <p className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                                    <IconEyeOff size={14} stroke={1.8} className="text-slate-500" />
                                    Déclaration anonyme
                                </p>
                                <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                    {anonymous
                                        ? "Votre identité ne sera pas associée à cette déclaration. Le déclarant apparaîtra comme « Déclarant anonyme » dans l'historique."
                                        : "Activez cette option pour déclarer sans associer votre identité à l'événement."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-[12px] text-slate-500">
                            <IconPaperclip size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                            <span>
                                <span className="font-medium text-slate-600">Pièces jointes : </span>
                                l'ajout de photos et documents sera disponible depuis la fiche de l'événement une fois la
                                déclaration enregistrée.
                            </span>
                        </div>
                    </Section>
                </div>

                {/* ── Volet de droite (collant) ── */}
                <aside className="lg:col-span-1">
                    <div className="lg:sticky lg:top-6 space-y-4">
                        {/* Criticité calculée */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100">
                                <h3 className="text-[13px] font-semibold text-slate-800">Criticité calculée</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">Matrice 5×5 (gravité × probabilité).</p>
                            </div>
                            <div className="p-5">
                                {previewCell ? (
                                    <div
                                        className="flex items-center gap-3 rounded-lg border px-4 py-3"
                                        style={{
                                            backgroundColor: `${previewCell.colorHex ?? NAVY}12`,
                                            borderColor: `${previewCell.colorHex ?? NAVY}40`,
                                        }}
                                    >
                                        <span
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                                            style={{ backgroundColor: previewCell.colorHex ?? NAVY }}
                                        >
                                            {(previewCell.severityLevel ?? 0) * (previewCell.probabilityLevel ?? 0)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">
                                                Niveau
                                            </p>
                                            <p
                                                className="text-[16px] font-bold leading-tight"
                                                style={{ color: previewCell.colorHex ?? NAVY }}
                                            >
                                                {previewCell.criticalityLevel
                                                    ? CRITICALITY_LABELS[previewCell.criticalityLevel]
                                                    : 'À évaluer'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[12px] text-slate-500">
                                        <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                                        Renseignez une gravité et une probabilité pour afficher la criticité. Le niveau définitif est confirmé à la création.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Récapitulatif */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100">
                                <h3 className="text-[13px] font-semibold text-slate-800">Récapitulatif</h3>
                            </div>
                            <dl className="p-5 space-y-2.5 text-[12.5px]">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-slate-500 flex-shrink-0">Type</dt>
                                    <dd className="text-slate-800 font-medium text-right truncate">{selectedTypeLabel ?? 'Non défini'}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-slate-500 flex-shrink-0">Survenue</dt>
                                    <dd className="text-slate-800 font-medium text-right">{fmtDate(occurredAt)}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-slate-500 flex-shrink-0">Déclaration</dt>
                                    <dd className="text-slate-800 font-medium text-right">{anonymous ? 'Anonyme' : 'Nominative'}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Repère Just Culture */}
                        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <IconScale size={16} stroke={1.8} className="mt-0.5 flex-shrink-0" style={{ color: TEAL }} />
                            <p className="text-[12px] text-slate-600 leading-snug">
                                <span className="font-semibold text-slate-800">Just Culture.</span> La déclaration nourrit
                                la prévention. La dimension disciplinaire est traitée séparément.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                fullWidth
                                leftSection={<IconSend size={15} />}
                                loading={submitting}
                                onClick={handleSubmit}
                                styles={{ root: { backgroundColor: NAVY } }}
                            >
                                Enregistrer la déclaration
                            </Button>
                            <Button
                                fullWidth
                                variant="default"
                                leftSection={<IconArrowLeft size={15} />}
                                onClick={() => navigate('/error-management')}
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ErrorDeclarationPage;
