import { type ReactNode } from 'react';
import { Modal } from '@mantine/core';
import {
    IconAlertTriangle,
    IconCheck,
    IconX,
    IconArchive,
    IconTrash,
    IconInfoCircle,
    IconUrgent,
} from '@tabler/icons-react';

/**
 * Composant ConfirmModal réutilisable (LOT 48 P3.b.1).
 *
 * <p>Remplace les {@code window.confirm()} natifs (qui sont laids et non
 * cohérents avec le design de la plateforme) par un Mantine Modal stylisé
 * avec icône + couleur + animation.</p>
 *
 * <p>5 variantes prédéfinies par {@code tone} :</p>
 * <ul>
 *   <li>{@code danger} — rouge, suppressions / archives définitifs</li>
 *   <li>{@code warning} — ambre, actions sensibles (clôture, false-alarm)</li>
 *   <li>{@code info} — bleu, confirmations neutres</li>
 *   <li>{@code success} — emeraude, validations positives</li>
 *   <li>{@code emergency} — rouge animé, actions SOS critiques</li>
 * </ul>
 *
 * <p>Pattern d'utilisation : contrôlé via {@code opened} + handlers
 * {@code onConfirm}/{@code onCancel}. Pour usage impératif type
 * {@code await confirm(...)}, voir {@code useConfirm()} ci-dessous.</p>
 */

export type ConfirmTone = 'danger' | 'warning' | 'info' | 'success' | 'emergency';

interface ConfirmModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
    icon?: ReactNode;
    loading?: boolean;
    /** Champ supplémentaire (textarea) à afficher avant les boutons. */
    extra?: ReactNode;
}

const TONE_META: Record<ConfirmTone, {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
    btnBg: string;
    btnHover: string;
    pulse: boolean;
    defaultIcon: ReactNode;
}> = {
    danger: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        btnBg: 'bg-red-600',
        btnHover: 'hover:bg-red-700',
        pulse: false,
        defaultIcon: <IconTrash size={20} stroke={1.8} />,
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-600',
        btnBg: 'bg-amber-600',
        btnHover: 'hover:bg-amber-700',
        pulse: false,
        defaultIcon: <IconAlertTriangle size={20} stroke={1.8} />,
    },
    info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        iconBg: 'bg-sky-100',
        iconText: 'text-sky-600',
        btnBg: 'bg-sky-600',
        btnHover: 'hover:bg-sky-700',
        pulse: false,
        defaultIcon: <IconInfoCircle size={20} stroke={1.8} />,
    },
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        btnBg: 'bg-emerald-600',
        btnHover: 'hover:bg-emerald-700',
        pulse: false,
        defaultIcon: <IconCheck size={20} stroke={1.8} />,
    },
    emergency: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        iconBg: 'bg-red-100',
        iconText: 'text-red-700',
        btnBg: 'bg-red-700',
        btnHover: 'hover:bg-red-800',
        pulse: true,
        defaultIcon: <IconUrgent size={22} stroke={2} />,
    },
};

const ConfirmModal = ({
    opened,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    tone = 'warning',
    icon,
    loading = false,
    extra,
}: ConfirmModalProps) => {
    const meta = TONE_META[tone];

    return (
        <Modal
            opened={opened}
            onClose={() => !loading && onClose()}
            centered
            withCloseButton={false}
            padding={0}
            radius="lg"
            size="sm"
            overlayProps={{ blur: 3, backgroundOpacity: 0.55 }}
        >
            <div className={`${meta.bg} border-l-[4px] ${meta.border.replace('border-', 'border-l-')} px-5 py-4`}>
                <div className="flex items-start gap-3">
                    <span
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-full ${meta.iconBg} ${meta.iconText} flex-shrink-0 ${meta.pulse ? 'animate-pulse' : ''}`}
                    >
                        {icon ?? meta.defaultIcon}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3
                            className="text-[15px] text-slate-900 leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                        >
                            {title}
                        </h3>
                        <div className="text-[12.5px] text-slate-700 mt-1.5 leading-relaxed">
                            {message}
                        </div>
                    </div>
                </div>
            </div>

            {extra && <div className="px-5 py-3 border-t border-slate-100">{extra}</div>}

            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <IconX size={12} stroke={2} />
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={() => onConfirm()}
                    disabled={loading}
                    className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-md ${meta.btnBg} text-white text-[12.5px] font-semibold ${meta.btnHover} transition-colors shadow-sm disabled:opacity-50`}
                >
                    <IconCheck size={12} stroke={2.4} />
                    {loading ? '…' : confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
