/**
 * DoseEntryForm — Phase 4 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Formulaire premium SafeX 360 de saisie ou edition d'un enregistrement de dose.
 *
 * Routes :
 *   - /dosimetry/doses/new            (creation d'une dose)
 *   - /dosimetry/doses/edit/:id       (edition append-only : cree une nouvelle version)
 *
 * Sections :
 *   1. Travailleur & periode  : autocomplete worker actif + card 360-mini +
 *                               periode debut/fin (defaults = mois courant).
 *   2. Mesures dose           : NumberInput HP10, HP007, HP3 + banners pour
 *                               valeurs elevees (>10 / >100 / >10 mSv) +
 *                               checkbox "sous seuil de detection" + radio source.
 *   3. Pieces jointes & notes : upload placeholder + textarea notes.
 *   4. Cumuls en direct       : projection annuelle Hp10 + glissant 5 ans avec
 *                               gauges colorees + banner depassement niveau invest.
 *   5. Validation & soumission: modal double-validation si dose elevee + submit
 *                               (createDoseRecord ou supersedeDoseRecord via
 *                               updateDoseRecord pour le mode edition).
 *
 * Volet d'aide collapsible :
 *   - Comment lire votre dosimetre
 *   - Limites CIPR (tableau)
 *   - Procedure en cas de depassement
 *
 * Pattern UI/UX aligne sur DosimeterAssignmentForm / ExposedWorkerForm :
 *   - Breadcrumb premium + hero gradient indigo->violet->fuchsia
 *   - Sections Mantine Paper avec entete + bordure premium
 *   - i18n via namespace `dosimetry` -> bloc `doseEntryForm`
 *   - tsc strict + vite EXIT 0
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import {
    Paper,
    Group,
    Button,
    Select,
    NumberInput,
    Textarea,
    Checkbox,
    Tooltip,
    Alert,
    Text,
    Badge,
    Modal,
    Radio,
    Collapse,
    Table,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconChevronRight,
    IconUser,
    IconCalendarTime,
    IconAlertOctagon,
    IconCheck,
    IconInfoCircle,
    IconShieldCheck,
    IconAtom2,
    IconActivity,
    IconBolt,
    IconPaperclip,
    IconNote,
    IconChartBar,
    IconAlertTriangle,
    IconHelpCircle,
    IconBook,
    IconUpload,
    IconDeviceFloppy,
    IconHistory,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    searchWorkers,
    createDoseRecord,
    updateDoseRecord,
    getDoseRecordById,
    getActiveDoseRecordsByWorker,
    type DoseRecordDTO,
    type DoseSource,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes metier — Limites CIPR 103 / AIEA GSR Part 3 (Cat A)
// ─────────────────────────────────────────────────────────────────────────────

/** Limite annuelle Hp(10) categorie A (corps entier — CIPR 103). */
const LIMIT_HP10_ANNUAL_CAT_A = 20; // mSv/an

/** Limite glissante 5 ans Hp(10) categorie A (CIPR 103 — 100 mSv sur 5 ans). */
const LIMIT_HP10_ROLLING_5Y = 100; // mSv / 5 ans

/** Niveau d'investigation usuel pour Hp(10) — declenche enquete radio. */
const INVESTIGATION_LEVEL_HP10 = 6; // mSv/an (3/10 de la limite)

/** Seuils de validation double (au-dessus = banner + confirmation modale). */
const HP10_HIGH_THRESHOLD = 10;   // mSv/mois — necessite validation PCR
const HP007_HIGH_THRESHOLD = 100; // mSv/mois — extremites
const HP3_HIGH_THRESHOLD = 10;    // mSv/mois — cristallin

// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Projection minimale d'un worker pour le Select autocomplete. */
interface WorkerListItem {
    id: number;
    matricule: string;
    fullName: string;
    category: 'A' | 'B';
    specialStatus: string | null;
    active: boolean;
    /** Cumul annuel Hp10 deja saisi (mSv) — fourni par la projection liste backend. */
    annualHp10?: number | null;
    /** Cumul glissant 5 ans Hp10 (mSv). */
    rolling5yHp10?: number | null;
    /** Derniere periode declaree (YYYY-MM). */
    lastPeriod?: string | null;
    /** Derniere dose Hp10 (mSv). */
    lastHp10?: number | null;
}

/** Convertit une date locale en libelle FR. */
const formatDateFr = (d: Date | null | undefined): string => {
    if (!d) return '—';
    try {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

/** Date du 1er du mois courant. */
const firstDayOfMonth = (ref: Date = new Date()): Date => {
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
};

/** Date du dernier jour du mois courant. */
const lastDayOfMonth = (ref: Date = new Date()): Date => {
    return new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
};

/** Convertit une date en cle period YYYY-MM. */
const toPeriodKey = (d: Date | null | undefined): string | null => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

/** Couleur d'une gauge selon ratio cumul / limite. */
const gaugeColorForRatio = (ratio: number): { color: string; tone: string; bg: string; border: string; bar: string } => {
    if (ratio >= 1.0) {
        return {
            color: 'red',
            tone: 'text-red-700',
            bg: 'bg-red-50',
            border: 'border-red-200',
            bar: 'bg-red-500',
        };
    }
    if (ratio >= 0.75) {
        return {
            color: 'orange',
            tone: 'text-orange-700',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            bar: 'bg-orange-500',
        };
    }
    if (ratio >= 0.5) {
        return {
            color: 'yellow',
            tone: 'text-yellow-700',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            bar: 'bg-yellow-500',
        };
    }
    return {
        color: 'green',
        tone: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface FormShape {
    workerId: string;
    periodStart: Date | null;
    periodEnd: Date | null;
    hp10: number | string;
    hp007: number | string;
    hp3: number | string;
    belowDetection: boolean;
    source: DoseSource;
    notes: string;
    attachmentUrls: string;
    /** Raison de l'edition (append-only — supersede). */
    supersedeReason: string;
}

const DoseEntryForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const params = useParams<{ id?: string }>();
    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    // ───── Mode edition vs creation ─────
    const editId = params.id ? Number(params.id) : null;
    const isEditMode = editId != null && !Number.isNaN(editId) && editId > 0;

    // ───── Etat ─────
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingWorkers, setLoadingWorkers] = useState(false);
    const [loadingCumulative, setLoadingCumulative] = useState(false);
    const [workerOptions, setWorkerOptions] = useState<{ value: string; label: string }[]>([]);
    const [workerMap, setWorkerMap] = useState<Record<string, WorkerListItem>>({});
    const [originalRecord, setOriginalRecord] = useState<DoseRecordDTO | null>(null);
    /** Cumul existant (sans la nouvelle dose) pour le worker selectionne, annee courante. */
    const [existingAnnualHp10, setExistingAnnualHp10] = useState<number>(0);
    /** Cumul glissant 5 ans existant (approximatif, sans la nouvelle dose). */
    const [existingRolling5yHp10, setExistingRolling5yHp10] = useState<number>(0);

    /** Modal de validation double pour valeurs elevees. */
    const [highValueModalOpen, setHighValueModalOpen] = useState(false);
    /** Volet d'aide collapsible. */
    const [helpOpen, setHelpOpen] = useState(false);

    // ───── Form ─────
    const form = useForm<FormShape>({
        initialValues: {
            workerId: '',
            periodStart: firstDayOfMonth(),
            periodEnd: lastDayOfMonth(),
            hp10: '',
            hp007: '',
            hp3: '',
            belowDetection: false,
            source: 'AGENCY',
            notes: '',
            attachmentUrls: '',
            supersedeReason: '',
        },
        validate: {
            workerId: (v) => (v ? null : t('doseEntryForm.validation.workerRequired')),
            periodStart: (v) => (v ? null : t('doseEntryForm.validation.periodStartRequired')),
            periodEnd: (v, values) => {
                if (!v) return t('doseEntryForm.validation.periodEndRequired');
                if (values.periodStart && v < values.periodStart) {
                    return t('doseEntryForm.validation.periodOrder');
                }
                return null;
            },
            source: (v) => (v ? null : t('doseEntryForm.validation.sourceRequired')),
            supersedeReason: (v) => {
                if (!isEditMode) return null;
                if (!v || v.trim().length < 10) {
                    return t('doseEntryForm.validation.supersedeReasonRequired');
                }
                return null;
            },
        },
    });

    // ───── Chargement liste workers actifs ─────
    useEffect(() => {
        let cancelled = false;
        setLoadingWorkers(true);
        const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;
        searchWorkers({ mineId })
            .then((data: any) => {
                if (cancelled) return;
                const list: any[] = Array.isArray(data) ? data : (data?.content ?? []);
                const activeOnly: WorkerListItem[] = list
                    .filter((w: any) => w?.active !== false)
                    .map((w: any) => ({
                        id: Number(w.id ?? 0),
                        matricule: w.matricule ?? `#${w.employeeId ?? ''}`,
                        fullName: w.fullName ?? `Employe #${w.employeeId ?? ''}`,
                        category: (w.category as 'A' | 'B') ?? 'B',
                        specialStatus: w.specialStatus ?? null,
                        active: w.active !== false,
                        annualHp10: typeof w.annualHp10 === 'number' ? w.annualHp10 : null,
                        rolling5yHp10: typeof w.rolling5yHp10 === 'number' ? w.rolling5yHp10 : null,
                        lastPeriod: w.lastPeriod ?? null,
                        lastHp10: typeof w.lastHp10 === 'number' ? w.lastHp10 : null,
                    }))
                    .filter((w) => w.id > 0);
                const map: Record<string, WorkerListItem> = {};
                const opts = activeOnly.map((w) => {
                    const id = String(w.id);
                    map[id] = w;
                    return { value: id, label: `${w.matricule} — ${w.fullName}` };
                });
                setWorkerMap(map);
                setWorkerOptions(opts);
            })
            .catch(() => {
                // silencieux
            })
            .finally(() => {
                if (!cancelled) setLoadingWorkers(false);
            });
        return () => {
            cancelled = true;
        };
    }, [user, selectedMineId]);

    // ───── Pre-remplissage en mode edition ─────
    useEffect(() => {
        if (!isEditMode || editId == null) return;
        let cancelled = false;
        setLoadingInitial(true);
        getDoseRecordById(editId)
            .then((dto: DoseRecordDTO) => {
                if (cancelled || !dto) return;
                setOriginalRecord(dto);
                // Reconstruit la fenetre periode depuis la cle YYYY-MM si possible.
                const periodKey = dto.period ?? '';
                let pStart: Date | null = null;
                let pEnd: Date | null = null;
                const match = /^(\d{4})-(\d{2})$/.exec(periodKey);
                if (match) {
                    const year = Number(match[1]);
                    const month = Number(match[2]) - 1;
                    pStart = new Date(year, month, 1);
                    pEnd = new Date(year, month + 1, 0);
                }
                form.setValues({
                    workerId: dto.workerId != null ? String(dto.workerId) : '',
                    periodStart: pStart ?? firstDayOfMonth(),
                    periodEnd: pEnd ?? lastDayOfMonth(),
                    hp10: dto.hp10 ?? '',
                    hp007: dto.hp007 ?? '',
                    hp3: dto.hp3 ?? '',
                    belowDetection: Boolean(dto.belowDetection),
                    source: dto.source ?? 'AGENCY',
                    notes: dto.notes ?? '',
                    attachmentUrls: dto.attachmentUrls ?? '',
                    supersedeReason: '',
                });
            })
            .catch(() => {
                errorNotification(t('doseEntryForm.errors.loadFailed'));
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, isEditMode]);

    // ───── Worker selectionne ─────
    const selectedWorker = useMemo(() => {
        const id = form.values.workerId;
        return id ? workerMap[id] ?? null : null;
    }, [form.values.workerId, workerMap]);

    // ───── Chargement cumul existant a la selection d'un worker ─────
    useEffect(() => {
        const id = form.values.workerId;
        if (!id) {
            setExistingAnnualHp10(0);
            setExistingRolling5yHp10(0);
            return;
        }
        let cancelled = false;
        setLoadingCumulative(true);

        // 1) Pre-rempli depuis la projection liste (rapide, peut etre absent).
        const fromList = workerMap[id];
        if (fromList?.annualHp10 != null) setExistingAnnualHp10(fromList.annualHp10);
        if (fromList?.rolling5yHp10 != null) setExistingRolling5yHp10(fromList.rolling5yHp10);

        // 2) Affinage : agrege les doses actives pour l'annee en cours.
        getActiveDoseRecordsByWorker(id)
            .then((data: any) => {
                if (cancelled) return;
                const list: DoseRecordDTO[] = Array.isArray(data) ? data : (data?.content ?? []);
                const currentYear = new Date().getFullYear();
                const fiveYearsAgo = currentYear - 4;
                let annual = 0;
                let rolling = 0;
                for (const rec of list) {
                    // En mode edition on exclut l'enregistrement original (sera remplace).
                    if (isEditMode && rec.id != null && Number(rec.id) === editId) continue;
                    const p = rec.period ?? '';
                    const m = /^(\d{4})-(\d{2})$/.exec(p);
                    if (!m) continue;
                    const y = Number(m[1]);
                    const hp10 = typeof rec.hp10 === 'number' ? rec.hp10 : 0;
                    if (y === currentYear) annual += hp10;
                    if (y >= fiveYearsAgo && y <= currentYear) rolling += hp10;
                }
                setExistingAnnualHp10(annual);
                setExistingRolling5yHp10(rolling);
            })
            .catch(() => {
                // silencieux : on garde la projection liste
            })
            .finally(() => {
                if (!cancelled) setLoadingCumulative(false);
            });

        return () => {
            cancelled = true;
        };
    }, [form.values.workerId, workerMap, isEditMode, editId]);

    // ───── Numerisation des valeurs saisies (gestion '' / number) ─────
    const numericHp10 = useMemo(() => {
        const v = form.values.hp10;
        if (form.values.belowDetection) return 0;
        if (v === '' || v == null) return 0;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : 0;
    }, [form.values.hp10, form.values.belowDetection]);

    const numericHp007 = useMemo(() => {
        const v = form.values.hp007;
        if (form.values.belowDetection) return 0;
        if (v === '' || v == null) return 0;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : 0;
    }, [form.values.hp007, form.values.belowDetection]);

    const numericHp3 = useMemo(() => {
        const v = form.values.hp3;
        if (form.values.belowDetection) return 0;
        if (v === '' || v == null) return 0;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : 0;
    }, [form.values.hp3, form.values.belowDetection]);

    // ───── Detection valeurs elevees ─────
    const isHp10High = numericHp10 > HP10_HIGH_THRESHOLD;
    const isHp007High = numericHp007 > HP007_HIGH_THRESHOLD;
    const isHp3High = numericHp3 > HP3_HIGH_THRESHOLD;
    const hasAnyHighValue = isHp10High || isHp007High || isHp3High;

    // ───── Projection cumuls en direct ─────
    const projectedAnnual = existingAnnualHp10 + numericHp10;
    const projectedRolling = existingRolling5yHp10 + numericHp10;
    const annualRatio = projectedAnnual / LIMIT_HP10_ANNUAL_CAT_A;
    const rollingRatio = projectedRolling / LIMIT_HP10_ROLLING_5Y;
    const lastRatio = (selectedWorker?.lastHp10 ?? 0) / (HP10_HIGH_THRESHOLD * 2); // ref interne pour la 3e gauge
    const annualColors = gaugeColorForRatio(annualRatio);
    const rollingColors = gaugeColorForRatio(rollingRatio);
    const lastColors = gaugeColorForRatio(Math.min(1, lastRatio));
    const willExceedInvestigation =
        existingAnnualHp10 < INVESTIGATION_LEVEL_HP10 && projectedAnnual >= INVESTIGATION_LEVEL_HP10;

    // ───── Effet du checkbox belowDetection : force les valeurs a 0 ─────
    useEffect(() => {
        if (form.values.belowDetection) {
            // Ne reset que si une valeur non nulle est saisie pour eviter une boucle.
            if (form.values.hp10 !== 0 && form.values.hp10 !== '') form.setFieldValue('hp10', 0);
            if (form.values.hp007 !== 0 && form.values.hp007 !== '') form.setFieldValue('hp007', 0);
            if (form.values.hp3 !== 0 && form.values.hp3 !== '') form.setFieldValue('hp3', 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.belowDetection]);

    // ───── Submit ─────
    const buildPayload = (requiresValidation: boolean): DoseRecordDTO & { requiresValidation?: boolean } => {
        const period = toPeriodKey(form.values.periodStart) ?? '';
        const baseNotes = form.values.notes.trim();
        const reason = form.values.supersedeReason.trim();
        const notes =
            isEditMode && reason
                ? baseNotes
                    ? `${baseNotes}\n\n[Supersede reason] ${reason}`
                    : `[Supersede reason] ${reason}`
                : baseNotes || null;
        return {
            ...(isEditMode && originalRecord?.id != null ? { id: originalRecord.id } : {}),
            workerId: Number(form.values.workerId),
            period,
            hp10: form.values.belowDetection ? 0 : numericHp10,
            hp007: form.values.belowDetection ? 0 : numericHp007,
            hp3: form.values.belowDetection ? 0 : numericHp3,
            source: form.values.source,
            belowDetection: form.values.belowDetection,
            attachmentUrls: form.values.attachmentUrls.trim() || null,
            notes,
            ...(isEditMode && originalRecord?.id != null
                ? { supersededRecordId: originalRecord.id }
                : {}),
            ...(requiresValidation ? { requiresValidation: true } : {}),
        };
    };

    const persistDose = async (requiresValidation: boolean) => {
        const payload = buildPayload(requiresValidation);
        dispatch(showOverlay());
        try {
            if (isEditMode) {
                await updateDoseRecord(payload);
                successNotification(t('doseEntryForm.success.versionCreated'));
            } else {
                await createDoseRecord(payload);
                successNotification(t('doseEntryForm.success.created'));
            }
            const workerId = form.values.workerId;
            navigate(`/dosimetry/doses/by-worker/${workerId}`);
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('doseEntryForm.errors.submitFailed'),
            );
        } finally {
            dispatch(hideOverlay());
        }
    };

    const handleSubmit = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            errorNotification(t('doseEntryForm.validation.completeBeforeSubmit'));
            return;
        }
        if (hasAnyHighValue) {
            // Demande validation double via modal.
            setHighValueModalOpen(true);
            return;
        }
        await persistDose(false);
    };

    const handleConfirmHighValue = async () => {
        setHighValueModalOpen(false);
        await persistDose(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  Rendu
    // ─────────────────────────────────────────────────────────────────────────

    const titleKey = isEditMode ? 'doseEntryForm.titleEdit' : 'doseEntryForm.titleNew';
    const subtitleKey = isEditMode ? 'doseEntryForm.subtitleEdit' : 'doseEntryForm.subtitleNew';
    const crumbCurrentKey = isEditMode
        ? 'doseEntryForm.breadcrumbEdit'
        : 'doseEntryForm.breadcrumbNew';

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1200px] mx-auto">
                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('doseEntryForm.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('doseEntryForm.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t(crumbCurrentKey)}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-700 shadow-indigo-200">
                                <IconAtom2 size={22} stroke={1.8} className="text-white" />
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
                                    {t(titleKey)}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t(subtitleKey)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconHelpCircle size={14} stroke={1.8} />}
                                onClick={() => setHelpOpen((v) => !v)}
                            >
                                {helpOpen
                                    ? t('doseEntryForm.actions.hideHelp')
                                    : t('doseEntryForm.actions.showHelp')}
                            </Button>
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                onClick={() => navigate('/dosimetry/workers')}
                            >
                                {t('doseEntryForm.actions.back')}
                            </Button>
                        </div>
                    </div>
                </div>

                {loadingInitial && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[12.5px]">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('doseEntryForm.loadingInitial')}
                    </div>
                )}

                {isEditMode && (
                    <Alert
                        color="amber"
                        variant="light"
                        icon={<IconHistory size={16} />}
                        title={t('doseEntryForm.editWarningTitle')}
                        className="mb-4"
                    >
                        <Text size="xs">{t('doseEntryForm.editWarningBody')}</Text>
                    </Alert>
                )}

                {/* ─── Volet aide collapsible ─── */}
                <Collapse in={helpOpen}>
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconBook size={16} className="text-indigo-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.help.title')}
                            </h2>
                        </div>

                        <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                {t('doseEntryForm.help.readingTitle')}
                            </p>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                                {t('doseEntryForm.help.readingBody')}
                            </p>
                        </div>

                        <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                {t('doseEntryForm.help.limitsTitle')}
                            </p>
                            <Table withTableBorder withColumnBorders striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('doseEntryForm.help.limitsCols.grandeur')}</Table.Th>
                                        <Table.Th>{t('doseEntryForm.help.limitsCols.catA')}</Table.Th>
                                        <Table.Th>{t('doseEntryForm.help.limitsCols.catB')}</Table.Th>
                                        <Table.Th>{t('doseEntryForm.help.limitsCols.unit')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td>Hp(10)</Table.Td>
                                        <Table.Td>20</Table.Td>
                                        <Table.Td>6</Table.Td>
                                        <Table.Td>mSv/an</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td>Hp(0.07)</Table.Td>
                                        <Table.Td>500</Table.Td>
                                        <Table.Td>150</Table.Td>
                                        <Table.Td>mSv/an</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td>Hp(3)</Table.Td>
                                        <Table.Td>20</Table.Td>
                                        <Table.Td>15</Table.Td>
                                        <Table.Td>mSv/an</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                            <p className="text-[11px] text-slate-500 mt-1.5 italic">
                                {t('doseEntryForm.help.limitsRef')}
                            </p>
                        </div>

                        <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                {t('doseEntryForm.help.procedureTitle')}
                            </p>
                            <ol className="list-decimal list-inside text-[12px] text-slate-600 leading-relaxed space-y-1">
                                <li>{t('doseEntryForm.help.procedureSteps.0')}</li>
                                <li>{t('doseEntryForm.help.procedureSteps.1')}</li>
                                <li>{t('doseEntryForm.help.procedureSteps.2')}</li>
                                <li>{t('doseEntryForm.help.procedureSteps.3')}</li>
                                <li>{t('doseEntryForm.help.procedureSteps.4')}</li>
                            </ol>
                        </div>
                    </Paper>
                </Collapse>

                <div className="space-y-4">
                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SECTION 1 — Travailleur & periode                       */}
                    {/* ─────────────────────────────────────────────────────── */}
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconUser size={16} className="text-teal-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.sections.workerPeriod')}
                            </h2>
                        </div>

                        <Select
                            label={t('doseEntryForm.worker.selectLabel')}
                            placeholder={
                                loadingWorkers
                                    ? t('doseEntryForm.worker.loading')
                                    : t('doseEntryForm.worker.selectPlaceholder')
                            }
                            data={workerOptions}
                            searchable
                            nothingFoundMessage={t('doseEntryForm.worker.notFound')}
                            withAsterisk
                            size="sm"
                            disabled={isEditMode}
                            {...form.getInputProps('workerId')}
                        />

                        {/* Card 360-mini */}
                        {selectedWorker && (
                            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-4">
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Badge color="indigo" variant="light" size="sm">
                                                {selectedWorker.matricule}
                                            </Badge>
                                            <Badge
                                                color={selectedWorker.category === 'A' ? 'red' : 'blue'}
                                                variant="light"
                                                size="sm"
                                            >
                                                {t('doseEntryForm.worker.category')} {selectedWorker.category}
                                            </Badge>
                                            {selectedWorker.specialStatus &&
                                                selectedWorker.specialStatus !== 'NONE' && (
                                                    <Badge color="orange" variant="light" size="sm">
                                                        {selectedWorker.specialStatus}
                                                    </Badge>
                                                )}
                                        </div>
                                        <p className="text-[14px] font-semibold text-slate-800 truncate">
                                            {selectedWorker.fullName}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 min-w-[260px]">
                                        <MiniStat
                                            label={t('doseEntryForm.worker.lastDose')}
                                            value={
                                                selectedWorker.lastHp10 != null
                                                    ? `${selectedWorker.lastHp10.toFixed(2)} mSv`
                                                    : '—'
                                            }
                                            sublabel={selectedWorker.lastPeriod ?? '—'}
                                        />
                                        <MiniStat
                                            label={t('doseEntryForm.worker.annualCumul')}
                                            value={`${existingAnnualHp10.toFixed(2)} mSv`}
                                            sublabel={`${new Date().getFullYear()}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateInput
                                label={t('doseEntryForm.period.startLabel')}
                                placeholder={t('doseEntryForm.period.placeholder')}
                                valueFormat="DD/MM/YYYY"
                                withAsterisk
                                size="sm"
                                leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                {...form.getInputProps('periodStart')}
                            />
                            <DateInput
                                label={t('doseEntryForm.period.endLabel')}
                                placeholder={t('doseEntryForm.period.placeholder')}
                                valueFormat="DD/MM/YYYY"
                                withAsterisk
                                size="sm"
                                leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                {...form.getInputProps('periodEnd')}
                            />
                        </div>
                        {form.values.periodStart && (
                            <Text size="xs" c="dimmed">
                                {t('doseEntryForm.period.previewMonth', {
                                    period: toPeriodKey(form.values.periodStart),
                                    start: formatDateFr(form.values.periodStart),
                                    end: formatDateFr(form.values.periodEnd),
                                })}
                            </Text>
                        )}
                    </Paper>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SECTION 2 — Mesures dose                                */}
                    {/* ─────────────────────────────────────────────────────── */}
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconActivity size={16} className="text-indigo-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.sections.measurements')}
                            </h2>
                        </div>

                        <Checkbox
                            label={
                                <span className="flex items-center gap-1.5">
                                    {t('doseEntryForm.measurements.belowDetectionLabel')}
                                    <Tooltip
                                        label={t('doseEntryForm.measurements.belowDetectionTooltip')}
                                        multiline
                                        w={260}
                                    >
                                        <IconInfoCircle size={12} className="text-slate-400" />
                                    </Tooltip>
                                </span>
                            }
                            {...form.getInputProps('belowDetection', { type: 'checkbox' })}
                        />

                        {/* HP10 card */}
                        <DoseMetricCard
                            icon={<IconBolt size={14} stroke={1.8} className="text-indigo-600" />}
                            color="indigo"
                            title={t('doseEntryForm.measurements.hp10.title')}
                            description={t('doseEntryForm.measurements.hp10.description')}
                            tooltip={t('doseEntryForm.measurements.hp10.tooltip')}
                            inputProps={form.getInputProps('hp10')}
                            disabled={form.values.belowDetection}
                            warning={
                                isHp10High
                                    ? t('doseEntryForm.measurements.hp10.highWarning', {
                                          threshold: HP10_HIGH_THRESHOLD,
                                      })
                                    : null
                            }
                        />

                        {/* HP007 card */}
                        <DoseMetricCard
                            icon={<IconBolt size={14} stroke={1.8} className="text-amber-600" />}
                            color="orange"
                            title={t('doseEntryForm.measurements.hp007.title')}
                            description={t('doseEntryForm.measurements.hp007.description')}
                            tooltip={t('doseEntryForm.measurements.hp007.tooltip')}
                            inputProps={form.getInputProps('hp007')}
                            disabled={form.values.belowDetection}
                            warning={
                                isHp007High
                                    ? t('doseEntryForm.measurements.hp007.highWarning', {
                                          threshold: HP007_HIGH_THRESHOLD,
                                      })
                                    : null
                            }
                        />

                        {/* HP3 card */}
                        <DoseMetricCard
                            icon={<IconBolt size={14} stroke={1.8} className="text-violet-600" />}
                            color="violet"
                            title={t('doseEntryForm.measurements.hp3.title')}
                            description={t('doseEntryForm.measurements.hp3.description')}
                            tooltip={t('doseEntryForm.measurements.hp3.tooltip')}
                            inputProps={form.getInputProps('hp3')}
                            disabled={form.values.belowDetection}
                            warning={
                                isHp3High
                                    ? t('doseEntryForm.measurements.hp3.highWarning', {
                                          threshold: HP3_HIGH_THRESHOLD,
                                      })
                                    : null
                            }
                        />

                        {/* Source radio */}
                        <Radio.Group
                            label={t('doseEntryForm.measurements.sourceLabel')}
                            withAsterisk
                            {...form.getInputProps('source')}
                        >
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Radio value="AGENCY" label={t('doseEntryForm.measurements.sources.AGENCY')} />
                                    <Tooltip
                                        label={t('doseEntryForm.measurements.sourceTooltips.AGENCY')}
                                        multiline
                                        w={260}
                                    >
                                        <IconInfoCircle size={12} className="text-slate-400" />
                                    </Tooltip>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Radio value="EPD" label={t('doseEntryForm.measurements.sources.EPD')} />
                                    <Tooltip
                                        label={t('doseEntryForm.measurements.sourceTooltips.EPD')}
                                        multiline
                                        w={260}
                                    >
                                        <IconInfoCircle size={12} className="text-slate-400" />
                                    </Tooltip>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Radio
                                        value="ESTIMATED"
                                        label={t('doseEntryForm.measurements.sources.ESTIMATED')}
                                    />
                                    <Tooltip
                                        label={t('doseEntryForm.measurements.sourceTooltips.ESTIMATED')}
                                        multiline
                                        w={260}
                                    >
                                        <IconInfoCircle size={12} className="text-slate-400" />
                                    </Tooltip>
                                </div>
                            </div>
                        </Radio.Group>
                    </Paper>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SECTION 3 — Pieces jointes & notes                       */}
                    {/* ─────────────────────────────────────────────────────── */}
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconPaperclip size={16} className="text-slate-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.sections.attachments')}
                            </h2>
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                            <IconUpload size={22} stroke={1.4} className="mx-auto text-slate-400 mb-1.5" />
                            <p className="text-[12.5px] text-slate-600 font-medium mb-0.5">
                                {t('doseEntryForm.attachments.uploadTitle')}
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {t('doseEntryForm.attachments.uploadHint')}
                            </p>
                        </div>

                        <Textarea
                            label={
                                <span className="flex items-center gap-1.5">
                                    <IconNote size={12} className="text-slate-500" />
                                    {t('doseEntryForm.attachments.notesLabel')}
                                </span>
                            }
                            placeholder={t('doseEntryForm.attachments.notesPlaceholder')}
                            minRows={3}
                            autosize
                            {...form.getInputProps('notes')}
                        />

                        {isEditMode && (
                            <Textarea
                                label={t('doseEntryForm.attachments.supersedeReasonLabel')}
                                placeholder={t('doseEntryForm.attachments.supersedeReasonPlaceholder')}
                                minRows={2}
                                autosize
                                withAsterisk
                                {...form.getInputProps('supersedeReason')}
                            />
                        )}
                    </Paper>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SECTION 4 — Cumuls en direct                            */}
                    {/* ─────────────────────────────────────────────────────── */}
                    <Paper className="border border-violet-200 shadow-sm rounded-xl p-5 space-y-4 bg-gradient-to-br from-violet-50/60 to-indigo-50/30">
                        <div className="flex items-center gap-2 pb-2 border-b border-violet-100">
                            <IconChartBar size={16} className="text-violet-700" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.sections.cumulative')}
                            </h2>
                            {loadingCumulative && (
                                <span className="inline-block w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                            )}
                        </div>

                        {!selectedWorker ? (
                            <Text size="xs" c="dimmed">
                                {t('doseEntryForm.cumulative.selectWorkerHint')}
                            </Text>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Annuel Hp10 */}
                                    <GaugeCard
                                        title={t('doseEntryForm.cumulative.annualTitle')}
                                        currentValue={`${projectedAnnual.toFixed(2)} mSv`}
                                        limit={`${LIMIT_HP10_ANNUAL_CAT_A} mSv`}
                                        ratio={annualRatio}
                                        colors={annualColors}
                                        sublabel={t('doseEntryForm.cumulative.annualSublabel', {
                                            existing: existingAnnualHp10.toFixed(2),
                                            added: numericHp10.toFixed(2),
                                        })}
                                    />
                                    {/* Glissant 5 ans */}
                                    <GaugeCard
                                        title={t('doseEntryForm.cumulative.rollingTitle')}
                                        currentValue={`${projectedRolling.toFixed(2)} mSv`}
                                        limit={`${LIMIT_HP10_ROLLING_5Y} mSv`}
                                        ratio={rollingRatio}
                                        colors={rollingColors}
                                        sublabel={t('doseEntryForm.cumulative.rollingSublabel', {
                                            existing: existingRolling5yHp10.toFixed(2),
                                            added: numericHp10.toFixed(2),
                                        })}
                                    />
                                    {/* Derniere dose */}
                                    <GaugeCard
                                        title={t('doseEntryForm.cumulative.lastTitle')}
                                        currentValue={
                                            selectedWorker.lastHp10 != null
                                                ? `${selectedWorker.lastHp10.toFixed(2)} mSv`
                                                : '—'
                                        }
                                        limit={selectedWorker.lastPeriod ?? '—'}
                                        ratio={Math.min(1, lastRatio)}
                                        colors={lastColors}
                                        sublabel={t('doseEntryForm.cumulative.lastSublabel')}
                                    />
                                </div>

                                {willExceedInvestigation && (
                                    <Alert
                                        color="orange"
                                        variant="light"
                                        icon={<IconAlertTriangle size={16} />}
                                        title={t('doseEntryForm.cumulative.investigationBannerTitle')}
                                    >
                                        <Text size="xs">
                                            {t('doseEntryForm.cumulative.investigationBannerBody', {
                                                level: INVESTIGATION_LEVEL_HP10,
                                            })}
                                        </Text>
                                    </Alert>
                                )}
                                {annualRatio >= 1.0 && (
                                    <Alert
                                        color="red"
                                        variant="light"
                                        icon={<IconAlertOctagon size={16} />}
                                        title={t('doseEntryForm.cumulative.exceededBannerTitle')}
                                    >
                                        <Text size="xs">
                                            {t('doseEntryForm.cumulative.exceededBannerBody', {
                                                limit: LIMIT_HP10_ANNUAL_CAT_A,
                                            })}
                                        </Text>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Paper>

                    {/* ─────────────────────────────────────────────────────── */}
                    {/* SECTION 5 — Validation & soumission                     */}
                    {/* ─────────────────────────────────────────────────────── */}
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconShieldCheck size={16} className="text-emerald-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('doseEntryForm.sections.submit')}
                            </h2>
                        </div>

                        {hasAnyHighValue && (
                            <Alert
                                color="orange"
                                variant="light"
                                icon={<IconAlertTriangle size={16} />}
                                title={t('doseEntryForm.submit.highValueTitle')}
                            >
                                <Text size="xs">{t('doseEntryForm.submit.highValueBody')}</Text>
                            </Alert>
                        )}

                        <Group justify="flex-end">
                            <Button
                                variant="default"
                                onClick={() => navigate('/dosimetry/workers')}
                            >
                                {t('doseEntryForm.actions.cancel')}
                            </Button>
                            <Button
                                color="indigo"
                                className="!bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700"
                                leftSection={<IconDeviceFloppy size={14} stroke={2} />}
                                onClick={handleSubmit}
                            >
                                {isEditMode
                                    ? t('doseEntryForm.actions.saveVersion')
                                    : t('doseEntryForm.actions.save')}
                            </Button>
                        </Group>
                    </Paper>
                </div>
            </div>

            {/* ─── Modal validation double pour valeurs elevees ─── */}
            <Modal
                opened={highValueModalOpen}
                onClose={() => setHighValueModalOpen(false)}
                title={
                    <span className="flex items-center gap-2 text-slate-800 font-semibold">
                        <IconAlertOctagon size={16} stroke={1.8} className="text-red-600" />
                        {t('doseEntryForm.modal.title')}
                    </span>
                }
                centered
            >
                <div className="space-y-3">
                    <Text size="sm">{t('doseEntryForm.modal.body')}</Text>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12.5px] text-slate-700 space-y-1">
                        {isHp10High && (
                            <div className="flex justify-between">
                                <span>Hp(10) :</span>
                                <strong>{numericHp10.toFixed(2)} mSv</strong>
                            </div>
                        )}
                        {isHp007High && (
                            <div className="flex justify-between">
                                <span>Hp(0.07) :</span>
                                <strong>{numericHp007.toFixed(2)} mSv</strong>
                            </div>
                        )}
                        {isHp3High && (
                            <div className="flex justify-between">
                                <span>Hp(3) :</span>
                                <strong>{numericHp3.toFixed(2)} mSv</strong>
                            </div>
                        )}
                    </div>
                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={() => setHighValueModalOpen(false)}>
                            {t('doseEntryForm.actions.cancel')}
                        </Button>
                        <Button
                            color="red"
                            leftSection={<IconCheck size={14} stroke={2} />}
                            onClick={handleConfirmHighValue}
                        >
                            {t('doseEntryForm.modal.confirm')}
                        </Button>
                    </Group>
                </div>
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

interface MiniStatProps {
    label: string;
    value: string | number;
    sublabel?: string;
}

const MiniStat = ({ label, value, sublabel }: MiniStatProps) => (
    <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
        <div className="text-[9.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
            {label}
        </div>
        <div className="text-[13px] font-semibold text-slate-800 leading-tight">{value}</div>
        {sublabel && <div className="text-[10px] text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
);

interface DoseMetricCardProps {
    icon: React.ReactNode;
    color: 'indigo' | 'orange' | 'violet';
    title: string;
    description: string;
    tooltip: string;
    // useForm getInputProps returns a complex object; we type permissively to avoid
    // a hard dependency on Mantine internal types here.
    inputProps: any;
    disabled: boolean;
    warning: string | null;
}

const DoseMetricCard = ({
    icon,
    color,
    title,
    description,
    tooltip,
    inputProps,
    disabled,
    warning,
}: DoseMetricCardProps) => {
    const accentBorder =
        color === 'indigo'
            ? 'border-indigo-100'
            : color === 'orange'
              ? 'border-amber-100'
              : 'border-violet-100';
    const accentBg =
        color === 'indigo'
            ? 'bg-indigo-50/30'
            : color === 'orange'
              ? 'bg-amber-50/30'
              : 'bg-violet-50/30';

    return (
        <div className={`rounded-xl border ${accentBorder} ${accentBg} p-4 space-y-2`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    {icon}
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                            {title}
                        </p>
                        <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                            {description}
                        </p>
                    </div>
                </div>
                <Tooltip label={tooltip} multiline w={280}>
                    <IconInfoCircle size={14} className="text-slate-400 flex-shrink-0" />
                </Tooltip>
            </div>
            <NumberInput
                placeholder="0.00"
                size="sm"
                min={0}
                step={0.01}
                decimalScale={3}
                rightSection={<span className="text-[11px] text-slate-500 pr-2">mSv</span>}
                rightSectionWidth={42}
                disabled={disabled}
                {...inputProps}
            />
            {warning && (
                <Alert color="orange" variant="light" icon={<IconAlertTriangle size={14} />} p="xs">
                    <Text size="xs">{warning}</Text>
                </Alert>
            )}
        </div>
    );
};

interface GaugeCardProps {
    title: string;
    currentValue: string;
    limit: string;
    ratio: number;
    colors: { color: string; tone: string; bg: string; border: string; bar: string };
    sublabel?: string;
}

const GaugeCard = ({ title, currentValue, limit, ratio, colors, sublabel }: GaugeCardProps) => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const pct = Math.round(clampedRatio * 100);
    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {title}
                </p>
                <span className={`text-[11px] font-semibold ${colors.tone}`}>{pct}%</span>
            </div>
            <p className={`text-[18px] font-bold ${colors.tone} leading-tight`}>{currentValue}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
                / <strong>{limit}</strong>
            </p>
            <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                <div
                    className={`h-full ${colors.bar} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {sublabel && <p className="text-[10.5px] text-slate-500 mt-1.5">{sublabel}</p>}
        </div>
    );
};

export default DoseEntryForm;
