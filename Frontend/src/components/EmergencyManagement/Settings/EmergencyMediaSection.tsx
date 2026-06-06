import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mantine/core';
import { IconVolume, IconPlus, IconTrash, IconMessage, IconBellRinging } from '@tabler/icons-react';
import {
    listEmergencyMedia,
    createEmergencyMedia,
    deleteEmergencyMedia,
    type EmergencyMediaDTO,
    type EmergencyMediaType,
} from '../../../services/EmergencyService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Section « Médias d'urgence » (LOT 48 Phase 1.e).
 *
 * Sirène : fichier audio (URL/path).
 * Message vocal : texte TTS (généré côté Azure Speech Phase 3+) OU fichier audio.
 *
 * Phase 1.e livre le CRUD des références. La génération TTS Azure + upload
 * fichier réels arrivent Phase 3 (préparation des assets quand le runtime
 * alerte sera activé).
 */

interface Props {
    companyId: number;
}

const EmergencyMediaSection = ({ companyId }: Props) => {
    const { t } = useTranslation('emergency');
    const currentUser = useAppSelector((state: any) => state.user);

    const [items, setItems] = useState<EmergencyMediaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [type, setType] = useState<EmergencyMediaType>('VOICE_MESSAGE');
    const [locale, setLocale] = useState('fr-FR');
    const [label, setLabel] = useState('');
    const [filePath, setFilePath] = useState('');
    const [ttsText, setTtsText] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        listEmergencyMedia(companyId)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [companyId]);

    const handleCreate = async () => {
        if (!label.trim()) return;
        setSaving(true);
        try {
            const created = await createEmergencyMedia(
                {
                    companyId,
                    mediaType: type,
                    locale,
                    label: label.trim(),
                    filePath: filePath || null,
                    ttsText: ttsText || null,
                },
                currentUser?.id
            );
            setItems((prev) => [...prev, created]);
            setModal(false);
            setLabel('');
            setFilePath('');
            setTtsText('');
            successNotification('Média ajouté');
        } catch {
            errorNotification("Échec de l'ajout du média");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce média ?')) return;
        try {
            await deleteEmergencyMedia(id, currentUser?.id);
            setItems((prev) => prev.filter((m) => m.id !== id));
            successNotification('Média supprimé');
        } catch {
            errorNotification('Échec de la suppression');
        }
    };

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-violet-400 rounded-xl p-5 shadow-sm">
            <header className="flex items-start justify-between gap-3 mb-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-violet-50 text-violet-600 flex-shrink-0" aria-hidden="true">
                        <IconVolume size={15} stroke={1.6} />
                    </span>
                    <div>
                        <h3
                            className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('settings.sections.media.title')}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('settings.sections.media.subtitle')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-[11.5px] font-medium transition-colors"
                >
                    <IconPlus size={12} stroke={2.2} />
                    Ajouter
                </button>
            </header>

            {loading ? (
                <p className="text-[12px] text-slate-400 italic">Chargement…</p>
            ) : items.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                    <IconVolume size={20} className="text-slate-300 mx-auto mb-1" stroke={1.5} />
                    <p className="text-[11.5px] text-slate-400 italic">
                        Aucun média configuré pour cette mine.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Type
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Libellé
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Langue
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Défaut
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-20">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-3 py-2">
                                            <span className="inline-flex items-center gap-1.5">
                                                {m.mediaType === 'SIREN' ? (
                                                    <>
                                                        <IconBellRinging size={12} stroke={1.8} className="text-orange-600" />
                                                        <span className="text-slate-700">Sirène</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconMessage size={12} stroke={1.8} className="text-violet-600" />
                                                        <span className="text-slate-700">Message vocal</span>
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-800 truncate max-w-xs">
                                            {m.label}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10.5px] uppercase tracking-wider font-semibold">
                                                {m.locale}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {m.isDefault ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] uppercase tracking-wider font-semibold">
                                                    Oui
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => m.id && handleDelete(m.id)}
                                                title="Supprimer"
                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <IconTrash size={11} stroke={1.8} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                opened={modal}
                onClose={() => !saving && setModal(false)}
                centered
                title="Nouveau média d'urgence"
                size="md"
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as EmergencyMediaType)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            >
                                <option value="VOICE_MESSAGE">Message vocal</option>
                                <option value="SIREN">Sirène</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Langue</label>
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            >
                                <option value="fr-FR">Français (fr-FR)</option>
                                <option value="en-US">English (en-US)</option>
                                <option value="en-GB">English (en-GB)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Libellé *</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Voix Denise — Alerte générale"
                            className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                    </div>
                    {type === 'VOICE_MESSAGE' ? (
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                                Texte TTS (Azure Speech)
                            </label>
                            <textarea
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value)}
                                rows={3}
                                placeholder="Alerte Générale, veuillez rejoindre le point de rassemblement le plus proche."
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            />
                            <p className="text-[10.5px] text-slate-500 mt-1">
                                Génération réelle TTS Azure activée en Phase 3.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Fichier (chemin / URL)</label>
                            <input
                                type="text"
                                value={filePath}
                                onChange={(e) => setFilePath(e.target.value)}
                                placeholder="/media/siren-standard.mp3"
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            />
                            <p className="text-[10.5px] text-slate-500 mt-1">
                                Upload réel implémenté Phase 3.
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setModal(false)}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving || !label.trim()}
                            className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 disabled:opacity-40"
                        >
                            {saving ? '…' : 'Créer'}
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
};

export default EmergencyMediaSection;
