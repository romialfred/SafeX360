/**
 * MobilePpeRequestNew — Demande d'EPI depuis le terrain.
 *
 * Contrat backend (aligné sur le web PPERequestsTable) :
 *   POST /hns/ppe-request/create
 *   { empIds: number[], ppeIds: number[], desiredDate: 'yyyy-MM-dd',
 *     priority: 'High'|'Medium'|'Low', reason: string }
 * Hors ligne : mutateOffline met la demande en file (kind ppe.request).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconShieldHalf } from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useRedirectTimer } from '../hooks/useRedirectTimer';
import { getCached, mutateOffline } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { MobileButton, MobileCard, MobileErrorState, toIsoDateLocal } from '../components/MobileUI';
import { MSelectSheet, MSegment, MDateField, MTextArea, MSelectOption } from '../components/MobileForm';

const todayIso = () => toIsoDateLocal();

export default function MobilePpeRequestNew() {
    useStatusBarColor('#059669', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const redirectAfter = useRedirectTimer();
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.empId ?? user?.id ?? 0);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [ppeOptions, setPpeOptions] = useState<MSelectOption[]>([]);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    const [ppeId, setPpeId] = useState<string | null>(null);
    const [priority, setPriority] = useState<string>('Medium');
    const [desiredDate, setDesiredDate] = useState<string>(todayIso());
    const [reason, setReason] = useState('');

    const [sending, setSending] = useState(false);
    const [done, setDone] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const loadOptions = useCallback(() => {
        setOptionsError(null);
        let cancelled = false;
        (async () => {
            try {
                const res = await getCached<any[]>({
                    endpoint: '/hns/ppe/getActive',
                    cacheStore: 'inspectionCache',
                    cacheKey: `ppe-catalog-${companyId}`,
                    ttlMs: 5 * 60 * 1000,
                });
                if (!cancelled) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setPpeOptions(list.map((p) => ({
                        value: String(p.id),
                        label: String(p.name ?? `EPI #${p.id}`),
                        hint: p.category ?? undefined,
                    })));
                }
            } catch {
                if (!cancelled) setOptionsError('Catalogue EPI indisponible — vérifiez votre connexion.');
            }
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    useEffect(loadOptions, [loadOptions]);

    const canSubmit = ppeId !== null && reason.trim().length >= 3 && desiredDate && !sending;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSending(true);
        setSubmitError(null);
        haptic('medium');
        try {
            const payload = {
                empIds: [userId],
                ppeIds: [Number(ppeId)],
                desiredDate,
                priority,
                reason: reason.trim(),
            };
            // Fingerprint anti-doublon : même article + même date pendant une
            // file hors ligne = une seule mutation en queue.
            const result = await mutateOffline({
                endpoint: '/hns/ppe-request/create',
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'ppe.request',
                fingerprint: `ppe:${userId}:${ppeId}:${desiredDate}`,
            });
            haptic('success');
            setDone(result.online
                ? 'Demande transmise. Le magasin EPI est notifié.'
                : 'Demande sauvegardée hors ligne. Sera transmise au retour du réseau.');
            redirectAfter(() => navigate('/m/ppe/requests'), 2200);
        } catch {
            haptic('error');
            setSubmitError('Échec de l\'envoi de la demande. Réessayez.');
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
            <MobileTopBar title="Demande d'EPI" subtitle="Dotation personnelle" accent="#059669" onBack={() => navigate(-1)} />

            <div className="px-4 pt-4 pb-8 space-y-4">
                <MobileCard>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <IconShieldHalf size={18} stroke={1.8} />
                        </div>
                        <p className="text-[12.5px] text-slate-600">
                            La demande est transmise au magasin EPI pour validation.
                        </p>
                    </div>
                </MobileCard>

                {optionsError && <MobileErrorState message={optionsError} onRetry={loadOptions} />}

                <MSelectSheet
                    label="Équipement"
                    required
                    value={ppeId}
                    onChange={setPpeId}
                    options={ppeOptions}
                    placeholder="Choisir un EPI…"
                />

                <MSegment
                    label="Priorité"
                    required
                    value={priority}
                    onChange={setPriority}
                    options={[
                        { value: 'Low', label: 'Faible' },
                        { value: 'Medium', label: 'Moyenne' },
                        { value: 'High', label: 'Élevée' },
                    ]}
                />

                <MDateField label="Date souhaitée" required value={desiredDate} onChange={setDesiredDate} />

                <MTextArea
                    label="Motif"
                    required
                    value={reason}
                    onChange={setReason}
                    placeholder="Ex. : casque endommagé, dotation initiale…"
                />

                {submitError && <MobileErrorState message={submitError} />}

                <MobileButton accent="#059669" loading={sending} disabled={!canSubmit} onClick={handleSubmit}>
                    Envoyer la demande
                </MobileButton>
            </div>
        </>
    );
}
