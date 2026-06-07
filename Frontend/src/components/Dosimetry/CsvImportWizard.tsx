/**
 * CsvImportWizard — Phase 4 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Wizard premium SafeX 360 d'import en masse de doses dosimetriques au format CSV.
 *
 * Route :
 *   - /dosimetry/doses/import
 *
 * Etapes (Mantine Stepper) :
 *   1. Selection fichier   : drag & drop .csv + template + lien aide.
 *   2. Preview              : stats + tableau des 10 premieres lignes + statut (badges)
 *                             + erreurs (rouge) + warnings (orange) issus du dry-run backend.
 *   3. Options & dry-run    : skip duplicates / continueOnWarnings + recap + bouton commit.
 *   4. Resultat             : progress bar pendant import, card success + stats apres,
 *                             tableau detaille des lignes en erreur + download error log.
 *
 * Backend :
 *   - Etape 2 : DosimetryService.previewCsvImport(file, mineId)
 *   - Etape 4 : DosimetryService.executeCsvImport(file, mineId, options)
 *
 * Volet aide collapsible :
 *   - Section "Format CSV"
 *   - Section "Codes d'erreur" (WORKER_NOT_FOUND, INVALID_FORMAT, DUPLICATE, ...)
 *   - Section "Confidentialite RGPD"
 *
 * Audit visible : "Import trace sous le numero {auditId}" affiche dans le footer
 * apres execute (et au-dessus apres preview en sous-titre).
 *
 * Pattern UI/UX aligne sur DoseEntryForm / DosimeterAssignmentForm :
 *   - Breadcrumb premium + hero gradient indigo->violet->fuchsia
 *   - Sections Mantine Paper avec entete + bordure premium
 *   - Bouton "Lancer l'import" gradient teal large (etape 3)
 *   - i18n via namespace `dosimetry` -> bloc `csvImportWizard`
 *   - tsc strict + vite EXIT 0
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Stepper,
    Paper,
    Group,
    Button,
    Text,
    Badge,
    Alert,
    Checkbox,
    Progress,
    Table,
    Collapse,
    Tooltip,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconChevronRight,
    IconFileTypeCsv,
    IconCloudUpload,
    IconCheck,
    IconAlertTriangle,
    IconAlertOctagon,
    IconHelpCircle,
    IconBook,
    IconShieldLock,
    IconDownload,
    IconRocket,
    IconChartBar,
    IconFileX,
    IconTrash,
    IconExternalLink,
    IconInfoCircle,
    IconBell,
    IconLayoutDashboard,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    previewCsvImport,
    executeCsvImport,
    type CsvImportPreviewResponse,
    type CsvImportPreviewRow,
    type CsvImportExecuteResponse,
    type CsvImportOptions,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
const PREVIEW_DISPLAY_ROWS = 10;

const CSV_TEMPLATE_HEADER =
    'matricule,period,hp10,hp007,hp3,source,below_detection,notes,attachment_url';
const CSV_TEMPLATE_SAMPLE =
    'MAT-0001,2026-05,0.45,0.12,0.05,AGENCY,false,Lecture mensuelle agence,';

/** Codes d'erreur a documenter dans le volet aide. */
const ERROR_CODES: string[] = [
    'WORKER_NOT_FOUND',
    'INVALID_FORMAT',
    'INVALID_PERIOD',
    'INVALID_DOSE',
    'DUPLICATE',
    'NEAR_DUPLICATE',
    'HIGH_VALUE',
    'BELOW_DETECTION_CONFLICT',
    'MISSING_REQUIRED',
    'UNKNOWN_SOURCE',
    'INTERNAL_ERROR',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Telecharge un blob en tant que fichier (utilitaire DOM). */
const triggerBlobDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** Construit le contenu CSV d'un template vide (avec une ligne d'exemple). */
const buildTemplateCsv = (): string => {
    return `${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_SAMPLE}\n`;
};

/** Echappe un champ CSV en respectant le standard RFC 4180. */
const csvEscape = (value: unknown): string => {
    if (value == null) return '';
    const s = String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

/** Construit le contenu CSV du log d'erreurs (lignes en erreur + colonnes diagnostic). */
const buildErrorLogCsv = (rows: CsvImportPreviewRow[]): string => {
    const headers = [
        'lineNumber',
        'matricule',
        'period',
        'hp10',
        'hp007',
        'hp3',
        'source',
        'status',
        'errors',
        'warnings',
    ];
    const out: string[] = [headers.join(',')];
    for (const r of rows) {
        const errs = (r.errors ?? [])
            .map((e) => `${e.code}: ${e.message}`)
            .join(' | ');
        const warns = (r.warnings ?? [])
            .map((w) => `${w.code}: ${w.message}`)
            .join(' | ');
        out.push(
            [
                csvEscape(r.lineNumber),
                csvEscape(r.matricule),
                csvEscape(r.period),
                csvEscape(r.hp10),
                csvEscape(r.hp007),
                csvEscape(r.hp3),
                csvEscape(r.source),
                csvEscape(r.status),
                csvEscape(errs),
                csvEscape(warns),
            ].join(','),
        );
    }
    return out.join('\n');
};

/** Formate une taille de fichier en KB / MB. */
const formatBytes = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

type StepIndex = 0 | 1 | 2 | 3;

const CsvImportWizard = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );
    const effectiveMineId: number | null =
        selectedMineId ?? user?.mineId ?? user?.companyId ?? null;

    // ───── Etat global du wizard ─────
    const [active, setActive] = useState<StepIndex>(0);
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileReject, setFileReject] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);

    // ───── Etape 2 : preview ─────
    const [previewLoading, setPreviewLoading] = useState(false);
    const [preview, setPreview] = useState<CsvImportPreviewResponse | null>(null);

    // ───── Etape 3 : options ─────
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [continueOnWarnings, setContinueOnWarnings] = useState(false);

    // ───── Etape 4 : execute ─────
    const [executeLoading, setExecuteLoading] = useState(false);
    const [executeProgress, setExecuteProgress] = useState(0);
    const [result, setResult] = useState<CsvImportExecuteResponse | null>(null);
    const [executeFailed, setExecuteFailed] = useState(false);

    /** Audit id affiche dans le footer (PREVIEW puis IMPORT). */
    const auditId = result?.auditId ?? preview?.auditId ?? null;

    // ─────────────────────────────────────────────────────────────────────
    //  Helpers — handlers etape 1 (selection fichier)
    // ─────────────────────────────────────────────────────────────────────

    const validateFile = (f: File): string | null => {
        const isCsv =
            /\.csv$/i.test(f.name) ||
            f.type === 'text/csv' ||
            f.type === 'application/vnd.ms-excel' ||
            f.type === 'application/csv';
        if (!isCsv) return t('csvImportWizard.errors.wrongType');
        if (f.size > MAX_FILE_SIZE_BYTES) return t('csvImportWizard.errors.fileTooLarge');
        return null;
    };

    const handleFileChosen = (f: File | null) => {
        setFileReject(null);
        if (!f) {
            setFile(null);
            return;
        }
        const err = validateFile(f);
        if (err) {
            setFile(null);
            setFileReject(err);
            return;
        }
        setFile(f);
        // Reset des etapes ulterieures si le fichier change.
        setPreview(null);
        setResult(null);
        setExecuteFailed(false);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8' });
        triggerBlobDownload(blob, t('csvImportWizard.templateFilename'));
    };

    const handleDownloadErrorLog = () => {
        const rows = result?.errorRows ?? [];
        if (rows.length === 0) return;
        const blob = new Blob([buildErrorLogCsv(rows)], { type: 'text/csv;charset=utf-8' });
        triggerBlobDownload(blob, t('csvImportWizard.errorLogFilename'));
    };

    // ─────────────────────────────────────────────────────────────────────
    //  Navigation etapes
    // ─────────────────────────────────────────────────────────────────────

    const goPreviewStep = async () => {
        if (!file) {
            errorNotification(t('csvImportWizard.errors.noFile'));
            return;
        }
        if (effectiveMineId == null) {
            errorNotification(t('csvImportWizard.errors.mineRequired'));
            return;
        }
        setPreviewLoading(true);
        setActive(1);
        try {
            const data = await previewCsvImport(file, effectiveMineId);
            setPreview(data);
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('csvImportWizard.errors.previewFailed'),
            );
            setPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const goOptionsStep = () => {
        if (!preview || preview.stats.validRows <= 0) {
            errorNotification(t('csvImportWizard.errors.noValidRows'));
            return;
        }
        setActive(2);
    };

    const goResultStep = async () => {
        if (!file || effectiveMineId == null) {
            errorNotification(t('csvImportWizard.errors.noFile'));
            return;
        }
        setActive(3);
        setExecuteLoading(true);
        setExecuteFailed(false);
        setExecuteProgress(8);

        // Animation de progress visuelle (le backend ne stream pas la progression).
        let cancelled = false;
        const tick = () => {
            if (cancelled) return;
            setExecuteProgress((p) => (p < 90 ? p + Math.max(1, Math.floor((90 - p) / 12)) : p));
        };
        const interval = window.setInterval(tick, 250);

        try {
            const options: CsvImportOptions = {
                skipDuplicates,
                continueOnWarnings,
            };
            const res = await executeCsvImport(file, effectiveMineId, options);
            setResult(res);
            setExecuteProgress(100);
            successNotification(t('csvImportWizard.result.successTitle'));
        } catch (err: any) {
            setExecuteFailed(true);
            errorNotification(
                err?.response?.data?.errorMessage ||
                    err?.response?.data?.message ||
                    t('csvImportWizard.errors.executeFailed'),
            );
        } finally {
            cancelled = true;
            window.clearInterval(interval);
            setExecuteLoading(false);
        }
    };

    const handlePrevious = () => {
        if (active === 0) return;
        setActive((active - 1) as StepIndex);
    };

    // ─────────────────────────────────────────────────────────────────────
    //  Memoizations
    // ─────────────────────────────────────────────────────────────────────

    const previewRowsForTable = useMemo(() => {
        if (!preview) return [] as CsvImportPreviewRow[];
        return preview.rows.slice(0, PREVIEW_DISPLAY_ROWS);
    }, [preview]);

    const importableCount = useMemo(() => {
        if (!preview) return 0;
        let n = preview.stats.validRows;
        if (continueOnWarnings) n += preview.stats.warningRows;
        return Math.max(0, n);
    }, [preview, continueOnWarnings]);

    const allRowsError =
        preview != null &&
        preview.stats.totalRows > 0 &&
        preview.stats.validRows === 0 &&
        preview.stats.warningRows === 0;

    const someRowsError =
        preview != null && preview.stats.errorRows > 0 && preview.stats.validRows > 0;

    // ─────────────────────────────────────────────────────────────────────
    //  Rendu
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1200px] mx-auto">
                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('csvImportWizard.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('csvImportWizard.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('csvImportWizard.breadcrumbCurrent')}
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
                                <IconFileTypeCsv size={22} stroke={1.8} className="text-white" />
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
                                    {t('csvImportWizard.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('csvImportWizard.subtitle')}
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
                                    ? t('csvImportWizard.actions.hideHelp')
                                    : t('csvImportWizard.actions.showHelp')}
                            </Button>
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                onClick={() => navigate('/dosimetry/workers')}
                            >
                                {t('csvImportWizard.actions.back')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ─── Volet aide ─── */}
                <Collapse in={helpOpen}>
                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <IconBook size={16} className="text-indigo-600" stroke={1.8} />
                            <h2 className="text-[14px] font-semibold text-slate-800">
                                {t('csvImportWizard.help.title')}
                            </h2>
                        </div>

                        <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                {t('csvImportWizard.help.formatTitle')}
                            </p>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                                {t('csvImportWizard.help.formatBody')}
                            </p>
                            <pre className="mt-2 rounded-lg bg-slate-900 text-slate-100 px-3 py-2 text-[11.5px] overflow-x-auto">
                                {CSV_TEMPLATE_HEADER}
                            </pre>
                        </div>

                        <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                {t('csvImportWizard.help.errorCodesTitle')}
                            </p>
                            <Table withTableBorder withColumnBorders striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Code</Table.Th>
                                        <Table.Th>Description</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {ERROR_CODES.map((code) => (
                                        <Table.Tr key={code}>
                                            <Table.Td>
                                                <Badge size="xs" color="red" variant="light">
                                                    {code}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs">
                                                    {t(`csvImportWizard.help.errorCodes.${code}`)}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <IconShieldLock size={14} className="text-emerald-600" />
                                <p className="text-[12.5px] font-semibold text-slate-700">
                                    {t('csvImportWizard.help.privacyTitle')}
                                </p>
                            </div>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                                {t('csvImportWizard.help.privacyBody')}
                            </p>
                        </div>
                    </Paper>
                </Collapse>

                {/* ─── Stepper Mantine 4 etapes ─── */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-4">
                    <Stepper
                        active={active}
                        onStepClick={(s) => {
                            // Navigation libre uniquement en arriere (verrouille en avant
                            // par la logique des handlers).
                            if (s < active) setActive(s as StepIndex);
                        }}
                        size="sm"
                        color="indigo"
                        allowNextStepsSelect={false}
                    >
                        <Stepper.Step
                            label={t('csvImportWizard.steps.select.label')}
                            description={t('csvImportWizard.steps.select.description')}
                            icon={<IconCloudUpload size={16} />}
                        />
                        <Stepper.Step
                            label={t('csvImportWizard.steps.preview.label')}
                            description={t('csvImportWizard.steps.preview.description')}
                            icon={<IconChartBar size={16} />}
                        />
                        <Stepper.Step
                            label={t('csvImportWizard.steps.options.label')}
                            description={t('csvImportWizard.steps.options.description')}
                            icon={<IconRocket size={16} />}
                        />
                        <Stepper.Step
                            label={t('csvImportWizard.steps.result.label')}
                            description={t('csvImportWizard.steps.result.description')}
                            icon={<IconCheck size={16} />}
                        />
                    </Stepper>
                </Paper>

                {/* ───────────────────────────────────────────────────────── */}
                {/* ETAPE 1 — Selection fichier                              */}
                {/* ───────────────────────────────────────────────────────── */}
                {active === 0 && (
                    <div className="space-y-4">
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            {effectiveMineId == null && (
                                <Alert
                                    color="orange"
                                    variant="light"
                                    icon={<IconAlertTriangle size={16} />}
                                >
                                    <Text size="xs">
                                        {t('csvImportWizard.select.noMineWarning')}
                                    </Text>
                                </Alert>
                            )}

                            {/* Drop zone */}
                            <label
                                htmlFor="csv-import-input"
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    const f = e.dataTransfer.files?.[0] ?? null;
                                    handleFileChosen(f);
                                }}
                                className={[
                                    'block rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition',
                                    dragOver
                                        ? 'border-indigo-400 bg-indigo-50/60'
                                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-indigo-300',
                                ].join(' ')}
                            >
                                <input
                                    id="csv-import-input"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
                                />
                                <IconCloudUpload
                                    size={36}
                                    stroke={1.4}
                                    className="mx-auto text-indigo-500 mb-2"
                                />
                                <p className="text-[14px] font-semibold text-slate-800">
                                    {t('csvImportWizard.select.dropTitle')}
                                </p>
                                <p className="text-[12px] text-slate-500 mt-1">
                                    {t('csvImportWizard.select.dropSubtitle')}
                                </p>
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="indigo"
                                    className="mt-3"
                                    component="span"
                                >
                                    {t('csvImportWizard.select.browse')}
                                </Button>
                            </label>

                            {fileReject && (
                                <Alert
                                    color="red"
                                    variant="light"
                                    icon={<IconFileX size={16} />}
                                    title={t('csvImportWizard.select.rejectedTitle')}
                                >
                                    <Text size="xs">{fileReject}</Text>
                                </Alert>
                            )}

                            {file && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <IconFileTypeCsv
                                                size={18}
                                                stroke={1.8}
                                                className="text-emerald-700"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10.5px] uppercase tracking-[0.10em] text-emerald-700 font-semibold">
                                                {t('csvImportWizard.select.selectedFile')}
                                            </p>
                                            <p className="text-[13px] font-semibold text-slate-800 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {formatBytes(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <Tooltip label={t('csvImportWizard.actions.removeFile')}>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleFileChosen(null)}
                                            leftSection={<IconTrash size={14} />}
                                        >
                                            {t('csvImportWizard.actions.removeFile')}
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}

                            {!file && !fileReject && (
                                <p className="text-[11.5px] text-slate-500">
                                    {t('csvImportWizard.select.noFileYet')}
                                </p>
                            )}
                        </Paper>

                        {/* Format expected */}
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconInfoCircle size={16} className="text-indigo-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('csvImportWizard.select.formatTitle')}
                                </h2>
                            </div>
                            <pre className="rounded-lg bg-slate-900 text-slate-100 px-3 py-2 text-[11.5px] overflow-x-auto">
                                {t('csvImportWizard.select.formatHeader')}
                            </pre>
                            <p className="text-[12px] text-slate-500">
                                {t('csvImportWizard.select.formatHint')}
                            </p>

                            <div className="mt-2">
                                <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                                    {t('csvImportWizard.select.fieldsTitle')}
                                </p>
                                <Table withTableBorder withColumnBorders striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Column</Table.Th>
                                            <Table.Th>Description</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {[
                                            'matricule',
                                            'period',
                                            'hp10',
                                            'hp007',
                                            'hp3',
                                            'source',
                                            'below_detection',
                                            'notes',
                                            'attachment_url',
                                        ].map((col) => (
                                            <Table.Tr key={col}>
                                                <Table.Td>
                                                    <code className="text-[11.5px]">{col}</code>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs">
                                                        {t(`csvImportWizard.select.fields.${col}`)}
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </div>

                            <Group justify="space-between" mt="sm">
                                <Button
                                    variant="default"
                                    size="xs"
                                    leftSection={<IconDownload size={14} stroke={1.8} />}
                                    onClick={handleDownloadTemplate}
                                >
                                    {t('csvImportWizard.actions.downloadTemplate')}
                                </Button>
                                <Button
                                    variant="subtle"
                                    color="indigo"
                                    size="xs"
                                    rightSection={<IconExternalLink size={12} />}
                                    onClick={() => setHelpOpen(true)}
                                >
                                    {t('csvImportWizard.actions.exportHelp')}
                                </Button>
                            </Group>
                        </Paper>

                        <Group justify="flex-end">
                            <Button
                                variant="default"
                                onClick={() => navigate('/dosimetry/workers')}
                            >
                                {t('csvImportWizard.actions.cancel')}
                            </Button>
                            <Button
                                color="indigo"
                                className="!bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700"
                                rightSection={<IconChevronRight size={14} stroke={2} />}
                                disabled={!file || effectiveMineId == null}
                                onClick={goPreviewStep}
                            >
                                {t('csvImportWizard.actions.next')}
                            </Button>
                        </Group>
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────── */}
                {/* ETAPE 2 — Preview                                         */}
                {/* ───────────────────────────────────────────────────────── */}
                {active === 1 && (
                    <div className="space-y-4">
                        {previewLoading && (
                            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 text-center">
                                <div className="inline-block w-7 h-7 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
                                <p className="text-[14px] font-semibold text-slate-800">
                                    {t('csvImportWizard.preview.loadingTitle')}
                                </p>
                                <p className="text-[12px] text-slate-500 mt-1">
                                    {t('csvImportWizard.preview.loadingBody')}
                                </p>
                            </Paper>
                        )}

                        {!previewLoading && preview && (
                            <>
                                {/* Stats agregees */}
                                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <IconChartBar
                                            size={16}
                                            className="text-indigo-600"
                                            stroke={1.8}
                                        />
                                        <h2 className="text-[14px] font-semibold text-slate-800">
                                            {t('csvImportWizard.preview.statsTitle')}
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.totalRows')}
                                            value={preview.stats.totalRows}
                                            tone="slate"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.validRows')}
                                            value={preview.stats.validRows}
                                            tone="emerald"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.warningRows')}
                                            value={preview.stats.warningRows}
                                            tone="orange"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.errorRows')}
                                            value={preview.stats.errorRows}
                                            tone="red"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.duplicateRows')}
                                            value={preview.stats.duplicateRows}
                                            tone="violet"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.preview.stats.unknownWorkers')}
                                            value={preview.stats.unknownWorkers}
                                            tone="amber"
                                        />
                                    </div>

                                    {allRowsError && (
                                        <Alert
                                            color="red"
                                            variant="light"
                                            icon={<IconAlertOctagon size={16} />}
                                        >
                                            <Text size="xs">
                                                {t('csvImportWizard.preview.allErrors')}
                                            </Text>
                                        </Alert>
                                    )}
                                    {someRowsError && (
                                        <Alert
                                            color="orange"
                                            variant="light"
                                            icon={<IconAlertTriangle size={16} />}
                                        >
                                            <Text size="xs">
                                                {t('csvImportWizard.preview.someErrors')}
                                            </Text>
                                        </Alert>
                                    )}
                                </Paper>

                                {/* Tableau preview */}
                                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <IconFileTypeCsv
                                            size={16}
                                            className="text-indigo-600"
                                            stroke={1.8}
                                        />
                                        <h2 className="text-[14px] font-semibold text-slate-800">
                                            {t('csvImportWizard.preview.tableTitle')}
                                        </h2>
                                    </div>

                                    {previewRowsForTable.length === 0 ? (
                                        <Text size="xs" c="dimmed">
                                            {t('csvImportWizard.preview.noRows')}
                                        </Text>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table
                                                withTableBorder
                                                withColumnBorders
                                                striped
                                                highlightOnHover
                                            >
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.line')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t(
                                                                'csvImportWizard.preview.cols.matricule',
                                                            )}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.period')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.hp10')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.hp007')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.hp3')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.status')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.issues')}
                                                        </Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {previewRowsForTable.map((row) => (
                                                        <PreviewRow
                                                            key={`${row.lineNumber}-${row.matricule ?? ''}`}
                                                            row={row}
                                                            t={t}
                                                        />
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Paper>
                            </>
                        )}

                        <Group justify="space-between">
                            <Button
                                variant="default"
                                leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                onClick={handlePrevious}
                            >
                                {allRowsError
                                    ? t('csvImportWizard.actions.fixFile')
                                    : t('csvImportWizard.actions.previous')}
                            </Button>
                            <Button
                                color="indigo"
                                className="!bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700"
                                rightSection={<IconChevronRight size={14} stroke={2} />}
                                disabled={
                                    previewLoading ||
                                    !preview ||
                                    preview.stats.validRows <= 0
                                }
                                onClick={goOptionsStep}
                            >
                                {t('csvImportWizard.actions.next')}
                            </Button>
                        </Group>
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────── */}
                {/* ETAPE 3 — Options & dry-run                              */}
                {/* ───────────────────────────────────────────────────────── */}
                {active === 2 && (
                    <div className="space-y-4">
                        <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <IconRocket size={16} className="text-teal-600" stroke={1.8} />
                                <h2 className="text-[14px] font-semibold text-slate-800">
                                    {t('csvImportWizard.options.recapTitle')}
                                </h2>
                            </div>

                            <Checkbox
                                label={
                                    <span className="flex items-center gap-1.5">
                                        {t('csvImportWizard.options.skipDuplicatesLabel')}
                                        <Tooltip
                                            label={t('csvImportWizard.options.skipDuplicatesHint')}
                                            multiline
                                            w={280}
                                        >
                                            <IconInfoCircle size={12} className="text-slate-400" />
                                        </Tooltip>
                                    </span>
                                }
                                checked={skipDuplicates}
                                onChange={(e) => setSkipDuplicates(e.currentTarget.checked)}
                            />
                            <Checkbox
                                label={
                                    <span className="flex items-center gap-1.5">
                                        {t('csvImportWizard.options.continueOnWarningsLabel')}
                                        <Tooltip
                                            label={t('csvImportWizard.options.continueOnWarningsHint')}
                                            multiline
                                            w={280}
                                        >
                                            <IconInfoCircle size={12} className="text-slate-400" />
                                        </Tooltip>
                                    </span>
                                }
                                checked={continueOnWarnings}
                                onChange={(e) => setContinueOnWarnings(e.currentTarget.checked)}
                            />

                            <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 p-4 space-y-1.5">
                                <p className="text-[11px] uppercase tracking-[0.10em] text-teal-700 font-semibold">
                                    {t('csvImportWizard.options.recapTitle')}
                                </p>
                                <p className="text-[14px] font-semibold text-slate-800">
                                    {t('csvImportWizard.options.recapBody', { count: importableCount })}
                                </p>
                                <p className="text-[11.5px] text-slate-600">
                                    {t('csvImportWizard.options.recapAlerts')}
                                </p>
                                <p className="text-[11px] text-slate-500 italic">
                                    {t('csvImportWizard.options.auditNote')}
                                </p>
                            </div>
                        </Paper>

                        <Group justify="space-between">
                            <Button
                                variant="default"
                                leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                onClick={handlePrevious}
                            >
                                {t('csvImportWizard.actions.previous')}
                            </Button>
                            <Button
                                size="md"
                                color="teal"
                                className="!bg-gradient-to-r !from-teal-500 !to-emerald-600 hover:!from-teal-600 hover:!to-emerald-700 !px-6"
                                leftSection={<IconRocket size={16} stroke={2} />}
                                onClick={goResultStep}
                                disabled={importableCount <= 0}
                            >
                                {t('csvImportWizard.actions.launchImport')}
                            </Button>
                        </Group>
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────── */}
                {/* ETAPE 4 — Resultat                                        */}
                {/* ───────────────────────────────────────────────────────── */}
                {active === 3 && (
                    <div className="space-y-4">
                        {executeLoading && (
                            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <IconRocket
                                        size={16}
                                        className="text-indigo-600"
                                        stroke={1.8}
                                    />
                                    <h2 className="text-[14px] font-semibold text-slate-800">
                                        {t('csvImportWizard.result.runningTitle')}
                                    </h2>
                                </div>
                                <Progress
                                    value={executeProgress}
                                    color="indigo"
                                    striped
                                    animated
                                    size="lg"
                                />
                                <Text size="xs" c="dimmed">
                                    {t('csvImportWizard.result.runningBody')}
                                </Text>
                            </Paper>
                        )}

                        {!executeLoading && executeFailed && (
                            <Paper className="bg-white border border-red-200 shadow-sm rounded-xl p-5">
                                <Alert
                                    color="red"
                                    variant="light"
                                    icon={<IconAlertOctagon size={16} />}
                                    title={t('csvImportWizard.result.failureTitle')}
                                >
                                    <Text size="xs">
                                        {t('csvImportWizard.result.failureBody')}
                                    </Text>
                                </Alert>
                                <Group justify="flex-end" mt="md">
                                    <Button
                                        variant="default"
                                        onClick={() => setActive(2)}
                                        leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                    >
                                        {t('csvImportWizard.actions.previous')}
                                    </Button>
                                </Group>
                            </Paper>
                        )}

                        {!executeLoading && !executeFailed && result && (
                            <>
                                {/* Card succes */}
                                <Paper className="border border-emerald-200 shadow-sm rounded-xl p-5 space-y-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/40">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200">
                                            <IconCheck size={20} stroke={2} className="text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-semibold text-slate-800 leading-tight">
                                                {t('csvImportWizard.result.successTitle')}
                                            </p>
                                            <p className="text-[12.5px] text-slate-600 mt-1">
                                                {t('csvImportWizard.result.successBody')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <StatCard
                                            label={t('csvImportWizard.result.stats.importedCount')}
                                            value={result.importedCount}
                                            tone="emerald"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.result.stats.skippedCount')}
                                            value={result.skippedCount}
                                            tone="amber"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.result.stats.errorCount')}
                                            value={result.errorCount}
                                            tone="red"
                                        />
                                        <StatCard
                                            label={t('csvImportWizard.result.stats.alertsCreated')}
                                            value={result.alertsCreated}
                                            tone="violet"
                                        />
                                    </div>
                                </Paper>

                                {/* Tableau erreurs */}
                                {result.errorRows && result.errorRows.length > 0 ? (
                                    <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3">
                                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <IconFileX
                                                    size={16}
                                                    className="text-red-600"
                                                    stroke={1.8}
                                                />
                                                <h2 className="text-[14px] font-semibold text-slate-800">
                                                    {t('csvImportWizard.result.errorTableTitle')}
                                                </h2>
                                            </div>
                                            <Button
                                                size="xs"
                                                variant="default"
                                                leftSection={<IconDownload size={14} stroke={1.8} />}
                                                onClick={handleDownloadErrorLog}
                                            >
                                                {t('csvImportWizard.actions.downloadErrorLog')}
                                            </Button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table
                                                withTableBorder
                                                withColumnBorders
                                                striped
                                                highlightOnHover
                                            >
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.line')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t(
                                                                'csvImportWizard.preview.cols.matricule',
                                                            )}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.period')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.status')}
                                                        </Table.Th>
                                                        <Table.Th>
                                                            {t('csvImportWizard.preview.cols.issues')}
                                                        </Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {result.errorRows.map((row, idx) => (
                                                        <PreviewRow
                                                            key={`err-${row.lineNumber}-${idx}`}
                                                            row={row}
                                                            t={t}
                                                            compact
                                                        />
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        </div>
                                    </Paper>
                                ) : (
                                    <Alert
                                        color="emerald"
                                        variant="light"
                                        icon={<IconCheck size={16} />}
                                    >
                                        <Text size="xs">{t('csvImportWizard.result.noErrors')}</Text>
                                    </Alert>
                                )}

                                <Group justify="flex-end">
                                    <Button
                                        variant="default"
                                        leftSection={<IconLayoutDashboard size={14} stroke={1.8} />}
                                        onClick={() => navigate('/dosimetry/workers')}
                                    >
                                        {t('csvImportWizard.actions.backToDashboard')}
                                    </Button>
                                    <Button
                                        color="indigo"
                                        className="!bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700"
                                        leftSection={<IconBell size={14} stroke={2} />}
                                        onClick={() => navigate('/dosimetry/workers')}
                                    >
                                        {t('csvImportWizard.actions.viewAlerts')}
                                    </Button>
                                </Group>
                            </>
                        )}
                    </div>
                )}

                {/* ─── Footer audit ─── */}
                {auditId != null && auditId !== '' && (
                    <div className="mt-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
                            <IconShieldLock size={12} className="text-emerald-600" />
                            {t('csvImportWizard.result.auditFooter', { auditId })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number | string;
    tone: 'slate' | 'emerald' | 'red' | 'orange' | 'amber' | 'violet';
}

const StatCard = ({ label, value, tone }: StatCardProps) => {
    const toneMap: Record<StatCardProps['tone'], { border: string; bg: string; text: string }> = {
        slate: { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700' },
        emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
        orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700' },
        amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
        violet: { border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-700' },
    };
    const c = toneMap[tone];
    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} px-3 py-2.5`}>
            <p className="text-[10px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
                {label}
            </p>
            <p className={`text-[20px] font-bold ${c.text} leading-tight mt-0.5`}>{value}</p>
        </div>
    );
};

interface PreviewRowProps {
    row: CsvImportPreviewRow;
    t: (key: string) => string;
    compact?: boolean;
}

const PreviewRow = ({ row, t, compact = false }: PreviewRowProps) => {
    const statusColor =
        row.status === 'ERROR' ? 'red' : row.status === 'WARNING' ? 'orange' : 'green';
    const statusIcon =
        row.status === 'ERROR' ? (
            <IconAlertOctagon size={11} />
        ) : row.status === 'WARNING' ? (
            <IconAlertTriangle size={11} />
        ) : (
            <IconCheck size={11} />
        );
    const issues = [...(row.errors ?? []), ...(row.warnings ?? [])];

    return (
        <Table.Tr>
            <Table.Td>
                <span className="text-[11.5px] font-mono text-slate-500">{row.lineNumber}</span>
            </Table.Td>
            <Table.Td>
                <span className="text-[12px] font-semibold text-slate-800">
                    {row.matricule ?? '—'}
                </span>
            </Table.Td>
            <Table.Td>
                <span className="text-[12px] text-slate-700">{row.period ?? '—'}</span>
            </Table.Td>
            {!compact && (
                <>
                    <Table.Td>
                        <span className="text-[12px] text-slate-700">
                            {row.hp10 != null ? row.hp10.toFixed(3) : '—'}
                        </span>
                    </Table.Td>
                    <Table.Td>
                        <span className="text-[12px] text-slate-700">
                            {row.hp007 != null ? row.hp007.toFixed(3) : '—'}
                        </span>
                    </Table.Td>
                    <Table.Td>
                        <span className="text-[12px] text-slate-700">
                            {row.hp3 != null ? row.hp3.toFixed(3) : '—'}
                        </span>
                    </Table.Td>
                </>
            )}
            <Table.Td>
                <Badge
                    color={statusColor}
                    variant="light"
                    size="sm"
                    leftSection={statusIcon}
                >
                    {t(`csvImportWizard.preview.status.${row.status}`)}
                </Badge>
            </Table.Td>
            <Table.Td>
                {issues.length === 0 ? (
                    <span className="text-[11.5px] text-slate-400">—</span>
                ) : (
                    <ul className="space-y-1">
                        {issues.map((iss, idx) => {
                            const isError = (row.errors ?? []).includes(iss);
                            return (
                                <li
                                    key={`${row.lineNumber}-${iss.code}-${idx}`}
                                    className="flex items-start gap-1.5"
                                >
                                    {isError ? (
                                        <IconAlertOctagon
                                            size={12}
                                            className="text-red-600 flex-shrink-0 mt-0.5"
                                        />
                                    ) : (
                                        <IconAlertTriangle
                                            size={12}
                                            className="text-orange-500 flex-shrink-0 mt-0.5"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <span
                                            className={`text-[11px] font-semibold ${
                                                isError ? 'text-red-700' : 'text-orange-700'
                                            }`}
                                        >
                                            {iss.code}
                                        </span>
                                        <span className="text-[11px] text-slate-600">
                                            {' '}
                                            — {iss.message}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Table.Td>
        </Table.Tr>
    );
};

export default CsvImportWizard;
