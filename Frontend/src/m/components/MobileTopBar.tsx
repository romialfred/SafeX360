/**
 * MobileTopBar — Top bar Material 3 (~56 dp) avec indicateur reseau et titre
 * d'ecran. Optionnellement un bouton "retour" et un slot d'actions a droite.
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface MobileTopBarProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    accent?: string; // hex hex pour bg
    textOnDark?: boolean;
    rightSlot?: ReactNode;
}

export function MobileTopBar({
    title,
    subtitle,
    onBack,
    accent = '#0E7490',
    textOnDark = true,
    rightSlot,
}: MobileTopBarProps) {
    const navigate = useNavigate();
    const { online } = useNetworkStatus();
    const textColor = textOnDark ? 'text-white' : 'text-slate-900';

    return (
        <header
            className={`sticky top-0 z-40 ${textColor}`}
            style={{
                backgroundColor: accent,
                paddingTop: 'env(safe-area-inset-top, 0)',
            }}
        >
            <div className="flex items-center gap-3 px-3 h-14">
                {onBack !== undefined && (
                    <button
                        type="button"
                        onClick={onBack ?? (() => navigate(-1))}
                        aria-label="Retour"
                        className="-ml-1 rounded-full flex items-center justify-center hover:bg-black/10 transition"
                        style={{ minWidth: 44, minHeight: 44 }}
                    >
                        <IconArrowLeft size={20} stroke={2} />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <h1
                        className="text-[17px] leading-tight truncate"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[11.5px] opacity-80 truncate">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!online && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10.5px] font-medium"
                            aria-label="Hors ligne"
                        >
                            <IconWifiOff size={11} stroke={2} />
                            Hors ligne
                        </span>
                    )}
                    {online && (
                        <span className="sr-only" aria-label="En ligne">
                            <IconWifi size={11} stroke={2} />
                        </span>
                    )}
                    {rightSlot}
                </div>
            </div>
        </header>
    );
}

export default MobileTopBar;
