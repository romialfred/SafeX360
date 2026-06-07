/**
 * ExposureProfileLinkEditor — Phase 6 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Editeur des liens (point de mesure × fraction de temps) d'un profil
 * d'exposition agent + simulation de la dose estimee annuelle.
 *
 * Route : /dosimetry/exposure-profiles/:profileId/edit
 *
 * Layout (page large) :
 *   - Header : breadcrumb + nom profil + worker count
 *   - Section "Points de mesure et fractions de temps" :
 *       Tableau editable : SearchableSelect(MeasurementPoint) +
 *                          NumberInput(fraction 0-1) +
 *                          affichage estimatedDoseRate uSv/h
 *       Bouton "+ Ajouter point" / suppression par ligne
 *       Validation SUM(fraction) <= 1 (banner rouge sinon)
 *   - Section "Calcul dose estimee annuelle" :
 *       NumberInput "Heures travail par an" (default 1607)
 *       Affichage temps reel : SUM(fraction * doseRate * hours) en mSv
 *       Comparaison avec seuils CIPR 103 (visual indicator si >50/75/90%)
 *   - Bouton "Sauvegarder" -> setExposureProfileLinks(profileId, links)
 *   - Notice bas de page
 *
 * Sources :
 *   - getExposureProfileById(profileId)
 *   - getExposureProfileLinks(profileId)
 *   - listMeasurementPoints(mineId)
 *   - getAmbientMeasurementStats(pointId) — pour estimatedDoseRate temps reel
 *   - getAllThresholds() — pour CIPR 103 worker A/B (regulatoryLimit mSv)
 *   - setExposureProfileLinks(profileId, links)
 *
 * i18n : namespace `dosimetry` -> bloc `exposureProfile.links.editor`
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Select,
    NumberInput,
    Button,
    Alert,
} from '@mantine/core';
import {
    IconAtom2,
    IconChevronRight,
    IconArrowLeft,
    IconPlus,
    IconTrash,
    IconAlertOctagon,
    IconInfoCircle,
    IconDeviceFloppy,
    IconActivityHeartbeat,
    IconShieldCheck,
    IconCheck,
    IconCalculator,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import {
    errorNotification,
    successNotification,
} from '../../utility/NotificationUtility';
import {
    getExposureProfileById,
    getExposureProfileLinks,
    setExposureProfileLinks,
    listMeasurementPoints,
    getAmbientMeasurementStats,
    getAllThresholds,
    type ExposureProfileDTO,
    type ExposureProfileLinkDTO,
    type MeasurementPointDTO,
    type ThresholdDTO,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC tolerant
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
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

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface EditableLink {
    /** Cle stable pour le rendu (UUID-like local). */
    key: string;
    /** Id existant (null pour les nouveaux). */
    id: number | null;
    measurementPointId: number | null;
    fraction: number;
    /** uSv/h — calc. depuis getAmbientMeasurementStats(pointId).avg. */
    estimatedDoseRate: number | null;
}

const DEFAULT_HOURS = 1607;
const MAX_FRACTION_TOTAL = 1.0;

const newKey = (): string =>
    `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// CIPR 103 default thresholds (mSv/an) — fallback si aucune entree backend
const CIPR_DEFAULT_LIMIT_MSV: { workerA: number; workerB: number; public: number } = {
    workerA: 20,
    workerB: 6,
    public: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposureProfileLinkEditor = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const params = useParams<{ profileId: string }>();
    const profileId = Number(params.profileId);

    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [profile, setProfile] = useState<ExposureProfileDTO | null>(null);
    const [points, setPoints] = useState<MeasurementPointDTO[]>([]);
    const [thresholds, setThresholds] = useState<ThresholdDTO[]>([]);
    const [links, setLinks] = useState<EditableLink[]>([]);
    const [workHours, setWorkHours] = useState<number>(DEFAULT_HOURS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // ─── Chargement initial : profil + liens existants + points + thresholds ───
    useEffect(() => {
        let cancelled = false;
        if (!Number.isFinite(profileId) || profileId <= 0) {
            setLoadError(t('exposureProfile.links.editor.errors.invalidProfile'));
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);

        const profilePromise = getExposureProfileById(profileId);
        const linksPromise = getExposureProfileLinks(profileId).catch(
            () => [] as ExposureProfileLinkDTO[],
        );
        const pointsPromise = listMeasurementPoints(mineId).catch(
            () => [] as MeasurementPointDTO[],
        );
        const thresholdsPromise = getAllThresholds().catch(
            () => [] as ThresholdDTO[],
        );

        Promise.all([profilePromise, linksPromise, pointsPromise, thresholdsPromise])
            .then(([p, ls, pts, ths]) => {
                if (cancelled) return;
                setProfile(p);
                setPoints(pts.filter((pt) => pt.active !== false));
                setThresholds(Array.isArray(ths) ? ths : []);
                setLinks(
                    (ls ?? []).map<EditableLink>((l) => ({
                        key: newKey(),
                        id: l.id ?? null,
                        measurementPointId: Number(l.measurementPointId),
                        fraction: Number(l.fraction ?? 0),
                        estimatedDoseRate:
                            l.estimatedDoseRate != null
                                ? Number(l.estimatedDoseRate)
                                : null,
                    })),
                );
            })
            .catch(() => {
                if (cancelled) return;
                setLoadError(t('exposureProfile.links.editor.errors.loadFailed'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [profileId, mineId, t]);

    // ─── Resolution des stats moyennes par point (memoization simple) ───
    const fetchAvgRateForPoint = async (
        pointId: number,
    ): Promise<number | null> => {
        try {
            const stats = await getAmbientMeasurementStats(pointId);
            const v = stats?.avg;
            if (v == null) return null;
            const n = typeof v === 'number' ? v : Number(v);
            return Number.isFinite(n) ? n : null;
        } catch {
            return null;
        }
    };

    // ─── Operations sur les lignes ───
    const addLine = () => {
        setLinks((prev) => [
            ...prev,
            {
                key: newKey(),
                id: null,
                measurementPointId: null,
                fraction: 0,
                estimatedDoseRate: null,
            },
        ]);
    };

    const removeLine = (key: string) => {
        setLinks((prev) => prev.filter((l) => l.key !== key));
    };

    const handlePointChange = async (key: string, newPointId: number | null) => {
        setLinks((prev) =>
            prev.map((l) =>
                l.key === key
                    ? { ...l, measurementPointId: newPointId, estimatedDoseRate: null }
                    : l,
            ),
        );
        if (newPointId != null && newPointId > 0) {
            const rate = await fetchAvgRateForPoint(newPointId);
            setLinks((prev) =>
                prev.map((l) =>
                    l.key === key ? { ...l, estimatedDoseRate: rate } : l,
                ),
            );
        }
    };

    const handleFractionChange = (key: string, value: number | string) => {
        const num =
            typeof value === 'number'
                ? value
                : Number.isFinite(parseFloat(value as string))
                    ? parseFloat(value as string)
                    : 0;
        setLinks((prev) =>
            prev.map((l) => (l.key === key ? { ...l, fraction: num } : l)),
        );
    };

    // ─── Calculs derives ───
    const totalFraction = useMemo(
        () => links.reduce((acc, l) => acc + (Number.isFinite(l.fraction) ? l.fraction : 0), 0),
        [links],
    );

    const fractionOverflow = totalFraction > MAX_FRACTION_TOTAL + 0.0001;

    /** Dose estimee annuelle en mSv. uSv/h * fraction * hours = uSv -> /1000. */
    const estimatedAnnualMsv = useMemo(() => {
        const totalUSv = links.reduce((acc, l) => {
            if (l.estimatedDoseRate == null) return acc;
            const safeRate = Number.isFinite(l.estimatedDoseRate) ? l.estimatedDoseRate : 0;
            const safeFrac = Number.isFinite(l.fraction) ? l.fraction : 0;
            return acc + safeRate * safeFrac * workHours;
        }, 0);
        return totalUSv / 1000;
    }, [links, workHours]);

    /** Pourcentage vs limite reglementaire workerA (par defaut 20 mSv/an). */
    const ciprWorkerALimit = useMemo(() => {
        const match = thresholds.find(
            (th) =>
                th.grandeur === 'HP10'
                && th.referenceFramework === 'CIPR_103'
                && (th.personCategory === 'WORKER_A' || th.personCategory === 'A')
                && th.regulatoryLimit != null,
        );
        return match?.regulatoryLimit ?? CIPR_DEFAULT_LIMIT_MSV.workerA;
    }, [thresholds]);

    const ciprWorkerBLimit = useMemo(() => {
        const match = thresholds.find(
            (th) =>
                th.grandeur === 'HP10'
                && th.referenceFramework === 'CIPR_103'
                && (th.personCategory === 'WORKER_B' || th.personCategory === 'B')
                && th.regulatoryLimit != null,
        );
        return match?.regulatoryLimit ?? CIPR_DEFAULT_LIMIT_MSV.workerB;
    }, [thresholds]);

    const pctVsWorkerA = ciprWorkerALimit > 0
        ? (estimatedAnnualMsv / ciprWorkerALimit) * 100
        : 0;
    const pctVsWorkerB = ciprWorkerBLimit > 0
        ? (estimatedAnnualMsv / ciprWorkerBLimit) * 100
        : 0;

    const indicatorTone = (pct: number) => {
        if (pct >= 90) return { color: 'red', label: 'critical' };
        if (pct >= 75) return { color: 'orange', label: 'high' };
        if (pct >= 50) return { color: 'yellow', label: 'medium' };
        return { color: 'green', label: 'low' };
    };

    // ─── Sauvegarde ───
    const handleSave = async () => {
        if (fractionOverflow) {
            errorNotification(t('exposureProfile.links.editor.errors.fractionOverflow'));
            return;
        }
        // Verifier qu'aucune ligne n'a de point manquant
        const incomplete = links.find(
            (l) => l.measurementPointId == null || l.measurementPointId <= 0,
        );
        if (incomplete) {
            errorNotification(
                t('exposureProfile.links.editor.errors.incompleteLine'),
            );
            return;
        }
        setSaving(true);
        dispatch(showOverlay());
        try {
            const payload: ExposureProfileLinkDTO[] = links.map((l) => ({
                id: l.id ?? null,
                exposureProfileId: profileId,
                measurementPointId: Number(l.measurementPointId),
                fraction: Number(l.fraction),
            }));
            await setExposureProfileLinks(profileId, payload);
            successNotification(t('exposureProfile.links.editor.saveSuccess'));
            navigate('/dosimetry/exposure-profiles');
        } catch (err: any) {
            const msg =
                err?.response?.data?.message
                ?? err?.message
                ?? t('exposureProfile.links.editor.errors.saveFailed');
            errorNotification(String(msg));
        } finally {
            setSaving(false);
            dispatch(hideOverlay());
        }
    };

    // ─── Points selectionnes pour exclure ceux deja en usage ───
    const usedPointIds = useMemo(
        () =>
            new Set(
                links
                    .map((l) => l.measurementPointId)
                    .filter((id): id is number => id != null && id > 0),
            ),
        [links],
    );

    const buildPointOptions = (currentPointId: number | null) =>
        points
            .filter(
                (p) =>
                    p.id != null
                    && (Number(p.id) === currentPointId
                        || !usedPointIds.has(Number(p.id))),
            )
            .map((p) => ({
                value: String(p.id),
                label: `${p.code} — ${p.label}`,
            }));

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('exposureProfile.links.editor.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/exposure-profiles')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600"
                    >
                        {t('exposureProfile.links.editor.breadcrumbParent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('exposureProfile.links.editor.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Header ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
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
                                    {profile?.exposureType
                                        ?? t('exposureProfile.links.editor.untitled')}
                                </h1>
                                <p className="text-[12.5px] text-slate-600 mt-1">
                                    {t('exposureProfile.links.editor.workerHint', {
                                        workerId: profile?.workerId ?? '—',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="xs"
                                variant="default"
                                leftSection={<IconArrowLeft size={13} stroke={1.8} />}
                                onClick={() => navigate('/dosimetry/exposure-profiles')}
                            >
                                {t('exposureProfile.links.editor.back')}
                            </Button>
                            {canWrite && (
                                <Button
                                    size="xs"
                                    color="indigo"
                                    leftSection={<IconDeviceFloppy size={13} stroke={1.8} />}
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={fractionOverflow || loading}
                                >
                                    {t('exposureProfile.links.editor.save')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Banner erreur globale ─── */}
                {loadError && (
                    <Alert
                        color="red"
                        variant="light"
                        icon={<IconAlertOctagon size={16} />}
                        className="mb-4"
                    >
                        {loadError}
                    </Alert>
                )}

                {/* ─── Banner depassement fraction ─── */}
                {!loading && fractionOverflow && (
                    <Alert
                        color="red"
                        variant="filled"
                        icon={<IconAlertOctagon size={16} />}
                        className="mb-4"
                    >
                        <span className="font-medium">
                            {t('exposureProfile.links.editor.errors.fractionOverflow')}
                        </span>{' '}
                        <span className="ml-1 text-[11px] opacity-90">
                            {t('exposureProfile.links.editor.totalLabel', {
                                value: totalFraction.toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4,
                                }),
                            })}
                        </span>
                    </Alert>
                )}

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-12 text-center text-slate-500 text-[13px]">
                        <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('exposureProfile.links.editor.loading')}
                    </div>
                ) : (
                    <>
                        {/* ─── Section : Points & fractions ─── */}
                        <section className="bg-white border border-slate-200 rounded-xl shadow-sm mb-5">
                            <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        <IconActivityHeartbeat size={14} stroke={1.8} />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">
                                            {t('exposureProfile.links.editor.sections.points.title')}
                                        </h2>
                                        <p className="text-[11.5px] text-slate-500 leading-tight">
                                            {t('exposureProfile.links.editor.sections.points.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono tabular-nums ${
                                            fractionOverflow
                                                ? 'bg-red-50 border-red-200 text-red-700'
                                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        }`}
                                        title={t('exposureProfile.links.editor.totalTitle')}
                                    >
                                        {fractionOverflow ? (
                                            <IconAlertOctagon size={11} stroke={1.8} />
                                        ) : (
                                            <IconCheck size={11} stroke={1.8} />
                                        )}
                                        Σ {totalFraction.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 4,
                                        })}
                                        {' / 1.00'}
                                    </span>
                                    {canWrite && (
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="indigo"
                                            leftSection={<IconPlus size={13} stroke={1.8} />}
                                            onClick={addLine}
                                        >
                                            {t('exposureProfile.links.editor.addPoint')}
                                        </Button>
                                    )}
                                </div>
                            </header>

                            <div className="px-4 py-3">
                                {links.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-[12.5px]">
                                        {t('exposureProfile.links.editor.noLinks')}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[12.5px]">
                                            <thead>
                                                <tr className="text-left text-[10.5px] uppercase tracking-[0.1em] text-slate-500 border-b border-slate-100">
                                                    <th className="py-2 pr-2 font-semibold">
                                                        {t('exposureProfile.links.editor.table.point')}
                                                    </th>
                                                    <th className="py-2 px-2 font-semibold w-[180px]">
                                                        {t('exposureProfile.links.editor.table.fraction')}
                                                    </th>
                                                    <th className="py-2 px-2 font-semibold w-[160px]">
                                                        {t('exposureProfile.links.editor.table.doseRate')}
                                                    </th>
                                                    <th className="py-2 pl-2 w-[60px]"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {links.map((l) => (
                                                    <tr
                                                        key={l.key}
                                                        className="border-b border-slate-50 last:border-b-0 align-top"
                                                    >
                                                        <td className="py-2 pr-2">
                                                            <Select
                                                                size="xs"
                                                                searchable
                                                                placeholder={t(
                                                                    'exposureProfile.links.editor.pickPoint',
                                                                )}
                                                                data={buildPointOptions(
                                                                    l.measurementPointId,
                                                                )}
                                                                value={
                                                                    l.measurementPointId != null
                                                                        ? String(l.measurementPointId)
                                                                        : null
                                                                }
                                                                onChange={(v) =>
                                                                    handlePointChange(
                                                                        l.key,
                                                                        v != null ? Number(v) : null,
                                                                    )
                                                                }
                                                                disabled={!canWrite}
                                                                nothingFoundMessage={t(
                                                                    'exposureProfile.links.editor.noPointFound',
                                                                )}
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <NumberInput
                                                                size="xs"
                                                                min={0}
                                                                max={1}
                                                                step={0.05}
                                                                decimalScale={4}
                                                                clampBehavior="strict"
                                                                value={l.fraction}
                                                                onChange={(v) =>
                                                                    handleFractionChange(l.key, v)
                                                                }
                                                                disabled={!canWrite}
                                                                hideControls={false}
                                                                error={
                                                                    l.fraction < 0 || l.fraction > 1
                                                                        ? t(
                                                                              'exposureProfile.links.editor.errors.fractionRange',
                                                                          )
                                                                        : undefined
                                                                }
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[11.5px] font-mono tabular-nums text-slate-700">
                                                                {l.estimatedDoseRate != null
                                                                    ? l.estimatedDoseRate.toLocaleString(
                                                                          'fr-FR',
                                                                          {
                                                                              minimumFractionDigits: 2,
                                                                              maximumFractionDigits: 3,
                                                                          },
                                                                      )
                                                                    : '—'}
                                                                <span className="text-[9.5px] text-slate-400">
                                                                    µSv/h
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 pl-2 text-right">
                                                            {canWrite && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeLine(l.key)}
                                                                    className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                                    title={t(
                                                                        'exposureProfile.links.editor.removeLine',
                                                                    )}
                                                                    aria-label={t(
                                                                        'exposureProfile.links.editor.removeLine',
                                                                    )}
                                                                >
                                                                    <IconTrash size={13} stroke={1.8} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ─── Section : Calcul dose estimee annuelle ─── */}
                        <section className="bg-white border border-slate-200 rounded-xl shadow-sm mb-5">
                            <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
                                    <IconCalculator size={14} stroke={1.8} />
                                </span>
                                <div>
                                    <h2 className="text-[14px] font-semibold text-slate-800 leading-tight">
                                        {t('exposureProfile.links.editor.sections.estimate.title')}
                                    </h2>
                                    <p className="text-[11.5px] text-slate-500 leading-tight">
                                        {t('exposureProfile.links.editor.sections.estimate.subtitle')}
                                    </p>
                                </div>
                            </header>

                            <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11.5px] uppercase tracking-[0.1em] font-semibold text-slate-600 mb-1">
                                        {t('exposureProfile.links.editor.workHours')}
                                    </label>
                                    <NumberInput
                                        size="sm"
                                        min={0}
                                        max={8760}
                                        step={50}
                                        value={workHours}
                                        onChange={(v) => {
                                            const n =
                                                typeof v === 'number'
                                                    ? v
                                                    : Number.isFinite(parseFloat(v as string))
                                                        ? parseFloat(v as string)
                                                        : DEFAULT_HOURS;
                                            setWorkHours(n);
                                        }}
                                        disabled={!canWrite}
                                        suffix=" h/an"
                                    />
                                    <p className="mt-1 text-[10.5px] text-slate-500">
                                        {t('exposureProfile.links.editor.workHoursHint', {
                                            defaultHours: DEFAULT_HOURS,
                                        })}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                    <p className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-slate-600 mb-1">
                                        {t('exposureProfile.links.editor.totalAnnualLabel')}
                                    </p>
                                    <p className="font-mono text-[24px] font-bold text-slate-800 leading-none tabular-nums">
                                        {estimatedAnnualMsv.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 3,
                                            maximumFractionDigits: 3,
                                        })}
                                        <span className="ml-1 text-[12px] text-slate-400 font-medium">
                                            mSv/an
                                        </span>
                                    </p>
                                    <p className="mt-1 text-[10.5px] text-slate-500">
                                        {t('exposureProfile.links.editor.formula')}
                                    </p>
                                </div>
                            </div>

                            {/* Comparaisons aux seuils CIPR 103 */}
                            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CiprComparison
                                    label={t('exposureProfile.links.editor.cipr.workerA', {
                                        limit: ciprWorkerALimit,
                                    })}
                                    pct={pctVsWorkerA}
                                    indicatorTone={indicatorTone}
                                />
                                <CiprComparison
                                    label={t('exposureProfile.links.editor.cipr.workerB', {
                                        limit: ciprWorkerBLimit,
                                    })}
                                    pct={pctVsWorkerB}
                                    indicatorTone={indicatorTone}
                                />
                            </div>
                        </section>

                        {/* ─── Footer / sauvegarde ─── */}
                        <div className="flex items-center justify-end gap-2 mb-6">
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => navigate('/dosimetry/exposure-profiles')}
                            >
                                {t('exposureProfile.links.editor.cancel')}
                            </Button>
                            {canWrite && (
                                <Button
                                    size="sm"
                                    color="indigo"
                                    leftSection={<IconDeviceFloppy size={14} stroke={1.8} />}
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={fractionOverflow}
                                >
                                    {t('exposureProfile.links.editor.save')}
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {/* ─── Notice ─── */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5 inline-flex items-center gap-1">
                            <IconShieldCheck size={13} stroke={1.8} className="text-indigo-600" />
                            {t('exposureProfile.links.editor.notice.title')}
                        </p>
                        <p>{t('exposureProfile.links.editor.notice.body')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function CiprComparison({
    label,
    pct,
    indicatorTone,
}: {
    label: string;
    pct: number;
    indicatorTone: (pct: number) => { color: string; label: string };
}) {
    const tone = indicatorTone(pct);
    const colorMap: Record<
        string,
        { bar: string; text: string; bg: string; border: string }
    > = {
        green: {
            bar: 'bg-emerald-500',
            text: 'text-emerald-700',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
        },
        yellow: {
            bar: 'bg-amber-500',
            text: 'text-amber-700',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
        },
        orange: {
            bar: 'bg-orange-500',
            text: 'text-orange-700',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        },
        red: {
            bar: 'bg-red-500',
            text: 'text-red-700',
            bg: 'bg-red-50',
            border: 'border-red-200',
        },
    };
    const c = colorMap[tone.color] ?? colorMap.green;
    const clamped = Math.max(0, Math.min(100, pct));
    return (
        <div className={`rounded-lg border ${c.border} ${c.bg} px-3 py-2.5`}>
            <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-slate-600">
                    {label}
                </span>
                <span
                    className={`font-mono text-[11.5px] font-bold tabular-nums ${c.text}`}
                >
                    {pct.toLocaleString('fr-FR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    })}
                    %
                </span>
            </div>
            <div className="w-full h-1.5 rounded bg-white/70 overflow-hidden border border-white">
                <div
                    className={`h-full ${c.bar} transition-all`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}

export default ExposureProfileLinkEditor;
