/**
 * BlastForm — Module Gestion des Dynamitages (Phase 2 Frontend).
 *
 * Formulaire premium d'enregistrement / edition d'un tir de mine.
 *
 * Routes :
 *   - /blast/new        (creation : status initial DRAFT)
 *   - /blast/edit/:id   (edition : toutes les sections sont editables tant que
 *                       le statut est DRAFT ou PLANNED ; verrouille des CONFIRMED
 *                       (modif possible avec raison tracee + adminOverride))
 *
 * Sections (sequencees en pleine page desktop ; les Mantine Paper se replient
 * naturellement sur mobile) :
 *   1. Identification     : reference, heure prevue (Europe/Paris), type
 *   2. Localisation       : fosse, gradin, bloc, lat/lng, acces concernes
 *   3. Plan de tir        : trous, diametre, profondeur, burden, spacing,
 *                          stemming + maille calculee
 *   4. Explosifs & amorcage: nature, quantite, charge specifique calculee,
 *                          systeme d'amorcage, sequence retards
 *   5. Perimetre & abris  : rayon exclusion, points rassemblement, postes
 *                          des gardes
 *   6. Equipe             : boutefeu, equipe, responsable HSE
 *   7. Environnement      : limites PPV, recepteurs sensibles
 *   8. Annonce            : destinataires e-mails + langue, zone alerte T-10
 *   9. Pieces jointes     : permis, JSA, plan de tir, schemas (placeholder)
 *  10. Notes libres
 *
 * Boutons d'action :
 *   - Enregistrer brouillon (DRAFT)
 *   - Confirmer le tir (DRAFT/PLANNED -> CONFIRMED) — modal de confirmation
 *   - Mettre a jour (en mode edition)
 *
 * Tir CONFIRMED ou ulterieur : champs scheduled_at et perimetre verrouilles ;
 * un bouton "Modifier" ouvre un modal exigeant une raison + adminOverride
 * (cf. BlastService.updateBlast / Backend BLAST_ADMIN).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Group,
    Button,
    Select,
    NumberInput,
    TextInput,
    Textarea,
    Modal,
    ActionIcon,
    Text,
    Stepper,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Dropzone, MIME_TYPES, type FileWithPath } from '@mantine/dropzone';
import {
    IconArrowLeft,
    IconChevronRight,
    IconBolt,
    IconId,
    IconMapPin,
    IconRuler,
    IconFlame,
    IconShieldHalfFilled,
    IconUsers,
    IconAlertOctagon,
    IconMail,
    IconPaperclip,
    IconNote,
    IconDeviceFloppy,
    IconCheck,
    IconLock,
    IconPlus,
    IconTrash,
    IconUpload,
    IconX,
    IconFile,
    IconArrowRight,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    createBlast,
    updateBlast,
    confirmBlast,
    getBlastDetail,
    type BlastCreateDTO,
    type BlastUpdateDTO,
    type BlastDetailDTO,
    type BlastGuardDTO,
    type BlastRecipientDTO,
    type BlastStatus,
    type BlastType,
} from '../../services/BlastService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes : referentiels d'enums (alignes sur le backend)
// ─────────────────────────────────────────────────────────────────────────────

const BLAST_TYPES: BlastType[] = [
    'PRODUCTION',
    'DEVELOPMENT',
    'SECONDARY',
    'PRESPLIT',
    'FINAL',
];

const EXPLOSIVE_TYPES = [
    'ANFO',
    'EMULSION',
    'ANFO_HEAVY',
    'DYNAMITE',
    'WATER_GEL',
];

const INITIATION_SYSTEMS = [
    'ELECTRONIC',
    'NON_ELECTRIC',
    'ELECTRIC',
    'DETONATING_CORD',
];

const TIMEZONES = ['Europe/Paris', 'UTC', 'Africa/Abidjan', 'Africa/Ouagadougou'];

const PREFERRED_LANGUAGES = [
    { value: 'FR', label: 'FR' },
    { value: 'EN', label: 'EN' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Type d'etat local du formulaire (regroupant tous les champs de saisie)
// ─────────────────────────────────────────────────────────────────────────────

interface BlastFormState {
    // Section 1 — Identification
    reference: string;
    scheduledAt: Date | null;
    timezone: string;
    type: BlastType | '';

    // Section 2 — Localisation
    pit: string;
    bench: string;
    block: string;
    lat: number | '';
    lng: number | '';
    accessConcerned: string;

    // Section 3 — Plan de tir
    holeCount: number | '';
    holeDiameterMm: number | '';
    depthM: number | '';
    burdenM: number | '';
    spacingM: number | '';
    stemmingM: number | '';

    // Section 4 — Explosifs
    explosiveType: string;
    explosiveQtyKg: number | '';
    initiationSystem: string;
    delaySequence: string;

    // Section 5 — Perimetre & abris
    exclusionRadiusM: number | '';
    assemblyPoints: string;
    guards: BlastGuardDTO[];

    // Section 6 — Equipe
    blasterId: number | '';
    team: string;
    hseLeadId: number | '';

    // Section 7 — Environnement
    ppvLimit: number | '';
    sensitiveReceivers: string;

    // Section 8 — Annonce
    recipients: BlastRecipientDTO[];
    alarmZoneScope: string;

    // Section 9 — Pieces jointes (placeholder uniquement)
    attachmentsNote: string;

    // Section 10 — Notes
    notes: string;
}

const INITIAL_STATE: BlastFormState = {
    reference: '',
    scheduledAt: null,
    timezone: 'Europe/Paris',
    type: '',
    pit: '',
    bench: '',
    block: '',
    lat: '',
    lng: '',
    accessConcerned: '',
    holeCount: '',
    holeDiameterMm: '',
    depthM: '',
    burdenM: '',
    spacingM: '',
    stemmingM: '',
    explosiveType: '',
    explosiveQtyKg: '',
    initiationSystem: '',
    delaySequence: '',
    exclusionRadiusM: '',
    assemblyPoints: '',
    guards: [],
    blasterId: '',
    team: '',
    hseLeadId: '',
    ppvLimit: '',
    sensitiveReceivers: '',
    recipients: [],
    alarmZoneScope: '',
    attachmentsNote: '',
    notes: '',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const isLocked = (status: BlastStatus | null): boolean => {
    if (!status) return false;
    return status !== 'DRAFT' && status !== 'PLANNED';
};

const isoLocal = (d: Date): string => {
    // LocalDateTime sans timezone (le backend Java attend un LocalDateTime ISO).
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : entete de section premium
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    locked?: boolean;
}

const SectionHeader = ({ icon, title, locked }: SectionHeaderProps) => (
    <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            {icon}
        </div>
        <h2 className="text-[14px] font-semibold text-slate-800">{title}</h2>
        {locked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-slate-100 border-slate-300 text-slate-700">
                <IconLock size={10} stroke={2} />
                {/* libelle "verrouille" / "locked" geree au niveau du parent via i18n. */}
            </span>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const BlastForm = () => {
    const { t } = useTranslation('blast');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );
    const mineId: number =
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1;

    const [state, setState] = useState<BlastFormState>(INITIAL_STATE);
    const [originalStatus, setOriginalStatus] = useState<BlastStatus | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [lockedReason, setLockedReason] = useState('');
    /** P2.1 — index courant du Stepper mobile (0 a 9 ; 10 sections). */
    const [mobileStep, setMobileStep] = useState(0);
    /**
     * P2.1 — Pieces jointes : liste de metadata (nom + taille) cote front
     * uniquement. Aucun endpoint d'upload n'existe en P1 ; les fichiers ne sont
     * pas envoyes au backend, on serialise leurs noms dans `attachmentsNote`
     * (TEXT) au moment de la sauvegarde.
     */
    const [attachmentsFiles, setAttachmentsFiles] = useState<
        Array<{ name: string; size: number }>
    >([]);

    /** Formattage humain d'une taille en octets. */
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const handleDropFiles = (files: FileWithPath[]) => {
        if (locked) return;
        const next = [
            ...attachmentsFiles,
            ...files.map((f) => ({ name: f.name, size: f.size })),
        ];
        setAttachmentsFiles(next);
        // On reflete la liste dans le champ texte persiste (attachmentsNote)
        // en complement d'eventuelles notes deja saisies par l'utilisateur.
        const headline = next
            .map((f) => `• ${f.name} (${formatFileSize(f.size)})`)
            .join('\n');
        setState((s) => ({ ...s, attachmentsNote: headline }));
    };
    const removeAttachmentAt = (idx: number) => {
        const next = attachmentsFiles.filter((_, i) => i !== idx);
        setAttachmentsFiles(next);
        const headline = next
            .map((f) => `• ${f.name} (${formatFileSize(f.size)})`)
            .join('\n');
        setState((s) => ({ ...s, attachmentsNote: headline }));
    };

    /**
     * P2.1 — Stepper mobile : classe Tailwind a appliquer sur chaque section
     * pour la masquer sur mobile (md hidden) tant qu'elle n'est pas l'etape
     * courante. Sur desktop (md:block), toutes les sections restent visibles
     * pour preserver la grille pleine page.
     */
    const stepClass = (idx: number): string =>
        mobileStep === idx ? 'block md:block' : 'hidden md:block';

    /** Libelles des 10 sections (cles i18n form.section{n}). */
    const sectionTitles: Array<{ key: string; icon: React.ReactNode }> = [
        { key: 'form.section1', icon: <IconId size={12} stroke={1.8} /> },
        { key: 'form.section2', icon: <IconMapPin size={12} stroke={1.8} /> },
        { key: 'form.section3', icon: <IconRuler size={12} stroke={1.8} /> },
        { key: 'form.section4', icon: <IconFlame size={12} stroke={1.8} /> },
        { key: 'form.section5', icon: <IconShieldHalfFilled size={12} stroke={1.8} /> },
        { key: 'form.section6', icon: <IconUsers size={12} stroke={1.8} /> },
        { key: 'form.section7', icon: <IconAlertOctagon size={12} stroke={1.8} /> },
        { key: 'form.section8', icon: <IconMail size={12} stroke={1.8} /> },
        { key: 'form.section9', icon: <IconPaperclip size={12} stroke={1.8} /> },
        { key: 'form.section10', icon: <IconNote size={12} stroke={1.8} /> },
    ];

    const locked = isLocked(originalStatus);

    // ───── Chargement en mode edition ─────
    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        getBlastDetail(id)
            .then((d: BlastDetailDTO) => {
                if (cancelled) return;
                setOriginalStatus(d.status);
                // P2.1 : re-injection des 7 champs additionnels desormais
                // persistés cote backend (V015). Avant le fix, le load forçait
                // ces champs a chaine vide → toute edition d'un brouillon
                // ecrasait silencieusement le contenu saisi.
                setState({
                    reference: d.reference ?? '',
                    scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
                    timezone: d.timezone ?? 'Europe/Paris',
                    type: d.type,
                    pit: d.pit ?? '',
                    bench: d.bench ?? '',
                    block: d.block ?? '',
                    lat: d.lat ?? '',
                    lng: d.lng ?? '',
                    accessConcerned: d.accessConcerned ?? '',
                    holeCount: d.plan?.holeCount ?? '',
                    holeDiameterMm: d.plan?.holeDiameterMm ?? '',
                    depthM: d.plan?.depthM ?? '',
                    burdenM: d.plan?.burdenM ?? '',
                    spacingM: d.plan?.spacingM ?? '',
                    stemmingM: d.plan?.stemmingM ?? '',
                    explosiveType: d.plan?.explosiveType ?? '',
                    explosiveQtyKg: d.plan?.explosiveQtyKg ?? '',
                    initiationSystem: d.plan?.initiationSystem ?? '',
                    delaySequence: d.plan?.delaySequence ?? '',
                    exclusionRadiusM: d.exclusionRadiusM ?? '',
                    assemblyPoints: d.assemblyPoints ?? '',
                    guards: d.guards ?? [],
                    blasterId: d.blasterId ?? '',
                    team: d.team ?? '',
                    hseLeadId: d.hseLeadId ?? '',
                    ppvLimit: d.ppvLimit ?? '',
                    sensitiveReceivers: d.sensitiveReceivers ?? '',
                    recipients: d.recipients ?? [],
                    alarmZoneScope: d.alarmZoneScope ?? '',
                    attachmentsNote: d.attachmentsNote ?? '',
                    notes: d.notes ?? '',
                });
            })
            .catch(() => {
                if (!cancelled) setLoadError(t('detail.loadError'));
            });
        return () => {
            cancelled = true;
        };
    }, [isEdit, id, t]);

    // ───── Maille calculee (burden x spacing) ─────
    const patternCalc = useMemo(() => {
        const b = Number(state.burdenM);
        const s = Number(state.spacingM);
        if (!b || !s) return null;
        return (b * s).toFixed(2);
    }, [state.burdenM, state.spacingM]);

    // ───── Charge specifique calculee (kg explosif / volume rocher) ─────
    const powderFactor = useMemo(() => {
        const h = Number(state.holeCount);
        const b = Number(state.burdenM);
        const s = Number(state.spacingM);
        const d = Number(state.depthM);
        const q = Number(state.explosiveQtyKg);
        if (!h || !b || !s || !d || !q) return null;
        const volume = h * b * s * d;
        if (volume <= 0) return null;
        return (q / volume).toFixed(3);
    }, [
        state.holeCount,
        state.burdenM,
        state.spacingM,
        state.depthM,
        state.explosiveQtyKg,
    ]);

    // ───── Validation ─────
    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!state.scheduledAt) {
            e.scheduledAt = t('form.validation.scheduledAtRequired');
        }
        if (!state.type) e.type = t('form.validation.typeRequired');
        if (
            state.exclusionRadiusM !== '' &&
            Number(state.exclusionRadiusM) <= 0
        ) {
            e.exclusionRadiusM = t('form.validation.exclusionRadiusInvalid');
        }
        if (state.holeCount !== '' && Number(state.holeCount) <= 0) {
            e.holeCount = t('form.validation.holeCountInvalid');
        }
        if (
            state.explosiveQtyKg !== '' &&
            Number(state.explosiveQtyKg) < 0
        ) {
            e.explosiveQtyKg = t('form.validation.explosiveQtyInvalid');
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ───── Construction du payload (create ou update) ─────
    // P2.1 : on envoie desormais les 7 champs flag par l'audit
    // (accessConcerned, assemblyPoints, team, ppvLimit, sensitiveReceivers,
    // attachmentsNote, notes) qui etaient silencieusement perdus.
    const buildCreatePayload = (): BlastCreateDTO => ({
        reference: state.reference || null,
        scheduledAt: isoLocal(state.scheduledAt as Date),
        timezone: state.timezone || null,
        type: state.type as BlastType,
        pit: state.pit || null,
        bench: state.bench || null,
        block: state.block || null,
        lat: state.lat === '' ? null : Number(state.lat),
        lng: state.lng === '' ? null : Number(state.lng),
        accessConcerned: state.accessConcerned || null,
        assemblyPoints: state.assemblyPoints || null,
        exclusionRadiusM:
            state.exclusionRadiusM === '' ? null : Number(state.exclusionRadiusM),
        blasterId: state.blasterId === '' ? null : Number(state.blasterId),
        team: state.team || null,
        hseLeadId: state.hseLeadId === '' ? null : Number(state.hseLeadId),
        ppvLimit: state.ppvLimit === '' ? null : Number(state.ppvLimit),
        sensitiveReceivers: state.sensitiveReceivers || null,
        alarmZoneScope: state.alarmZoneScope || null,
        attachmentsNote: state.attachmentsNote || null,
        notes: state.notes || null,
        mineId,
        plan: {
            holeCount: state.holeCount === '' ? null : Number(state.holeCount),
            holeDiameterMm:
                state.holeDiameterMm === '' ? null : Number(state.holeDiameterMm),
            depthM: state.depthM === '' ? null : Number(state.depthM),
            burdenM: state.burdenM === '' ? null : Number(state.burdenM),
            spacingM: state.spacingM === '' ? null : Number(state.spacingM),
            stemmingM: state.stemmingM === '' ? null : Number(state.stemmingM),
            explosiveType: state.explosiveType || null,
            explosiveQtyKg:
                state.explosiveQtyKg === '' ? null : Number(state.explosiveQtyKg),
            powderFactor: powderFactor ? Number(powderFactor) : null,
            initiationSystem: state.initiationSystem || null,
            delaySequence: state.delaySequence || null,
        },
        guards: state.guards,
        recipients: state.recipients,
    });

    const buildUpdatePayload = (reason?: string): BlastUpdateDTO => ({
        id: Number(id),
        scheduledAt: state.scheduledAt ? isoLocal(state.scheduledAt) : null,
        timezone: state.timezone || null,
        type: (state.type || null) as BlastType | null,
        pit: state.pit || null,
        bench: state.bench || null,
        block: state.block || null,
        lat: state.lat === '' ? null : Number(state.lat),
        lng: state.lng === '' ? null : Number(state.lng),
        accessConcerned: state.accessConcerned || null,
        assemblyPoints: state.assemblyPoints || null,
        exclusionRadiusM:
            state.exclusionRadiusM === '' ? null : Number(state.exclusionRadiusM),
        blasterId: state.blasterId === '' ? null : Number(state.blasterId),
        team: state.team || null,
        hseLeadId: state.hseLeadId === '' ? null : Number(state.hseLeadId),
        ppvLimit: state.ppvLimit === '' ? null : Number(state.ppvLimit),
        sensitiveReceivers: state.sensitiveReceivers || null,
        alarmZoneScope: state.alarmZoneScope || null,
        attachmentsNote: state.attachmentsNote || null,
        notes: state.notes || null,
        plan: {
            holeCount: state.holeCount === '' ? null : Number(state.holeCount),
            holeDiameterMm:
                state.holeDiameterMm === '' ? null : Number(state.holeDiameterMm),
            depthM: state.depthM === '' ? null : Number(state.depthM),
            burdenM: state.burdenM === '' ? null : Number(state.burdenM),
            spacingM: state.spacingM === '' ? null : Number(state.spacingM),
            stemmingM: state.stemmingM === '' ? null : Number(state.stemmingM),
            explosiveType: state.explosiveType || null,
            explosiveQtyKg:
                state.explosiveQtyKg === '' ? null : Number(state.explosiveQtyKg),
            powderFactor: powderFactor ? Number(powderFactor) : null,
            initiationSystem: state.initiationSystem || null,
            delaySequence: state.delaySequence || null,
        },
        guards: state.guards,
        recipients: state.recipients,
        reason: reason ?? null,
    });

    // ───── Soumission : brouillon ─────
    const handleSaveDraft = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (isEdit && id) {
                if (locked) {
                    setShowLockedModal(true);
                    setSaving(false);
                    return;
                }
                await updateBlast(id, buildUpdatePayload(), false);
            } else {
                await createBlast(buildCreatePayload());
            }
            navigate('/blast/registry');
        } catch {
            setLoadError(t('form.saveError'));
        } finally {
            setSaving(false);
        }
    };

    // ───── Soumission : confirmer le tir ─────
    const handleConfirm = async () => {
        if (!validate()) return;
        setShowConfirmModal(true);
    };

    const doConfirmAfterModal = async () => {
        setSaving(true);
        try {
            let blastId: number;
            if (isEdit && id) {
                if (locked) {
                    // Deja confirme : pas de double-confirmation possible.
                    setShowConfirmModal(false);
                    return;
                }
                await updateBlast(id, buildUpdatePayload(), false);
                blastId = Number(id);
            } else {
                blastId = await createBlast(buildCreatePayload());
            }
            await confirmBlast(blastId);
            setShowConfirmModal(false);
            navigate('/blast/registry');
        } catch {
            setLoadError(t('form.saveError'));
        } finally {
            setSaving(false);
        }
    };

    // ───── Soumission : edition d'un tir verrouille (BLAST_ADMIN + raison) ─────
    const doLockedUpdate = async () => {
        if (!lockedReason.trim()) {
            setErrors((e) => ({
                ...e,
                lockedReason: t('form.validation.reasonRequired'),
            }));
            return;
        }
        setSaving(true);
        try {
            await updateBlast(id as string, buildUpdatePayload(lockedReason), true);
            setShowLockedModal(false);
            navigate('/blast/registry');
        } catch {
            setLoadError(t('form.saveError'));
        } finally {
            setSaving(false);
        }
    };

    // ───── Helpers pour gestion des listes (gardes / destinataires) ─────
    const addGuard = () =>
        setState((s) => ({
            ...s,
            guards: [...s.guards, { employeeId: 0, position: '' }],
        }));
    const removeGuard = (idx: number) =>
        setState((s) => ({
            ...s,
            guards: s.guards.filter((_, i) => i !== idx),
        }));
    const updateGuard = (idx: number, patch: Partial<BlastGuardDTO>) =>
        setState((s) => ({
            ...s,
            guards: s.guards.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
        }));

    const addRecipient = () =>
        setState((s) => ({
            ...s,
            recipients: [
                ...s.recipients,
                { externalEmail: '', preferredLanguage: 'FR' },
            ],
        }));
    const removeRecipient = (idx: number) =>
        setState((s) => ({
            ...s,
            recipients: s.recipients.filter((_, i) => i !== idx),
        }));
    const updateRecipient = (
        idx: number,
        patch: Partial<BlastRecipientDTO>,
    ) =>
        setState((s) => ({
            ...s,
            recipients: s.recipients.map((r, i) =>
                i === idx ? { ...r, ...patch } : r,
            ),
        }));

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full max-w-5xl mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/blast/registry')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-amber-700 hover:underline transition"
                    >
                        {t('registry.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {isEdit
                            ? t('form.breadcrumbCurrentEdit')
                            : t('form.breadcrumbCurrentNew')}
                    </span>
                </div>

                {/* ─── Hero header serif ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
                                <IconBolt size={22} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(22px, 2.4vw, 28px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {isEdit
                                        ? t('form.titleEdit')
                                        : t('form.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {isEdit
                                        ? t('form.subtitleEdit')
                                        : t('form.subtitleNew')}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="subtle"
                            color="gray"
                            size="sm"
                            leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                            onClick={() => navigate('/blast/registry')}
                        >
                            {t('common.back')}
                        </Button>
                    </div>
                </div>

                {/* ─── Bandeau verrouille (si statut >= CONFIRMED) ─── */}
                {locked && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconLock
                            size={14}
                            stroke={1.8}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{t('form.lockedModal.body')}</span>
                    </div>
                )}

                {/* ─── Erreur de chargement / sauvegarde ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertOctagon
                            size={14}
                            stroke={1.8}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── P2.1 — Stepper mobile (uniquement < md) ─── */}
                <div className="md:hidden mb-4">
                    <Paper p="md" radius="md" withBorder className="bg-white">
                        <Stepper
                            active={mobileStep}
                            onStepClick={setMobileStep}
                            size="xs"
                            color="amber"
                            iconSize={22}
                            allowNextStepsSelect
                        >
                            {sectionTitles.map((s, i) => (
                                <Stepper.Step
                                    key={s.key}
                                    label={`${i + 1}`}
                                    icon={s.icon}
                                />
                            ))}
                        </Stepper>
                        <Text
                            size="xs"
                            fw={500}
                            className="text-slate-700 mt-2 text-center"
                        >
                            {mobileStep + 1}/{sectionTitles.length} —{' '}
                            {t(sectionTitles[mobileStep].key)}
                        </Text>
                    </Paper>
                </div>

                {/* ─── SECTION 1 — Identification ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(0)}`}
                >
                    <SectionHeader
                        icon={<IconId size={14} stroke={1.8} />}
                        title={t('form.section1')}
                        locked={locked}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextInput
                            label={t('form.fields.reference')}
                            placeholder={t('form.fields.referencePlaceholder')}
                            value={state.reference}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    reference: e.currentTarget.value,
                                }))
                            }
                            disabled={locked}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <DateTimePicker
                            label={t('form.fields.scheduledAt')}
                            placeholder=""
                            value={state.scheduledAt}
                            onChange={(v: any) =>
                                setState((s) => ({
                                    ...s,
                                    scheduledAt:
                                        v instanceof Date ? v : v ? new Date(v) : null,
                                }))
                            }
                            disabled={locked}
                            valueFormat="DD/MM/YYYY HH:mm"
                            error={errors.scheduledAt}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Select
                            label={t('form.fields.type')}
                            placeholder={t('form.fields.typePlaceholder')}
                            value={state.type || null}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    type: (v as BlastType) || '',
                                }))
                            }
                            data={BLAST_TYPES.map((bt) => ({
                                value: bt,
                                label: t(`types.${bt}`),
                            }))}
                            error={errors.type}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Select
                            label={t('form.fields.timezone')}
                            value={state.timezone}
                            onChange={(v) =>
                                setState((s) => ({ ...s, timezone: v ?? 'Europe/Paris' }))
                            }
                            data={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                            disabled={locked}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                    </div>
                </Paper>

                {/* ─── SECTION 2 — Localisation ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(1)}`}
                >
                    <SectionHeader
                        icon={<IconMapPin size={14} stroke={1.8} />}
                        title={t('form.section2')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextInput
                            label={t('form.fields.pit')}
                            placeholder={t('form.fields.pitPlaceholder')}
                            value={state.pit}
                            onChange={(e) =>
                                setState((s) => ({ ...s, pit: e.currentTarget.value }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <TextInput
                            label={t('form.fields.bench')}
                            placeholder={t('form.fields.benchPlaceholder')}
                            value={state.bench}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    bench: e.currentTarget.value,
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <TextInput
                            label={t('form.fields.block')}
                            placeholder={t('form.fields.blockPlaceholder')}
                            value={state.block}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    block: e.currentTarget.value,
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.lat')}
                            decimalScale={6}
                            value={state.lat}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    lat:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.lng')}
                            decimalScale={6}
                            value={state.lng}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    lng:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Textarea
                            label={t('form.fields.accessConcerned')}
                            placeholder={t('form.fields.accessPlaceholder')}
                            value={state.accessConcerned}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    accessConcerned: e.currentTarget.value,
                                }))
                            }
                            autosize
                            minRows={2}
                            className="md:col-span-3"
                        />
                    </div>
                </Paper>

                {/* ─── SECTION 3 — Plan de tir ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(2)}`}
                >
                    <SectionHeader
                        icon={<IconRuler size={14} stroke={1.8} />}
                        title={t('form.section3')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumberInput
                            label={t('form.fields.holeCount')}
                            suffix={` ${t('form.units.holes')}`}
                            value={state.holeCount}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    holeCount:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            error={errors.holeCount}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.holeDiameter')}
                            suffix={` ${t('form.units.mm')}`}
                            value={state.holeDiameterMm}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    holeDiameterMm:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.depth')}
                            suffix={` ${t('form.units.m')}`}
                            value={state.depthM}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    depthM:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={2}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.burden')}
                            suffix={` ${t('form.units.m')}`}
                            value={state.burdenM}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    burdenM:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={2}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.spacing')}
                            suffix={` ${t('form.units.m')}`}
                            value={state.spacingM}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    spacingM:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={2}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.stemming')}
                            suffix={` ${t('form.units.m')}`}
                            value={state.stemmingM}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    stemmingM:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={2}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                    </div>
                    {patternCalc && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[12px]">
                            <span className="font-medium">
                                {t('form.fields.patternCalculated')} :
                            </span>
                            <span className="font-mono tabular-nums">
                                {patternCalc} m2
                            </span>
                        </div>
                    )}
                </Paper>

                {/* ─── SECTION 4 — Explosifs & amorcage ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(3)}`}
                >
                    <SectionHeader
                        icon={<IconFlame size={14} stroke={1.8} />}
                        title={t('form.section4')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select
                            label={t('form.fields.explosiveType')}
                            placeholder={t('form.fields.explosiveTypePlaceholder')}
                            value={state.explosiveType || null}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    explosiveType: v ?? '',
                                }))
                            }
                            data={EXPLOSIVE_TYPES.map((et) => ({
                                value: et,
                                label: et,
                            }))}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.explosiveQty')}
                            suffix={` ${t('form.units.kg')}`}
                            value={state.explosiveQtyKg}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    explosiveQtyKg:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={2}
                            error={errors.explosiveQtyKg}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <TextInput
                            label={t('form.fields.powderFactor')}
                            value={powderFactor ?? ''}
                            disabled
                            rightSection={
                                <Text size="xs" c="dimmed">
                                    {t('form.units.kgPerM3')}
                                </Text>
                            }
                            rightSectionWidth={50}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Select
                            label={t('form.fields.initiationSystem')}
                            placeholder={t('form.fields.initiationPlaceholder')}
                            value={state.initiationSystem || null}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    initiationSystem: v ?? '',
                                }))
                            }
                            data={INITIATION_SYSTEMS.map((is) => ({
                                value: is,
                                label: is,
                            }))}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <TextInput
                            label={t('form.fields.delaySequence')}
                            placeholder={t('form.fields.delaySequencePlaceholder')}
                            value={state.delaySequence}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    delaySequence: e.currentTarget.value,
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                            className="md:col-span-2"
                        />
                    </div>
                </Paper>

                {/* ─── SECTION 5 — Perimetre & abris ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(4)}`}
                >
                    <SectionHeader
                        icon={<IconShieldHalfFilled size={14} stroke={1.8} />}
                        title={t('form.section5')}
                        locked={locked}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumberInput
                            label={t('form.fields.exclusionRadius')}
                            suffix={` ${t('form.units.m')}`}
                            value={state.exclusionRadiusM}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    exclusionRadiusM:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={0}
                            disabled={locked}
                            error={errors.exclusionRadiusM}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Textarea
                            label={t('form.fields.assemblyPoints')}
                            placeholder={t('form.fields.assemblyPointsPlaceholder')}
                            value={state.assemblyPoints}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    assemblyPoints: e.currentTarget.value,
                                }))
                            }
                            autosize
                            minRows={2}
                            className="md:col-span-2"
                        />
                    </div>

                    {/* Liste editable des gardes */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <Text fw={500} size="sm" className="text-slate-700">
                                {t('form.fields.guards')}
                            </Text>
                            <Button
                                size="xs"
                                variant="light"
                                color="amber"
                                leftSection={<IconPlus size={12} />}
                                onClick={addGuard}
                            >
                                {t('form.fields.addGuard')}
                            </Button>
                        </div>
                        {state.guards.length === 0 ? (
                            <Text size="xs" c="dimmed">
                                {t('form.fields.guardsPlaceholder')}
                            </Text>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {state.guards.map((g, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end"
                                    >
                                        <NumberInput
                                            label={
                                                idx === 0
                                                    ? t('form.fields.guardName')
                                                    : undefined
                                            }
                                            value={g.employeeId || ''}
                                            onChange={(v) =>
                                                updateGuard(idx, {
                                                    employeeId:
                                                        typeof v === 'number'
                                                            ? v
                                                            : v === ''
                                                              ? 0
                                                              : Number(v),
                                                })
                                            }
                                            min={0}
                                            classNames={{ input: 'min-h-[44px]' }}
                                        />
                                        <TextInput
                                            label={
                                                idx === 0
                                                    ? t('form.fields.guardPosition')
                                                    : undefined
                                            }
                                            value={g.position ?? ''}
                                            onChange={(e) =>
                                                updateGuard(idx, {
                                                    position: e.currentTarget.value,
                                                })
                                            }
                                            classNames={{ input: 'min-h-[44px]' }}
                                        />
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={() => removeGuard(idx)}
                                            size="lg"
                                            title={t('form.fields.removeGuard')}
                                        >
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Paper>

                {/* ─── SECTION 6 — Equipe ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(5)}`}
                >
                    <SectionHeader
                        icon={<IconUsers size={14} stroke={1.8} />}
                        title={t('form.section6')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumberInput
                            label={t('form.fields.blaster')}
                            placeholder={t('form.fields.blasterPlaceholder')}
                            value={state.blasterId}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    blasterId:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <TextInput
                            label={t('form.fields.team')}
                            placeholder={t('form.fields.teamPlaceholder')}
                            value={state.team}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    team: e.currentTarget.value,
                                }))
                            }
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <NumberInput
                            label={t('form.fields.hseLead')}
                            placeholder={t('form.fields.hseLeadPlaceholder')}
                            value={state.hseLeadId}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    hseLeadId:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                    </div>
                </Paper>

                {/* ─── SECTION 7 — Environnement ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(6)}`}
                >
                    <SectionHeader
                        icon={<IconAlertOctagon size={14} stroke={1.8} />}
                        title={t('form.section7')}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumberInput
                            label={t('form.fields.ppvLimit')}
                            suffix={` ${t('form.units.mmPerS')}`}
                            value={state.ppvLimit}
                            onChange={(v) =>
                                setState((s) => ({
                                    ...s,
                                    ppvLimit:
                                        typeof v === 'number'
                                            ? v
                                            : v === ''
                                              ? ''
                                              : Number(v),
                                }))
                            }
                            min={0}
                            decimalScale={1}
                            classNames={{ input: 'min-h-[44px]' }}
                        />
                        <Textarea
                            label={t('form.fields.sensitiveReceivers')}
                            placeholder={t('form.fields.sensitivePlaceholder')}
                            value={state.sensitiveReceivers}
                            onChange={(e) =>
                                setState((s) => ({
                                    ...s,
                                    sensitiveReceivers: e.currentTarget.value,
                                }))
                            }
                            autosize
                            minRows={2}
                            className="md:col-span-2"
                        />
                    </div>
                </Paper>

                {/* ─── SECTION 8 — Annonce ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(7)}`}
                >
                    <SectionHeader
                        icon={<IconMail size={14} stroke={1.8} />}
                        title={t('form.section8')}
                        locked={locked}
                    />
                    <Textarea
                        label={t('form.fields.alarmZoneScope')}
                        placeholder={t('form.fields.alarmZonePlaceholder')}
                        value={state.alarmZoneScope}
                        onChange={(e) =>
                            setState((s) => ({
                                ...s,
                                alarmZoneScope: e.currentTarget.value,
                            }))
                        }
                        autosize
                        minRows={2}
                        disabled={locked}
                        className="mb-4"
                    />
                    <div className="flex items-center justify-between mb-2">
                        <Text fw={500} size="sm" className="text-slate-700">
                            {t('form.fields.recipients')}
                        </Text>
                        <Button
                            size="xs"
                            variant="light"
                            color="amber"
                            leftSection={<IconPlus size={12} />}
                            onClick={addRecipient}
                        >
                            {t('form.fields.addRecipient')}
                        </Button>
                    </div>
                    {state.recipients.length === 0 ? (
                        <Text size="xs" c="dimmed">
                            {t('form.fields.recipientsPlaceholder')}
                        </Text>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {state.recipients.map((r, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-end"
                                >
                                    <TextInput
                                        label={
                                            idx === 0
                                                ? t('form.fields.recipientEmail')
                                                : undefined
                                        }
                                        type="email"
                                        value={r.externalEmail ?? ''}
                                        onChange={(e) =>
                                            updateRecipient(idx, {
                                                externalEmail: e.currentTarget.value,
                                            })
                                        }
                                        classNames={{ input: 'min-h-[44px]' }}
                                    />
                                    <Select
                                        label={
                                            idx === 0
                                                ? t('form.fields.recipientLanguage')
                                                : undefined
                                        }
                                        value={r.preferredLanguage ?? 'FR'}
                                        onChange={(v) =>
                                            updateRecipient(idx, {
                                                preferredLanguage: v ?? 'FR',
                                            })
                                        }
                                        data={PREFERRED_LANGUAGES}
                                        classNames={{ input: 'min-h-[44px]' }}
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() => removeRecipient(idx)}
                                        size="lg"
                                        title={t('form.fields.removeRecipient')}
                                    >
                                        <IconTrash size={14} />
                                    </ActionIcon>
                                </div>
                            ))}
                        </div>
                    )}
                </Paper>

                {/* ─── SECTION 9 — Pieces jointes (Dropzone simule, P2.1) ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(8)}`}
                >
                    <SectionHeader
                        icon={<IconPaperclip size={14} stroke={1.8} />}
                        title={t('form.section9')}
                    />
                    <Text size="xs" c="dimmed" className="mb-2">
                        {t('form.fields.attachmentsHint')}
                    </Text>
                    <Dropzone
                        onDrop={handleDropFiles}
                        onReject={() => {
                            // ignore les fichiers non supportes silencieusement
                        }}
                        maxSize={20 * 1024 * 1024}
                        accept={[
                            MIME_TYPES.pdf,
                            MIME_TYPES.docx,
                            MIME_TYPES.xlsx,
                            MIME_TYPES.png,
                            MIME_TYPES.jpeg,
                        ]}
                        disabled={locked}
                        radius="md"
                        className="bg-amber-50/40 border-dashed border-amber-200"
                    >
                        <Group justify="center" gap="md" mih={90}>
                            <Dropzone.Accept>
                                <IconUpload
                                    size={32}
                                    stroke={1.6}
                                    className="text-amber-600"
                                />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX
                                    size={32}
                                    stroke={1.6}
                                    className="text-red-500"
                                />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconUpload
                                    size={32}
                                    stroke={1.6}
                                    className="text-amber-500"
                                />
                            </Dropzone.Idle>
                            <div>
                                <Text size="sm" fw={500} className="text-slate-700">
                                    {t('form.fields.attachmentsDropzoneTitle')}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {t('form.fields.attachmentsDropzoneSubtitle')}
                                </Text>
                            </div>
                        </Group>
                    </Dropzone>

                    {attachmentsFiles.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5">
                            {attachmentsFiles.map((f, idx) => (
                                <div
                                    key={`${f.name}-${idx}`}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <IconFile
                                            size={14}
                                            stroke={1.8}
                                            className="text-slate-500 flex-shrink-0"
                                        />
                                        <span className="text-[12.5px] text-slate-800 truncate">
                                            {f.name}
                                        </span>
                                        <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                                            {formatFileSize(f.size)}
                                        </span>
                                    </div>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => removeAttachmentAt(idx)}
                                        title={t('form.fields.removeAttachment')}
                                        disabled={locked}
                                    >
                                        <IconTrash size={12} />
                                    </ActionIcon>
                                </div>
                            ))}
                        </div>
                    )}

                    <Textarea
                        label={t('form.fields.attachments')}
                        placeholder={t('form.fields.attachmentsHint')}
                        value={state.attachmentsNote}
                        onChange={(e) =>
                            setState((s) => ({
                                ...s,
                                attachmentsNote: e.currentTarget.value,
                            }))
                        }
                        autosize
                        minRows={2}
                        className="mt-3"
                    />
                </Paper>

                {/* ─── SECTION 10 — Notes ─── */}
                <Paper
                    p="lg"
                    radius="md"
                    withBorder
                    className={`mb-4 bg-white ${stepClass(9)}`}
                >
                    <SectionHeader
                        icon={<IconNote size={14} stroke={1.8} />}
                        title={t('form.section10')}
                    />
                    <Textarea
                        label={t('form.fields.notes')}
                        placeholder={t('form.fields.notesPlaceholder')}
                        value={state.notes}
                        onChange={(e) =>
                            setState((s) => ({ ...s, notes: e.currentTarget.value }))
                        }
                        autosize
                        minRows={3}
                    />
                </Paper>

                {/* ─── P2.1 — Navigation Stepper mobile (uniquement < md) ─── */}
                <div className="md:hidden flex items-center justify-between gap-2 mb-3">
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={<IconArrowLeft size={14} />}
                        disabled={mobileStep === 0}
                        onClick={() =>
                            setMobileStep((s) => Math.max(0, s - 1))
                        }
                    >
                        {t('form.actions.stepperPrev')}
                    </Button>
                    <Text size="xs" c="dimmed">
                        {mobileStep + 1}/{sectionTitles.length}
                    </Text>
                    <Button
                        variant="filled"
                        color="amber"
                        size="sm"
                        rightSection={<IconArrowRight size={14} />}
                        disabled={mobileStep === sectionTitles.length - 1}
                        onClick={() =>
                            setMobileStep((s) =>
                                Math.min(sectionTitles.length - 1, s + 1),
                            )
                        }
                    >
                        {t('form.actions.stepperNext')}
                    </Button>
                </div>

                {/* ─── Actions ─── */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6 py-3 mt-4 shadow-md">
                    <Group justify="flex-end" gap="sm">
                        <Button
                            variant="default"
                            onClick={() => navigate('/blast/registry')}
                        >
                            {t('common.cancel')}
                        </Button>
                        {locked ? (
                            <Button
                                color="amber"
                                leftSection={<IconLock size={14} />}
                                onClick={() => setShowLockedModal(true)}
                            >
                                {t('detail.actions.edit')}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="light"
                                    color="amber"
                                    leftSection={<IconDeviceFloppy size={14} />}
                                    loading={saving}
                                    onClick={handleSaveDraft}
                                >
                                    {isEdit
                                        ? t('form.actions.update')
                                        : t('form.actions.saveDraft')}
                                </Button>
                                <Button
                                    color="amber"
                                    leftSection={<IconCheck size={14} />}
                                    loading={saving}
                                    onClick={handleConfirm}
                                >
                                    {t('form.actions.confirm')}
                                </Button>
                            </>
                        )}
                    </Group>
                </div>
            </div>

            {/* ─── Modal confirmation tir ─── */}
            <Modal
                opened={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title={
                    <Text fw={600} size="md">
                        {t('form.confirmModal.title')}
                    </Text>
                }
                centered
                size="md"
            >
                <Text size="sm" className="text-slate-700 mb-4">
                    {t('form.confirmModal.body')}
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="default"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        {t('form.confirmModal.cancel')}
                    </Button>
                    <Button
                        color="amber"
                        loading={saving}
                        onClick={doConfirmAfterModal}
                    >
                        {t('form.confirmModal.validate')}
                    </Button>
                </Group>
            </Modal>

            {/* ─── Modal edition tir verrouille (raison obligatoire) ─── */}
            <Modal
                opened={showLockedModal}
                onClose={() => setShowLockedModal(false)}
                title={
                    <Text fw={600} size="md">
                        {t('form.lockedModal.title')}
                    </Text>
                }
                centered
                size="md"
            >
                <Text size="sm" className="text-slate-700 mb-3">
                    {t('form.lockedModal.body')}
                </Text>
                <Textarea
                    label={t('form.lockedModal.reasonLabel')}
                    placeholder={t('form.lockedModal.reasonPlaceholder')}
                    value={lockedReason}
                    onChange={(e) => setLockedReason(e.currentTarget.value)}
                    autosize
                    minRows={2}
                    error={errors.lockedReason}
                    className="mb-3"
                />
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="default"
                        onClick={() => {
                            setShowLockedModal(false);
                            setLockedReason('');
                            setErrors((e) => ({ ...e, lockedReason: '' }));
                        }}
                    >
                        {t('form.lockedModal.cancel')}
                    </Button>
                    <Button color="amber" loading={saving} onClick={doLockedUpdate}>
                        {t('form.lockedModal.validate')}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default BlastForm;
