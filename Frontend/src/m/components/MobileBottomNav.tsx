/**
 * MobileBottomNav — Bottom navigation Material 3 (5 items max).
 *
 * Conventions :
 *   - Hauteur 64 dp + safe area inset bottom (notch / barre gestuelle)
 *   - 5 items : Accueil, Inspections, SOS (FAB), Incidents, Profil
 *   - Item central SOS surdimensionne (FAB-style) avec gyrophare rouge
 *   - Indicateur d'item actif : background pill cyan + label visible
 *   - Items inactifs : icone seule + label discret
 *   - Haptic feedback "light" a chaque tap
 *
 * Accessibilite : aria-current + aria-label + min tap-target 48dp.
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
    IconHome2,
    IconClipboardList,
    IconAlertOctagon,
    IconExclamationCircle,
    IconUserCircle,
} from '@tabler/icons-react';
import { useHaptics } from '../hooks/useHaptics';

interface NavItem {
    path: string;
    label: string;
    icon: typeof IconHome2;
    accent: 'cyan' | 'rose' | 'amber' | 'slate';
}

const ITEMS: NavItem[] = [
    { path: '/m/home',          label: 'Accueil',     icon: IconHome2,            accent: 'cyan' },
    { path: '/m/inspections',   label: 'Inspections', icon: IconClipboardList,    accent: 'cyan' },
    { path: '/m/sos',           label: 'SOS',         icon: IconAlertOctagon,     accent: 'rose' },
    { path: '/m/incident/new',  label: 'Incident',    icon: IconExclamationCircle, accent: 'amber' },
    { path: '/m/profile',       label: 'Profil',      icon: IconUserCircle,       accent: 'slate' },
];

const ACCENT_CLASSES: Record<NavItem['accent'], { bg: string; text: string; ring: string }> = {
    cyan:  { bg: 'bg-cyan-50',  text: 'text-cyan-800',  ring: 'ring-cyan-200' },
    rose:  { bg: 'bg-rose-50',  text: 'text-rose-800',  ring: 'ring-rose-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-800', ring: 'ring-slate-200' },
};

export function MobileBottomNav() {
    const haptic = useHaptics();
    const location = useLocation();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
                boxShadow: '0 -2px 12px rgba(15, 23, 42, 0.04)',
            }}
            aria-label="Navigation principale"
        >
            <ul className="flex items-stretch justify-around h-16">
                {ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isSos = item.path === '/m/sos';
                    const isActive =
                        location.pathname === item.path ||
                        (item.path !== '/m/home' && location.pathname.startsWith(item.path));
                    const cls = ACCENT_CLASSES[item.accent];

                    if (isSos) {
                        return (
                            <li key={item.path} className="flex items-center justify-center -mt-5">
                                <NavLink
                                    to={item.path}
                                    onClick={() => haptic('medium')}
                                    aria-label="Déclencher un SOS"
                                    className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg ring-4 ring-white"
                                    style={{ minHeight: 56 }}
                                >
                                    <Icon size={26} stroke={2.4} />
                                </NavLink>
                            </li>
                        );
                    }

                    return (
                        <li key={item.path} className="flex-1 flex items-center justify-center">
                            <NavLink
                                to={item.path}
                                onClick={() => haptic('light')}
                                aria-current={isActive ? 'page' : undefined}
                                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-[11px] transition ${
                                    isActive ? `${cls.text} font-medium` : 'text-slate-500'
                                }`}
                                style={{ minHeight: 48 }}
                            >
                                <div
                                    className={`flex items-center justify-center w-10 h-7 rounded-full transition ${
                                        isActive ? `${cls.bg} ring-2 ${cls.ring}` : ''
                                    }`}
                                >
                                    <Icon
                                        size={20}
                                        stroke={isActive ? 2.2 : 1.8}
                                    />
                                </div>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default MobileBottomNav;
