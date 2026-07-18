/**
 * InspectionScheduleForm — Formulaire de planification (responsive web + mobile).
 *
 *   1. Cible    — type d'objet (tuiles) + cible (liste déroulante groupée par
 *                 famille) + panneau d'info (détails, famille, modèle applicable,
 *                 dernière inspection).
 *   2. Modèle   — SAUTÉE quand un seul modèle est applicable (cf. D2) ; sinon
 *                 n'affiche QUE les modèles applicables à la famille de la cible.
 *   3. Détails  — date, horaires, ÉQUIPE d'inspection (employés + rôles),
 *                 objectifs, description.
 *
 * INVARIANTS À NE PAS CASSER
 *
 *  - D2 : le modèle est DÉRIVÉ de la cible, jamais choisi à l'aveugle. On
 *    apparie `template.scopeRef` avec la FAMILLE de la cible (`equipment.type`,
 *    une clé canonique depuis D1). Zéro modèle applicable ⇒ message métier
 *    actionnable + soumission bloquée. Ne JAMAIS retomber sur « tous les
 *    modèles du type » : c'est ce repli qui permettait d'inspecter une
 *    chargeuse avec la checklist d'un camion benne (défaut de SÉCURITÉ).
 *  - D3 : la « Designation » n'existe plus dans l'IHM. `targetLabel` est
 *    toujours envoyé au backend mais DÉRIVÉ du nom de la cible. Ne pas
 *    réintroduire de champ de saisie.
 *  - D4 : l'équipe comporte EXACTEMENT un LEAD ; `primaryInspectorId` en est
 *    dérivé (rétro-compat `start()` + PDF).
 *  - Mine : JAMAIS demandée. Dérivée de la cible (`companyId`) et passée en
 *    param explicite à `scheduleInspection`. Ne pas réintroduire de sélecteur.
 *
 * Aucune section EPI. Pas de checklist ni de mesure ici (saisie déportée à la
 * page d'exécution).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select } from '@mantine/core';
import {
    IconChevronRight,
    IconChevronLeft,
    IconChecklist,
    IconBuildingFactory2,
    IconMapPin,
    IconClipboardCheck,
    IconArrowRight,
    IconCheck,
    IconAlertOctagon,
    IconCalendarStats,
    IconHistory,
    IconInfoCircle,
    IconFileCheck,
    IconListCheck,
    IconUsers,
    IconClock,
} from '@tabler/icons-react';

import {
    listTemplates,
    getTemplate,
    scheduleInspection,
    getLastInspection,
    type InspectionTemplateType,
    type InspectionTemplateSummaryDTO,
    type ScheduleInspectionDTO,
    type LastInspectionDTO,
} from '../../services/InspectionService';
import { getAllEquipment } from '../../services/EquipmentService';
import { getAllActiveLocations } from '../../services/LocationService';
import { getAllActiveWorkProcess } from '../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import InspectionStatusBadge from './InspectionStatusBadge';
import {
    equipmentFamilyLabel,
    normalizeFamilyKey,
} from './inspectionLabels';
// Éditeur d'équipe PARTAGÉ avec InspectionDetailPage (modification post-
// planification) : l'invariant « un seul LEAD » vit dans le composant, pas ici.
import InspectionTeamEditor, {
    leadCountOf,
    teamToDTO,
    type TeamMemberState,
} from './InspectionTeamEditor';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import { useAppSelector } from '../../slices/hooks';

// Wizard : Cible → [Modèle] → Détails. L'étape 2 est conditionnelle (D2).
type Step = 1 | 2 | 3;

/** Option simple ou groupe de famille (liste des cibles). */
type TargetItem = { value: string; label: string };
type TargetOption = TargetItem | { group: string; items: TargetItem[] };

/** Clé sentinelle du groupe « sans famille » — distincte des clés métier. */
const UNCLASSIFIED = '__UNCLASSIFIED__';


interface FormState {
    type: InspectionTemplateType | null;
    siteId: number | null;
    targetRefId: string;
    /** Dérivé du nom de la cible (D3) — jamais saisi, jamais affiché en champ. */
    targetLabel: string;
    templateId: number | null;
    plannedDate: string;
    startTime: string;
    endTime: string;
    team: TeamMemberState[];
    objectives: string;
    description: string;
}

const INITIAL: FormState = {
    type: null,
    siteId: null,
    targetRefId: '',
    targetLabel: '',
    templateId: null,
    plannedDate: '',
    startTime: '',
    endTime: '',
    team: [],
    objectives: '',
    description: '',
};

const TYPE_ICON: Record<InspectionTemplateType, React.ReactNode> = {
    EQUIPMENT: <IconBuildingFactory2 size={28} stroke={1.6} />,
    LOCATION:  <IconMapPin size={28} stroke={1.6} />,
    PROCEDURE: <IconClipboardCheck size={28} stroke={1.6} />,
};

const TYPE_ACCENT: Record<InspectionTemplateType, string> = {
    EQUIPMENT: 'from-amber-500 to-orange-600 text-amber-700',
    LOCATION:  'from-emerald-500 to-teal-600 text-emerald-700',
    PROCEDURE: 'from-violet-500 to-purple-600 text-violet-700',
};

export default function InspectionScheduleForm() {
    const { t, i18n } = useTranslation(['inspection', 'common']);
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormState>(INITIAL);
    const [templates, setTemplates] = useState<InspectionTemplateSummaryDTO[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Cibles : options de la liste déroulante + enregistrements bruts (panneau info).
    // Pour les ÉQUIPEMENTS la liste est GROUPÉE par famille : le groupe porte le
    // LIBELLÉ traduit, jamais la clé brute (HEAVY_TRUCK) stockée en base.
    const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
    const [targetRecords, setTargetRecords] = useState<any[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    // Dernière inspection de la cible sélectionnée
    const [lastInspection, setLastInspection] = useState<LastInspectionDTO | null>(null);
    const [loadingLast, setLoadingLast] = useState(false);

    // Principe plateforme : AUCUN formulaire ne demande la mine. La mine active
    // vient du header (sélecteur global) ; toute création y est rattachée.
    const activeMineId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId ?? null);
    // Mine principale de l'utilisateur (repli quand le header est en « Toutes les
    // Mines » / vue consolidée) : on ne demande JAMAIS la mine dans le formulaire.
    const primaryMineId = useAppSelector((state: any) => {
        const c = state.user?.company;
        const n = c === null || c === undefined ? null : Number(c);
        return Number.isNaN(n as any) ? null : n;
    });
    const resolvedMineId = activeMineId ?? primaryMineId;

    // Employés (dropdown HRMS, scopé mine par l'intercepteur) : alimente les
    // sélecteurs de membres de l'équipe d'inspection.
    const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoadingEmployees(true);
        Promise.resolve(getEmployeeDropdown())
            .then((list: any[]) => {
                if (!alive) return;
                const arr = Array.isArray(list) ? list : [];
                setEmployees(
                    arr
                        .filter((e) => e && e.id !== undefined && e.id !== null)
                        .map((e) => ({
                            value: String(e.id),
                            label: e.name ?? e.fullName ?? `#${e.id}`,
                        })),
                );
            })
            .catch(() => {
                if (alive) setEmployees([]);
            })
            .finally(() => {
                if (alive) setLoadingEmployees(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    // Charge la liste des cibles selon le type d'objet choisi.
    // Dégradation gracieuse : toute erreur → liste vide, pas de crash.
    useEffect(() => {
        if (!form.type) {
            setTargetOptions([]);
            setTargetRecords([]);
            return;
        }
        const currentType = form.type;
        setLoadingTargets(true);
        const loader =
            currentType === 'EQUIPMENT'
                ? getAllEquipment()
                : currentType === 'LOCATION'
                ? getAllActiveLocations()
                : getAllActiveWorkProcess();
        Promise.resolve(loader)
            .then((list: any[]) => {
                const arr = Array.isArray(list) ? list : [];
                setTargetRecords(arr);
                const valid = arr.filter((r) => r && r.id !== undefined && r.id !== null);
                const byLabel = (a: TargetItem, b: TargetItem) =>
                    a.label.localeCompare(b.label, 'fr');
                // Le libellé ne porte QUE le nom : le code est affiché en puce
                // discrète (renderOption) et reste cherchable (filtre custom).
                const toItem = (r: any): TargetItem => ({
                    value: String(r.id),
                    label: r.name ?? r.code ?? `#${r.id}`,
                });

                if (currentType === 'EQUIPMENT') {
                    // Regroupement par famille : on groupe sur la CLÉ puis on
                    // affiche son LIBELLÉ traduit (D1).
                    const families = new Map<string, TargetItem[]>();
                    for (const r of valid) {
                        const fam = normalizeFamilyKey(r.type) ?? UNCLASSIFIED;
                        if (!families.has(fam)) families.set(fam, []);
                        families.get(fam)!.push(toItem(r));
                    }
                    const groupLabel = (key: string) =>
                        key === UNCLASSIFIED
                            ? t('equipment.familyUnclassified', { defaultValue: 'Non classée' })
                            : equipmentFamilyLabel(t, key);
                    const groups = [...families.entries()]
                        .map(([key, items]) => ({
                            group: groupLabel(key),
                            items: items.sort(byLabel),
                            __key: key,
                        }))
                        .sort((a, b) =>
                            // « Non classée » toujours en dernier.
                            a.__key === UNCLASSIFIED
                                ? 1
                                : b.__key === UNCLASSIFIED
                                ? -1
                                : a.group.localeCompare(b.group, 'fr'),
                        )
                        .map(({ group, items }) => ({ group, items }));
                    setTargetOptions(groups);
                } else {
                    setTargetOptions(valid.map(toItem).sort(byLabel));
                }
            })
            .catch(() => {
                setTargetRecords([]);
                setTargetOptions([]);
            })
            .finally(() => setLoadingTargets(false));
        // `t` : les libellés de groupe doivent suivre la langue courante.
    }, [form.type, t, i18n.language]);

    // Modèles du type sélectionné. Chargés dès le choix du TYPE (et non à
    // l'étape 2) : il faut connaître les modèles applicables AVANT de savoir si
    // l'étape « Modèle » doit exister (D2 — auto-sélection / saut d'étape).
    useEffect(() => {
        if (!form.type) {
            setTemplates([]);
            return;
        }
        let alive = true;
        setLoadingTemplates(true);
        listTemplates(form.type)
            .then((list) => {
                if (alive) setTemplates(list.filter((tpl) => tpl.active !== false));
            })
            .catch(() => {
                if (alive) setTemplates([]);
            })
            .finally(() => {
                if (alive) setLoadingTemplates(false);
            });
        return () => {
            alive = false;
        };
    }, [form.type]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    const selectedRecord = useMemo(
        () => (form.targetRefId ? targetRecords.find((r) => String(r.id) === form.targetRefId) ?? null : null),
        [targetRecords, form.targetRefId],
    );

    // Famille de la cible = clé d'appariement avec `template.scopeRef`.
    //  - EQUIPMENT : la famille EST `record.type` (clé canonique depuis D1).
    //  - LOCATION / PROCEDURE : `scopeRef` de la cible s'il est renseigné,
    //    sinon pas de sous-filtre (le filtre par `type` suffit).
    const targetFamily = useMemo<string | null>(() => {
        if (!selectedRecord || !form.type) return null;
        const raw =
            form.type === 'EQUIPMENT'
                ? selectedRecord.type
                : selectedRecord.scopeRef ?? null;
        return String(raw ?? '').trim() || null;
    }, [selectedRecord, form.type]);

    /**
     * Équipement dont la famille est absente/inconnue : on ne peut PAS dériver
     * le modèle. On bloque avec un message actionnable plutôt que de retomber
     * sur la liste complète (ce repli est précisément le défaut de sécurité).
     */
    const familyMissing = useMemo(
        () => form.type === 'EQUIPMENT' && !!selectedRecord && !normalizeFamilyKey(targetFamily),
        [form.type, selectedRecord, targetFamily],
    );

    const familyLabel = useMemo(
        () =>
            normalizeFamilyKey(targetFamily)
                ? equipmentFamilyLabel(t, targetFamily)
                : t('equipment.familyUnclassified', { defaultValue: 'Non classée' }),
        [targetFamily, t],
    );

    /** Modèles applicables à la cible sélectionnée (D2). */
    const applicableTemplates = useMemo<InspectionTemplateSummaryDTO[]>(() => {
        if (!form.type || !selectedRecord) return [];
        const byType = templates.filter((tpl) => tpl.type === form.type);
        if (form.type === 'EQUIPMENT') {
            const key = normalizeFamilyKey(targetFamily);
            if (!key) return []; // famille inconnue → aucun appariement possible
            return byType.filter((tpl) => normalizeFamilyKey(tpl.scopeRef) === key);
        }
        // LOCATION / PROCEDURE : sous-filtre scopeRef seulement s'il est porté
        // par la cible ; sinon tous les modèles du type sont pertinents.
        if (!targetFamily) return byType;
        const wanted = targetFamily.trim().toUpperCase();
        return byType.filter((tpl) => String(tpl.scopeRef ?? '').trim().toUpperCase() === wanted);
    }, [templates, form.type, selectedRecord, targetFamily]);

    // ─── Aperçu des points de contrôle ────────────────────────────────────────
    //
    // POURQUOI. L'étape « grille de contrôle » n'affichait que le NOM du modèle
    // et un décompte. Or les modèles de lieu s'appellent « Atelier de
    // maintenance », « Magasin d'explosifs »… — c'est-à-dire exactement comme
    // des lieux. Après avoir choisi un lieu à l'étape 1, l'utilisateur croyait
    // donc qu'on lui redemandait le lieu. Ce qu'il cherchait — éclairage, niveau
    // sonore, sols dégagés — existe bel et bien, mais comme POINTS DE CONTRÔLE
    // du modèle, et n'était affiché nulle part avant l'exécution.
    //
    // On charge donc les points de contrôle des modèles applicables (au plus
    // quelques-uns) pour les montrer dès la planification. Une `ref` mémorise
    // les identifiants déjà demandés : sans elle, la dépendance sur l'état
    // rechargerait en boucle.
    const [checkpointPreviews, setCheckpointPreviews] = useState<Record<number, string[]>>({});
    const requestedTemplateIds = useRef<Set<number>>(new Set());

    useEffect(() => {
        const missing = applicableTemplates.filter((tpl) => !requestedTemplateIds.current.has(tpl.id));
        if (missing.length === 0) return;
        missing.forEach((tpl) => requestedTemplateIds.current.add(tpl.id));
        let alive = true;
        Promise.all(
            missing.map((tpl) =>
                getTemplate(tpl.id)
                    .then(
                        (detail) =>
                            [
                                tpl.id,
                                (detail.checkpoints ?? [])
                                    .slice()
                                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                                    .map((cp) => cp.label)
                                    .filter(Boolean),
                            ] as const,
                    )
                    // Un aperçu indisponible ne doit JAMAIS bloquer la planification :
                    // on retombe sur la liste vide, l'écran affiche alors le seul
                    // décompte, comme avant.
                    .catch(() => [tpl.id, []] as const),
            ),
        ).then((entries) => {
            if (alive) setCheckpointPreviews((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        });
        return () => {
            alive = false;
        };
    }, [applicableTemplates]);

    const autoTemplate =
        selectedRecord && applicableTemplates.length === 1 ? applicableTemplates[0] : null;
    /** Un seul modèle applicable → l'étape « Modèle » n'a plus rien à demander. */
    const skipTemplateStep = !!autoTemplate;
    /** Le stepper ne doit pas mentir : il n'affiche que les étapes atteignables. */
    const visibleSteps: Step[] = skipTemplateStep ? [1, 3] : [1, 2, 3];

    // Recalcul du modèle à chaque changement de cible : auto-sélection quand il
    // n'y a qu'un applicable, purge quand la sélection courante ne l'est plus.
    useEffect(() => {
        setForm((f) => {
            if (autoTemplate) {
                return f.templateId === autoTemplate.id ? f : { ...f, templateId: autoTemplate.id };
            }
            if (f.templateId && !applicableTemplates.some((tpl) => tpl.id === f.templateId)) {
                return { ...f, templateId: null };
            }
            return f;
        });
    }, [autoTemplate, applicableTemplates]);

    // Si l'utilisateur est sur l'étape « Modèle » et qu'elle devient inutile
    // (changement de cible → un seul applicable), on ne l'y laisse pas coincé.
    useEffect(() => {
        if (skipTemplateStep && step === 2) setStep(3);
    }, [skipTemplateStep, step]);

    // Sélection du type d'objet : réinitialise la cible, le template et l'info.
    const handleSelectType = (tt: InspectionTemplateType) => {
        setForm((f) => ({ ...f, type: tt, templateId: null, targetRefId: '', targetLabel: '' }));
        setLastInspection(null);
        setErrors([]);
    };

    // Sélection d'une cible : fixe targetRefId, DÉRIVE la désignation (D3 — non
    // affichée, non modifiable) et va chercher la dernière inspection.
    const handleSelectTarget = (value: string | null) => {
        if (!value) {
            setForm((f) => ({ ...f, targetRefId: '', targetLabel: '', templateId: null }));
            setLastInspection(null);
            return;
        }
        const rec = targetRecords.find((r) => String(r.id) === value);
        setForm((f) => ({
            ...f,
            targetRefId: value,
            targetLabel: rec?.name ?? rec?.code ?? `#${value}`,
        }));
        setErrors([]);
        if (form.type) {
            setLoadingLast(true);
            getLastInspection(form.type, Number(value))
                .then((res) => setLastInspection(res))
                .catch(() => setLastInspection(null))
                .finally(() => setLoadingLast(false));
        }
    };

    // ─── Équipe d'inspection (D4) ──────────────────────────────────────────
    // La composition (ajout/retrait, invariant « un seul LEAD ») est portée par
    // InspectionTeamEditor, partagé avec InspectionDetailPage. Ici on ne garde
    // que la re-vérification à la validation (cas « on retire le LEAD »).

    const leadCount = leadCountOf(form.team);

    const validateStep = (s: Step): string[] => {
        const errs: string[] = [];
        // Étape 1 : type d'objet + cible. Plus de « Designation » (D3).
        if (s >= 1) {
            if (!form.type) errs.push(t('schedule.errors.typeRequired'));
            if (!form.targetRefId) {
                errs.push(t('schedule.errors.targetIdRequired', { defaultValue: 'Sélectionnez une cible.' }));
            }
            // D2 : sans modèle applicable, la planification n'a pas de sens.
            if (selectedRecord && !loadingTemplates) {
                if (familyMissing) {
                    errs.push(t('schedule.errors.familyMissing'));
                } else if (applicableTemplates.length === 0) {
                    errs.push(t('schedule.errors.noTemplateForFamily', { family: familyLabel }));
                }
            }
        }
        // La mine (site) n'est JAMAIS saisie : résolue depuis le header, sinon la
        // mine principale de l'utilisateur. Aucun blocage ici.
        // Le modèle n'est exigé que si l'utilisateur avait un choix à faire :
        // à 1 applicable il est auto-sélectionné, à 0 l'erreur est déjà remontée.
        if (s >= 2 && !form.templateId && applicableTemplates.length > 1) {
            errs.push(t('schedule.errors.templateRequired'));
        }
        if (s >= 3) {
            if (!form.plannedDate) errs.push(t('schedule.errors.dateRequired'));
            // Équipe optionnelle ; mais dès qu'elle existe elle doit être valide.
            if (form.team.length > 0) {
                if (form.team.some((m) => !m.employeeId)) {
                    errs.push(t('schedule.errors.teamMemberIncomplete'));
                }
                if (leadCount === 0) errs.push(t('schedule.errors.teamLeadRequired'));
                else if (leadCount > 1) errs.push(t('schedule.errors.teamLeadDuplicate'));
            }
        }
        return errs;
    };

    const goNext = () => {
        const errs = validateStep(step);
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        setErrors([]);
        // Saut de l'étape « Modèle » quand elle n'a rien à demander (D2).
        setStep((s) => {
            const idx = visibleSteps.indexOf(s);
            return idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : s;
        });
    };

    const goPrev = () => {
        setErrors([]);
        setStep((s) => {
            const idx = visibleSteps.indexOf(s);
            return idx > 0 ? visibleSteps[idx - 1] : s;
        });
    };

    const handleSubmit = async () => {
        const errs = validateStep(3);
        if (errs.length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            // Le site (lieu) et la mine propriétaire sont DÉRIVÉS de la cible —
            // jamais saisis. Site = la localisation elle-même (type LOCATION) ou
            // le lieu de rattachement de l'équipement/procédure (peut être null).
            // Mine = company_id de la cible → l'inspection est filée sous la bonne
            // mine même en vue consolidée (« Toutes les Mines »).
            const rec = selectedRecord;
            const derivedSiteId =
                form.type === 'LOCATION'
                    ? Number(form.targetRefId)
                    : rec?.locationId ?? null;
            const targetCompanyId = rec?.companyId ?? resolvedMineId ?? null;

            // D3 : targetLabel dérivé du nom de la cible, jamais saisi.
            const derivedLabel =
                String(rec?.name ?? form.targetLabel ?? '').trim() || `#${form.targetRefId}`;

            // D4 : l'équipe part telle quelle ; primaryInspectorId = LEAD.
            const members = form.team.filter((m) => m.employeeId);
            const lead = members.find((m) => m.role === 'LEAD');

            const payload: ScheduleInspectionDTO = {
                templateId: form.templateId as number,
                siteId: derivedSiteId,
                targetRefId: Number(form.targetRefId),
                targetLabel: derivedLabel,
                plannedDate: form.plannedDate,
                startTime: form.startTime ? `${form.startTime}:00` : null,
                endTime: form.endTime ? `${form.endTime}:00` : null,
                description: form.description || undefined,
                objectives: form.objectives || undefined,
                primaryInspectorId: lead ? Number(lead.employeeId) : null,
                teamMembers: members.length
                    ? members.map((m) => ({ employeeId: Number(m.employeeId), role: m.role }))
                    : undefined,
            };
            const id = await scheduleInspection(payload, targetCompanyId);
            successNotification(t('schedule.success.submitted', { id }));
            navigate('/inspections');
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                t('schedule.errors.submitFailed');
            setErrors([msg]);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const STEP_META: Record<Step, { key: string; fallback: string }> = {
        1: { key: 'target', fallback: 'Cible' },
        2: { key: 'template', fallback: 'Modèle' },
        3: { key: 'details', fallback: 'Détails' },
    };

    /** `position` = rang AFFICHÉ (1..n) : il suit les étapes réellement visibles. */
    const stepHeader = (n: Step, position: number) => {
        const isActive = step === n;
        const isDone = visibleSteps.indexOf(step) > visibleSteps.indexOf(n);
        const meta = STEP_META[n];
        return (
            <div key={n} className="flex items-center gap-2 min-w-0">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                        isDone
                            ? 'bg-emerald-600 text-white'
                            : isActive
                            ? 'bg-cyan-700 text-white ring-4 ring-cyan-100'
                            : 'bg-slate-200 text-slate-500'
                    }`}
                >
                    {isDone ? <IconCheck size={14} stroke={2.4} /> : position}
                </div>
                <span
                    className={`text-[12px] truncate ${
                        isActive ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}
                >
                    {t(`schedule.steps.${meta.key}`, { defaultValue: meta.fallback })}
                </span>
            </div>
        );
    };

    const isLastStep = step === visibleSteps[visibleSteps.length - 1];

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('schedule.breadcrumbCurrent')}
                    </span>
                </div>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <IconChecklist size={18} stroke={1.8} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1
                            className="text-slate-900 leading-tight truncate"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(17px, 1.6vw, 20px)',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            {t('schedule.title')}
                        </h1>
                        <p className="text-[12px] text-slate-500 truncate">{t('schedule.subtitle')}</p>
                    </div>
                </div>

                {/* Stepper — n'affiche que les étapes réellement atteignables (D2) */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}
                    >
                        {visibleSteps.map((n, i) => stepHeader(n, i + 1))}
                    </div>
                </div>

                {/* Erreurs */}
                {errors.length > 0 && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px]" role="alert">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <ul className="space-y-0.5">
                            {errors.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Corps : étape courante à gauche, récapitulatif persistant à droite.
                    Le volet lève l'ambiguïté qui rendait ce formulaire confus — la
                    cible retenue reste VISIBLE à chaque étape, donc on ne peut plus
                    croire qu'une étape ultérieure la redemande. */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 mb-4 items-start">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 min-w-0">
                    {step === 1 && (
                        <StepTarget
                            form={form}
                            onSelectType={handleSelectType}
                            targetOptions={targetOptions}
                            targetRecords={targetRecords}
                            loadingTargets={loadingTargets}
                            onSelectTarget={handleSelectTarget}
                            lastInspection={lastInspection}
                            loadingLast={loadingLast}
                            locale={i18n.language}
                            selectedRecord={selectedRecord}
                            familyLabel={familyLabel}
                            familyMissing={familyMissing}
                            applicableTemplates={applicableTemplates}
                            loadingTemplates={loadingTemplates}
                        />
                    )}
                    {step === 2 && (
                        <StepTemplate
                            templates={applicableTemplates}
                            loading={loadingTemplates}
                            selectedTemplateId={form.templateId}
                            onSelect={(id) => set('templateId', id)}
                            familyLabel={familyLabel}
                            familyMissing={familyMissing}
                            checkpointPreviews={checkpointPreviews}
                            targetLabel={form.targetLabel}
                        />
                    )}
                    {step === 3 && (
                        <StepDetails
                            form={form}
                            setField={set}
                            employees={employees}
                            loadingEmployees={loadingEmployees}
                            appliedTemplate={
                                templates.find((tpl) => tpl.id === form.templateId) ?? null
                            }
                            templateAutoApplied={skipTemplateStep}
                            familyLabel={familyLabel}
                            checkpointPreviews={checkpointPreviews}
                        />
                    )}
                </div>

                    {/* Volet récapitulatif — visible à TOUTES les étapes. */}
                    <RecapPanel
                        form={form}
                        typeLabel={
                            // Même clé que les cartes de l'étape 1 : le volet et
                            // l'étape nomment le type exactement pareil.
                            form.type ? t(`schedule.typeStep.${form.type}.title`, { defaultValue: form.type }) : null
                        }
                        familyLabel={familyLabel}
                        appliedTemplate={templates.find((tpl) => tpl.id === form.templateId) ?? null}
                        checkpointPreviews={checkpointPreviews}
                        employees={employees}
                        locale={i18n.language}
                    />
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md text-slate-600 hover:bg-slate-100 transition"
                    >
                        {t('schedule.buttons.cancel')}
                    </button>
                    <div className="flex items-center gap-2">
                        {step !== visibleSteps[0] && (
                            <button
                                type="button"
                                onClick={goPrev}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                            >
                                <IconChevronLeft size={14} stroke={1.8} />
                                {t('schedule.buttons.previous')}
                            </button>
                        )}
                        {!isLastStep ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition font-medium shadow-sm"
                            >
                                {t('schedule.buttons.next')}
                                <IconArrowRight size={14} stroke={1.8} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition font-medium shadow-sm disabled:opacity-50"
                            >
                                <IconCalendarStats size={14} stroke={1.8} />
                                {submitting ? '…' : t('schedule.buttons.submit')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Sous-composants — un par étape
 * ────────────────────────────────────────────────────────────────────────*/

function formatDate(iso: string | undefined, locale: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB');
    } catch (_e) {
        return iso;
    }
}

/**
 * StepTarget — Étape 1 : type d'objet (tuiles) + cible (liste déroulante
 * groupée par famille) + panneau d'info (détails, famille, MODÈLE APPLICABLE,
 * dernière inspection).
 *
 * Le modèle applicable est annoncé DÈS ICI : c'est la famille de la cible qui
 * le détermine (D2), donc l'utilisateur voit immédiatement si la planification
 * est possible — et pourquoi elle ne l'est pas, le cas échéant.
 * Pas de champ « Designation » (D3).
 */
function StepTarget({
    form,
    onSelectType,
    targetOptions,
    targetRecords,
    loadingTargets,
    onSelectTarget,
    lastInspection,
    loadingLast,
    locale,
    selectedRecord,
    familyLabel,
    familyMissing,
    applicableTemplates,
    loadingTemplates,
}: {
    form: FormState;
    onSelectType: (t: InspectionTemplateType) => void;
    targetOptions: TargetOption[];
    targetRecords: any[];
    loadingTargets: boolean;
    onSelectTarget: (value: string | null) => void;
    lastInspection: LastInspectionDTO | null;
    loadingLast: boolean;
    locale: string;
    selectedRecord: any | null;
    familyLabel: string;
    familyMissing: boolean;
    applicableTemplates: InspectionTemplateSummaryDTO[];
    loadingTemplates: boolean;
}) {
    const { t } = useTranslation('inspection');
    const types: InspectionTemplateType[] = ['EQUIPMENT', 'LOCATION', 'PROCEDURE'];

    // Code de chaque cible (équipements) : sorti du libellé pour alléger la
    // liste, il reste affiché en puce et surtout CHERCHABLE via le filtre.
    const codeById = useMemo(() => {
        const m = new Map<string, string>();
        for (const r of targetRecords) {
            if (r?.id != null && r.code) m.set(String(r.id), String(r.code));
        }
        return m;
    }, [targetRecords]);

    // Filtre : recherche sur le nom ET le code, en préservant les groupes.
    const filterTargets = ({ options, search }: { options: any[]; search: string }) => {
        const q = search.trim().toLowerCase();
        if (!q) return options;
        const matches = (o: any) =>
            String(o.label ?? '').toLowerCase().includes(q) ||
            (codeById.get(o.value) ?? '').toLowerCase().includes(q);
        const out: any[] = [];
        for (const o of options) {
            if (o && Array.isArray(o.items)) {
                const items = o.items.filter(matches);
                if (items.length) out.push({ ...o, items });
            } else if (matches(o)) {
                out.push(o);
            }
        }
        return out;
    };

    return (
        <div>
            {/* Type d'objet — tuiles */}
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.typeStep.heading')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {types.map((tt) => {
                    const active = form.type === tt;
                    return (
                        <button
                            key={tt}
                            type="button"
                            onClick={() => onSelectType(tt)}
                            className={`text-left p-4 rounded-xl border-2 transition min-h-[120px] ${
                                active
                                    ? 'border-cyan-600 bg-cyan-50/60 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_ACCENT[tt]} flex items-center justify-center mb-2`}
                            >
                                <span className="text-white">{TYPE_ICON[tt]}</span>
                            </div>
                            <div className="text-[14px] font-semibold text-slate-900 mb-0.5">
                                {t(`schedule.typeStep.${tt}.title`)}
                            </div>
                            <div className="text-[12px] text-slate-500 leading-snug">
                                {t(`schedule.typeStep.${tt}.description`)}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Cible — liste déroulante (source dépend du type) */}
            {form.type && (
                <div className="mt-5 space-y-3">
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">
                            {t('schedule.targetStep.targetSelectLabel', { defaultValue: 'Cible' })}
                        </label>
                        <Select
                            searchable
                            clearable
                            data={targetOptions as any}
                            value={form.targetRefId || null}
                            onChange={onSelectTarget}
                            disabled={loadingTargets}
                            filter={filterTargets as any}
                            maxDropdownHeight={280}
                            renderOption={({ option }: any) => {
                                const code = codeById.get(option.value);
                                return (
                                    <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                        <span className="truncate text-[13px] text-slate-800">
                                            {option.label}
                                        </span>
                                        {code && (
                                            <span className="flex-shrink-0 text-[10px] font-medium tracking-[0.04em] text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                                                {code}
                                            </span>
                                        )}
                                    </div>
                                );
                            }}
                            nothingFoundMessage={
                                loadingTargets
                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                    : t('schedule.targetStep.noTarget', { defaultValue: 'Aucune cible disponible' })
                            }
                            placeholder={
                                loadingTargets
                                    ? t('common:loading', { defaultValue: 'Chargement…' })
                                    : t('schedule.targetStep.targetSelectPlaceholder', { defaultValue: 'Sélectionner une cible…' })
                            }
                            comboboxProps={{ withinPortal: true }}
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            {t('schedule.targetStep.targetSelectHelp', {
                                defaultValue: "La liste est limitée à la mine active.",
                            })}
                        </p>
                    </div>

                    {/* Panneau d'info raffiné — détails de la cible + dernière inspection */}
                    {selectedRecord && (
                        <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <IconInfoCircle size={15} stroke={1.8} className="text-cyan-700" />
                                <span className="text-[12.5px] font-semibold text-slate-800">
                                    {t('schedule.targetStep.infoHeading', { defaultValue: 'Détails de la cible' })}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                {form.type === 'EQUIPMENT' ? (
                                    <>
                                        <InfoField label={t('schedule.targetStep.fieldCode', { defaultValue: 'Code' })} value={selectedRecord.code} />
                                        <InfoField label={t('schedule.targetStep.fieldName', { defaultValue: 'Nom' })} value={selectedRecord.name} />
                                        {/* La famille est affichée TRADUITE, jamais la clé brute (D1). */}
                                        <InfoField label={t('schedule.targetStep.fieldFamily', { defaultValue: 'Famille' })} value={familyMissing ? null : familyLabel} />
                                        <InfoField
                                            label={t('schedule.targetStep.fieldBrandModel', { defaultValue: 'Marque / Modèle' })}
                                            value={[selectedRecord.brand, selectedRecord.model].filter(Boolean).join(' ')}
                                        />
                                        <InfoField label={t('schedule.targetStep.fieldSerial', { defaultValue: 'N° de série' })} value={selectedRecord.serialNumber} />
                                    </>
                                ) : (
                                    <>
                                        <InfoField label={t('schedule.targetStep.fieldName', { defaultValue: 'Nom' })} value={selectedRecord.name} />
                                        {selectedRecord.zone && (
                                            <InfoField label={t('schedule.targetStep.fieldZone', { defaultValue: 'Zone' })} value={selectedRecord.zone} />
                                        )}
                                    </>
                                )}
                            </dl>

                            {/* Dernière inspection */}
                            <div className="mt-3 pt-3 border-t border-cyan-100 flex items-center gap-2 flex-wrap">
                                <IconHistory size={14} stroke={1.8} className="text-slate-500" />
                                <span className="text-[11.5px] uppercase tracking-[0.08em] text-slate-500 font-medium">
                                    {t('schedule.targetStep.lastInspection', { defaultValue: 'Dernière inspection' })}
                                </span>
                                {loadingLast ? (
                                    <span className="text-[12px] text-slate-400">…</span>
                                ) : lastInspection ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-[12.5px] text-slate-800 tabular-nums font-medium">
                                            {formatDate(lastInspection.plannedDate, locale)}
                                        </span>
                                        <InspectionStatusBadge status={lastInspection.status} />
                                    </span>
                                ) : (
                                    <span className="text-[12px] text-slate-500 italic">
                                        {t('schedule.targetStep.noPreviousInspection', {
                                            defaultValue: 'Aucune inspection précédente',
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Modèle applicable — verdict immédiat de l'appariement famille↔scopeRef (D2) */}
                    {selectedRecord && !loadingTemplates && (
                        <>
                            {familyMissing ? (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                    <span>{t('schedule.templateStep.familyMissing')}</span>
                                </div>
                            ) : applicableTemplates.length === 0 ? (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        {t('schedule.templateStep.noTemplateForFamily', { family: familyLabel })}
                                    </span>
                                </div>
                            ) : applicableTemplates.length === 1 ? (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px]">
                                    <IconFileCheck size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="font-medium">{applicableTemplates[0].name}</div>
                                        <div className="text-[11.5px] text-emerald-700/90">
                                            {t('schedule.templateStep.autoSelected', { family: familyLabel })}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-[10.5px] uppercase tracking-[0.08em] text-slate-400 font-medium">{label}</dt>
            <dd className="text-[12.5px] text-slate-800 truncate">{value || '—'}</dd>
        </div>
    );
}

/**
 * StepTemplate — Étape 2, affichée UNIQUEMENT quand plusieurs modèles sont
 * applicables. `templates` ne contient QUE les applicables : ne jamais lui
 * repasser la liste complète du type (cf. D2, défaut de sécurité).
 */
function StepTemplate({
    templates,
    loading,
    selectedTemplateId,
    onSelect,
    familyLabel,
    familyMissing,
    checkpointPreviews,
    targetLabel,
}: {
    templates: InspectionTemplateSummaryDTO[];
    loading: boolean;
    selectedTemplateId: number | null;
    onSelect: (id: number) => void;
    familyLabel: string;
    familyMissing: boolean;
    checkpointPreviews: Record<number, string[]>;
    targetLabel: string;
}) {
    const { t } = useTranslation('inspection');
    return (
        <div>
            <h2 className="text-[14px] font-semibold text-slate-800 mb-1">
                {t('schedule.templateStep.heading')}
            </h2>
            {/* Rappel EXPLICITE de la cible déjà retenue. Sans lui, cette étape —
                dont les modèles de lieu s'appellent « Atelier de maintenance »,
                « Magasin d'explosifs »… — se lisait comme une seconde demande de
                lieu, alors que le lieu était déjà choisi à l'étape 1. */}
            {targetLabel && (
                <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[12px]">
                    <IconMapPin size={14} stroke={1.8} className="mt-0.5 flex-shrink-0 text-slate-500" />
                    <span className="text-slate-600">
                        {t('schedule.templateStep.targetRecall', {
                            defaultValue: 'Objet retenu : {{target}}. Choisissez maintenant la grille de points à contrôler.',
                            target: targetLabel,
                        })}
                    </span>
                </div>
            )}
            {!loading && !familyMissing && templates.length > 0 && (
                <p className="text-[11.5px] text-slate-500 mb-3">
                    {t('schedule.templateStep.applicableHint', { family: familyLabel })}
                </p>
            )}
            {loading ? (
                <div className="text-[12.5px] text-slate-500 py-6 text-center">…</div>
            ) : familyMissing ? (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('schedule.templateStep.familyMissing')}</span>
                </div>
            ) : templates.length === 0 ? (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('schedule.templateStep.noTemplateForFamily', { family: familyLabel })}</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {templates.map((tpl) => {
                        const active = selectedTemplateId === tpl.id;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => onSelect(tpl.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                                    active
                                        ? 'border-cyan-600 bg-cyan-50/60 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <IconListCheck size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" />
                                        <div className="text-[13.5px] font-medium text-slate-900 truncate">
                                            {tpl.name}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
                                        <span>{tpl.code}</span>
                                        <span>
                                            {t('schedule.templateStep.checkpoints', { count: tpl.checkpointCount })}
                                        </span>
                                        {tpl.estimatedDurationMin && (
                                            <span>
                                                {t('schedule.templateStep.estimated', { min: tpl.estimatedDurationMin })}
                                            </span>
                                        )}
                                    </div>
                                    {/* Les intitulés réels lèvent toute ambiguïté : on
                                        choisit une GRILLE, pas un lieu. */}
                                    <CheckpointPreview
                                        labels={checkpointPreviews[tpl.id] ?? []}
                                        total={tpl.checkpointCount}
                                    />
                                </div>
                                {active && (
                                    <div className="w-6 h-6 rounded-full bg-cyan-700 text-white flex items-center justify-center flex-shrink-0">
                                        <IconCheck size={14} stroke={2.4} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Aperçu des points de contrôle d'une grille.
 *
 * C'est LA réponse au reproche « on me redemande le lieu » : montrer, dès la
 * planification, ce que l'inspection vérifiera réellement (éclairage, niveau
 * sonore, sols dégagés…). Ces intitulés sont ceux du modèle ; ils ne sont pas
 * saisis ici — ils seront renseignés à l'exécution, sur le terrain.
 */
function CheckpointPreview({ labels, total }: { labels: string[]; total: number }) {
    const { t } = useTranslation('inspection');
    const shown = labels.slice(0, 6);
    const rest = Math.max(0, total - shown.length);
    if (shown.length === 0) return null;
    return (
        <div className="mt-2">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                {t('schedule.templateStep.previewHeading', { defaultValue: 'Ce qui sera vérifié' })}
            </div>
            <div className="flex flex-wrap gap-1">
                {shown.map((label, i) => (
                    <span
                        key={`${label}-${i}`}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 border border-slate-200"
                    >
                        {label}
                    </span>
                ))}
                {rest > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] text-slate-400">
                        {t('schedule.templateStep.previewMore', {
                            count: rest,
                            defaultValue: `+ ${rest} autres`,
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Ligne du volet : intitulé discret à gauche, valeur affirmée à droite. */
function RecapRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-[11.5px] text-slate-500 flex-shrink-0">{label}</span>
            <span
                className={`text-[12.5px] text-right min-w-0 truncate ${
                    value ? 'text-slate-900 font-medium' : 'text-slate-300'
                }`}
            >
                {value || '—'}
            </span>
        </div>
    );
}

/**
 * Volet récapitulatif — persistant sur les trois étapes.
 *
 * Il répond au reproche central : « à l'étape 2 c'est encore la liste des lieux
 * alors que le lieu est déjà choisi ». En gardant la cible retenue sous les
 * yeux en permanence, l'ambiguïté disparaît — l'étape 2 ne peut plus être prise
 * pour une nouvelle demande de lieu.
 *
 * Ce qui n'est pas encore décidé s'affiche « — », jamais une valeur inventée.
 */
function RecapPanel({
    form,
    typeLabel,
    familyLabel,
    appliedTemplate,
    checkpointPreviews,
    employees,
    locale,
}: {
    form: FormState;
    typeLabel: string | null;
    familyLabel: string;
    appliedTemplate: InspectionTemplateSummaryDTO | null;
    checkpointPreviews: Record<number, string[]>;
    employees: { value: string; label: string }[];
    locale: string;
}) {
    const { t } = useTranslation('inspection');

    const lead = form.team.find((m) => m.role === 'LEAD' && m.employeeId);
    const leadName = lead ? employees.find((e) => e.value === lead.employeeId)?.label ?? null : null;
    const assignedCount = form.team.filter((m) => m.employeeId).length;

    const dateLabel = form.plannedDate
        ? new Date(`${form.plannedDate}T00:00:00`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')
        : null;
    const slot = [form.startTime, form.endTime].filter(Boolean).join(' → ') || null;

    const previewLabels = appliedTemplate ? checkpointPreviews[appliedTemplate.id] ?? [] : [];

    return (
        <aside className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 lg:sticky lg:top-4">
            <h2 className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-3">
                {t('schedule.recap.heading', { defaultValue: 'Récapitulatif' })}
            </h2>

            <section className="pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                    <IconMapPin size={13} stroke={1.8} className="text-cyan-700" />
                    <span className="text-[11.5px] font-medium text-slate-700">
                        {t('schedule.recap.target', { defaultValue: 'Objet inspecté' })}
                    </span>
                </div>
                <RecapRow label={t('schedule.recap.type', { defaultValue: 'Type' })} value={typeLabel} />
                <RecapRow
                    label={t('schedule.recap.name', { defaultValue: 'Désignation' })}
                    value={form.targetLabel || null}
                />
                {form.type === 'EQUIPMENT' && (
                    <RecapRow
                        label={t('schedule.recap.family', { defaultValue: 'Famille' })}
                        value={familyLabel || null}
                    />
                )}
            </section>

            <section className="py-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                    <IconListCheck size={13} stroke={1.8} className="text-cyan-700" />
                    <span className="text-[11.5px] font-medium text-slate-700">
                        {t('schedule.recap.grid', { defaultValue: 'Grille de contrôle' })}
                    </span>
                </div>
                <RecapRow
                    label={t('schedule.recap.gridName', { defaultValue: 'Modèle' })}
                    value={appliedTemplate?.name ?? null}
                />
                <RecapRow
                    label={t('schedule.recap.gridPoints', { defaultValue: 'Points' })}
                    value={appliedTemplate ? String(appliedTemplate.checkpointCount) : null}
                />
                {appliedTemplate && (
                    <CheckpointPreview labels={previewLabels} total={appliedTemplate.checkpointCount} />
                )}
            </section>

            <section className="py-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                    <IconClock size={13} stroke={1.8} className="text-cyan-700" />
                    <span className="text-[11.5px] font-medium text-slate-700">
                        {t('schedule.recap.planning', { defaultValue: 'Planification' })}
                    </span>
                </div>
                <RecapRow label={t('schedule.recap.date', { defaultValue: 'Date prévue' })} value={dateLabel} />
                <RecapRow label={t('schedule.recap.slot', { defaultValue: 'Créneau' })} value={slot} />
            </section>

            <section className="pt-2">
                <div className="flex items-center gap-1.5 mb-1">
                    <IconUsers size={13} stroke={1.8} className="text-cyan-700" />
                    <span className="text-[11.5px] font-medium text-slate-700">
                        {t('schedule.recap.team', { defaultValue: 'Équipe' })}
                    </span>
                </div>
                <RecapRow
                    label={t('schedule.recap.lead', { defaultValue: 'Responsable' })}
                    value={leadName}
                />
                <RecapRow
                    label={t('schedule.recap.members', { defaultValue: 'Membres' })}
                    value={assignedCount > 0 ? String(assignedCount) : null}
                />
            </section>
        </aside>
    );
}

function StepDetails({
    form,
    setField,
    employees,
    loadingEmployees,
    appliedTemplate,
    templateAutoApplied,
    familyLabel,
    checkpointPreviews,
}: {
    form: FormState;
    setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
    employees: { value: string; label: string }[];
    loadingEmployees: boolean;
    appliedTemplate: InspectionTemplateSummaryDTO | null;
    templateAutoApplied: boolean;
    familyLabel: string;
    checkpointPreviews: Record<number, string[]>;
}) {
    const { t } = useTranslation('inspection');

    /**
     * HIÉRARCHIE VISUELLE — l'ancienne version alignait libellés, valeurs et
     * notes d'aide dans des gris et des tailles trop proches : on ne distinguait
     * plus ce qui était une étiquette de ce qui était une saisie, ni de ce qui
     * était un commentaire. Trois niveaux nets sont désormais tenus :
     *   · SECTION  — capitales espacées, ardoise clair (repère de bloc) ;
     *   · LIBELLÉ  — 12 px semi-gras ardoise foncé (nomme le champ) ;
     *   · AIDE     — 11 px ardoise clair, précédée d'un point médian (commente).
     * Les champs, eux, portent un fond blanc et une bordure franche.
     */
    const sectionTitle = 'text-[11px] uppercase tracking-[0.14em] text-slate-500';
    const fieldLabel = 'block text-[12px] font-semibold text-slate-800 mb-1';
    const fieldHint = 'text-[11px] text-slate-500 mt-1';
    const inputBase =
        'w-full px-3 py-2 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-slate-400';

    const previewLabels = appliedTemplate ? checkpointPreviews[appliedTemplate.id] ?? [] : [];

    return (
        <div>
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">
                {t('schedule.detailsStep.heading')}
            </h2>
            <div className="space-y-5">
                {/* Rappel du modèle auto-appliqué : l'étape « grille » ayant été
                    sautée, l'utilisateur doit voir quelle grille s'applique — ET
                    ce qu'elle contient, sinon le bandeau ne dit rien d'utile. */}
                {templateAutoApplied && appliedTemplate && (
                    <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-start gap-2 text-emerald-800 text-[12.5px]">
                            <IconFileCheck size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="font-medium">{appliedTemplate.name}</div>
                                <div className="text-[11.5px] text-emerald-700/90">
                                    {t('schedule.templateStep.autoSelected', { family: familyLabel })}
                                </div>
                            </div>
                        </div>
                        <CheckpointPreview labels={previewLabels} total={appliedTemplate.checkpointCount} />
                    </div>
                )}

                {/* ─── Planification ─────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className={sectionTitle}>
                            {t('schedule.detailsStep.planningSection', { defaultValue: 'Planification' })}
                        </h3>
                        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className={fieldLabel}>
                                {t('schedule.detailsStep.plannedDateLabel')}
                                <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.plannedDate}
                                onChange={(e) => setField('plannedDate', e.target.value)}
                                className={`${inputBase} min-h-[40px]`}
                            />
                        </div>
                        <div>
                            <label className={fieldLabel}>{t('schedule.detailsStep.startTimeLabel')}</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setField('startTime', e.target.value)}
                                className={`${inputBase} min-h-[40px]`}
                            />
                        </div>
                        <div>
                            <label className={fieldLabel}>{t('schedule.detailsStep.endTimeLabel')}</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setField('endTime', e.target.value)}
                                className={`${inputBase} min-h-[40px]`}
                            />
                        </div>
                    </div>
                </section>

                {/* ─── Équipe ────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className={sectionTitle}>
                            {t('schedule.detailsStep.teamSection', { defaultValue: 'Équipe' })}
                        </h3>
                        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                    </div>
                    {/* Composant PARTAGÉ avec InspectionDetailPage (modification
                        post-planification) : l'invariant « un seul LEAD » y vit. */}
                    <InspectionTeamEditor
                        value={form.team}
                        onChange={(next) => setField('team', next)}
                        employees={employees}
                        loadingEmployees={loadingEmployees}
                    />
                </section>

                {/* ─── Cadrage ───────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className={sectionTitle}>
                            {t('schedule.detailsStep.scopeSection', { defaultValue: 'Cadrage de la mission' })}
                        </h3>
                        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className={fieldLabel}>{t('schedule.detailsStep.objectivesLabel')}</label>
                            <textarea
                                value={form.objectives}
                                onChange={(e) => setField('objectives', e.target.value)}
                                placeholder={t('schedule.detailsStep.objectivesPlaceholder')}
                                rows={2}
                                className={inputBase}
                            />
                            <p className={fieldHint}>
                                ·{' '}
                                {t('schedule.detailsStep.objectivesHint', {
                                    defaultValue: 'Facultatif — précise ce que cette inspection cherche à établir.',
                                })}
                            </p>
                        </div>
                        <div>
                            <label className={fieldLabel}>{t('schedule.detailsStep.descriptionLabel')}</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setField('description', e.target.value)}
                                placeholder={t('schedule.detailsStep.descriptionPlaceholder')}
                                rows={3}
                                className={inputBase}
                            />
                            <p className={fieldHint}>
                                ·{' '}
                                {t('schedule.detailsStep.descriptionHint', {
                                    defaultValue:
                                        'Facultatif — conditions particulières utiles à l’inspecteur sur le terrain.',
                                })}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
