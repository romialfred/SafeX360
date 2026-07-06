/**
 * DosimetryReportsPage — Phase 9-B Frontend (LOT Dosimetrie & Expositions).
 *
 * Page premium d'acces aux rapports & attestations dosimetrie. Quatre cards :
 *
 *   1. Attestation individuelle de dose — PDF nominatif workerId + annee
 *      (header X-Reason obligatoire — modal RGPD).
 *   2. Fiche carriere — historique doses + aptitudes + visites
 *      (RBAC strict : DOSIMETRY_MEDICAL ou SELF, modal RGPD).
 *   3. Registre annuel mine — PDF A4 paysage agrege (pas de motif individuel).
 *   4. Rapport surexposition — cas EXCEEDED detaille (modal RGPD).
 *
 * Route : /dosimetry/reports.
 *
 * Pattern UX :
 *  - Hero serif premium (titre + sous-titre + breadcrumb).
 *  - Grid 2x2 de cards "rapport" : icone gradient + titre + sub + selecteurs +
 *    bouton "Generer".
 *  - Avant chaque download nominatif, ouverture d'un PdfDownloadModal qui
 *    capture le motif RGPD + checkbox legitimite.
 *  - Le registre annuel agrege n'ouvre pas de modal (download direct).
 *
 * Donnees :
 *  - Liste des workers : POST /exposed-worker/search (mineId courant).
 *  - Liste des cases   : GET /overexposure-case/getAll (companyId courant).
 *  - Mine courante     : selectedCompanyId du store Redux.
 *
 * Contrainte : tsc strict + vite EXIT 0.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select } from '@mantine/core';
import {
    IconFileCertificate,
    IconHistory,
    IconClipboardList,
    IconAlertOctagon,
    IconChevronRight,
    IconShieldLock,
    IconRefresh,
    IconReportAnalytics,
    IconDownload,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    successNotification,
    errorNotification,
    extractErrorMessage,
} from '../../utility/NotificationUtility';
import {
    searchWorkers,
    getOverexposureCases,
    downloadIndividualAttestation,
    downloadCareerSummary,
    downloadAnnualRegister,
    downloadOverexposureReport,
    triggerBrowserDownload,
    type OverexposureCaseDTO,
} from '../../services/DosimetryService';
import PdfDownloadModal from './PdfDownloadModal';

// ─────────────────────────────────────────────────────────────────────────────
//  Types locaux
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

type ModalKind = 'attestation' | 'career' | 'overexposure' | null;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

/** Construit la liste des annees pour les selecteurs (5 ans en arriere). */
function buildYearOptions(): { value: string; label: string }[] {
    const years: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push({ value: String(y), label: String(y) });
    }
    return years;
}

/** Slug ASCII safe d'un identifiant pour les noms de fichiers. */
function slugForFilename(s: string): string {
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimetryReportsPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const mineId: number = useMemo(() => {
        const candidate = selectedMineId ?? user?.mineId ?? user?.companyId ?? null;
        const n = Number(candidate);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }, [selectedMineId, user]);

    // ─── State data sources ───
    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [cases, setCases] = useState<OverexposureCaseDTO[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);

    // ─── State form selections ───
    const yearOptions = useMemo(() => buildYearOptions(), []);
    const [attestationWorkerId, setAttestationWorkerId] = useState<string | null>(null);
    const [attestationYear, setAttestationYear] = useState<string>(String(currentYear));
    const [careerWorkerId, setCareerWorkerId] = useState<string | null>(null);
    const [registerYear, setRegisterYear] = useState<string>(String(currentYear));
    const [registerLoading, setRegisterLoading] = useState<boolean>(false);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    // ─── State modale active ───
    const [activeModal, setActiveModal] = useState<ModalKind>(null);

    // ─── Fetch initial : workers + cases ───
    const fetchData = useCallback(async () => {
        setLoadingData(true);
        try {
            const [workersRes, casesRes] = await Promise.allSettled([
                searchWorkers({ mineId }),
                getOverexposureCases(),
            ]);
            if (workersRes.status === 'fulfilled') {
                const list: any = workersRes.value;
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                setWorkers(
                    arr
                        .map((w: any) => ({
                            id: Number(w.id ?? w.workerId ?? 0),
                            matricule: String(
                                w.matricule ?? `#${w.employeeId ?? ''}`,
                            ),
                            fullName: String(
                                w.fullName ?? `Employee #${w.employeeId ?? ''}`,
                            ),
                        }))
                        .filter((w) => w.id > 0),
                );
            }
            if (casesRes.status === 'fulfilled') {
                setCases(casesRes.value as OverexposureCaseDTO[]);
            }
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('reports.loadError')));
        } finally {
            setLoadingData(false);
        }
    }, [mineId, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── Lookup helpers ───
    const findWorker = useCallback(
        (id: string | null): WorkerLite | null => {
            if (!id) return null;
            const n = Number(id);
            return workers.find((w) => w.id === n) ?? null;
        },
        [workers],
    );

    // ─── Filenames computed (mis a jour avec selections) ───
    const attestationFilename = useMemo(() => {
        const w = findWorker(attestationWorkerId);
        const matricule = w ? slugForFilename(w.matricule) : 'worker';
        return `attestation_${matricule}_${attestationYear}.pdf`;
    }, [attestationWorkerId, attestationYear, findWorker]);

    const careerFilename = useMemo(() => {
        const w = findWorker(careerWorkerId);
        const matricule = w ? slugForFilename(w.matricule) : 'worker';
        return `fiche_carriere_${matricule}.pdf`;
    }, [careerWorkerId, findWorker]);

    const registerFilename = useMemo(
        () => `registre_annuel_mine${mineId}_${registerYear}.pdf`,
        [mineId, registerYear],
    );

    const overexposureFilename = useMemo(() => {
        const id = selectedCaseId ?? 'case';
        return `surexposition_${slugForFilename(id)}.pdf`;
    }, [selectedCaseId]);

    // ─── Handlers de download ───
    const handleAttestationConfirm = useCallback(
        (reason: string): Promise<Blob> => {
            const wid = Number(attestationWorkerId);
            const year = Number(attestationYear);
            return downloadIndividualAttestation(wid, year, reason);
        },
        [attestationWorkerId, attestationYear],
    );

    const handleCareerConfirm = useCallback(
        (reason: string): Promise<Blob> => {
            const wid = Number(careerWorkerId);
            return downloadCareerSummary(wid, reason);
        },
        [careerWorkerId],
    );

    const handleOverexposureConfirm = useCallback(
        (reason: string): Promise<Blob> => {
            const cid = Number(selectedCaseId);
            return downloadOverexposureReport(cid, reason);
        },
        [selectedCaseId],
    );

    // Le registre annuel ne demande PAS de motif RGPD (donnees agregees).
    const handleRegisterDirect = useCallback(async () => {
        if (!registerYear) return;
        setRegisterLoading(true);
        try {
            const blob = await downloadAnnualRegister(mineId, Number(registerYear));
            triggerBrowserDownload(blob, registerFilename);
            successNotification(
                t('reports.modal.successToast', { filename: registerFilename }),
            );
        } catch (err: any) {
            const status = err?.response?.status;
            let message = t('reports.modal.errorGeneric');
            if (status === 403) message = t('reports.modal.errorForbidden');
            else if (status === 404) message = t('reports.modal.errorNotFound');
            errorNotification(message);
        } finally {
            setRegisterLoading(false);
        }
    }, [mineId, registerYear, registerFilename, t]);

    // ─── Mantine Select data builders ───
    const workersSelectData = useMemo(
        () =>
            workers.map((w) => ({
                value: String(w.id),
                label: `${w.matricule} — ${w.fullName}`,
            })),
        [workers],
    );

    const casesSelectData = useMemo(
        () =>
            cases.map((c) => ({
                value: String(c.id ?? ''),
                label: t('reports.cases.optionLabel', {
                    id: c.id,
                    level: c.level,
                    status: c.status,
                }),
            })),
        [cases, t],
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('reports.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('reports.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                    <IconReportAnalytics
                                        size={26}
                                        stroke={1.8}
                                        className="text-white"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10.5px] uppercase tracking-[0.16em] text-indigo-600 font-semibold mb-0.5">
                                        {t('reports.heroLabel')}
                                    </p>
                                    <h1
                                        className="text-slate-900 leading-tight"
                                        style={{
                                            fontFamily:
                                                "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(22px, 2.4vw, 28px)',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {t('reports.title')}
                                    </h1>
                                    <p className="text-[12.5px] text-slate-600 mt-1 max-w-2xl">
                                        {t('reports.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fetchData}
                                disabled={loadingData}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start disabled:opacity-50"
                                aria-label={t('reports.refresh')}
                            >
                                <IconRefresh size={13} stroke={1.8} />
                            </button>
                        </div>
                    </div>
                    {/* RGPD banner */}
                    <div className="px-5 py-2 bg-indigo-50/60 border-t border-indigo-100 text-[11.5px] text-indigo-900 flex items-center gap-2">
                        <IconShieldLock size={12} stroke={1.8} />
                        <span>{t('reports.rgpdBanner')}</span>
                    </div>
                </div>

                {/* ─── Grid 2x2 ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. Attestation individuelle de dose */}
                    <ReportCard
                        accent="indigo"
                        icon={
                            <IconFileCertificate
                                size={24}
                                stroke={1.8}
                                className="text-indigo-700"
                            />
                        }
                        title={t('reports.cards.attestation.title')}
                        subtitle={t('reports.cards.attestation.subtitle')}
                        rbacHint={t('reports.cards.attestation.rbacHint')}
                    >
                        <Select
                            label={t('reports.fields.workerLabel')}
                            placeholder={t('reports.fields.workerPlaceholder')}
                            data={workersSelectData}
                            value={attestationWorkerId}
                            onChange={setAttestationWorkerId}
                            searchable
                            disabled={loadingData}
                            nothingFoundMessage={t('reports.fields.workerEmpty')}
                            size="sm"
                            mb="xs"
                        />
                        <Select
                            label={t('reports.fields.yearLabel')}
                            data={yearOptions}
                            value={attestationYear}
                            onChange={(v) =>
                                setAttestationYear(v ?? String(currentYear))
                            }
                            size="sm"
                            mb="sm"
                            allowDeselect={false}
                        />
                        <PrimaryButton
                            disabled={!attestationWorkerId || !attestationYear}
                            onClick={() => setActiveModal('attestation')}
                            label={t('reports.cards.attestation.cta')}
                            tone="indigo"
                        />
                    </ReportCard>

                    {/* 2. Fiche carriere */}
                    <ReportCard
                        accent="violet"
                        icon={
                            <IconHistory
                                size={24}
                                stroke={1.8}
                                className="text-violet-700"
                            />
                        }
                        title={t('reports.cards.career.title')}
                        subtitle={t('reports.cards.career.subtitle')}
                        rbacHint={t('reports.cards.career.rbacHint')}
                    >
                        <Select
                            label={t('reports.fields.workerLabel')}
                            placeholder={t('reports.fields.workerPlaceholder')}
                            data={workersSelectData}
                            value={careerWorkerId}
                            onChange={setCareerWorkerId}
                            searchable
                            disabled={loadingData}
                            nothingFoundMessage={t('reports.fields.workerEmpty')}
                            size="sm"
                            mb="sm"
                        />
                        <PrimaryButton
                            disabled={!careerWorkerId}
                            onClick={() => setActiveModal('career')}
                            label={t('reports.cards.career.cta')}
                            tone="violet"
                        />
                    </ReportCard>

                    {/* 3. Registre annuel mine */}
                    <ReportCard
                        accent="emerald"
                        icon={
                            <IconClipboardList
                                size={24}
                                stroke={1.8}
                                className="text-emerald-700"
                            />
                        }
                        title={t('reports.cards.register.title')}
                        subtitle={t('reports.cards.register.subtitle')}
                        rbacHint={t('reports.cards.register.rbacHint')}
                    >
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-[12px] text-slate-700">
                                <span className="block text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-0.5">
                                    {t('reports.fields.mineLabel')}
                                </span>
                                <span className="font-semibold text-slate-900">
                                    #{mineId}
                                </span>
                            </div>
                            <Select
                                label={t('reports.fields.yearLabel')}
                                data={yearOptions}
                                value={registerYear}
                                onChange={(v) =>
                                    setRegisterYear(v ?? String(currentYear))
                                }
                                size="sm"
                                allowDeselect={false}
                            />
                        </div>
                        <PrimaryButton
                            disabled={!registerYear || registerLoading}
                            onClick={handleRegisterDirect}
                            label={
                                registerLoading
                                    ? t('reports.cards.register.ctaLoading')
                                    : t('reports.cards.register.cta')
                            }
                            tone="emerald"
                        />
                    </ReportCard>

                    {/* 4. Rapport surexposition */}
                    <ReportCard
                        accent="red"
                        icon={
                            <IconAlertOctagon
                                size={24}
                                stroke={1.8}
                                className="text-red-700"
                            />
                        }
                        title={t('reports.cards.overexposure.title')}
                        subtitle={t('reports.cards.overexposure.subtitle')}
                        rbacHint={t('reports.cards.overexposure.rbacHint')}
                    >
                        <Select
                            label={t('reports.fields.caseLabel')}
                            placeholder={t('reports.fields.casePlaceholder')}
                            data={casesSelectData}
                            value={selectedCaseId}
                            onChange={setSelectedCaseId}
                            searchable
                            disabled={loadingData}
                            nothingFoundMessage={t('reports.fields.caseEmpty')}
                            size="sm"
                            mb="sm"
                        />
                        <PrimaryButton
                            disabled={!selectedCaseId}
                            onClick={() => setActiveModal('overexposure')}
                            label={t('reports.cards.overexposure.cta')}
                            tone="red"
                        />
                    </ReportCard>
                </div>

                {/* ─── Footer RGPD ─── */}
                <div className="mt-5 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <IconShieldLock
                                size={16}
                                stroke={1.8}
                                className="text-indigo-700"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-slate-800">
                                {t('reports.footerTitle')}
                            </p>
                            <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                                {t('reports.footerBody')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Modale RGPD reusable ─── */}
            <PdfDownloadModal
                opened={activeModal === 'attestation'}
                onClose={() => setActiveModal(null)}
                title={t('reports.cards.attestation.modalTitle')}
                subtitle={t('reports.cards.attestation.modalSubtitle')}
                filename={attestationFilename}
                onConfirm={handleAttestationConfirm}
            />
            <PdfDownloadModal
                opened={activeModal === 'career'}
                onClose={() => setActiveModal(null)}
                title={t('reports.cards.career.modalTitle')}
                subtitle={t('reports.cards.career.modalSubtitle')}
                filename={careerFilename}
                onConfirm={handleCareerConfirm}
            />
            <PdfDownloadModal
                opened={activeModal === 'overexposure'}
                onClose={() => setActiveModal(null)}
                title={t('reports.cards.overexposure.modalTitle')}
                subtitle={t('reports.cards.overexposure.modalSubtitle')}
                filename={overexposureFilename}
                onConfirm={handleOverexposureConfirm}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Card rapport (icone gradient + titre + sub + zone form)
// ─────────────────────────────────────────────────────────────────────────────

interface ReportCardProps {
    accent: 'indigo' | 'violet' | 'emerald' | 'red';
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    rbacHint?: string;
    children: React.ReactNode;
}

const ACCENT_BG: Record<ReportCardProps['accent'], string> = {
    indigo: 'bg-gradient-to-br from-indigo-100 to-indigo-50',
    violet: 'bg-gradient-to-br from-violet-100 to-violet-50',
    emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
    red: 'bg-gradient-to-br from-red-100 to-red-50',
};

const ACCENT_BORDER: Record<ReportCardProps['accent'], string> = {
    indigo: 'border-indigo-200',
    violet: 'border-violet-200',
    emerald: 'border-emerald-200',
    red: 'border-red-200',
};

function ReportCard({
    accent,
    icon,
    title,
    subtitle,
    rbacHint,
    children,
}: ReportCardProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
            <div className="p-4 flex items-start gap-3 border-b border-slate-100">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${ACCENT_BG[accent]} ${ACCENT_BORDER[accent]}`}
                >
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-slate-900 leading-tight"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '16px',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {title}
                    </h3>
                    <p className="text-[12px] text-slate-600 mt-0.5">{subtitle}</p>
                    {rbacHint && (
                        <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-400 font-semibold mt-1.5">
                            {rbacHint}
                        </p>
                    )}
                </div>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Primary button
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryButtonProps {
    tone: 'indigo' | 'violet' | 'emerald' | 'red';
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

const TONE_BG: Record<PrimaryButtonProps['tone'], string> = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    violet: 'bg-violet-600 hover:bg-violet-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    red: 'bg-red-600 hover:bg-red-700',
};

function PrimaryButton({ tone, label, onClick, disabled }: PrimaryButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${TONE_BG[tone]}`}
        >
            <IconDownload size={13} stroke={2} />
            {label}
        </button>
    );
}

export default DosimetryReportsPage;
