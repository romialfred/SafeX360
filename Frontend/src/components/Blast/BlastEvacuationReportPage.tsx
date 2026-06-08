/**
 * BlastEvacuationReportPage — Phase 6 du Module Blast Management.
 *
 * Page de consultation et finalisation d'un rapport d'evacuation cloturant
 * un tir confirme (statut ALL_CLEAR). Affiche en sections deroulees :
 *   - Bloc Tir (reference, zone, heure prevue / tir / site degage)
 *   - Bloc Alerte (heure de declenchement de l'alarme)
 *   - Bloc Evacuation (mustered / missing / delai d'evacuation)
 *   - Bloc Incidents (liste append-only avec horodatages)
 *   - Bloc Signature (signataire + date apres signature, ou bouton signer)
 *
 * Actions :
 *   - "Ajouter incident" (BLAST_REPORT, avant signature)
 *   - "Signer le rapport" (BLAST_REPORT, avant signature)
 *   - "Telecharger PDF (FR)" et "PDF (EN)" (BLAST_VIEW, toujours)
 *
 * Apres signature : toute la page passe en read-only ; seul le bouton PDF
 * reste actionnable, conformement a la regle append-only (V018 + service).
 *
 * Route : /blast/evacuation-report/:blastId
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Group,
    Button,
    Loader,
    Modal,
    Textarea,
    Text,
    Badge,
    Alert,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconFileText,
    IconShieldCheck,
    IconAlertTriangle,
    IconCirclePlus,
    IconDownload,
    IconLock,
    IconClock,
    IconUsers,
    IconAlertOctagon,
} from '@tabler/icons-react';
import BlastEvacuationReportService, {
    type BlastEvacuationReportDTO,
} from '../../services/BlastEvacuationReportService';
import { useAppSelector } from '../../slices/hooks';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (
    iso: string | null | undefined,
    lang: string,
): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(d);
    } catch {
        return iso;
    }
};

/** Convertit une duree en secondes en libelle humain "Xmin Ys". */
const humanDuration = (seconds: number | null | undefined): string => {
    if (seconds == null || seconds <= 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}min`);
    parts.push(`${s}s`);
    return parts.join(' ');
};

/**
 * Parse le champ {@code incidents} brut en lignes filtrees : retire la
 * signature graphique (marqueur [SIG_DATA_URL]) et les lignes vides.
 */
const parseIncidents = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    return raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('[SIG_DATA_URL]:'));
};

/**
 * Check RBAC inline (meme convention que BlastDetailPage : extraction des
 * permissions depuis le store user en couvrant les variantes connues).
 */
function hasBlastPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

/** Declenche le telechargement d'un Blob avec le nom de fichier voulu. */
const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const BlastEvacuationReportPage = () => {
    const { t, i18n } = useTranslation('blast');
    const navigate = useNavigate();
    const { blastId } = useParams<{ blastId: string }>();
    const user = useAppSelector((state: any) => state.user);
    const canSign = hasBlastPermission(user, 'BLAST_REPORT');

    const [report, setReport] = useState<BlastEvacuationReportDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Modales
    const [incidentModalOpen, setIncidentModalOpen] = useState(false);
    const [incidentText, setIncidentText] = useState('');
    const [signModalOpen, setSignModalOpen] = useState(false);

    // ── Load ──
    const refresh = async () => {
        if (!blastId) return;
        setLoading(true);
        setLoadError(null);
        try {
            const dto = await BlastEvacuationReportService.getByBlastId(blastId);
            if (!dto) {
                setLoadError(t('evacReport.errors.notFound') as string);
                setReport(null);
            } else {
                setReport(dto);
            }
        } catch (err: any) {
            setLoadError(err?.message ?? (t('evacReport.errors.loadFailed') as string));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blastId]);

    // ── Handlers ──
    const handleAddIncident = async () => {
        if (!report || !incidentText.trim()) {
            setActionError(t('evacReport.errors.descriptionRequired') as string);
            return;
        }
        setActionLoading(true);
        setActionError(null);
        try {
            const updated = await BlastEvacuationReportService.addIncident(
                report.id,
                incidentText.trim(),
            );
            setReport(updated);
            setIncidentText('');
            setIncidentModalOpen(false);
        } catch (err: any) {
            setActionError(
                err?.response?.data ?? (t('evacReport.errors.actionFailed') as string),
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleSign = async () => {
        if (!report) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const updated = await BlastEvacuationReportService.sign(report.id);
            setReport(updated);
            setSignModalOpen(false);
        } catch (err: any) {
            setActionError(
                err?.response?.data ?? (t('evacReport.errors.actionFailed') as string),
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPdf = async (lang: 'fr' | 'en') => {
        if (!report) return;
        setActionError(null);
        try {
            const blob = await BlastEvacuationReportService.downloadPdf(report.id, lang);
            downloadBlob(blob, `evacuation-report-${report.id}-${lang}.pdf`);
        } catch (err: any) {
            setActionError(
                err?.response?.data ?? (t('evacReport.errors.downloadFailed') as string),
            );
        }
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader size="md" color="orange" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-6">
                <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
                    {loadError}
                </Alert>
                <Button
                    variant="default"
                    leftSection={<IconArrowLeft size={14} />}
                    onClick={() => navigate(-1)}
                    className="mt-4"
                >
                    {t('evacReport.back')}
                </Button>
            </div>
        );
    }

    if (!report) return null;
    const incidents = parseIncidents(report.incidents);
    const lang = i18n.language;
    const isSigned = report.signed;

    return (
        <div className="p-4 md:p-6 space-y-4 bg-[#FAF8F3] min-h-screen">
            {/* Header */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Group justify="space-between" align="center">
                    <div>
                        <Group gap={8} align="center">
                            <IconFileText size={22} className="text-slate-700" />
                            <Text fw={700} size="lg">
                                {t('evacReport.title')}
                            </Text>
                            {isSigned ? (
                                <Badge color="green" leftSection={<IconShieldCheck size={12} />}>
                                    {t('evacReport.badges.signed')}
                                </Badge>
                            ) : (
                                <Badge color="orange" leftSection={<IconAlertOctagon size={12} />}>
                                    {t('evacReport.badges.pending')}
                                </Badge>
                            )}
                        </Group>
                        <Text size="sm" c="dimmed" mt={4}>
                            {t('evacReport.subtitle', {
                                reference: report.blastReference ?? '—',
                            })}
                        </Text>
                    </div>
                    <Group gap={8}>
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={14} />}
                            onClick={() =>
                                navigate(`/blast/detail/${report.blastId}`)
                            }
                        >
                            {t('evacReport.back')}
                        </Button>
                    </Group>
                </Group>
            </Paper>

            {actionError && (
                <Alert color="red" icon={<IconAlertTriangle size={18} />}>
                    {actionError}
                </Alert>
            )}

            {/* Action bar */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Group gap={8}>
                    {!isSigned && canSign && (
                        <Button
                            color="blue"
                            leftSection={<IconCirclePlus size={14} />}
                            onClick={() => setIncidentModalOpen(true)}
                            disabled={actionLoading}
                        >
                            {t('evacReport.actions.addIncident')}
                        </Button>
                    )}
                    {!isSigned && canSign && (
                        <Button
                            color="green"
                            leftSection={<IconShieldCheck size={14} />}
                            onClick={() => setSignModalOpen(true)}
                            disabled={actionLoading}
                        >
                            {t('evacReport.actions.sign')}
                        </Button>
                    )}
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={14} />}
                        onClick={() => handleDownloadPdf('fr')}
                    >
                        {t('evacReport.actions.downloadPdfFr')}
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={14} />}
                        onClick={() => handleDownloadPdf('en')}
                    >
                        {t('evacReport.actions.downloadPdfEn')}
                    </Button>
                    {isSigned && (
                        <Badge
                            color="gray"
                            leftSection={<IconLock size={12} />}
                            className="ml-auto"
                        >
                            {t('evacReport.readOnly')}
                        </Badge>
                    )}
                </Group>
            </Paper>

            {/* Bloc Tir */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Text fw={600} size="md" className="mb-3">
                    {t('evacReport.sections.blast')}
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <DetailRow
                        label={t('evacReport.fields.reference') as string}
                        value={report.blastReference ?? '—'}
                    />
                    <DetailRow
                        label={t('evacReport.fields.zone') as string}
                        value={report.alarmZoneScope ?? '—'}
                    />
                    <DetailRow
                        label={t('evacReport.fields.scheduledAt') as string}
                        value={formatDateTime(report.blastScheduledAt, lang)}
                    />
                    <DetailRow
                        label={t('evacReport.fields.firedAt') as string}
                        value={formatDateTime(report.firedAt, lang)}
                    />
                    <DetailRow
                        label={t('evacReport.fields.allClearAt') as string}
                        value={formatDateTime(report.allClearAt, lang)}
                    />
                    <DetailRow
                        label={t('evacReport.fields.assemblyPoints') as string}
                        value={report.assemblyPoints ?? '—'}
                    />
                </div>
            </Paper>

            {/* Bloc Alerte */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Group gap={6} align="center" className="mb-3">
                    <IconClock size={18} className="text-amber-600" />
                    <Text fw={600} size="md">
                        {t('evacReport.sections.alert')}
                    </Text>
                </Group>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <DetailRow
                        label={t('evacReport.fields.alarmTriggeredAt') as string}
                        value={formatDateTime(report.alarmTriggeredAt, lang)}
                    />
                </div>
                <Text size="xs" c="dimmed" className="mt-2">
                    {t('evacReport.alertMessage')}
                </Text>
            </Paper>

            {/* Bloc Evacuation */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Group gap={6} align="center" className="mb-3">
                    <IconUsers size={18} className="text-blue-600" />
                    <Text fw={600} size="md">
                        {t('evacReport.sections.headcount')}
                    </Text>
                </Group>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <DetailRow
                        label={t('evacReport.fields.mustered') as string}
                        value={String(report.musteredCount ?? 0)}
                    />
                    <DetailRow
                        label={t('evacReport.fields.missing') as string}
                        value={String(report.missingCount ?? 0)}
                    />
                    <DetailRow
                        label={t('evacReport.fields.evacDuration') as string}
                        value={humanDuration(report.evacDurationSeconds)}
                    />
                </div>
            </Paper>

            {/* Bloc Incidents */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Text fw={600} size="md" className="mb-3">
                    {t('evacReport.sections.incidents')}
                </Text>
                {incidents.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        {t('evacReport.noIncidents')}
                    </Text>
                ) : (
                    <ul className="list-disc pl-6 text-sm space-y-1">
                        {incidents.map((inc, idx) => (
                            <li key={idx}>{inc}</li>
                        ))}
                    </ul>
                )}
            </Paper>

            {/* Bloc Signature */}
            <Paper p="md" radius="md" withBorder className="bg-white">
                <Text fw={600} size="md" className="mb-3">
                    {t('evacReport.sections.signature')}
                </Text>
                {isSigned ? (
                    <Alert color="green" icon={<IconShieldCheck size={18} />}>
                        <Text size="sm">
                            {t('evacReport.signedBy', {
                                user: report.signedOffBy ?? '?',
                                at: formatDateTime(report.signedAt, lang),
                            })}
                        </Text>
                        <Text size="xs" c="dimmed" className="mt-1">
                            {t('evacReport.lockNote')}
                        </Text>
                    </Alert>
                ) : (
                    <Alert color="orange" icon={<IconAlertOctagon size={18} />}>
                        {t('evacReport.pendingSignatureNote')}
                    </Alert>
                )}
            </Paper>

            {/* Modal : ajouter incident */}
            <Modal
                opened={incidentModalOpen}
                onClose={() => {
                    setIncidentModalOpen(false);
                    setIncidentText('');
                    setActionError(null);
                }}
                title={t('evacReport.modals.addIncidentTitle')}
                centered
            >
                <Text size="sm" c="dimmed" className="mb-2">
                    {t('evacReport.modals.addIncidentHint')}
                </Text>
                <Textarea
                    autosize
                    minRows={3}
                    maxRows={8}
                    value={incidentText}
                    onChange={(e) => setIncidentText(e.currentTarget.value)}
                    placeholder={t('evacReport.modals.addIncidentPlaceholder') as string}
                />
                {actionError && (
                    <Alert color="red" mt="sm" icon={<IconAlertTriangle size={18} />}>
                        {actionError}
                    </Alert>
                )}
                <Group justify="flex-end" mt="md">
                    <Button
                        variant="default"
                        onClick={() => setIncidentModalOpen(false)}
                        disabled={actionLoading}
                    >
                        {t('evacReport.modals.cancel')}
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleAddIncident}
                        loading={actionLoading}
                    >
                        {t('evacReport.actions.addIncident')}
                    </Button>
                </Group>
            </Modal>

            {/* Modal : signer */}
            <Modal
                opened={signModalOpen}
                onClose={() => {
                    setSignModalOpen(false);
                    setActionError(null);
                }}
                title={t('evacReport.modals.signTitle')}
                centered
            >
                <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
                    {t('evacReport.modals.signWarning')}
                </Alert>
                {actionError && (
                    <Alert color="red" mt="sm" icon={<IconAlertTriangle size={18} />}>
                        {actionError}
                    </Alert>
                )}
                <Group justify="flex-end" mt="md">
                    <Button
                        variant="default"
                        onClick={() => setSignModalOpen(false)}
                        disabled={actionLoading}
                    >
                        {t('evacReport.modals.cancel')}
                    </Button>
                    <Button
                        color="green"
                        onClick={handleSign}
                        loading={actionLoading}
                        leftSection={<IconShieldCheck size={14} />}
                    >
                        {t('evacReport.actions.confirmSign')}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : ligne label / valeur
// ─────────────────────────────────────────────────────────────────────────────

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-1.5 border-b border-slate-100 last:border-0">
        <div className="text-[12px] text-slate-500 font-medium">{label}</div>
        <div className="text-[12.5px] text-slate-800">{value}</div>
    </div>
);

export default BlastEvacuationReportPage;
