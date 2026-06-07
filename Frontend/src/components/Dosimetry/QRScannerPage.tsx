/**
 * QRScannerPage — Phase 3 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Page mobile-friendly de scan QR pour identifier un dosimetre du parc.
 *
 * Strategie d'implementation (Phase 3) :
 *  - La bibliotheque `html5-qrcode` n'est PAS encore installee (voir package.json).
 *    Pour eviter d'ajouter une dependance avant validation produit, ce composant
 *    affiche un PLACEHOLDER premium pleine page avec :
 *       - Cadre scanner anime (carre + 4 coins decoratifs) signalant la future
 *         zone camera.
 *       - Banniere "Camera non disponible" mentionnant explicitement le TODO
 *         `npm install html5-qrcode`.
 *       - Mode de saisie manuelle (input + bouton "Rechercher") qui appelle
 *         l'API `searchDosimeters({ qr })` cote serveur (fallback client si
 *         l'endpoint POST /search n'est pas encore deploye) : le champ accepte
 *         autant un QR code qu'un numero de serie.
 *
 *  - Une fois `html5-qrcode` ajoute au package.json, il suffira de remplacer le
 *    placeholder par le composant <Html5QrcodePlugin /> et de cabler son
 *    callback {@code onScanSuccess} sur la fonction {@code handleSearch} :
 *
 *      <Html5QrcodePlugin
 *          fps={10}
 *          qrbox={250}
 *          disableFlip={false}
 *          qrCodeSuccessCallback={(decoded) => handleSearch(decoded)}
 *      />
 *
 * Apres un scan / recherche reussi :
 *   - Si le dosimetre est trouve : carte "identifie" avec serial, type, statut +
 *     deux boutons (Attribuer -> /dosimetry/dosimeters/assign?dosimeterId=X,
 *     Voir le detail -> /dosimetry/dosimeters?focus=X).
 *   - Sinon : carte "inconnu" + CTA "Ajouter ce dosimetre" (route placeholder
 *     /coming-soon en P3, sera DosimeterCreateForm en P4).
 *
 * Mobile-first :
 *   - Plein ecran sous le shell SafeX (DashboardLayout) avec padding minimal en
 *     viewport <640px (sm), grand carre scanner (max-h 60vh), grandes cibles
 *     tactiles (boutons 44px+), bouton flottant "Retour" (FAB) en bas-gauche.
 *   - Sur desktop, layout centre (max-w 480px) avec coins arrondis et marges
 *     plus aerees.
 *
 * Route : /dosimetry/dosimeters/scan
 *
 * RBAC : DOSIMETRY_READ_AGGREGATE (lecture du parc, geree backend cote search).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../slices/hooks';
import {
    IconArrowLeft,
    IconChevronRight,
    IconQrcode,
    IconScan,
    IconDeviceWatch,
    IconAlertCircle,
    IconSearch,
    IconCircleCheck,
    IconAlertTriangle,
    IconPlus,
    IconArrowRight,
    IconUser,
    IconCamera,
    IconRefresh,
} from '@tabler/icons-react';
import {
    findDosimeterByQr,
    searchDosimeters,
    type DosimeterDTO,
    type DosimeterStatus,
    type DosimeterType,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Mapping local (couleurs statut / type) — extrait de DosimetersInventoryPage
//  pour preserver l'autonomie du composant sans dependance croisee.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DosimeterStatus, { bg: string; border: string; text: string; dot: string }> = {
    AVAILABLE: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
    ASSIGNED:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    IN_READING:{ bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
    LOST:      { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800',    dot: 'bg-red-600' },
    DAMAGED:   { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
    RETIRED:   { bg: 'bg-slate-100', border: 'border-slate-300',  text: 'text-slate-600',  dot: 'bg-slate-500' },
};

const TYPE_BADGE: Record<DosimeterType, { bg: string; text: string }> = {
    TLD:  { bg: 'bg-indigo-50 border-indigo-200',   text: 'text-indigo-700' },
    OSL:  { bg: 'bg-violet-50 border-violet-200',   text: 'text-violet-700' },
    FILM: { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700' },
    EPD:  { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Etat machine du scanner
// ─────────────────────────────────────────────────────────────────────────────

type ScanState =
    | { kind: 'idle' }
    | { kind: 'searching'; value: string }
    | { kind: 'found'; value: string; dosimeter: DosimeterDTO }
    | { kind: 'notFound'; value: string }
    | { kind: 'error'; value: string; message: string };

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const QRScannerPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const mineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const [manualValue, setManualValue] = useState('');
    const [state, setState] = useState<ScanState>({ kind: 'idle' });

    /**
     * Recherche un dosimetre par QR code (priorite) ou numero de serie (repli).
     *
     * <p>Strategie Phase 3 (alignee sur l'API backend) :
     *   1. Tente d'abord {@code findDosimeterByQr(value, mineId)} — endpoint
     *      dedie qui retourne 200/404 sur match exact qrCode.
     *   2. Si miss, lance une recherche LIKE via {@code searchDosimeters({ search })}
     *      pour matcher un numero de serie (cas saisie manuelle).
     *
     * <p>Le mineId est resolu depuis le store Redux companySelection. Si aucun
     * tenant n'est selectionne, on remonte une erreur claire a l'utilisateur.
     */
    const handleSearch = async (raw: string) => {
        const value = raw.trim();
        if (!value) {
            setState({ kind: 'error', value: '', message: t('qrScanner.errors.emptyInput') });
            return;
        }
        if (mineId == null) {
            setState({
                kind: 'error',
                value,
                message: t('qrScanner.errors.searchFailed'),
            });
            return;
        }
        setState({ kind: 'searching', value });
        try {
            // 1. Lookup exact QR via endpoint dedie.
            const direct = await findDosimeterByQr(value, mineId);
            if (direct && direct.id != null) {
                setState({ kind: 'found', value, dosimeter: direct });
                return;
            }
            // 2. Repli : recherche LIKE sur serial / qrCode.
            const list = await searchDosimeters({ mineId, search: value });
            const exactSerial = list.find((d) => d.serial === value);
            const match = exactSerial ?? list[0] ?? null;
            if (match && match.id != null) {
                setState({ kind: 'found', value, dosimeter: match });
            } else {
                setState({ kind: 'notFound', value });
            }
        } catch {
            setState({
                kind: 'error',
                value,
                message: t('qrScanner.errors.searchFailed'),
            });
        }
    };

    const handleSubmitManual = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(manualValue);
    };

    const resetScan = () => {
        setState({ kind: 'idle' });
        setManualValue('');
    };

    return (
        <div className="min-h-full bg-[#FAF8F3]">
            <div className="max-w-[640px] mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24">

                {/* ─── Breadcrumb premium ─── */}
                <nav
                    aria-label={t('qrScanner.breadcrumbCurrent')}
                    className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 mb-3"
                >
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('qrScanner.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('qrScanner.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/dosimeters')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('qrScanner.breadcrumbInventory')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('qrScanner.breadcrumbCurrent')}
                    </span>
                </nav>

                {/* ─── Header card compact (mobile-friendly) ─── */}
                <div className="mb-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-4 sm:px-5 py-4 flex items-center gap-3">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <button
                            type="button"
                            onClick={() => navigate('/dosimetry/dosimeters')}
                            className="sm:hidden flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition"
                            aria-label={t('qrScanner.back')}
                        >
                            <IconArrowLeft size={18} stroke={1.8} />
                        </button>
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                            <IconScan size={20} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1
                                className="text-slate-900 leading-tight"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(18px, 4.5vw, 22px)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {t('qrScanner.title')}
                            </h1>
                            <p className="hidden sm:block text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">
                                {t('qrScanner.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Zone scanner ou resultat ─── */}
                {state.kind === 'found' && (
                    <FoundCard
                        dosimeter={state.dosimeter}
                        onAssign={() =>
                            navigate(
                                `/dosimetry/dosimeters/assign?dosimeterId=${state.dosimeter.id}`,
                            )
                        }
                        onDetail={() =>
                            navigate(`/dosimetry/dosimeters?focus=${state.dosimeter.id}`)
                        }
                        onRescan={resetScan}
                    />
                )}

                {state.kind === 'notFound' && (
                    <NotFoundCard
                        value={state.value}
                        onAdd={() => navigate('/coming-soon')}
                        onRescan={resetScan}
                    />
                )}

                {(state.kind === 'idle' || state.kind === 'searching' || state.kind === 'error') && (
                    <>
                        <ScannerFrame searching={state.kind === 'searching'} />

                        {/* Banner camera indisponible — TODO html5-qrcode */}
                        <div
                            className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
                            role="status"
                        >
                            <IconCamera size={18} stroke={1.8} className="mt-0.5 flex-shrink-0 text-amber-600" />
                            <div className="flex-1 text-[12.5px]">
                                <p className="font-semibold text-amber-900 mb-0.5">
                                    {t('qrScanner.frame.cameraUnavailableTitle')}
                                </p>
                                <p className="leading-relaxed text-amber-800">
                                    {t('qrScanner.frame.cameraUnavailableHint')}
                                </p>
                            </div>
                        </div>

                        {/* Section saisie manuelle */}
                        <form
                            onSubmit={handleSubmitManual}
                            className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <IconQrcode size={16} stroke={1.8} className="text-indigo-600" />
                                <h2 className="text-[13.5px] font-semibold text-slate-800">
                                    {t('qrScanner.manual.title')}
                                </h2>
                            </div>
                            <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
                                {t('qrScanner.manual.hint')}
                            </p>

                            <label
                                htmlFor="qr-manual-input"
                                className="block text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold mb-1.5"
                            >
                                {t('qrScanner.manual.inputLabel')}
                            </label>
                            <div className="relative">
                                <IconSearch
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    stroke={1.8}
                                />
                                <input
                                    id="qr-manual-input"
                                    type="text"
                                    autoComplete="off"
                                    inputMode="text"
                                    value={manualValue}
                                    onChange={(e) => setManualValue(e.target.value)}
                                    placeholder={t('qrScanner.manual.inputPlaceholder')}
                                    className="w-full pl-9 pr-3 py-3 text-[14px] font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                    aria-describedby={
                                        state.kind === 'error' ? 'qr-manual-error' : undefined
                                    }
                                />
                            </div>

                            {state.kind === 'error' && (
                                <p
                                    id="qr-manual-error"
                                    role="alert"
                                    className="mt-2 flex items-center gap-1.5 text-[12px] text-red-700"
                                >
                                    <IconAlertCircle size={13} stroke={1.8} />
                                    {state.message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={state.kind === 'searching'}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {state.kind === 'searching' ? (
                                    <>
                                        <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        {t('qrScanner.manual.searching')}
                                    </>
                                ) : (
                                    <>
                                        <IconSearch size={15} stroke={2} />
                                        {t('qrScanner.manual.submit')}
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}

            </div>

            {/* ─── Bouton flottant retour (mobile-first FAB) ─── */}
            <button
                type="button"
                onClick={() => navigate('/dosimetry/dosimeters')}
                className="sm:hidden fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 pl-3 pr-4 py-2.5 rounded-full bg-white border border-slate-300 text-slate-700 shadow-lg hover:bg-slate-50 active:bg-slate-100 transition text-[13px] font-medium"
                aria-label={t('qrScanner.back')}
            >
                <IconArrowLeft size={15} stroke={1.8} />
                {t('qrScanner.back')}
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cadre scanner placeholder — affiche un grand carre avec 4 coins decoratifs
 * (style scanner QR camera) et un texte d'instruction. Anime un voile pulse
 * pendant la recherche.
 */
function ScannerFrame({ searching }: { searching: boolean }) {
    const { t } = useTranslation('dosimetry');
    return (
        <div
            className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-lg"
            style={{ aspectRatio: '1 / 1', maxHeight: '60vh' }}
        >
            {/* Fond degrade discret */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950"
                aria-hidden="true"
            />

            {/* Grille decorative (rappel cadre scanner) */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
                aria-hidden="true"
            />

            {/* Carre central avec 4 coins */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-full max-w-[260px] aspect-square">
                    {/* Coin haut-gauche */}
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-md" aria-hidden="true" />
                    {/* Coin haut-droit */}
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-md" aria-hidden="true" />
                    {/* Coin bas-gauche */}
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-md" aria-hidden="true" />
                    {/* Coin bas-droit */}
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-md" aria-hidden="true" />

                    {/* Icone QR centre */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <IconQrcode
                            size={96}
                            stroke={1}
                            className={`text-white/30 ${searching ? 'animate-pulse' : ''}`}
                        />
                    </div>

                    {/* Ligne de scan animee (decoration) */}
                    {searching && (
                        <span
                            className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.8)]"
                            style={{
                                top: '50%',
                                animation: 'qr-scan-line 1.6s ease-in-out infinite',
                            }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>

            {/* Texte d'instruction en bas */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-center bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent">
                <p className="text-white text-[14px] sm:text-[15px] font-semibold mb-0.5">
                    {t('qrScanner.frame.instruction')}
                </p>
                <p className="text-white/60 text-[11.5px] sm:text-[12px]">
                    {t('qrScanner.frame.subInstruction')}
                </p>
            </div>

            {/* Keyframes inline pour l'animation de la ligne de scan
                — evite d'editer la config Tailwind. */}
            <style>
                {`@keyframes qr-scan-line {
                    0%   { transform: translateY(-90px); opacity: 0.2; }
                    50%  { transform: translateY(90px);  opacity: 1; }
                    100% { transform: translateY(-90px); opacity: 0.2; }
                }`}
            </style>
        </div>
    );
}

/**
 * Carte de resultat "Dosimetre identifie" — affiche les details du dosimetre
 * trouve + deux CTA principaux (Attribuer / Voir le detail).
 */
function FoundCard({
    dosimeter,
    onAssign,
    onDetail,
    onRescan,
}: {
    dosimeter: DosimeterDTO;
    onAssign: () => void;
    onDetail: () => void;
    onRescan: () => void;
}) {
    const { t } = useTranslation('dosimetry');
    const status = STATUS_BADGE[dosimeter.status];
    const type = TYPE_BADGE[dosimeter.type];
    const canAssign = dosimeter.status === 'AVAILABLE';

    return (
        <div className="bg-white border border-green-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-200 flex-shrink-0">
                        <IconCircleCheck size={22} stroke={1.8} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] uppercase tracking-[0.16em] text-green-700 font-semibold">
                            {t('qrScanner.result.foundTitle')}
                        </p>
                        <h2 className="text-slate-900 font-mono font-semibold text-[18px] leading-tight mt-0.5 truncate">
                            {dosimeter.serial}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${type.bg} ${type.text}`}
                    >
                        {dosimeter.type}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${status.bg} ${status.border} ${status.text} text-[11px] font-medium`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                        {t(`dosimeters.statusValues.${dosimeter.status}`)}
                    </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                    <div>
                        <dt className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                            {t('dosimeters.detail.serial')}
                        </dt>
                        <dd className="text-slate-800 font-mono font-medium">{dosimeter.serial}</dd>
                    </div>
                    <div>
                        <dt className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium">
                            {t('dosimeters.detail.qrCode')}
                        </dt>
                        <dd className="text-slate-800 font-mono text-[11.5px] break-all">
                            {dosimeter.qrCode ?? '—'}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col gap-2">
                {canAssign && (
                    <button
                        type="button"
                        onClick={onAssign}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm"
                    >
                        <IconUser size={15} stroke={2} />
                        {t('qrScanner.result.assignCta')}
                        <IconArrowRight size={14} stroke={2} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onDetail}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition"
                >
                    <IconDeviceWatch size={15} stroke={2} />
                    {t('qrScanner.result.detailCta')}
                </button>
                <button
                    type="button"
                    onClick={onRescan}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[12.5px] font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                >
                    <IconRefresh size={13} stroke={2} />
                    {t('qrScanner.result.rescan')}
                </button>
            </div>
        </div>
    );
}

/**
 * Carte de resultat "Dosimetre inconnu" — affiche la valeur tapee + CTA
 * "Ajouter ce dosimetre".
 */
function NotFoundCard({
    value,
    onAdd,
    onRescan,
}: {
    value: string;
    onAdd: () => void;
    onRescan: () => void;
}) {
    const { t } = useTranslation('dosimetry');
    return (
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="relative px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
                        <IconAlertTriangle size={22} stroke={1.8} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] uppercase tracking-[0.16em] text-amber-800 font-semibold">
                            {t('qrScanner.result.notFoundTitle')}
                        </p>
                        <p className="text-slate-800 font-mono font-semibold text-[14px] leading-tight mt-0.5 break-all">
                            {value}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4">
                <p className="text-[13px] text-slate-700 leading-relaxed">
                    {t('qrScanner.result.notFoundHint', { value })}
                </p>
            </div>

            <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onAdd}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm"
                >
                    <IconPlus size={15} stroke={2} />
                    {t('qrScanner.result.addCta')}
                </button>
                <button
                    type="button"
                    onClick={onRescan}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[12.5px] font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                >
                    <IconRefresh size={13} stroke={2} />
                    {t('qrScanner.result.rescan')}
                </button>
            </div>
        </div>
    );
}

export default QRScannerPage;
