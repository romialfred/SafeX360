import { useState } from 'react';
import { Button, Modal, Checkbox, Radio, MultiSelect, Tooltip, Alert, Textarea, Group, Loader } from '@mantine/core';
import { IconBroadcast, IconCheck, IconAlertTriangle, IconUsers, IconDeviceMobile, IconMail, IconBell } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { useAppSelector } from '../../../slices/hooks';
import { triggerAlert } from '../../../services/GeneralAlertService';
import { useNavigate } from 'react-router-dom';

/**
 * Bouton Alerte Générale : déclenche une notification multicanal (web, mobile, SMS) à tous les employés.
 * Formulaire compact pour configurer le périmètre (toutes zones / sélection) et les actions attendues.
 */
const GeneralAlertButton = () => {
    const { t } = useTranslation('navigation');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const [opened, { open, close }] = useDisclosure(false);

    // Type d'alerte
    const [alertType, setAlertType] = useState<string>('mandatory-assembly');

    // Zones (toutes par défaut)
    const [zoneScope, setZoneScope] = useState<'all' | 'selection'>('all');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);

    // Canaux de notification
    const [channels, setChannels] = useState<string[]>(['web', 'mobile', 'sms']);

    // Message libre
    const [message, setMessage] = useState('');

    // États
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // TODO Phase 2.b : charger les zones depuis l'API /hns/locations/getAll
    const availableZones = [
        { value: 'open-pit-north', label: 'Open Pit North' },
        { value: 'open-pit-south', label: 'Open Pit South' },
        { value: 'crushing-station', label: 'Crushing Station' },
        { value: 'heap-leach', label: 'Heap Leach Pad' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'magazine', label: 'Explosive Magazine' },
        { value: 'tailings', label: 'Tailings Storage Facility' },
        { value: 'office-camp', label: 'Office Camp' },
    ];

    const handleClose = () => {
        close();
        setAlertType('mandatory-assembly');
        setZoneScope('all');
        setSelectedZones([]);
        setChannels(['web', 'mobile', 'sms']);
        setMessage('');
        setSent(false);
    };

    const handleSend = async () => {
        if (channels.length === 0) {
            errorNotification("Sélectionnez au moins un canal de notification.");
            return;
        }
        if (zoneScope === 'selection' && selectedZones.length === 0) {
            errorNotification("Sélectionnez au moins une zone ou choisissez l'option « Toutes les zones ».");
            return;
        }

        if (!selectedCompanyId || !user?.id) {
            errorNotification("Mine ou utilisateur non identifié. Contactez l'administrateur.");
            return;
        }

        setSending(true);

        try {
            const reasonCode = (alertType ?? 'EVACUATION_GENERALE')
                .toUpperCase()
                .replace(/-/g, '_');
            const saved = await triggerAlert(
                {
                    companyId: selectedCompanyId,
                    reasonCode,
                    // Message par défaut — sera diffusé en TTS si l'utilisateur n'a rien saisi.
                    // Le listener ajoute automatiquement le préfixe "Ceci n'est pas un exercice".
                    message: message || (
                        alertType === 'mandatory-assembly'
                            ? 'Rassemblement obligatoire à votre point d\'évacuation désigné.'
                            : 'Évacuation immédiate.'
                    ),
                    drillMode: false,
                },
                Number(user.id)
            );
            setSent(true);
            successNotification('Alerte Générale déclenchée. Tous les employés sont notifiés en temps réel.');
            setTimeout(() => {
                handleClose();
                if (saved.id) navigate(`/emergency/alerts/general/${saved.id}`);
            }, 2200);
        } catch (e: any) {
            errorNotification("Échec du déclenchement de l'alerte. Contactez l'administrateur système.");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Tooltip label={t('header.alertTooltip')} position="bottom">
                <button
                    onClick={open}
                    className="safex-gyrophare-alert group relative inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:via-orange-700 hover:to-amber-700 text-white text-[12px] font-bold uppercase tracking-[0.12em] shadow-[0_4px_14px_rgba(249,115,22,0.45)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.6)] ring-1 ring-orange-400/60 hover:brightness-110 transition-[filter,box-shadow,background-color] duration-200 overflow-visible flex-shrink-0"
                >
                    {/* Halos gyrophare orange */}
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--orange"></span>
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--orange safex-gyrophare-ring--delay-1"></span>
                    {/* Glow intérieur */}
                    <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none"></span>
                    {/* Icône dans cercle blanc semi-transparent */}
                    <span aria-hidden className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30 group-hover:ring-white/50 transition-all">
                        <IconBroadcast size={13} stroke={2.4} className="drop-shadow-sm" />
                    </span>
                    <span className="relative z-10 drop-shadow-sm">{t('header.generalAlert')}</span>
                </button>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={handleClose}
                centered
                size="lg"
                radius="md"
                withCloseButton={!sending}
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <IconBroadcast size={18} className="text-orange-700" />
                        </div>
                        <div>
                            <p className="text-base text-slate-900">Alerte Générale</p>
                            <p className="text-[11px] text-slate-500">Diffusion multicanal à l'ensemble du personnel concerné</p>
                        </div>
                    </div>
                }
            >
                {sent ? (
                    <Alert color="green" icon={<IconCheck size={18} />} variant="light">
                        <p className="font-medium">Alerte diffusée</p>
                        <p className="text-xs mt-1">Les notifications ont été envoyées sur les canaux sélectionnés. Les destinataires recevront le signal dans les prochaines secondes.</p>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        <Alert color="orange" icon={<IconAlertTriangle size={16} />} variant="light">
                            <p className="text-xs">Cette action déclenche une notification de masse. Vérifiez les paramètres avant validation.</p>
                        </Alert>

                        {/* Type d'alerte */}
                        <div>
                            <p className="text-xs text-slate-700 uppercase tracking-wider mb-2">Type d'alerte</p>
                            <Radio.Group value={alertType} onChange={setAlertType}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <Radio.Card value="mandatory-assembly" radius="md" className="p-3 hover:bg-slate-50 data-[checked]:!border-orange-500 data-[checked]:!bg-orange-50">
                                        <Group wrap="nowrap" align="flex-start" gap="xs">
                                            <Radio.Indicator />
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-900">Rassemblement obligatoire</p>
                                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Point de rassemblement immédiat pour tous</p>
                                            </div>
                                        </Group>
                                    </Radio.Card>
                                    <Radio.Card value="zone-evacuation" radius="md" className="p-3 hover:bg-slate-50 data-[checked]:!border-red-500 data-[checked]:!bg-red-50">
                                        <Group wrap="nowrap" align="flex-start" gap="xs">
                                            <Radio.Indicator color="red" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-900">Évacuation de zone</p>
                                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Vider la zone et rejoindre un point sûr</p>
                                            </div>
                                        </Group>
                                    </Radio.Card>
                                </div>
                            </Radio.Group>
                        </div>

                        {/* Périmètre zones */}
                        <div>
                            <p className="text-xs text-slate-700 uppercase tracking-wider mb-2">Périmètre</p>
                            <Radio.Group value={zoneScope} onChange={(v) => setZoneScope(v as 'all' | 'selection')}>
                                <div className="flex flex-col gap-1">
                                    <Radio value="all" label={<span className="text-sm text-slate-800">Toutes les zones (alerte mine entière)</span>} />
                                    <Radio value="selection" label={<span className="text-sm text-slate-800">Sélectionner des zones spécifiques</span>} />
                                </div>
                            </Radio.Group>
                            {zoneScope === 'selection' && (
                                <MultiSelect
                                    mt="xs"
                                    size="sm"
                                    data={availableZones}
                                    value={selectedZones}
                                    onChange={setSelectedZones}
                                    placeholder="Sélectionner les zones concernées"
                                    searchable
                                    hidePickedOptions
                                />
                            )}
                        </div>

                        {/* Canaux */}
                        <div>
                            <p className="text-xs text-slate-700 uppercase tracking-wider mb-2">Canaux de notification</p>
                            <Checkbox.Group value={channels} onChange={setChannels}>
                                {/* LOT 40 P1: grille canaux responsive (1 col mobile → 3 col desktop) */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <Checkbox.Card value="web" radius="md" className="p-2.5 data-[checked]:!border-teal-500 data-[checked]:!bg-teal-50">
                                        <Group wrap="nowrap" gap="xs" align="center">
                                            <Checkbox.Indicator />
                                            <IconBell size={14} className="text-slate-700" />
                                            <span className="text-xs text-slate-800">Web</span>
                                        </Group>
                                    </Checkbox.Card>
                                    <Checkbox.Card value="mobile" radius="md" className="p-2.5 data-[checked]:!border-teal-500 data-[checked]:!bg-teal-50">
                                        <Group wrap="nowrap" gap="xs" align="center">
                                            <Checkbox.Indicator />
                                            <IconDeviceMobile size={14} className="text-slate-700" />
                                            <span className="text-xs text-slate-800">Mobile</span>
                                        </Group>
                                    </Checkbox.Card>
                                    <Checkbox.Card value="sms" radius="md" className="p-2.5 data-[checked]:!border-teal-500 data-[checked]:!bg-teal-50">
                                        <Group wrap="nowrap" gap="xs" align="center">
                                            <Checkbox.Indicator />
                                            <IconMail size={14} className="text-slate-700" />
                                            <span className="text-xs text-slate-800">SMS</span>
                                        </Group>
                                    </Checkbox.Card>
                                </div>
                            </Checkbox.Group>
                        </div>

                        {/* Message personnalisé */}
                        <Textarea
                            label="Message complémentaire (optionnel)"
                            placeholder="Précisez des consignes spécifiques (point de rassemblement, équipement à apporter, etc.)"
                            autosize
                            minRows={2}
                            maxRows={4}
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                            size="sm"
                        />

                        {/* Récapitulatif estimatif */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-start gap-2">
                            <IconUsers size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-700">
                                <span className="font-medium">Destinataires estimés :</span>
                                {zoneScope === 'all' ? ' tous les employés actifs (≈ 25 personnes sur les sites NMC et CITIZEN).' : ` employés affectés aux ${selectedZones.length || 0} zone(s) sélectionnée(s).`}
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={handleClose} disabled={sending}>
                                Annuler
                            </Button>
                            <Button
                                color="orange"
                                size="sm"
                                onClick={handleSend}
                                loading={sending}
                                leftSection={<IconBroadcast size={15} />}
                            >
                                Déclencher l'alerte
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default GeneralAlertButton;
