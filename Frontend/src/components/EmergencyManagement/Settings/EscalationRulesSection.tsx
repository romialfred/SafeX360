import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mantine/core';
import { IconStairsUp, IconPlus, IconTrash, IconClock } from '@tabler/icons-react';
import {
    listEscalationRules,
    createEscalationRule,
    deleteEscalationRule,
    type EscalationRuleDTO,
    type EmergencyPermissionKey,
} from '../../../services/EmergencyService';
import { useAppSelector } from '../../../slices/hooks';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

/**
 * Section « Règles d'escalade » (LOT 48 Phase 1.d).
 *
 * Liste ordonnée par {@code stepOrder}. Chaque règle pointe vers :
 *   - soit un utilisateur cible explicite ({@code targetUserId}),
 *   - soit un rôle ({@code targetPermission} parmi COORDINATOR/RESPONDER/ALERT_LAUNCHER).
 * Délai en secondes avant de passer à l'étape suivante.
 */

interface Props {
    companyId: number;
}

const EscalationRulesSection = ({ companyId }: Props) => {
    const { t } = useTranslation('emergency');
    const currentUser = useAppSelector((state: any) => state.user);

    const [rules, setRules] = useState<EscalationRuleDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const [newRuleModal, setNewRuleModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newStepOrder, setNewStepOrder] = useState(1);
    const [newDelay, setNewDelay] = useState(60);
    const [newTarget, setNewTarget] = useState<EmergencyPermissionKey>('COORDINATOR');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        listEscalationRules(companyId)
            .then(setRules)
            .catch(() => setRules([]))
            .finally(() => setLoading(false));
    }, [companyId]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const created = await createEscalationRule(
                {
                    companyId,
                    name: newName.trim(),
                    stepOrder: newStepOrder,
                    delaySeconds: newDelay,
                    targetPermission: newTarget,
                },
                currentUser?.id
            );
            setRules((prev) => [...prev, created].sort((a, b) => a.stepOrder - b.stepOrder));
            setNewRuleModal(false);
            setNewName('');
            setNewStepOrder(rules.length + 1);
            setNewDelay(60);
            successNotification('Règle créée');
        } catch {
            errorNotification('Échec de la création');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette règle ?')) return;
        try {
            await deleteEscalationRule(id, currentUser?.id);
            setRules((prev) => prev.filter((r) => r.id !== id));
            successNotification('Règle supprimée');
        } catch {
            errorNotification('Échec de la suppression');
        }
    };

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-amber-400 rounded-xl p-5 shadow-sm">
            <header className="flex items-start justify-between gap-3 mb-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex-shrink-0" aria-hidden="true">
                        <IconStairsUp size={15} stroke={1.6} />
                    </span>
                    <div>
                        <h3
                            className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('settings.sections.escalation.title')}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('settings.sections.escalation.subtitle')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNewStepOrder(rules.length + 1);
                        setNewRuleModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11.5px] font-medium transition-colors"
                >
                    <IconPlus size={12} stroke={2.2} />
                    Ajouter
                </button>
            </header>

            {loading ? (
                <p className="text-[12px] text-slate-400 italic">Chargement…</p>
            ) : rules.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                    <IconStairsUp size={20} className="text-slate-300 mx-auto mb-1" stroke={1.5} />
                    <p className="text-[11.5px] text-slate-400 italic">
                        Aucune règle d'escalade configurée.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 text-center font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-12">
                                        Étape
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Nom de la règle
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Cible
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                        Délai
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-20">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-[11px]">
                                                {rule.stepOrder}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-800">{rule.name}</td>
                                        <td className="px-3 py-2 text-slate-600">
                                            {rule.targetPermission ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 text-[10.5px] uppercase tracking-wider font-semibold">
                                                    {t(`permissions.${rule.targetPermission}`)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">User #{rule.targetUserId}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-slate-600">
                                            <span className="inline-flex items-center gap-1">
                                                <IconClock size={10} stroke={1.8} className="text-slate-400" />
                                                {rule.delaySeconds}s
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => rule.id && handleDelete(rule.id)}
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
                opened={newRuleModal}
                onClose={() => !saving && setNewRuleModal(false)}
                centered
                title="Nouvelle règle d'escalade"
                size="sm"
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Notifier le coordinateur"
                            className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Étape</label>
                            <input
                                type="number"
                                min={1}
                                value={newStepOrder}
                                onChange={(e) => setNewStepOrder(parseInt(e.target.value, 10) || 1)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Délai (s)</label>
                            <input
                                type="number"
                                min={5}
                                value={newDelay}
                                onChange={(e) => setNewDelay(parseInt(e.target.value, 10) || 60)}
                                className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Cible</label>
                        <select
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value as EmergencyPermissionKey)}
                            className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                        >
                            <option value="COORDINATOR">{t('permissions.COORDINATOR')}</option>
                            <option value="RESPONDER">{t('permissions.RESPONDER')}</option>
                            <option value="ALERT_LAUNCHER">{t('permissions.ALERT_LAUNCHER')}</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setNewRuleModal(false)}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[12.5px] text-slate-700 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving || !newName.trim()}
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

export default EscalationRulesSection;
