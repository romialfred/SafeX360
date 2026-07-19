import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import {
    Stepper,
    Paper,
    Group,
    Button,
    Badge,
    Tooltip,
    Select,
    MultiSelect,
    Radio,
    Textarea,
    Checkbox,
    Text,
    Alert,
} from '@mantine/core';
import {
    IconUser,
    IconUserPlus,
    IconShieldCheck,
    IconAtom2,
    IconAlertCircle,
    IconCertificate,
    IconCheck,
    IconArrowLeft,
    IconArrowRight,
    IconChevronRight,
    IconHash,
    IconDeviceFloppy,
    IconInfoCircle,
    IconHome,
    IconLayoutSidebarRightCollapse,
    IconLayoutSidebarRightExpand,
    IconBuildingFactory2,
    IconCalendarTime,
    IconBadge,
    IconBriefcase,
    IconWoman,
    IconSchool,
    IconAlertOctagon,
    IconX,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { getAllActiveWorkArea } from '../../services/WorkAreaService';
import {
    createExposedWorker,
    updateExposedWorker,
    getExposedWorkerById,
    type ExposedWorkerDTO,
    type DoseCategory,
} from '../../services/DosimetryService';
import { positiveMineId, selectMineMessage } from '../../utils/activeMine';

/**
 * ExposedWorkerForm — Phase 2 Frontend-C (LOT Dosimetrie).
 *
 * Formulaire premium d'enregistrement / mise a jour d'un travailleur expose.
 * Route :
 *   - /dosimetry/workers/new        (creation)
 *   - /dosimetry/workers/edit/:id   (edition)
 *
 * Layout (aligne sur NonConformityForm) :
 *   - Breadcrumb premium
 *   - Hero card (IconUserPlus + titre + sous-titre + badge identifiant)
 *   - Boutons "Retour" / "Sauvegarder brouillon" / "Aide"
 *   - Stepper 5 etapes Mantine
 *   - Volet d'aide collapsible (CIPR 103, procedure, RGPD/AIEA)
 *
 * 5 etapes :
 *   1. Identite & Emploi
 *   2. Classement radioprotection (CIPR 103 — A / B)
 *   3. Profil d'exposition (types, zones, postes, frequence)
 *   4. Statut special (grossesse, apprenti)
 *   5. Habilitations & confirmation (recapitulatif + checkbox)
 *
 * Validation Mantine en temps reel (champs obligatoires + tooltips).
 * Submit : appelle DosimetryService.createExposedWorker / updateExposedWorker
 * puis redirige vers la fiche detail.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Options statiques (Phase 1 — multilingue via i18n)
// ─────────────────────────────────────────────────────────────────────────────

const EXPOSURE_TYPES = [
    'EXTERNAL_RADIATION',
] as const;

const SPECIAL_STATUS_OPTIONS = [
    'NONE',
    'PREGNANCY',
    'APPRENTICE',
] as const;

const QUALIFICATION_OPTIONS = [
    'RPO_PCR',
    'INDUSTRIAL_RADIOGRAPHY',
    'OPEN_SOURCES',
    'SEALED_SOURCES',
    'RADIATION_AWARENESS',
] as const;

type SpecialStatusValue = (typeof SPECIAL_STATUS_OPTIONS)[number];

// ─────────────────────────────────────────────────────────────────────────────
//  Modele du formulaire
// ─────────────────────────────────────────────────────────────────────────────

interface FormShape {
    identity: {
        employeeId: string;
        assignmentDate: Date | null;
    };
    classification: {
        category: DoseCategory | '';
        reason: string;
        classificationDate: Date | null;
        rpoId: string;
    };
    exposure: {
        exposureTypes: string[];
        workAreaIds: string[];
        positions: string[];
        frequencyConditions: string;
    };
    special: {
        status: SpecialStatusValue;
        startDate: Date | null;
        note: string;
        birthDate: Date | null;
    };
    qualifications: {
        items: string[];
        nextExpiry: Date | null;
        certified: boolean;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

const formatDateFr = (d: Date | null): string => {
    if (!d) return '—';
    try {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposedWorkerForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const editId = params?.id ? Number(params.id) : null;
    const isEdit = editId !== null && !Number.isNaN(editId);

    const [activeStep, setActiveStep] = useState(0);
    const [helpPanelVisible, setHelpPanelVisible] = useState(true);
    const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [workAreas, setWorkAreas] = useState<{ value: string; label: string }[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(false);

    // Identifiant lisible : INC-DOS-YYYY-XXX
    const [workerNumber, setWorkerNumber] = useState<string>(
        `INC-DOS-${new Date().getFullYear()}-XXX`,
    );

    // ───── Form Mantine ─────
    const form = useForm<FormShape>({
        initialValues: {
            identity: {
                employeeId: '',
                assignmentDate: new Date(),
            },
            classification: {
                category: '',
                reason: '',
                classificationDate: new Date(),
                rpoId: '',
            },
            exposure: {
                exposureTypes: ['EXTERNAL_RADIATION'],
                workAreaIds: [],
                positions: [],
                frequencyConditions: '',
            },
            special: {
                status: 'NONE',
                startDate: null,
                note: '',
                birthDate: null,
            },
            qualifications: {
                items: [],
                nextExpiry: null,
                certified: false,
            },
        },
        validate: {
            identity: {
                employeeId: (v) => (v ? null : t('workerForm.validation.employeeRequired')),
                assignmentDate: (v) => (v ? null : t('workerForm.validation.assignmentDateRequired')),
            },
            classification: {
                category: (v) =>
                    activeStep < 1
                        ? null
                        : v === 'A' || v === 'B'
                            ? null
                            : t('workerForm.validation.categoryRequired'),
                reason: (v) =>
                    activeStep < 1
                        ? null
                        : v && v.trim().length >= 50
                            ? null
                            : t('workerForm.validation.reasonMin'),
                classificationDate: (v) =>
                    activeStep < 1
                        ? null
                        : v
                            ? null
                            : t('workerForm.validation.classificationDateRequired'),
            },
            // NOTE (bug perte de donnees) : les champs de l'etape 3 (types d'exposition,
            // zones, postes, frequence/conditions) ne sont PAS persistes par
            // ExposedWorkerService — le DTO ExposedWorkerDTO ne les porte pas. Tant que la
            // persistance du profil d'exposition n'est pas cablee, ils restent facultatifs :
            // rendre obligatoire une saisie jetee au submit trompe l'utilisateur.
            special: {
                startDate: (v, values) =>
                    activeStep < 3
                        ? null
                        : values.special.status === 'PREGNANCY' && !v
                            ? t('workerForm.validation.pregnancyStartRequired')
                            : null,
                // birthDate : non persiste (aucun champ correspondant sur ExposedWorkerDTO)
                // -> facultatif, cf. note ci-dessus.
            },
            qualifications: {
                certified: (v) =>
                    activeStep < 4
                        ? null
                        : v
                            ? null
                            : t('workerForm.validation.certifyRequired'),
            },
        },
    });

    // ───── Chargement initial : employees + work areas ─────
    useEffect(() => {
        let cancelled = false;
        getEmployeesWithDepartment()
            .then((data: any[]) => {
                if (cancelled) return;
                const map: Record<string, any> = {};
                const opts = (data ?? []).map((emp: any) => {
                    const id = String(emp.id);
                    map[id] = emp;
                    const label = `${emp.matricule ?? ''} — ${emp.name ?? `${emp.lastName ?? ''} ${emp.firstName ?? ''}`.trim()}`.trim();
                    return { value: id, label: label.length > 2 ? label : `Employe #${id}` };
                });
                setEmpMap(map);
                setEmployees(opts);
            })
            .catch(() => {
                // silencieux : le select restera vide, l'utilisateur sera notifie via validation
            });

        getAllActiveWorkArea()
            .then((data: any[]) => {
                if (cancelled) return;
                setWorkAreas(
                    (data ?? []).map((w: any) => ({
                        value: String(w.id),
                        label: w.name ?? `Zone #${w.id}`,
                    })),
                );
            })
            .catch(() => {
                // tolerant : zones vides
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // ───── Chargement en mode edition ─────
    useEffect(() => {
        if (!isEdit || editId == null) return;
        let cancelled = false;
        setLoadingInitial(true);
        getExposedWorkerById(editId)
            .then((dto: ExposedWorkerDTO) => {
                if (cancelled || !dto) return;
                form.setFieldValue(
                    'identity.employeeId',
                    dto.employeeId != null ? String(dto.employeeId) : '',
                );
                // Re-hydrate la date d'affectation : sans ca, ouvrir puis
                // re-enregistrer une fiche ecraserait la valeur persistee.
                form.setFieldValue(
                    'identity.assignmentDate',
                    parseDate(dto.assignmentDate) ?? new Date(),
                );
                form.setFieldValue(
                    'classification.category',
                    (dto.category as DoseCategory) || '',
                );
                form.setFieldValue('classification.reason', dto.classificationReason ?? '');
                form.setFieldValue(
                    'classification.classificationDate',
                    parseDate(dto.classificationDate) ?? new Date(),
                );
                form.setFieldValue(
                    'classification.rpoId',
                    dto.rpoId != null ? String(dto.rpoId) : '',
                );
                form.setFieldValue(
                    'special.status',
                    (dto.specialStatus as SpecialStatusValue) || 'NONE',
                );
                form.setFieldValue(
                    'special.startDate',
                    parseDate(dto.specialStatusStartDate),
                );
                setWorkerNumber(`INC-DOS-${new Date().getFullYear()}-${String(dto.id).padStart(3, '0')}`);
            })
            .catch(() => {
                errorNotification(t('workerForm.errors.loadFailed'));
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, isEdit]);

    // ───── Identite read-only depuis empMap ─────
    const selectedEmployee = useMemo(() => {
        const id = form.values.identity.employeeId;
        return id ? empMap[id] : null;
    }, [empMap, form.values.identity.employeeId]);

    // ───── Steps configuration ─────
    const steps = useMemo(
        () => [
            { label: t('workerForm.steps.identity.label'), description: t('workerForm.steps.identity.desc'), icon: IconUser, color: 'indigo' },
            { label: t('workerForm.steps.classification.label'), description: t('workerForm.steps.classification.desc'), icon: IconShieldCheck, color: 'teal' },
            { label: t('workerForm.steps.exposure.label'), description: t('workerForm.steps.exposure.desc'), icon: IconAtom2, color: 'violet' },
            { label: t('workerForm.steps.special.label'), description: t('workerForm.steps.special.desc'), icon: IconAlertCircle, color: 'orange' },
            { label: t('workerForm.steps.qualifications.label'), description: t('workerForm.steps.qualifications.desc'), icon: IconCertificate, color: 'green' },
        ],
        [t],
    );

    // ───── Navigation entre etapes ─────
    const validateCurrentStep = (): boolean => {
        // Mantine valide tout, on filtre sur l'etape courante via la dependance activeStep.
        const result = form.validate();
        if (result.hasErrors) {
            errorNotification(t('workerForm.validation.completeBeforeNext'));
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        if (activeStep < steps.length - 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveStep(activeStep + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) setActiveStep(activeStep - 1);
    };

    // ───── Sauvegarder brouillon (Phase 2 : pas d'endpoint dedie, on simule) ─────
    const handleSaveDraft = () => {
        // Pas d'endpoint backend pour brouillon en Phase 2 — on affiche un message
        // informatif. Le brouillon sera implemente en Phase 3 (LOT suivant).
        successNotification(t('workerForm.draftSavedLocal'));
    };

    // ───── Submit final ─────
    const handleSubmit = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            errorNotification(t('workerForm.validation.completeBeforeSubmit'));
            return;
        }
        const values = form.values;

        // Mine active OBLIGATOIRE : en vue consolidée (« Toutes les Mines »),
        // selectedCompanyId est null — on ne devine pas, on bloque.
        const mineId =
            positiveMineId(selectedCompanyId) ??
            positiveMineId(user?.mineId) ??
            positiveMineId(user?.companyId);
        if (mineId === null) {
            errorNotification(selectMineMessage('enregistrer ce travailleur exposé'));
            return;
        }

        const payload: ExposedWorkerDTO = {
            id: isEdit ? editId : null,
            employeeId: Number(values.identity.employeeId),
            category: (values.classification.category || 'B') as DoseCategory,
            classificationReason: values.classification.reason,
            classificationDate: toLocalDate(values.classification.classificationDate),
            rpoId: values.classification.rpoId ? Number(values.classification.rpoId) : null,
            specialStatus: values.special.status === 'NONE' ? null : values.special.status,
            specialStatusStartDate: toLocalDate(values.special.startDate),
            specialStatusEndDate: null,
            active: true,
            mineId: mineId as number,
            // Date d'affectation : champ obligatoire de l'etape 1, jete jusqu'ici
            // faute d'exister cote DTO/entite. Desormais persiste.
            assignmentDate: toLocalDate(values.identity.assignmentDate),
        };

        dispatch(showOverlay());
        try {
            const fn = isEdit ? updateExposedWorker : createExposedWorker;
            // Forme du retour (apres axiosInstance.then(response.data)) :
            //  - create  : backend renvoie ResponseEntity<Long>  -> response = number (id brut)
            //  - update  : backend renvoie ResponseEntity<ResponseDTO> -> response = { message }
            // On supporte aussi defensivement les variantes { id }, { data: { id } } et
            // { data: <long> } au cas ou un wrapper introduirait une enveloppe.
            const response: any = await fn(payload);
            let newId: number | null = null;
            if (isEdit && editId != null) {
                newId = editId;
            } else if (typeof response === 'number' && !Number.isNaN(response)) {
                newId = response;
            } else if (response && typeof response.id === 'number') {
                newId = response.id;
            } else if (response?.data != null) {
                if (typeof response.data === 'number') newId = response.data;
                else if (typeof response.data.id === 'number') newId = response.data.id;
            } else if (typeof response === 'string' && /^\d+$/.test(response)) {
                newId = Number(response);
            }

            successNotification(
                isEdit ? t('workerForm.successUpdate') : t('workerForm.successCreate'),
            );

            // P3 : navigation vers la fiche detail si id extractible, sinon repli
            // sur la liste pour eviter une route /detail/undefined.
            if (newId != null && !Number.isNaN(newId)) {
                navigate(`/dosimetry/workers/detail/${newId}`);
            } else {
                navigate('/dosimetry/workers');
            }
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('workerForm.errors.submitFailed'),
            );
        } finally {
            dispatch(hideOverlay());
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  Rendu des etapes
    // ─────────────────────────────────────────────────────────────────────────

    const renderStepIdentity = () => (
        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <IconUser size={16} className="text-indigo-600" stroke={1.8} />
                <h2 className="text-[14px] font-semibold text-slate-800">
                    {t('workerForm.identity.sectionTitle')}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Select
                        label={
                            <span className="flex items-center gap-1.5">
                                {t('workerForm.identity.employeeLabel')}
                                <Tooltip label={t('workerForm.identity.employeeTooltip')} multiline w={260}>
                                    <IconInfoCircle size={12} className="text-slate-400" />
                                </Tooltip>
                            </span>
                        }
                        placeholder={t('workerForm.identity.employeePlaceholder')}
                        data={employees}
                        searchable
                        nothingFoundMessage={t('workerForm.identity.employeeNotFound')}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('identity.employeeId')}
                    />
                </div>
                <DateInput
                    label={t('workerForm.identity.assignmentDate')}
                    placeholder={t('workerForm.identity.assignmentDatePlaceholder')}
                    valueFormat="DD/MM/YYYY"
                    withAsterisk
                    size="sm"
                    leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                    {...form.getInputProps('identity.assignmentDate')}
                />
            </div>

            {/* Cartes read-only depuis l'employee selectionne */}
            {selectedEmployee && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <ReadOnlyCard
                        icon={<IconBadge size={13} stroke={1.8} />}
                        label={t('workerForm.identity.matricule')}
                        value={selectedEmployee?.matricule ?? '—'}
                    />
                    <ReadOnlyCard
                        icon={<IconUser size={13} stroke={1.8} />}
                        label={t('workerForm.identity.fullName')}
                        value={
                            selectedEmployee?.name ||
                            `${selectedEmployee?.lastName ?? ''} ${selectedEmployee?.firstName ?? ''}`.trim() ||
                            '—'
                        }
                    />
                    <ReadOnlyCard
                        icon={<IconBriefcase size={13} stroke={1.8} />}
                        label={t('workerForm.identity.position')}
                        value={selectedEmployee?.position ?? selectedEmployee?.functionName ?? '—'}
                    />
                    <ReadOnlyCard
                        icon={<IconBuildingFactory2 size={13} stroke={1.8} />}
                        label={t('workerForm.identity.department')}
                        value={
                            selectedEmployee?.department ??
                            selectedEmployee?.departmentName ??
                            selectedEmployee?.direction ??
                            '—'
                        }
                    />
                </div>
            )}
        </Paper>
    );

    const renderStepClassification = () => (
        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <IconShieldCheck size={16} className="text-teal-600" stroke={1.8} />
                <h2 className="text-[14px] font-semibold text-slate-800">
                    {t('workerForm.classification.sectionTitle')}
                </h2>
            </div>

            <Radio.Group
                label={
                    <span className="flex items-center gap-1.5">
                        {t('workerForm.classification.categoryLabel')}
                        <Tooltip label={t('workerForm.classification.categoryTooltip')} multiline w={300}>
                            <IconInfoCircle size={12} className="text-slate-400" />
                        </Tooltip>
                    </span>
                }
                withAsterisk
                size="sm"
                {...form.getInputProps('classification.category')}
            >
                <Group mt="xs" gap="xl">
                    <Radio
                        value="A"
                        label={
                            <span>
                                <span className="font-semibold text-indigo-700">
                                    {t('workerForm.classification.categoryAShort')}
                                </span>
                                <span className="text-[12px] text-slate-500 ml-1">
                                    — {t('workerForm.classification.categoryADesc')}
                                </span>
                            </span>
                        }
                    />
                    <Radio
                        value="B"
                        label={
                            <span>
                                <span className="font-semibold text-slate-700">
                                    {t('workerForm.classification.categoryBShort')}
                                </span>
                                <span className="text-[12px] text-slate-500 ml-1">
                                    — {t('workerForm.classification.categoryBDesc')}
                                </span>
                            </span>
                        }
                    />
                </Group>
            </Radio.Group>

            <Textarea
                label={
                    <span className="flex items-center gap-1.5">
                        {t('workerForm.classification.reasonLabel')}
                        <Tooltip label={t('workerForm.classification.reasonTooltip')} multiline w={300}>
                            <IconInfoCircle size={12} className="text-slate-400" />
                        </Tooltip>
                    </span>
                }
                placeholder={t('workerForm.classification.reasonPlaceholder')}
                description={`${form.values.classification.reason.length} / 50 ${t('workerForm.classification.charsMin')}`}
                autosize
                minRows={3}
                withAsterisk
                size="sm"
                {...form.getInputProps('classification.reason')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput
                    label={t('workerForm.classification.classificationDate')}
                    placeholder={t('workerForm.identity.assignmentDatePlaceholder')}
                    valueFormat="DD/MM/YYYY"
                    withAsterisk
                    size="sm"
                    leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                    {...form.getInputProps('classification.classificationDate')}
                />
                <Select
                    label={
                        <span className="flex items-center gap-1.5">
                            {t('workerForm.classification.rpoLabel')}
                            <Tooltip label={t('workerForm.classification.rpoTooltip')} multiline w={280}>
                                <IconInfoCircle size={12} className="text-slate-400" />
                            </Tooltip>
                        </span>
                    }
                    placeholder={t('workerForm.classification.rpoPlaceholder')}
                    data={employees}
                    searchable
                    clearable
                    nothingFoundMessage={t('workerForm.identity.employeeNotFound')}
                    size="sm"
                    {...form.getInputProps('classification.rpoId')}
                />
            </div>
        </Paper>
    );

    const renderStepExposure = () => (
        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <IconAtom2 size={16} className="text-violet-600" stroke={1.8} />
                <h2 className="text-[14px] font-semibold text-slate-800">
                    {t('workerForm.exposure.sectionTitle')}
                </h2>
            </div>

            <MultiSelect
                label={
                    <span className="flex items-center gap-1.5">
                        {t('workerForm.exposure.typesLabel')}
                        <Tooltip label={t('workerForm.exposure.typesTooltip')} multiline w={280}>
                            <IconInfoCircle size={12} className="text-slate-400" />
                        </Tooltip>
                    </span>
                }
                placeholder={t('workerForm.exposure.typesPlaceholder')}
                data={EXPOSURE_TYPES.map((v) => ({ value: v, label: t(`workerForm.exposure.types.${v}`) }))}
                size="sm"
                {...form.getInputProps('exposure.exposureTypes')}
            />

            <MultiSelect
                label={
                    <span className="flex items-center gap-1.5">
                        {t('workerForm.exposure.workAreasLabel')}
                        <Tooltip label={t('workerForm.exposure.workAreasTooltip')} multiline w={280}>
                            <IconInfoCircle size={12} className="text-slate-400" />
                        </Tooltip>
                    </span>
                }
                placeholder={t('workerForm.exposure.workAreasPlaceholder')}
                data={workAreas}
                searchable
                size="sm"
                nothingFoundMessage={t('workerForm.exposure.workAreasEmpty')}
                {...form.getInputProps('exposure.workAreaIds')}
            />

            <MultiSelect
                label={t('workerForm.exposure.positionsLabel')}
                placeholder={t('workerForm.exposure.positionsPlaceholder')}
                data={form.values.exposure.positions.map((p) => ({ value: p, label: p }))}
                searchable
                clearable
                size="sm"
                description={t('workerForm.exposure.positionsHint')}
                {...form.getInputProps('exposure.positions')}
                onChange={(value: string[]) => form.setFieldValue('exposure.positions', value)}
            />

            <Textarea
                label={t('workerForm.exposure.frequencyLabel')}
                placeholder={t('workerForm.exposure.frequencyPlaceholder')}
                autosize
                minRows={3}
                size="sm"
                {...form.getInputProps('exposure.frequencyConditions')}
            />

            <Alert
                icon={<IconInfoCircle size={15} stroke={1.8} />}
                color="gray"
                variant="light"
                title={t('workerForm.exposure.notPersistedTitle')}
            >
                {t('workerForm.exposure.notPersistedText')}
            </Alert>
        </Paper>
    );

    const renderStepSpecial = () => {
        const status = form.values.special.status;
        const isPregnancy = status === 'PREGNANCY';
        const isApprentice = status === 'APPRENTICE';
        const category = form.values.classification.category;
        const showCrossWarning = isPregnancy && category === 'A';

        return (
            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <IconAlertCircle size={16} className="text-orange-600" stroke={1.8} />
                    <h2 className="text-[14px] font-semibold text-slate-800">
                        {t('workerForm.special.sectionTitle')}
                    </h2>
                    <Badge variant="light" color="gray" size="sm" radius="sm" ml="auto">
                        {t('workerForm.special.optional')}
                    </Badge>
                </div>

                <Select
                    label={
                        <span className="flex items-center gap-1.5">
                            {t('workerForm.special.statusLabel')}
                            <Tooltip label={t('workerForm.special.statusTooltip')} multiline w={280}>
                                <IconInfoCircle size={12} className="text-slate-400" />
                            </Tooltip>
                        </span>
                    }
                    data={SPECIAL_STATUS_OPTIONS.map((s) => ({
                        value: s,
                        label: t(`workerForm.special.statuses.${s}`),
                    }))}
                    size="sm"
                    {...form.getInputProps('special.status')}
                />

                {isPregnancy && (
                    <div className="space-y-3">
                        <Alert
                            icon={<IconWoman size={16} stroke={1.8} />}
                            color="pink"
                            variant="light"
                            title={t('workerForm.special.pregnancyBannerTitle')}
                        >
                            {t('workerForm.special.pregnancyBannerText')}
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateInput
                                label={t('workerForm.special.pregnancyStartDate')}
                                placeholder={t('workerForm.identity.assignmentDatePlaceholder')}
                                valueFormat="DD/MM/YYYY"
                                withAsterisk
                                size="sm"
                                leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                {...form.getInputProps('special.startDate')}
                            />
                        </div>
                        <Textarea
                            label={t('workerForm.special.pregnancyNote')}
                            placeholder={t('workerForm.special.pregnancyNotePlaceholder')}
                            autosize
                            minRows={2}
                            size="sm"
                            {...form.getInputProps('special.note')}
                        />
                    </div>
                )}

                {isApprentice && (
                    <div className="space-y-3">
                        <Alert
                            icon={<IconSchool size={16} stroke={1.8} />}
                            color="orange"
                            variant="light"
                            title={t('workerForm.special.apprenticeBannerTitle')}
                        >
                            {t('workerForm.special.apprenticeBannerText')}
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateInput
                                label={t('workerForm.special.apprenticeBirthDate')}
                                placeholder={t('workerForm.identity.assignmentDatePlaceholder')}
                                valueFormat="DD/MM/YYYY"
                                size="sm"
                                leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                                {...form.getInputProps('special.birthDate')}
                            />
                        </div>
                    </div>
                )}

                {showCrossWarning && (
                    <Alert
                        icon={<IconAlertOctagon size={16} stroke={1.8} />}
                        color="red"
                        variant="filled"
                        title={t('workerForm.special.crossWarningTitle')}
                    >
                        {t('workerForm.special.crossWarningText')}
                    </Alert>
                )}
            </Paper>
        );
    };

    const renderStepQualifications = () => {
        const v = form.values;
        return (
            <div className="space-y-4">
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <IconCertificate size={16} className="text-green-600" stroke={1.8} />
                        <h2 className="text-[14px] font-semibold text-slate-800">
                            {t('workerForm.qualifications.sectionTitle')}
                        </h2>
                    </div>

                    <MultiSelect
                        label={
                            <span className="flex items-center gap-1.5">
                                {t('workerForm.qualifications.itemsLabel')}
                                <Tooltip label={t('workerForm.qualifications.itemsTooltip')} multiline w={280}>
                                    <IconInfoCircle size={12} className="text-slate-400" />
                                </Tooltip>
                            </span>
                        }
                        placeholder={t('workerForm.qualifications.itemsPlaceholder')}
                        data={QUALIFICATION_OPTIONS.map((q) => ({
                            value: q,
                            label: t(`workerForm.qualifications.items.${q}`),
                        }))}
                        size="sm"
                        {...form.getInputProps('qualifications.items')}
                    />

                    <DateInput
                        label={t('workerForm.qualifications.nextExpiry')}
                        placeholder={t('workerForm.identity.assignmentDatePlaceholder')}
                        valueFormat="DD/MM/YYYY"
                        size="sm"
                        leftSection={<IconCalendarTime size={14} stroke={1.8} />}
                        {...form.getInputProps('qualifications.nextExpiry')}
                    />

                    <Alert
                        icon={<IconInfoCircle size={15} stroke={1.8} />}
                        color="gray"
                        variant="light"
                        title={t('workerForm.qualifications.notPersistedTitle')}
                    >
                        {t('workerForm.qualifications.notPersistedText')}
                    </Alert>
                </Paper>

                {/* Recapitulatif */}
                <Paper className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-3">
                        <IconCheck size={16} className="text-teal-600" stroke={1.8} />
                        <h2 className="text-[14px] font-semibold text-slate-800">
                            {t('workerForm.qualifications.summaryTitle')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
                        <SummaryItem
                            label={t('workerForm.summary.employee')}
                            value={
                                selectedEmployee
                                    ? `${selectedEmployee.matricule ?? ''} ${selectedEmployee.name ?? ''}`.trim()
                                    : '—'
                            }
                        />
                        <SummaryItem
                            label={t('workerForm.summary.assignmentDate')}
                            value={formatDateFr(v.identity.assignmentDate)}
                        />
                        <SummaryItem
                            label={t('workerForm.summary.category')}
                            value={
                                v.classification.category
                                    ? t(`workerForm.classification.category${v.classification.category}Short`)
                                    : '—'
                            }
                        />
                        <SummaryItem
                            label={t('workerForm.summary.classificationDate')}
                            value={formatDateFr(v.classification.classificationDate)}
                        />
                        <SummaryItem
                            label={t('workerForm.summary.exposureTypes')}
                            value={
                                v.exposure.exposureTypes.length > 0
                                    ? v.exposure.exposureTypes
                                          .map((x) => t(`workerForm.exposure.types.${x}`))
                                          .join(', ')
                                    : '—'
                            }
                        />
                        <SummaryItem
                            label={t('workerForm.summary.workAreas')}
                            value={
                                v.exposure.workAreaIds.length > 0
                                    ? v.exposure.workAreaIds
                                          .map((id) => workAreas.find((w) => w.value === id)?.label ?? id)
                                          .join(', ')
                                    : '—'
                            }
                        />
                        <SummaryItem
                            label={t('workerForm.summary.specialStatus')}
                            value={t(`workerForm.special.statuses.${v.special.status}`)}
                        />
                        <SummaryItem
                            label={t('workerForm.summary.qualifications')}
                            value={
                                v.qualifications.items.length > 0
                                    ? v.qualifications.items
                                          .map((x) => t(`workerForm.qualifications.items.${x}`))
                                          .join(', ')
                                    : '—'
                            }
                        />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                        <Checkbox
                            label={t('workerForm.qualifications.certifyLabel')}
                            size="sm"
                            color="teal"
                            {...form.getInputProps('qualifications.certified', { type: 'checkbox' })}
                        />
                    </div>
                </Paper>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return renderStepIdentity();
            case 1:
                return renderStepClassification();
            case 2:
                return renderStepExposure();
            case 3:
                return renderStepSpecial();
            case 4:
                return renderStepQualifications();
            default:
                return null;
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  Rendu principal
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full space-y-5">
                {/* ─── Breadcrumb premium ─── */}
                <nav
                    className="flex items-center gap-1.5 text-[11px] text-slate-500"
                    aria-label={t('workerForm.breadcrumbAria')}
                >
                    <IconHome size={11} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">SafeX 360</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/workers')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('registry.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {isEdit ? t('workerForm.breadcrumbEdit') : t('workerForm.breadcrumbNew')}
                    </span>
                </nav>

                {/* ─── Hero card ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-violet-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconUserPlus size={22} stroke={1.8} className="text-white" />
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
                                    {isEdit ? t('workerForm.titleEdit') : t('workerForm.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('workerForm.subtitle')}
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                                    <IconHash size={13} className="text-slate-500" />
                                    <span className="text-xs font-mono text-slate-700">
                                        {workerNumber}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                leftSection={<IconArrowLeft size={14} />}
                                onClick={() => navigate(-1)}
                            >
                                {t('workerForm.actions.back')}
                            </Button>
                            <Button
                                variant="light"
                                color="indigo"
                                size="sm"
                                leftSection={<IconDeviceFloppy size={14} />}
                                onClick={handleSaveDraft}
                            >
                                {t('workerForm.actions.saveDraft')}
                            </Button>
                            <Tooltip
                                label={
                                    helpPanelVisible
                                        ? t('workerForm.actions.hideHelp')
                                        : t('workerForm.actions.showHelp')
                                }
                            >
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => setHelpPanelVisible((v) => !v)}
                                    leftSection={
                                        helpPanelVisible ? (
                                            <IconLayoutSidebarRightCollapse size={14} />
                                        ) : (
                                            <IconLayoutSidebarRightExpand size={14} />
                                        )
                                    }
                                >
                                    {helpPanelVisible
                                        ? t('workerForm.actions.hideHelp')
                                        : t('workerForm.actions.showHelp')}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {loadingInitial && (
                    <Alert color="indigo" variant="light" icon={<IconInfoCircle size={14} />}>
                        {t('workerForm.loading')}
                    </Alert>
                )}

                {/* ─── Stepper ─── */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <Stepper
                        active={activeStep}
                        onStepClick={setActiveStep}
                        allowNextStepsSelect={false}
                        size="sm"
                        color="indigo"
                        classNames={{
                            step: 'hover:bg-slate-50 rounded-lg transition-colors duration-200',
                            stepIcon: 'border-2',
                            stepBody: 'ml-2',
                        }}
                    >
                        {steps.map((step, index) => (
                            <Stepper.Step
                                key={index}
                                label={
                                    <Text size="sm" className="text-slate-900">
                                        {step.label}
                                    </Text>
                                }
                                description={
                                    <Text size="xs" className="text-slate-500">
                                        {step.description}
                                    </Text>
                                }
                                icon={<step.icon size={14} />}
                                completedIcon={<IconCheck size={14} />}
                            />
                        ))}
                    </Stepper>
                </Paper>

                {/* ─── Contenu + volet d'aide ─── */}
                <div
                    className={`grid grid-cols-1 gap-5 ${
                        helpPanelVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
                    }`}
                >
                    <div
                        className={helpPanelVisible ? 'lg:col-span-2 space-y-5' : 'lg:col-span-1 space-y-5'}
                    >
                        {renderStepContent()}

                        {/* Barre de navigation */}
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                            <Group justify="space-between" wrap="wrap">
                                <Button
                                    variant="default"
                                    leftSection={<IconArrowLeft size={15} />}
                                    onClick={handlePrev}
                                    disabled={activeStep === 0}
                                >
                                    {t('workerForm.nav.prev')}
                                </Button>

                                <Group gap="md">
                                    <Badge variant="light" color="gray" radius="sm" size="md">
                                        {t('workerForm.nav.stepCounter', {
                                            current: activeStep + 1,
                                            total: steps.length,
                                        })}
                                    </Badge>
                                    {activeStep === steps.length - 1 ? (
                                        <Button
                                            color="teal"
                                            size="md"
                                            variant="gradient"
                                            gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
                                            leftSection={<IconCheck size={15} />}
                                            onClick={handleSubmit}
                                            disabled={!form.values.qualifications.certified}
                                        >
                                            {t('workerForm.nav.submit')}
                                        </Button>
                                    ) : (
                                        <Button
                                            color="indigo"
                                            rightSection={<IconArrowRight size={15} />}
                                            onClick={handleNext}
                                        >
                                            {t('workerForm.nav.next')}
                                        </Button>
                                    )}
                                </Group>
                            </Group>
                        </div>
                    </div>

                    {helpPanelVisible && (
                        <div className="lg:col-span-1">
                            <HelpPanel
                                activeStep={activeStep}
                                onClose={() => setHelpPanelVisible(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Bouton flottant pour rouvrir le volet */}
                {!helpPanelVisible && (
                    <Tooltip label={t('workerForm.actions.showHelp')} position="left" withArrow>
                        <button
                            type="button"
                            onClick={() => setHelpPanelVisible(true)}
                            className="fixed right-0 top-1/3 z-40 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-l-lg shadow-xl flex flex-col items-center gap-1 transition-all"
                            aria-label={t('workerForm.actions.showHelp')}
                        >
                            <IconLayoutSidebarRightExpand size={18} />
                            <span className="text-[10px] uppercase tracking-wider">
                                {t('workerForm.actions.help')}
                            </span>
                        </button>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function ReadOnlyCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                {icon}
                <span>{label}</span>
            </div>
            <div className="text-[13px] font-medium text-slate-800 truncate" title={value}>
                {value}
            </div>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-white border border-slate-200">
            <span className="text-[10.5px] text-slate-500 uppercase tracking-wider mt-0.5 min-w-[110px]">
                {label}
            </span>
            <span className="text-[12.5px] text-slate-800 font-medium flex-1 break-words">
                {value || '—'}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Help panel (CIPR 103 / procedure / RGPD-AIEA)
// ─────────────────────────────────────────────────────────────────────────────

function HelpPanel({ activeStep, onClose }: { activeStep: number; onClose: () => void }) {
    const { t } = useTranslation('dosimetry');

    return (
        <Paper className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-100 text-indigo-700">
                        <IconInfoCircle size={13} stroke={1.8} />
                    </span>
                    <h3 className="text-[13px] font-semibold text-slate-800">
                        {t('workerForm.help.title')}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-700"
                    aria-label={t('workerForm.actions.hideHelp')}
                >
                    <IconX size={14} />
                </button>
            </div>

            <div className="space-y-3 text-[12px] text-slate-700 leading-relaxed">
                {/* Section dynamique selon l'etape */}
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                    <p className="text-[10.5px] uppercase tracking-wider text-indigo-700 font-semibold mb-1">
                        {t('workerForm.help.currentStep')}
                    </p>
                    <p className="text-[12px] text-slate-700">
                        {t(`workerForm.help.steps.${activeStep}`)}
                    </p>
                </div>

                {/* Section CIPR 103 */}
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                    <p className="text-[10.5px] uppercase tracking-wider text-indigo-700 font-semibold mb-2">
                        {t('workerForm.help.iprcTitle')}
                    </p>
                    <table className="w-full text-[11.5px]">
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-200">
                                <th className="text-left font-medium pb-1">{t('workerForm.help.tableCategory')}</th>
                                <th className="text-right font-medium pb-1">{t('workerForm.help.tableLimit')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            <tr>
                                <td className="py-1">{t('workerForm.help.rowA')}</td>
                                <td className="text-right font-mono tabular-nums">20 mSv/an</td>
                            </tr>
                            <tr>
                                <td className="py-1">{t('workerForm.help.rowB')}</td>
                                <td className="text-right font-mono tabular-nums">6 mSv/an</td>
                            </tr>
                            <tr>
                                <td className="py-1">{t('workerForm.help.rowApprentice')}</td>
                                <td className="text-right font-mono tabular-nums">6 mSv/an</td>
                            </tr>
                            <tr>
                                <td className="py-1">{t('workerForm.help.rowPregnancy')}</td>
                                <td className="text-right font-mono tabular-nums">1 mSv</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section procedure */}
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                    <p className="text-[10.5px] uppercase tracking-wider text-indigo-700 font-semibold mb-1">
                        {t('workerForm.help.procedureTitle')}
                    </p>
                    <p>{t('workerForm.help.procedureText')}</p>
                </div>

                {/* Section confidentialite */}
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                    <p className="text-[10.5px] uppercase tracking-wider text-indigo-700 font-semibold mb-1">
                        {t('workerForm.help.privacyTitle')}
                    </p>
                    <p>{t('workerForm.help.privacyText')}</p>
                </div>
            </div>
        </Paper>
    );
}

export default ExposedWorkerForm;
