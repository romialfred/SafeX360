/**
 * RegulatoryExportsPage — Phase 9-B Frontend (LOT Dosimetrie & Expositions).
 *
 * Page institutionnelle d'export reglementaire ASN / IRSN / Ministere.
 * Trois cards :
 *
 *   1. XML ASN annuel       — export complet conforme schema ASN
 *      (Autorite de Surete Nucleaire).
 *   2. CSV regulateur       — donnees nominales pour declaration annuelle.
 *   3. XML incidents annuel — tous les depassements (cases OPEN+INVESTIGATING+CLOSED).
 *
 * Route : /dosimetry/regulatory-exports.
 *
 * RBAC :
 *   - Visible uniquement si DOSIMETRY_PCR_RPO (sinon banner "Acces restreint").
 *   - Pas de modal RGPD individuelle (export institutionnel) MAIS un modal
 *     "Audit confirmation" avant chaque download : "Cet export va etre
 *     journalise. Continuer ?".
 *
 * Donnees :
 *   - Mine courante : selectedCompanyId du store Redux.
 *   - Year : selecteur (5 ans en arriere par defaut).
 *
 * Contrainte : tsc strict + vite EXIT 0.
 */

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select, Modal, Button, Group, Checkbox } from '@mantine/core';
import {
    IconFileText,
    IconFileSpreadsheet,
    IconAlertOctagon,
    IconChevronRight,
    IconShieldLock,
    IconLockAccess,
    IconArchive,
    IconDownload,
    IconInfoCircle,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    successNotification,
    errorNotification,
} from '../../utility/NotificationUtility';
import {
    downloadAnnualXmlAsn,
    downloadAnnualCsvRegulator,
    downloadIncidentsXml,
    triggerBrowserDownload,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — meme pattern que les autres pages Dosimetrie
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(
            ...user.authorities.map((a: any) => a?.authority ?? a),
        );
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

type ExportKind = 'xml-asn' | 'csv-regulator' | 'xml-incidents';

interface ExportSpec {
    kind: ExportKind;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: 'sky' | 'amber' | 'red';
    filename: string;
    fetcher: () => Promise<Blob>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

function buildYearOptions(): { value: string; label: string }[] {
    const years: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push({ value: String(y), label: String(y) });
    }
    return years;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const RegulatoryExportsPage = () => {
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

    const canAccess = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');

    // ─── State ───
    const yearOptions = useMemo(() => buildYearOptions(), []);
    const [year, setYear] = useState<string>(String(currentYear));
    const [confirmModal, setConfirmModal] = useState<ExportKind | null>(null);
    const [auditAcknowledged, setAuditAcknowledged] = useState<boolean>(false);
    const [downloading, setDownloading] = useState<boolean>(false);

    // ─── Specs des trois exports ───
    const specs: Record<ExportKind, ExportSpec> = useMemo(
        () => ({
            'xml-asn': {
                kind: 'xml-asn',
                title: t('regulatoryExports.cards.xmlAsn.title'),
                subtitle: t('regulatoryExports.cards.xmlAsn.subtitle'),
                icon: (
                    <IconFileText
                        size={24}
                        stroke={1.8}
                        className="text-sky-700"
                    />
                ),
                accent: 'sky',
                filename: `asn_annuel_mine${mineId}_${year}.xml`,
                fetcher: () => downloadAnnualXmlAsn(mineId, Number(year)),
            },
            'csv-regulator': {
                kind: 'csv-regulator',
                title: t('regulatoryExports.cards.csvRegulator.title'),
                subtitle: t('regulatoryExports.cards.csvRegulator.subtitle'),
                icon: (
                    <IconFileSpreadsheet
                        size={24}
                        stroke={1.8}
                        className="text-amber-700"
                    />
                ),
                accent: 'amber',
                filename: `regulateur_annuel_mine${mineId}_${year}.csv`,
                fetcher: () => downloadAnnualCsvRegulator(mineId, Number(year)),
            },
            'xml-incidents': {
                kind: 'xml-incidents',
                title: t('regulatoryExports.cards.xmlIncidents.title'),
                subtitle: t('regulatoryExports.cards.xmlIncidents.subtitle'),
                icon: (
                    <IconAlertOctagon
                        size={24}
                        stroke={1.8}
                        className="text-red-700"
                    />
                ),
                accent: 'red',
                filename: `incidents_annuel_mine${mineId}_${year}.xml`,
                fetcher: () => downloadIncidentsXml(mineId, Number(year)),
            },
        }),
        [mineId, year, t],
    );

    // ─── Handlers ───
    const openConfirm = (kind: ExportKind) => {
        setConfirmModal(kind);
        setAuditAcknowledged(false);
    };

    const closeConfirm = () => {
        if (downloading) return;
        setConfirmModal(null);
        setAuditAcknowledged(false);
    };

    const handleConfirmDownload = useCallback(async () => {
        if (!confirmModal) return;
        const spec = specs[confirmModal];
        setDownloading(true);
        try {
            const blob = await spec.fetcher();
            triggerBrowserDownload(blob, spec.filename);
            successNotification(
                t('regulatoryExports.successToast', { filename: spec.filename }),
            );
            setConfirmModal(null);
            setAuditAcknowledged(false);
        } catch (err: any) {
            const status = err?.response?.status;
            let message = t('regulatoryExports.errorGeneric');
            if (status === 403) message = t('regulatoryExports.errorForbidden');
            else if (status === 404) message = t('regulatoryExports.errorNotFound');
            errorNotification(message);
        } finally {
            setDownloading(false);
        }
    }, [confirmModal, specs, t]);

    // ─── Render : Acces restreint ───
    if (!canAccess) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconLockAccess
                        size={36}
                        stroke={1.8}
                        className="mx-auto text-slate-400 mb-3"
                    />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('regulatoryExports.deniedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px] mb-4">
                        {t('regulatoryExports.deniedBody')}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        {t('regulatoryExports.backHome')}
                    </button>
                </div>
            </div>
        );
    }

    const activeSpec = confirmModal ? specs[confirmModal] : null;

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
                        {t('regulatoryExports.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('regulatoryExports.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md shadow-sky-200 flex-shrink-0">
                                    <IconArchive
                                        size={26}
                                        stroke={1.8}
                                        className="text-white"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10.5px] uppercase tracking-[0.16em] text-sky-700 font-semibold mb-0.5">
                                        {t('regulatoryExports.heroLabel')}
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
                                        {t('regulatoryExports.title')}
                                    </h1>
                                    <p className="text-[12.5px] text-slate-600 mt-1 max-w-2xl">
                                        {t('regulatoryExports.subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 py-2 bg-sky-50/60 border-t border-sky-100 text-[11.5px] text-sky-900 flex items-center gap-2">
                        <IconShieldLock size={12} stroke={1.8} />
                        <span>{t('regulatoryExports.auditBanner')}</span>
                    </div>
                </div>

                {/* ─── Bandeau filtres (mineId + year) ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
                    <div className="flex items-end gap-3 flex-wrap">
                        <div className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-[12px] text-slate-700 min-w-[120px]">
                            <span className="block text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-0.5">
                                {t('regulatoryExports.fields.mineLabel')}
                            </span>
                            <span className="font-semibold text-slate-900">
                                #{mineId}
                            </span>
                        </div>
                        <div className="min-w-[180px]">
                            <Select
                                label={t('regulatoryExports.fields.yearLabel')}
                                data={yearOptions}
                                value={year}
                                onChange={(v) =>
                                    setYear(v ?? String(currentYear))
                                }
                                size="sm"
                                allowDeselect={false}
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 ml-auto max-w-md">
                            {t('regulatoryExports.filtersHint')}
                        </p>
                    </div>
                </div>

                {/* ─── Cards 3 exports ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(
                        ['xml-asn', 'csv-regulator', 'xml-incidents'] as ExportKind[]
                    ).map((kind) => {
                        const spec = specs[kind];
                        return (
                            <ExportCard
                                key={kind}
                                spec={spec}
                                onClick={() => openConfirm(kind)}
                                t={t}
                            />
                        );
                    })}
                </div>

                {/* ─── Footer ─── */}
                <div className="mt-5 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                            <IconShieldLock
                                size={16}
                                stroke={1.8}
                                className="text-sky-700"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-slate-800">
                                {t('regulatoryExports.footerTitle')}
                            </p>
                            <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                                {t('regulatoryExports.footerBody')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Modal audit confirmation ─── */}
            <Modal
                opened={confirmModal !== null}
                onClose={closeConfirm}
                centered
                size="md"
                withCloseButton={!downloading}
                closeOnClickOutside={!downloading}
                closeOnEscape={!downloading}
                title={
                    <span
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                        }}
                        className="text-slate-900 inline-flex items-center gap-2"
                    >
                        <IconShieldLock
                            size={16}
                            className="text-sky-700"
                        />
                        {t('regulatoryExports.confirmModal.title')}
                    </span>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[12px]">
                        <IconInfoCircle
                            size={14}
                            stroke={1.8}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{t('regulatoryExports.confirmModal.body')}</span>
                    </div>

                    {activeSpec && (
                        <div className="px-3 py-3 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-1">
                                {t('regulatoryExports.confirmModal.exportLabel')}
                            </p>
                            <p className="text-[13px] font-semibold text-slate-900">
                                {activeSpec.title}
                            </p>
                            <p className="text-[11.5px] text-slate-600 mt-0.5">
                                {activeSpec.subtitle}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-2 font-mono">
                                {activeSpec.filename}
                            </p>
                        </div>
                    )}

                    <Checkbox
                        checked={auditAcknowledged}
                        onChange={(e) =>
                            setAuditAcknowledged(e.currentTarget.checked)
                        }
                        disabled={downloading}
                        label={
                            <span className="text-[12.5px] text-slate-800">
                                {t('regulatoryExports.confirmModal.acknowledge')}
                            </span>
                        }
                    />

                    <Group justify="flex-end" gap="sm" mt="md">
                        <Button
                            variant="default"
                            size="xs"
                            onClick={closeConfirm}
                            disabled={downloading}
                        >
                            {t('regulatoryExports.confirmModal.cancel')}
                        </Button>
                        <Button
                            size="xs"
                            color="sky"
                            loading={downloading}
                            disabled={!auditAcknowledged || downloading}
                            onClick={handleConfirmDownload}
                            leftSection={<IconDownload size={13} />}
                        >
                            {t('regulatoryExports.confirmModal.submit')}
                        </Button>
                    </Group>
                </div>
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Export card
// ─────────────────────────────────────────────────────────────────────────────

interface ExportCardProps {
    spec: ExportSpec;
    onClick: () => void;
    t: (k: string) => string;
}

const ACCENT_BG: Record<ExportSpec['accent'], string> = {
    sky: 'bg-gradient-to-br from-sky-100 to-sky-50',
    amber: 'bg-gradient-to-br from-amber-100 to-amber-50',
    red: 'bg-gradient-to-br from-red-100 to-red-50',
};

const ACCENT_BORDER: Record<ExportSpec['accent'], string> = {
    sky: 'border-sky-200',
    amber: 'border-amber-200',
    red: 'border-red-200',
};

const ACCENT_BTN: Record<ExportSpec['accent'], string> = {
    sky: 'bg-sky-600 hover:bg-sky-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    red: 'bg-red-600 hover:bg-red-700',
};

function ExportCard({ spec, onClick, t }: ExportCardProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition flex flex-col">
            <div className="p-4 flex items-start gap-3 border-b border-slate-100">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${ACCENT_BG[spec.accent]} ${ACCENT_BORDER[spec.accent]}`}
                >
                    {spec.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-slate-900 leading-tight"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {spec.title}
                    </h3>
                    <p className="text-[11.5px] text-slate-600 mt-0.5">
                        {spec.subtitle}
                    </p>
                </div>
            </div>
            <div className="p-4 mt-auto">
                <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-400 font-semibold mb-2">
                    {t('regulatoryExports.fileLabel')}
                </p>
                <p className="text-[11px] text-slate-700 font-mono mb-3 break-all">
                    {spec.filename}
                </p>
                <button
                    type="button"
                    onClick={onClick}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md text-white shadow-sm transition ${ACCENT_BTN[spec.accent]}`}
                >
                    <IconDownload size={13} stroke={2} />
                    {t('regulatoryExports.generateCta')}
                </button>
            </div>
        </div>
    );
}

export default RegulatoryExportsPage;
