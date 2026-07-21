/**
 * MobileBlastDetail — Fiche d'un tir de mine (lecture terrain).
 *
 * Source : GET /hns/blast/detail/{id} (BlastDetailDTO). Le terrain
 * consulte zone, rayon d'exclusion, points de rassemblement, équipe —
 * les transitions d'état (confirmer, tirer…) restent sur le web
 * (habilitations boutefeu/BLAST_ADMIN).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileTopBar from '../components/MobileTopBar';
import { CardSkeleton } from '../components/MobileSkeleton';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getBlastDetail, BlastDetailDTO, BlastStatus } from '../../services/BlastService';
import {
    MobileCard, MobileChip, MobileDetailRow, MobileErrorState, MobileSection, ChipTone, SERIF,
} from '../components/MobileUI';

const STATUS_META: Record<BlastStatus, { label: string; tone: ChipTone }> = {
    DRAFT: { label: 'Brouillon', tone: 'slate' },
    PLANNED: { label: 'Planifié', tone: 'cyan' },
    CONFIRMED: { label: 'Confirmé', tone: 'amber' },
    IMMINENT: { label: 'Imminent', tone: 'orange' },
    FIRED: { label: 'Tiré', tone: 'slate' },
    ALL_CLEAR: { label: 'Fin d\'alerte', tone: 'emerald' },
    MISFIRE: { label: 'Raté : verrouillé', tone: 'rose' },
    CANCELLED: { label: 'Annulé', tone: 'slate' },
    POSTPONED: { label: 'Reporté', tone: 'slate' },
};

export default function MobileBlastDetail() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const { id } = useParams<{ id: string }>();

    const [blast, setBlast] = useState<BlastDetailDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!id) return;
        setError(null);
        setBlast(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getBlastDetail(Number(id));
                if (!cancelled) {
                    if (res && typeof res === 'object') setBlast(res);
                    else setError('Tir introuvable.');
                }
            } catch {
                if (!cancelled) setError('Impossible de charger ce tir.');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    useEffect(fetchData, [fetchData]);

    const st = blast ? (STATUS_META[blast.status] ?? { label: blast.status, tone: 'slate' as ChipTone }) : null;
    const zone = blast ? [blast.pit, blast.bench, blast.block].filter(Boolean).join(' · ') : '';

    return (
        <>
            <MobileTopBar title="Détail du tir" subtitle="Dynamitage" accent="#B45309" onBack={() => navigate(-1)} />

            <div className="px-4 pt-4 space-y-3 pb-8">
                {error && <MobileErrorState message={error} onRetry={() => { haptic('light'); fetchData(); }} />}
                {!blast && !error && <CardSkeleton />}

                {blast && st && (
                    <>
                        <MobileCard>
                            <div className="mb-1.5"><MobileChip tone={st.tone}>{st.label}</MobileChip></div>
                            <h1 className="text-[17px] font-semibold text-slate-900" style={{ fontFamily: SERIF }}>
                                {blast.reference}
                            </h1>
                            <p className="text-[12.5px] text-slate-600 mt-0.5">
                                {blast.scheduledAt
                                    ? new Date(blast.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
                                    : 'Horaire non défini'}
                            </p>
                        </MobileCard>

                        <MobileSection title="Localisation & sécurité">
                            <MobileCard>
                                <MobileDetailRow label="Zone" value={zone || '—'} />
                                <MobileDetailRow label="Rayon d'exclusion" value={blast.exclusionRadiusM != null ? `${blast.exclusionRadiusM} m` : '—'} />
                                <MobileDetailRow label="Voies d'accès concernées" value={blast.accessConcerned ?? '—'} />
                                <MobileDetailRow label="Points de rassemblement" value={blast.assemblyPoints ?? '—'} />
                                <MobileDetailRow label="Récepteurs sensibles" value={blast.sensitiveReceivers ?? '—'} />
                            </MobileCard>
                        </MobileSection>

                        <MobileSection title="Organisation">
                            <MobileCard>
                                <MobileDetailRow label="Type de tir" value={blast.type ?? '—'} />
                                <MobileDetailRow label="Équipe de tir" value={blast.team ?? '—'} />
                                <MobileDetailRow label="Limite PPV" value={blast.ppvLimit != null ? `${blast.ppvLimit} mm/s` : '—'} />
                            </MobileCard>
                        </MobileSection>

                        {(blast.notes || blast.misfireResolutionNotes) && (
                            <MobileSection title="Notes">
                                <MobileCard>
                                    {blast.notes && (
                                        <p className="text-[13px] text-slate-800 whitespace-pre-wrap">{blast.notes}</p>
                                    )}
                                    {blast.misfireResolutionNotes && (
                                        <p className="text-[12.5px] text-rose-700 mt-2 whitespace-pre-wrap">
                                            Résolution du raté : {blast.misfireResolutionNotes}
                                        </p>
                                    )}
                                </MobileCard>
                            </MobileSection>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
