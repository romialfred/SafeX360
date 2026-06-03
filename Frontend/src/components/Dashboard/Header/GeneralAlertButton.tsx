import { useState } from 'react';
import { Button, Modal, Checkbox, Radio, MultiSelect, Tooltip, Alert, Textarea, Group, Loader } from '@mantine/core';
import { IconBroadcast, IconCheck, IconAlertTriangle, IconUsers, IconDeviceMobile, IconMail, IconBell } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Bouton Alerte Générale : déclenche une notification multicanal (web, mobile, SMS) à tous les employés.
 * Formulaire compact pour configurer le périmètre (toutes zones / sélection) et les actions attendues.
 */
const GeneralAlertButton = () => {
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

        setSending(true);
        await new Promise((r) => setTimeout(r, 900));

        try {
            // TODO Phase 2.b : POST /hns/emergency/general-alert
            // { alertType, zoneScope, selectedZones, channels, message, triggeredBy, timestamp }
            setSent(true);
            const zoneText = zoneScope === 'all' ? 'tous les sites' : `${selectedZones.length} zone(s)`;
            const channelText = channels.map((c) => c === 'web' ? 'Web' : c === 'mobile' ? 'Mobile' : 'SMS').join(', ');
            successNotification(`Alerte générale diffusée à ${zoneText} via ${channelText}.`);
            setTimeout(handleClose, 2200);
        } catch (e: any) {
            errorNotification("Échec du déclenchement de l'alerte. Contactez l'administrateur système.");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Tooltip label="Déclencher une alerte de masse vers tous les employés" position="bottom">
                <button
                    onClick={open}
                    className="safex-gyrophare-alert relative flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-xs uppercase tracking-wider shadow-lg transition-all overflow-visible"
                >
                    {/* Halos gyrophare orange */}
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--orange"></span>
                    <span aria-hidden className="safex-gyrophare-ring safex-gyrophare-ring--orange safex-gyrophare-ring--delay-1"></span>
                    {/* Voyant intérieur rotatif */}
                    <span aria-hidden className="absolute inset-0 rounded-md bg-orange-400 animate-pulse opacity-30 pointer-events-none"></span>
                    <IconBroadcast size={16} className="relative z-10 drop-shadow-sm" />
                    <span className="relative z-10">Alerte Générale</span>
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
                                <div className="grid grid-cols-3 gap-2">
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
