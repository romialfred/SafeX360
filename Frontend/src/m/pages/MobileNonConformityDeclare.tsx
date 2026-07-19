/**
 * MobileNonConformityDeclare — Déclaration terrain d'une non-conformité,
 * d'un quasi-accident ou d'un danger.
 *
 * Contrat backend (aligné sur le web NonConformityForm) :
 *   POST /hns/non-conformity/create
 *   { nonConformity: { type, title, date, detectionDate, reportedBy,
 *     workProcessId, locationId, categoryId, description, requirement,
 *     evidence: [], docs: [], status: null }, analysis: {}, correctiveActions: [] }
 * Référentiels : locations/getAllActive, work-process/getAllActive,
 * incidents-category/getAllActive.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconAlertOctagon } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useRedirectTimer } from '../hooks/useRedirectTimer';
import { getCached, mutateOffline } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { positiveMineId } from '../../utils/activeMine';
import { MobileButton, MobileCard, MobileErrorState, toIsoDateLocal } from '../components/MobileUI';
import { MSelectSheet, MSegment, MDateField, MTextArea, MTextField, MSelectOption } from '../components/MobileForm';

const todayIso = () => toIsoDateLocal();

/** Charge un référentiel {id,name}[] en options de sélecteur. */
function useRefOptions(endpoint: string, cacheKey: string) {
    const [options, setOptions] = useState<MSelectOption[]>([]);
    const [failed, setFailed] = useState(false);
    const load = useCallback(() => {
        setFailed(false);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any[]>({
                    endpoint, cacheStore: 'inspectionCache', cacheKey, ttlMs: 10 * 60 * 1000,
                });
                if (!cancelled) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setOptions(list.map((x) => ({
                        value: String(x.id),
                        label: String(x.name ?? x.label ?? x.title ?? `#${x.id}`),
                    })));
                }
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => { cancelled = true; };
    }, [endpoint, cacheKey]);
    useEffect(load, [load]);
    return { options, failed, reload: load };
}

export default function MobileNonConformityDeclare() {
    useStatusBarColor('#DC2626', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const redirectAfter = useRedirectTimer();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.empId ?? user?.id ?? 0);
    // Mine mono-tenant du terrain : jamais de repli fabriqué (1/0/NaN). null → bloqué au submit.
    const companyId = positiveMineId(user?.mineId) ?? positiveMineId(user?.companyId);

    const locations = useRefOptions('/hns/locations/getAllActive', `nc-locations-${companyId}`);
    const processes = useRefOptions('/hns/work-process/getAllActive', `nc-processes-${companyId}`);
    const categories = useRefOptions('/hns/incidents-category/getAllActive', `nc-categories-${companyId}`);

    const [type, setType] = useState<string>('NON_CONFORMITY');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirement, setRequirement] = useState('');
    const [eventDate, setEventDate] = useState(todayIso());
    const [locationId, setLocationId] = useState<string | null>(null);
    const [workProcessId, setWorkProcessId] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);

    const [sending, setSending] = useState(false);
    const [done, setDone] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const refsFailed = locations.failed || processes.failed || categories.failed;
    const canSubmit = title.trim().length >= 3
        && description.trim().length >= 5
        && locationId !== null && workProcessId !== null && categoryId !== null
        && (type === 'NEAR_MISS' || requirement.trim().length > 0)
        && !sending;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        if (companyId === null) {
            haptic('error');
            setSubmitError('Aucune mine valide associée à votre compte. Reconnectez-vous puis réessayez.');
            return;
        }
        setSending(true);
        setSubmitError(null);
        haptic('medium');
        try {
            const payload = {
                nonConformity: {
                    type,
                    title: title.trim(),
                    date: eventDate,
                    detectionDate: eventDate,
                    reportedBy: userId,
                    workProcessId: Number(workProcessId),
                    locationId: Number(locationId),
                    categoryId: Number(categoryId),
                    description: description.trim(),
                    requirement: type === 'NEAR_MISS' ? null : requirement.trim(),
                    evidence: [],
                    docs: [],
                    // Tableaux vides obligatoires : NonConformityDTO.toEntity() fait
                    // factors.toString()/events.toString()/indirectImpacts.toString()
                    // sans garde null → NPE 500 si absents du payload.
                    factors: [],
                    events: [],
                    indirectImpacts: [],
                    status: null,
                },
                analysis: {},
                correctiveActions: [],
            };
            // companyId en query param : @RequestParam OBLIGATOIRE côté backend —
            // l'injection auto de l'intercepteur dépend d'un store parfois vide
            // dans l'APK (400 systématique sinon). Fingerprint = anti-doublon
            // si l'utilisateur re-déclare pendant une file hors ligne.
            const result = await mutateOffline({
                endpoint: `/hns/non-conformity/create?companyId=${companyId}`,
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'nonconformity',
                fingerprint: `nc:${userId}:${title.trim()}:${eventDate}`,
            });
            haptic('success');
            setDone(result.online
                ? 'Événement déclaré. Le responsable HSE est notifié.'
                : 'Déclaration sauvegardée hors ligne. Sera transmise au retour du réseau.');
            redirectAfter(() => navigate('/m/non-conformities'), 2200);
        } catch {
            haptic('error');
            setSubmitError('Échec de la déclaration. Réessayez.');
        } finally {
            setSending(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg ring-2 ring-emerald-200 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                        <IconCheck size={28} stroke={2.4} className="text-emerald-700" />
                    </div>
                    <p className="text-[15px] font-semibold text-slate-900">{done}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <MobileTopBar title="Déclarer un événement" subtitle="Non-conformité · Quasi-accident · Danger" accent="#DC2626" onBack={() => navigate(-1)} />

            <div className="px-4 pt-4 pb-8 space-y-4">
                <MobileCard>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                            <IconAlertOctagon size={18} stroke={1.8} />
                        </div>
                        <p className="text-[12.5px] text-slate-600">
                            Déclaration transmise pour analyse (ISO 45001 · 10.2).
                        </p>
                    </div>
                </MobileCard>

                {refsFailed && (
                    <MobileErrorState
                        message="Référentiels indisponibles — vérifiez la connexion."
                        onRetry={() => { locations.reload(); processes.reload(); categories.reload(); }}
                    />
                )}

                <MSegment
                    label="Type d'événement"
                    required
                    value={type}
                    onChange={setType}
                    options={[
                        { value: 'NON_CONFORMITY', label: 'Non-conf.' },
                        { value: 'NEAR_MISS', label: 'Quasi-acc.' },
                        { value: 'HAZARD', label: 'Danger' },
                    ]}
                />

                <MTextField label="Titre" required value={title} onChange={setTitle} placeholder="Ex. : garde-corps manquant niveau 2" />
                <MDateField label="Date de l'événement" required value={eventDate} onChange={setEventDate} />
                <MSelectSheet label="Lieu" required value={locationId} onChange={setLocationId} options={locations.options} />
                <MSelectSheet label="Processus de travail" required value={workProcessId} onChange={setWorkProcessId} options={processes.options} />
                <MSelectSheet label="Catégorie" required value={categoryId} onChange={setCategoryId} options={categories.options} />

                {type !== 'NEAR_MISS' && (
                    <MTextField
                        label="Exigence non respectée"
                        required
                        value={requirement}
                        onChange={setRequirement}
                        placeholder="Ex. : procédure LOTO §4.2"
                    />
                )}

                <MTextArea label="Description" required value={description} onChange={setDescription} placeholder="Décrivez les faits observés…" />

                {submitError && <MobileErrorState message={submitError} />}

                <MobileButton accent="#DC2626" loading={sending} disabled={!canSubmit} onClick={handleSubmit}>
                    Déclarer l'événement
                </MobileButton>
            </div>
        </>
    );
}
