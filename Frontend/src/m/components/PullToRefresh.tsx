/**
 * PullToRefresh — Composant tactile natif pour rafraichir un ecran mobile.
 *
 * Tire le contenu vers le bas depuis le haut quand scrollTop=0. Apres un
 * deplacement seuil (THRESHOLD_PX = 80), le declic vibrant se produit et au
 * relachement, le {@code onRefresh} est appele. Visuel pendant la pull :
 * un anneau de progression cyan apparait, plus il se remplit, plus le seuil
 * est proche.
 *
 * Pas de dependance externe — touch events natifs.
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import { useHaptics } from '../hooks/useHaptics';

const THRESHOLD_PX = 80;
const MAX_PULL_PX = 140;
const SPINNER_VISIBLE_PX = 20;

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void;
    children: ReactNode;
    disabled?: boolean;
}

export default function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
    const haptic = useHaptics();
    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number | null>(null);
    const [pullDistance, setPullDistance] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const triggeredRef = useRef<boolean>(false);

    useEffect(() => {
        if (disabled) return;
        const el = containerRef.current;
        if (!el) return;

        const findScrollContainer = (): HTMLElement => {
            // Le scroll est gere par le main du MobileShell (overflow-y-auto).
            // On cherche le premier ancetre scrollable.
            let n: HTMLElement | null = el;
            while (n) {
                const overflowY = window.getComputedStyle(n).overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') return n;
                n = n.parentElement;
            }
            return document.scrollingElement as HTMLElement;
        };

        const scrollEl = findScrollContainer();

        const onTouchStart = (e: TouchEvent) => {
            if (refreshing) return;
            if (scrollEl.scrollTop > 0) {
                startYRef.current = null;
                return;
            }
            startYRef.current = e.touches[0].clientY;
            triggeredRef.current = false;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (startYRef.current === null) return;
            const dy = e.touches[0].clientY - startYRef.current;
            if (dy <= 0) {
                setPullDistance(0);
                return;
            }
            // Resistance non-lineaire : plus on tire, plus c'est dur (ressort)
            const dampened = Math.min(MAX_PULL_PX, Math.sqrt(dy * 30));
            setPullDistance(dampened);
            // Haptic au franchissement du seuil
            if (!triggeredRef.current && dampened >= THRESHOLD_PX) {
                triggeredRef.current = true;
                haptic('medium');
            }
            if (triggeredRef.current && dampened < THRESHOLD_PX) {
                triggeredRef.current = false;
            }
        };

        const onTouchEnd = async () => {
            const triggered = triggeredRef.current;
            startYRef.current = null;
            triggeredRef.current = false;
            if (triggered && !refreshing) {
                setRefreshing(true);
                setPullDistance(THRESHOLD_PX / 1.6);
                try {
                    await onRefresh();
                } finally {
                    setRefreshing(false);
                    setPullDistance(0);
                }
            } else {
                setPullDistance(0);
            }
        };

        // Listener au niveau document.body parce que le main est scrollable
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd);

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [disabled, onRefresh, refreshing, haptic]);

    const showSpinner = pullDistance > SPINNER_VISIBLE_PX || refreshing;
    const progress = Math.min(1, pullDistance / THRESHOLD_PX);

    return (
        <div ref={containerRef} className="relative">
            {/* Spinner overlay au top, opacity progressif */}
            {showSpinner && (
                <div
                    className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none transition-transform"
                    style={{
                        transform: `translateY(${Math.max(0, pullDistance - SPINNER_VISIBLE_PX)}px)`,
                        opacity: progress,
                    }}
                    aria-hidden="true"
                >
                    <div
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center"
                        style={{
                            transform: refreshing ? 'rotate(360deg)' : `rotate(${progress * 360}deg)`,
                            transition: refreshing ? 'transform 1s linear infinite' : 'transform 0.05s linear',
                        }}
                    >
                        <IconRefresh
                            size={18}
                            stroke={2}
                            className={refreshing ? 'text-cyan-700 animate-spin' : 'text-cyan-700'}
                        />
                    </div>
                </div>
            )}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pullDistance === 0 ? 'transform 0.25s ease-out' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
}
