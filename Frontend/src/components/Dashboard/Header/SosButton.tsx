import { useState } from 'react';
import { Button, Modal, Textarea, Tooltip, Loader, Alert, Select } from '@mantine/core';
import { IconUrgent, IconMapPin, IconClock, IconCheck, IconPhone } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { createSosAlert } from '../../../services/SosService';
import { enqueueSos } from '../../../utility/OfflineSosQueue';

/**
 * Bouton SOS : signal d'urgence direct au coordinateur HSE.
 * Capture la géolocalisation de l'utilisateur, son identité et un message libre.
 * Envoi simulé côté frontend (à brancher sur un endpoint backend en Phase 2.b).
 */
const SosButton = () => {
    const { t } = useTranslation('navigation');
    const navigate = useNavigate();
    const [opened, { open, close }] = useDisclosure(false);
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const [message, setMessage] = useState('');
    const [reasonCode, setReasonCode] = useState<string | null>('MEDICAL');
    const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            return;
        }
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setLocationStatus('granted');
            },
            () => setLocationStatus('denied'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleOpen = () => {
        open();
        setSent(false);
        requestLocation();
    };

    const handleClose = () => {
        close();
        setMessage('');
        setPosition(null);
        setLocationStatus('idle');
        setSent(false);
    };

    const handleSend = async () => {
        if (!selectedCompanyId || !user?.id) {
            errorNotification("Mine ou utilisateur non identifié. Contactez l'administrateur.");
            return;
        }
        setSending(true);
        const payload = {
            companyId: selectedCompanyId,
            employeeId: Number(user.id),
            reasonCode: reasonCode ?? 'AUTRE',
            description: message || null,
            latitude: position?.lat ?? 0,
            longitude: position?.lng ?? 0,
            gpsAccuracy: position?.accuracy ?? null,
            status: 'RECEIVED' as const,
            drillMode: false,
        };
        try {
            const saved = await createSosAlert(payload, Number(user.id));
            setSent(true);
            successNotification("Signal SOS transmis. Les coordinateurs HSE sont notifiés en temps réel.");
            setTimeout(() => {
                handleClose();
                if (saved.id) navigate(`/emergency/sos/${saved.id}`);
            }, 2000);
        } catch {
            // ── Fallback hors-ligne : enqueue dans IndexedDB ──
            try {
                await enqueueSos(payload, Number(user.id));
                setSent(true);
                successNotification(
                    "Signal SOS enregistré localement. Sera transmis automatiquement dès reconnexion réseau."
                );
                setTimeout(handleClose, 2500);
            } catch {
                errorNotification(
                    "Échec critique : impossible de stocker l'alerte. Contactez le poste de garde HSE par radio."
                );
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Tooltip label={t('header.sosTooltip')} position="bottom">
                <button
                    onClick={handleOpen}
                    className="safex-gyrophare-sos group relative inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white text-[12px] font-bold uppercase tracking-[0.15em] shadow-[0_4px_14px_rgba(239,68,68,0.45)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)] ring-1 ring-red-400/60 hover:scale-[1.03] transition-all duration-200 overflow-visible"
                >
                    {/* Halos gyrophare — 3 anneaux pulsés décalés */}
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--red"></span>
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--red safex-gyrophare-ring--delay-1"></span>
                    {/* Glow intérieur */}
                    <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none"></span>
                    {/* Icône dans cercle blanc semi-transparent (effet boîte d'alarme) */}
                    <span aria-hidden className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30 group-hover:ring-white/50 transition-all">
                        <IconUrgent size={13} stroke={2.4} className="drop-shadow-sm" />
                    </span>
                    <span className="relative z-10 drop-shadow-sm">{t('header.sos')}</span>
                </button>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={handleClose}
                centered
                size="md"
                radius="md"
                withCloseButton={!sending}
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <IconUrgent size={18} className="text-red-700" />
                        </div>
                        <div>
                            <p className="text-base text-slate-900">Signal SOS</p>
                            <p className="text-[11px] text-slate-500">Urgence vitale, transmission immédiate au coordinateur HSE</p>
                        </div>
                    </div>
                }
            >
                {sent ? (
                    <Alert color="green" icon={<IconCheck size={18} />} variant="light">
                        <p className="font-medium">Signal transmis</p>
                        <p className="text-xs mt-1">Le coordinateur HSE et l'équipe d'intervention ont reçu votre signal. Restez sur place si possible.</p>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {/* Identité utilisateur */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm">
                                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 truncate">{user?.name || 'Utilisateur'}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.role || 'Rôle non défini'}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <IconClock size={12} />
                                <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        {/* Localisation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-start gap-3">
                            <IconMapPin size={18} className="text-slate-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-xs">
                                <p className="text-slate-900">Position GPS</p>
                                {locationStatus === 'requesting' && (
                                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                                        <Loader size="xs" />
                                        <span>Capture en cours</span>
                                    </div>
                                )}
                                {locationStatus === 'granted' && position && (
                                    <div className="mt-1 text-slate-700 font-mono">
                                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                        <span className="text-slate-500"> (précision {Math.round(position.accuracy)} m)</span>
                                    </div>
                                )}
                                {locationStatus === 'denied' && (
                                    <p className="mt-1 text-orange-600">
                                        Localisation indisponible. Le signal sera envoyé sans position.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Motif (catégorie) */}
                        <Select
                            label="Motif de l'urgence"
                            placeholder="Sélectionnez le type d'urgence"
                            data={[
                                { value: 'MEDICAL', label: 'Urgence médicale (malaise, blessure)' },
                                { value: 'ACCIDENT_TRAVAIL', label: 'Accident du travail' },
                                { value: 'INCENDIE', label: 'Incendie / Fumée' },
                                { value: 'AGRESSION', label: 'Agression / Menace' },
                                { value: 'FUITE_CHIMIQUE', label: 'Fuite chimique' },
                                { value: 'EFFONDREMENT', label: 'Effondrement / Éboulement' },
                                { value: 'AUTRE', label: 'Autre urgence' },
                            ]}
                            value={reasonCode}
                            onChange={setReasonCode}
                            size="sm"
                        />

                        {/* Message d'urgence */}
                        <Textarea
                            label="Description de l'urgence (optionnel)"
                            placeholder="Décrivez brièvement la situation (ex. blessure grave, incendie, fuite chimique)"
                            autosize
                            minRows={2}
                            maxRows={4}
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                            size="sm"
                        />

                        {/* Numéro d'urgence */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                            <IconPhone size={16} className="text-red-700" />
                            <p className="text-xs text-red-900">
                                <span className="font-medium">En cas d'urgence vitale immédiate, appelez aussi le poste de garde HSE :</span>
                                <span className="font-mono ml-1">+226 25 30 00 00</span>
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={handleClose} disabled={sending}>
                                Annuler
                            </Button>
                            <Button
                                color="red"
                                size="sm"
                                onClick={handleSend}
                                loading={sending}
                                leftSection={<IconUrgent size={15} />}
                            >
                                Transmettre le signal SOS
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default SosButton;
