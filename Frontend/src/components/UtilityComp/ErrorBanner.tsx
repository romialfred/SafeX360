import { ReactNode } from 'react';
import {
    IconAlertTriangle,
    IconAlertCircle,
    IconInfoCircle,
    IconCheck,
    IconX,
} from '@tabler/icons-react';

/**
 * ErrorBanner — Pattern unifié pour les messages contextuels.
 *
 * 4 tons :
 *   - error   : opérations échouées (POST/PUT/DELETE refusés)
 *   - warning : opérations risquées / validation
 *   - info    : informations contextuelles
 *   - success : opérations réussies
 *
 * Utilisation :
 *   <ErrorBanner tone="error" title="Échec de la sauvegarde">
 *     {errorMsg}
 *   </ErrorBanner>
 *
 *   <ErrorBanner tone="success" onClose={() => setSaved(false)}>
 *     Modifications enregistrées
 *   </ErrorBanner>
 */

type Tone = 'error' | 'warning' | 'info' | 'success';

interface ErrorBannerProps {
    tone?: Tone;
    title?: string;
    children: ReactNode;
    onClose?: () => void;
    action?: ReactNode;
    /** Variante compacte (padding réduit) */
    compact?: boolean;
}

const TONE_CONFIG: Record<Tone, {
    bg: string;
    border: string;
    iconColor: string;
    titleColor: string;
    textColor: string;
    icon: typeof IconAlertTriangle;
    role: 'alert' | 'status';
    aria: 'assertive' | 'polite';
}> = {
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        textColor: 'text-red-700',
        icon: IconAlertCircle,
        role: 'alert',
        aria: 'assertive',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconColor: 'text-amber-700',
        titleColor: 'text-amber-900',
        textColor: 'text-amber-800',
        icon: IconAlertTriangle,
        role: 'alert',
        aria: 'assertive',
    },
    info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        iconColor: 'text-sky-700',
        titleColor: 'text-sky-900',
        textColor: 'text-sky-800',
        icon: IconInfoCircle,
        role: 'status',
        aria: 'polite',
    },
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        iconColor: 'text-emerald-700',
        titleColor: 'text-emerald-900',
        textColor: 'text-emerald-800',
        icon: IconCheck,
        role: 'status',
        aria: 'polite',
    },
};

export default function ErrorBanner({
    tone = 'error',
    title,
    children,
    onClose,
    action,
    compact = false,
}: ErrorBannerProps) {
    const cfg = TONE_CONFIG[tone];
    const Icon = cfg.icon;
    const padding = compact ? 'p-2.5' : 'p-3.5';

    return (
        <div
            className={`${cfg.bg} ${cfg.border} border rounded-lg ${padding} flex items-start gap-3`}
            role={cfg.role}
            aria-live={cfg.aria}
        >
            <Icon size={compact ? 15 : 17} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />

            <div className="min-w-0 flex-1">
                {title && (
                    <p className={`text-[13.5px] ${cfg.titleColor} tracking-tight`}>
                        {title}
                    </p>
                )}
                <div
                    className={`${cfg.textColor} ${title ? 'mt-0.5' : ''} leading-relaxed`}
                    style={{ fontSize: compact ? '12px' : '13px' }}
                >
                    {children}
                </div>
                {action && <div className="mt-2">{action}</div>}
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le message"
                    className={`${cfg.textColor} hover:bg-white/50 rounded p-1 flex-shrink-0 transition-colors`}
                >
                    <IconX size={14} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
