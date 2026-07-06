/**
 * DosimeterAssignmentForm — Phase 3 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Formulaire premium d'attribution / restitution d'un dosimetre.
 *
 * Deux modes (selectionnes via prop {@code mode} ou via la route appelante) :
 *   - ATTRIBUTION (route /dosimetry/dosimeters/assign?dosimeterId=X&qr=Y)
 *     1. Section "Dosimetre" — pre-rempli depuis URL OU autocompletion sur les
 *        dosimetres AVAILABLE (via DosimetryService.searchDosimeters). Le bouton
 *        "Scanner QR" ouvre un scanner placeholder qui simule la lecture d'un QR.
 *     2. Section "Travailleur" — autocompletion sur les workers actifs (via
 *        DosimetryService.searchWorkers). Banner "Surveillance medicale renforcee"
 *        si specialStatus = NONE et categorie A (regle metier UI).
 *     3. Section "Periode" — DateInput debut + fin. Validation : debut < fin
 *        et periode max 12 mois.
 *     4. Section "Accuse de remise" — note libre + checkbox + bouton submit
 *        qui appelle DosimetryService.assignDosimeter().
 *
 *   - RESTITUTION (route /dosimetry/dosimeters/return?assignmentId=X)
 *     1. Affiche le dosimetre + worker (read-only depuis l'assignment).
 *     2. Section "Etat du dispositif" : select (INTACT / DAMAGED / LOST / OTHER)
 *        + textarea de description si DAMAGED/OTHER + placeholder photo upload.
 *     3. Checkbox de confirmation + bouton submit qui appelle
 *        DosimetryService.returnDosimeter().
 *
 * Apres succes : navigation vers /dosimetry/dosimeters + notification.
 *
 * Pattern UI/UX aligne sur ExposedWorkerForm et NonConformityForm :
 *   - Breadcrumb premium + hero card gradient indigo/violet
 *   - Sections Mantine Paper + bordures premium + Stepper visuel
 *   - i18n via namespace `dosimetry` -> bloc `assignmentForm`
 *   - tsc strict + vite EXIT 0
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import {
    Paper,
    Group,
    Button,
    Select,
    Textarea,
    Checkbox,
    Tooltip,
    Alert,
    Text,
    Badge,
    Modal,
    TextInput,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconChevronRight,
    IconQrcode,
    IconScan,
    IconDeviceWatch,
    IconUser,
    IconCalendarTime,
    IconAlertOctagon,
    IconCheck,
    IconArrowBackUp,
    IconInfoCircle,
    IconShieldCheck,
    IconReceipt,
    IconCamera,
    IconClipboardCheck,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification, extractErrorMessage } from '../../utility/NotificationUtility';
import {
    searchDosimeters,
    findDosimeterByQr,
    searchWorkers,
    getAssignmentById,
    assignDosimeter,
    returnDosimeter,
    getDosimeterById,
    type DosimeterDTO,
    type DosimeterAssignmentDTO,
    type DosimeterAssignmentRequest,
    type DosimeterReturnRequest,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Mode du formulaire — ATTRIBUTION ou RESTITUTION. */
export type AssignmentFormMode = 'ASSIGN' | 'RETURN';

/** Etat constate du dispositif a la restitution (aligne sur les enums backend). */
type DeviceCondition = 'INTACT' | 'DAMAGED' | 'LOST' | 'OTHER';

/** Projection minimale d'un worker pour le Select autocomplete. */
interface WorkerListItem {
    id: number;
    matricule: string;
    fullName: string;
    category: 'A' | 'B';
    specialStatus: string | null;
    active: boolean;
}

interface DosimeterAssignmentFormProps {
    /** Mode du formulaire. Si absent : derive de l'URL (heuristique). */
    mode?: AssignmentFormMode;
}

const toLocalDate = (d: Date | null | undefined): string | null => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const parseDate = (s?: string | null): Date | null => {
    if (!s) return null;
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return null;
        return d;
    } catch {
        return null;
    }
};

const formatDateFr = (d: Date | null | undefined): string => {
    if (!d) return '—';
    try {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

/** Difference en mois entre 2 dates (approximatif — utilise pour validation periode). */
const monthsBetween = (start: Date, end: Date): number => {
    const ms = end.getTime() - start.getTime();
    return ms / (1000 * 60 * 60 * 24 * 30.44);
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimeterAssignmentForm = ({ mode: modeProp }: DosimeterAssignmentFormProps) => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const user = useAppSelector((state: any) => state.user);

    // ───── Resolution du mode ─────
    // Si la prop n'est pas fournie, on derive depuis le chemin courant.
    const derivedMode: AssignmentFormMode = useMemo(() => {
        if (modeProp) return modeProp;
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        if (path.includes('/return')) return 'RETURN';
        return 'ASSIGN';
    }, [modeProp]);

    const isAssign = derivedMode === 'ASSIGN';

    // ───── Etat global ─────
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingDosimeters, setLoadingDosimeters] = useState(false);
    const [loadingWorkers, setLoadingWorkers] = useState(false);

    const [dosimeterOptions, setDosimeterOptions] = useState<{ value: string; label: string }[]>([]);
    const [dosimeterMap, setDosimeterMap] = useState<Record<string, DosimeterDTO>>({});

    const [workerOptions, setWorkerOptions] = useState<{ value: string; label: string }[]>([]);
    const [workerMap, setWorkerMap] = useState<Record<string, WorkerListItem>>({});

    /** Assignment courante (mode RETURN) charge depuis assignmentId. */
    const [currentAssignment, setCurrentAssignment] = useState<DosimeterAssignmentDTO | null>(null);
    /** Dosimetre lie au currentAssignment (mode RETURN). */
    const [returnDosimeterInfo, setReturnDosimeterInfo] = useState<DosimeterDTO | null>(null);

    /** Scanner QR placeholder modal. */
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerInput, setScannerInput] = useState('');

    // ───── Form Mantine ─────
    const assignForm = useForm<{
        dosimeterId: string;
        workerId: string;
        periodStart: Date | null;
        periodEnd: Date | null;
        handoverNote: string;
        handoverAck: boolean;
    }>({
        initialValues: {
            dosimeterId: '',
            workerId: '',
            periodStart: new Date(),
            periodEnd: null,
            handoverNote: '',
            handoverAck: false,
        },
        validate: {
            dosimeterId: (v) => (v ? null : t('assignmentForm.validation.dosimeterRequired')),
            workerId: (v) => (v ? null : t('assignmentForm.validation.workerRequired')),
            periodStart: (v) => (v ? null : t('assignmentForm.validation.periodStartRequired')),
            periodEnd: (v, values) => {
                if (!v) return t('assignmentForm.validation.periodEndRequired');
                if (values.periodStart && v <= values.periodStart) {
                    return t('assignmentForm.validation.periodOrder');
                }
                if (values.periodStart && monthsBetween(values.periodStart, v) > 12.05) {
                    return t('assignmentForm.validation.periodMax12Months');
                }
                return null;
            },
            handoverAck: (v) => (v ? null : t('assignmentForm.validation.handoverAckRequired')),
        },
    });

    const returnForm = useForm<{
        deviceCondition: DeviceCondition;
        deviceConditionNote: string;
        photoUrl: string;
        returnAck: boolean;
    }>({
        initialValues: {
            deviceCondition: 'INTACT',
            deviceConditionNote: '',
            photoUrl: '',
            returnAck: false,
        },
        validate: {
            deviceCondition: (v) => (v ? null : t('assignmentForm.validation.deviceConditionRequired')),
            deviceConditionNote: (v, values) =>
                (values.deviceCondition === 'DAMAGED' || values.deviceCondition === 'OTHER') &&
                !v.trim()
                    ? t('assignmentForm.validation.conditionNoteRequired')
                    : null,
            returnAck: (v) => (v ? null : t('assignmentForm.validation.returnAckRequired')),
        },
    });

    // ───── Resolution du mineId (companySelection) ─────
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    // ───── Pre-remplissage initial (ASSIGN) — dosimeterId / qr depuis URL ─────
    useEffect(() => {
        if (!isAssign) return;
        const dosimeterIdParam = searchParams.get('dosimeterId');
        const qrParam = searchParams.get('qr');
        if (!dosimeterIdParam && !qrParam) return;

        let cancelled = false;
        setLoadingInitial(true);

        const loadByQr = async (qr: string): Promise<DosimeterDTO | null> => {
            if (selectedMineId == null) return null;
            return findDosimeterByQr(qr, selectedMineId);
        };

        const fetcher: Promise<DosimeterDTO | null> = dosimeterIdParam
            ? getDosimeterById(dosimeterIdParam)
                  .then((d: DosimeterDTO) => d)
                  .catch(() => null)
            : qrParam
              ? loadByQr(qrParam).catch(() => null)
              : Promise.resolve(null);

        fetcher
            .then((dto) => {
                if (cancelled || !dto || dto.id == null) return;
                const idStr = String(dto.id);
                setDosimeterMap((m) => ({ ...m, [idStr]: dto }));
                setDosimeterOptions((opts) => {
                    if (opts.find((o) => o.value === idStr)) return opts;
                    return [
                        ...opts,
                        { value: idStr, label: `${dto.serial} — ${dto.type}` },
                    ];
                });
                assignForm.setFieldValue('dosimeterId', idStr);
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAssign, searchParams]);

    // ───── Chargement initial des dosimetres AVAILABLE (ASSIGN) ─────
    useEffect(() => {
        if (!isAssign) return;
        if (selectedMineId == null) return;
        let cancelled = false;
        setLoadingDosimeters(true);
        searchDosimeters({ mineId: selectedMineId, status: ['AVAILABLE'] })
            .then((list: DosimeterDTO[]) => {
                if (cancelled) return;
                const map: Record<string, DosimeterDTO> = {};
                const opts = (list ?? [])
                    .filter((d) => d.id != null)
                    .map((d) => {
                        const id = String(d.id);
                        map[id] = d;
                        return {
                            value: id,
                            label: `${d.serial} — ${d.type}${d.qrCode ? ` (${d.qrCode})` : ''}`,
                        };
                    });
                setDosimeterMap((prev) => ({ ...prev, ...map }));
                setDosimeterOptions((prev) => {
                    // Fusion idempotente avec les options pre-remplies (par dosimeterId URL).
                    const merged = new Map<string, { value: string; label: string }>();
                    [...prev, ...opts].forEach((o) => merged.set(o.value, o));
                    return Array.from(merged.values());
                });
            })
            .catch(() => {
                // silencieux : l'utilisateur sera notifie via le placeholder du Select
            })
            .finally(() => {
                if (!cancelled) setLoadingDosimeters(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAssign, selectedMineId]);

    // ───── Chargement des workers actifs (ASSIGN) ─────
    useEffect(() => {
        if (!isAssign) return;
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
    }, [isAssign, user, selectedMineId]);

    // ───── Chargement de l'assignment (RETURN) ─────
    useEffect(() => {
        if (isAssign) return;
        const assignmentIdParam = searchParams.get('assignmentId');
        if (!assignmentIdParam) return;
        let cancelled = false;
        setLoadingInitial(true);
        getAssignmentById(assignmentIdParam)
            .then(async (asg: DosimeterAssignmentDTO) => {
                if (cancelled || !asg) return;
                setCurrentAssignment(asg);
                // Charge le dosimetre lie pour afficher serial/type.
                if (asg.dosimeterId != null) {
                    try {
                        const dto: DosimeterDTO = await getDosimeterById(asg.dosimeterId);
                        if (!cancelled) setReturnDosimeterInfo(dto);
                    } catch {
                        // silencieux
                    }
                }
            })
            .catch(() => {
                if (cancelled) return;
                errorNotification(t('assignmentForm.errors.assignmentLoadFailed'));
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAssign, searchParams, t]);

    // ───── Dosimetre selectionne (ASSIGN) ─────
    const selectedDosimeter = useMemo(() => {
        const id = assignForm.values.dosimeterId;
        return id ? dosimeterMap[id] ?? null : null;
    }, [assignForm.values.dosimeterId, dosimeterMap]);

    // ───── Worker selectionne (ASSIGN) ─────
    const selectedWorker = useMemo(() => {
        const id = assignForm.values.workerId;
        return id ? workerMap[id] ?? null : null;
    }, [assignForm.values.workerId, workerMap]);

    // ───── Banner "Surveillance medicale renforcee" ─────
    // Regle metier : worker categorie A ET specialStatus = NONE -> surveillance renforcee
    const showMedicalReinforcedBanner = useMemo(() => {
        if (!selectedWorker) return false;
        const statusNormalized = selectedWorker.specialStatus ?? 'NONE';
        return selectedWorker.category === 'A' && statusNormalized === 'NONE';
    }, [selectedWorker]);

    // ───── Y a-t-il un dosimeterId pre-rempli depuis l'URL ? ─────
    const dosimeterPrefilledFromUrl = useMemo(() => {
        return Boolean(searchParams.get('dosimeterId') || searchParams.get('qr'));
    }, [searchParams]);

    // ───── Submit ASSIGN ─────
    const handleSubmitAssign = async () => {
        const validation = assignForm.validate();
        if (validation.hasErrors) {
            errorNotification(t('assignmentForm.validation.completeBeforeSubmit'));
            return;
        }
        const values = assignForm.values;
        const payload: DosimeterAssignmentRequest = {
            dosimeterId: Number(values.dosimeterId),
            workerId: Number(values.workerId),
            periodStart: toLocalDate(values.periodStart) ?? new Date().toISOString().slice(0, 10),
            periodEnd: toLocalDate(values.periodEnd),
            // handoverNote — champ dedie cote backend (DosimeterAssignDTO.handoverNote).
            // Le checkbox handoverAck reste UX-only : sa validation bloque le submit
            // mais il n'est pas envoye au backend (pas de champ dedie dans le DTO).
            handoverNote: values.handoverNote.trim() ? values.handoverNote.trim() : null,
        };
        dispatch(showOverlay());
        try {
            await assignDosimeter(payload);
            successNotification(t('assignmentForm.success.assignCreated'));
            navigate('/dosimetry/dosimeters');
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('assignmentForm.errors.submitFailed'),
            );
        } finally {
            dispatch(hideOverlay());
        }
    };

    // ───── Submit RETURN ─────
    const handleSubmitReturn = async () => {
        const validation = returnForm.validate();
        if (validation.hasErrors) {
            errorNotification(t('assignmentForm.validation.completeBeforeSubmit'));
            return;
        }
        if (!currentAssignment?.id) {
            errorNotification(t('assignmentForm.errors.noAssignment'));
            return;
        }
        const values = returnForm.values;
        const payload: DosimeterReturnRequest = {
            assignmentId: Number(currentAssignment.id),
            returnAck: values.returnAck,
            deviceCondition: values.deviceCondition,
            deviceConditionNote: values.deviceConditionNote.trim() || null,
            photoUrl: values.photoUrl.trim() || null,
        };
        dispatch(showOverlay());
        try {
            await returnDosimeter(payload);
            successNotification(t('assignmentForm.success.returnRecorded'));
            navigate('/dosimetry/dosimeters');
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('assignmentForm.errors.submitFailed'),
            );
        } finally {
            dispatch(hideOverlay());
        }
    };

    // ───── Scanner QR placeholder ─────
    const handleScannerConfirm = async () => {
        const qr = scannerInput.trim();
        if (!qr) {
            errorNotification(t('assignmentForm.scanner.invalidQr'));
            return;
        }
        if (selectedMineId == null) {
            errorNotification(t('assignmentForm.scanner.searchFailed'));
            return;
        }
        try {
            const dto = await findDosimeterByQr(qr, selectedMineId);
            if (!dto || dto.id == null) {
                errorNotification(t('assignmentForm.scanner.notFound'));
                return;
            }
            const idStr = String(dto.id);
            setDosimeterMap((m) => ({ ...m, [idStr]: dto }));
            setDosimeterOptions((opts) => {
                if (opts.find((o) => o.value === idStr)) return opts;
                return [
                    ...opts,
                    { value: idStr, label: `${dto.serial} — ${dto.type}` },
                ];
            });
            assignForm.setFieldValue('dosimeterId', idStr);
            successNotification(t('assignmentForm.scanner.matched', { serial: dto.serial }));
            setScannerOpen(false);
            setScannerInput('');
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('assignmentForm.scanner.searchFailed')));
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  Rendu
    // ─────────────────────────────────────────────────────────────────────────

    const titleKey = isAssign ? 'assignmentForm.assign.title' : 'assignmentForm.return.title';
    const subtitleKey = isAssign ? 'assignmentForm.assign.subtitle' : 'assignmentForm.return.subtitle';
    const crumbCurrentKey = isAssign
        ? 'assignmentForm.assign.breadcrumb'
        : 'assignmentForm.return.breadcrumb';

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="max-w-[1200px] mx-auto">
                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dosimeters.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dosimeters.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/dosimeters')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700"
                    >
                        {t('dosimeters.breadcrumbCurrent')}
                    </button>
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
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                                    isAssign
                                        ? 'bg-gradient-to-br from-indigo-500 to-violet-700 shadow-indigo-200'
                                        : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-200'
                                }`}
                            >
                                {isAssign ? (
                                    <IconClipboardCheck size={22} stroke={1.8} className="text-white" />
                                ) : (
                                    <IconArrowBackUp size={22} stroke={1.8} className="text-white" />
                                )}
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
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                            onClick={() => navigate('/dosimetry/dosimeters')}
                        >
                            {t('assignmentForm.actions.back')}
                        </Button>
                    </div>
                </div>

                {loadingInitial && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[12.5px]">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('assignmentForm.loadingInitial')}
                    </div>
                )}

                {/* ─── MODE ASSIGN ─── */}
                {isAssign && (
                    <div className="space-y-4">
                        {/* Section 1 — Dosimetre */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <IconDeviceWatch size={16} className="text-indigo-600" stroke={1.8} />
                                    <h2 className="text-[14px] font-semibold text-slate-800">
                                        {t('assignmentForm.sections.dosimeter')}
                                    </h2>
                                </div>
                                {!dosimeterPrefilledFromUrl && (
                                    <Button
                                        variant="light"
                                        color="indigo"
                                        size="xs"
                                        leftSection={<IconScan size={13} stroke={1.8} />}
                                        onClick={() => setScannerOpen(true)}
                                    >
                                        {t('assignmentForm.actions.scanQr')}
                                    </Button>
                                )}
                            </div>

                            {dosimeterPrefilledFromUrl && selectedDosimeter ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    <ReadOnlyCard
                                        icon={<IconDeviceWatch size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.serial')}
                                        value={selectedDosimeter.serial}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconReceipt size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.type')}
                                        value={selectedDosimeter.type}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconQrcode size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.qrCode')}
                                        value={selectedDosimeter.qrCode ?? '—'}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconShieldCheck size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.status')}
                                        value={t(`dosimeters.statusValues.${selectedDosimeter.status}`, {
                                            defaultValue: selectedDosimeter.status,
                                        })}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Select
                                        label={
                                            <span className="flex items-center gap-1.5">
                                                {t('assignmentForm.dosimeter.selectLabel')}
                                                <Tooltip
                                                    label={t('assignmentForm.dosimeter.selectTooltip')}
                                                    multiline
                                                    w={260}
                                                >
                                                    <IconInfoCircle size={12} className="text-slate-400" />
                                                </Tooltip>
                                            </span>
                                        }
                                        placeholder={
                                            loadingDosimeters
                                                ? t('assignmentForm.dosimeter.loading')
                                                : t('assignmentForm.dosimeter.selectPlaceholder')
                                        }
                                        data={dosimeterOptions}
                                        searchable
                                        nothingFoundMessage={t('assignmentForm.dosimeter.notFound')}
                                        withAsterisk
                                        size="sm"
                                        {...assignForm.getInputProps('dosimeterId')}
                                    />
                                    {selectedDosimeter && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                            <ReadOnlyCard
                                                icon={<IconReceipt size={13} stroke={1.8} />}
                                                label={t('assignmentForm.dosimeter.type')}
                                                value={selectedDosimeter.type}
                                            />
                                            <ReadOnlyCard
                                                icon={<IconQrcode size={13} stroke={1.8} />}
                                                label={t('assignmentForm.dosimeter.qrCode')}
                                                value={selectedDosimeter.qrCode ?? '—'}
                                            />
                                            <ReadOnlyCard
                                                icon={<IconShieldCheck size={13} stroke={1.8} />}
                                                label={t('assignmentForm.dosimeter.status')}
                                                value={t(`dosimeters.statusValues.${selectedDosimeter.status}`, {
                                                    defaultValue: selectedDosimeter.status,
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </Paper>

                        {/* Section 2 — Travailleur */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconUser size={16} className="text-teal-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('assignmentForm.sections.worker')}
                                </h2>
                            </div>

                            <Select
                                label={t('assignmentForm.worker.selectLabel')}
                                placeholder={
                                    loadingWorkers
                                        ? t('assignmentForm.worker.loading')
                                        : t('assignmentForm.worker.selectPlaceholder')
                                }
                                data={workerOptions}
                                searchable
                                nothingFoundMessage={t('assignmentForm.worker.notFound')}
                                withAsterisk
                                size="sm"
                                {...assignForm.getInputProps('workerId')}
                            />

                            {selectedWorker && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge color="indigo" variant="light">
                                        {t('assignmentForm.worker.matricule')} : {selectedWorker.matricule}
                                    </Badge>
                                    <Badge
                                        color={selectedWorker.category === 'A' ? 'red' : 'blue'}
                                        variant="light"
                                    >
                                        {t('assignmentForm.worker.category')} : {selectedWorker.category}
                                    </Badge>
                                    {selectedWorker.specialStatus && selectedWorker.specialStatus !== 'NONE' && (
                                        <Badge color="orange" variant="light">
                                            {selectedWorker.specialStatus}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {showMedicalReinforcedBanner && (
                                <Alert
                                    color="orange"
                                    variant="light"
                                    icon={<IconAlertOctagon size={16} />}
                                    title={t('assignmentForm.worker.reinforcedTitle')}
                                >
                                    <Text size="xs">{t('assignmentForm.worker.reinforcedBody')}</Text>
                                </Alert>
                            )}
                        </Paper>

                        {/* Section 3 — Periode */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconCalendarTime size={16} className="text-violet-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('assignmentForm.sections.period')}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateInput
                                    label={t('assignmentForm.period.startLabel')}
                                    placeholder={t('assignmentForm.period.placeholder')}
                                    valueFormat="DD/MM/YYYY"
                                    withAsterisk
                                    size="sm"
                                    leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                    {...assignForm.getInputProps('periodStart')}
                                />
                                <DateInput
                                    label={t('assignmentForm.period.endLabel')}
                                    placeholder={t('assignmentForm.period.placeholder')}
                                    valueFormat="DD/MM/YYYY"
                                    withAsterisk
                                    size="sm"
                                    leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                    {...assignForm.getInputProps('periodEnd')}
                                />
                            </div>

                            {assignForm.values.periodStart && assignForm.values.periodEnd && (
                                <Text size="xs" c="dimmed">
                                    {t('assignmentForm.period.previewRange', {
                                        start: formatDateFr(assignForm.values.periodStart),
                                        end: formatDateFr(assignForm.values.periodEnd),
                                    })}
                                </Text>
                            )}
                        </Paper>

                        {/* Section 4 — Accuse de remise */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconClipboardCheck size={16} className="text-emerald-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('assignmentForm.sections.handover')}
                                </h2>
                            </div>

                            <Textarea
                                label={t('assignmentForm.handover.noteLabel')}
                                placeholder={t('assignmentForm.handover.notePlaceholder')}
                                minRows={3}
                                autosize
                                {...assignForm.getInputProps('handoverNote')}
                            />

                            <Checkbox
                                label={t('assignmentForm.handover.ackLabel')}
                                {...assignForm.getInputProps('handoverAck', { type: 'checkbox' })}
                            />

                            <Group justify="flex-end" mt="sm">
                                <Button
                                    variant="default"
                                    onClick={() => navigate('/dosimetry/dosimeters')}
                                >
                                    {t('assignmentForm.actions.cancel')}
                                </Button>
                                <Button
                                    color="indigo"
                                    leftSection={<IconCheck size={14} stroke={2} />}
                                    onClick={handleSubmitAssign}
                                >
                                    {t('assignmentForm.actions.confirmAssign')}
                                </Button>
                            </Group>
                        </Paper>
                    </div>
                )}

                {/* ─── MODE RETURN ─── */}
                {!isAssign && (
                    <div className="space-y-4">
                        {/* Recap dosimetre + worker */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconDeviceWatch size={16} className="text-emerald-700" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('assignmentForm.sections.summary')}
                                </h2>
                            </div>
                            {currentAssignment ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                                    <ReadOnlyCard
                                        icon={<IconDeviceWatch size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.serial')}
                                        value={returnDosimeterInfo?.serial ?? '—'}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconReceipt size={13} stroke={1.8} />}
                                        label={t('assignmentForm.dosimeter.type')}
                                        value={returnDosimeterInfo?.type ?? '—'}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconUser size={13} stroke={1.8} />}
                                        label={t('assignmentForm.return.workerId')}
                                        value={`#${currentAssignment.workerId}`}
                                    />
                                    <ReadOnlyCard
                                        icon={<IconCalendarTime size={13} stroke={1.8} />}
                                        label={t('assignmentForm.return.periodStart')}
                                        value={formatDateFr(parseDate(currentAssignment.periodStart))}
                                    />
                                </div>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    {t('assignmentForm.return.noAssignment')}
                                </Text>
                            )}
                        </Paper>

                        {/* Etat du dispositif */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconShieldCheck size={16} className="text-violet-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('assignmentForm.sections.condition')}
                                </h2>
                            </div>

                            <Select
                                label={t('assignmentForm.return.conditionLabel')}
                                withAsterisk
                                size="sm"
                                data={[
                                    { value: 'INTACT', label: t('assignmentForm.return.conditions.INTACT') },
                                    { value: 'DAMAGED', label: t('assignmentForm.return.conditions.DAMAGED') },
                                    { value: 'LOST', label: t('assignmentForm.return.conditions.LOST') },
                                    { value: 'OTHER', label: t('assignmentForm.return.conditions.OTHER') },
                                ]}
                                {...returnForm.getInputProps('deviceCondition')}
                            />

                            {(returnForm.values.deviceCondition === 'DAMAGED' ||
                                returnForm.values.deviceCondition === 'OTHER') && (
                                <Textarea
                                    label={t('assignmentForm.return.conditionNoteLabel')}
                                    placeholder={t('assignmentForm.return.conditionNotePlaceholder')}
                                    minRows={3}
                                    autosize
                                    withAsterisk
                                    {...returnForm.getInputProps('deviceConditionNote')}
                                />
                            )}

                            {/* Photo upload placeholder */}
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                                <IconCamera size={22} stroke={1.4} className="mx-auto text-slate-400 mb-1.5" />
                                <p className="text-[12.5px] text-slate-600 font-medium mb-0.5">
                                    {t('assignmentForm.return.photoPlaceholderTitle')}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {t('assignmentForm.return.photoPlaceholderHint')}
                                </p>
                            </div>

                            <Checkbox
                                label={t('assignmentForm.return.ackLabel')}
                                {...returnForm.getInputProps('returnAck', { type: 'checkbox' })}
                            />

                            <Group justify="flex-end" mt="sm">
                                <Button
                                    variant="default"
                                    onClick={() => navigate('/dosimetry/dosimeters')}
                                >
                                    {t('assignmentForm.actions.cancel')}
                                </Button>
                                <Button
                                    color="teal"
                                    leftSection={<IconArrowBackUp size={14} stroke={2} />}
                                    onClick={handleSubmitReturn}
                                    disabled={!currentAssignment}
                                >
                                    {t('assignmentForm.actions.confirmReturn')}
                                </Button>
                            </Group>
                        </Paper>
                    </div>
                )}
            </div>

            {/* ─── Modal Scanner QR (placeholder Phase 3) ─── */}
            <Modal
                opened={scannerOpen}
                onClose={() => {
                    setScannerOpen(false);
                    setScannerInput('');
                }}
                title={
                    <span className="flex items-center gap-2 text-slate-800 font-semibold">
                        <IconScan size={16} stroke={1.8} className="text-indigo-600" />
                        {t('assignmentForm.scanner.title')}
                    </span>
                }
                centered
            >
                <div className="space-y-3">
                    <Text size="sm" c="dimmed">
                        {t('assignmentForm.scanner.hint')}
                    </Text>
                    <TextInput
                        label={t('assignmentForm.scanner.qrInputLabel')}
                        placeholder={t('assignmentForm.scanner.qrInputPlaceholder')}
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.currentTarget.value)}
                        leftSection={<IconQrcode size={14} stroke={1.8} />}
                        size="sm"
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button
                            variant="default"
                            onClick={() => {
                                setScannerOpen(false);
                                setScannerInput('');
                            }}
                        >
                            {t('assignmentForm.actions.cancel')}
                        </Button>
                        <Button color="indigo" onClick={handleScannerConfirm}>
                            {t('assignmentForm.scanner.confirm')}
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

interface ReadOnlyCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number | null | undefined;
}

const ReadOnlyCard = ({ icon, label, value }: ReadOnlyCardProps) => (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-0.5">
            <span className="text-slate-400">{icon}</span>
            <span>{label}</span>
        </div>
        <p className="text-[13px] text-slate-800 font-medium truncate" title={String(value ?? '—')}>
            {value ?? '—'}
        </p>
    </div>
);

export default DosimeterAssignmentForm;
