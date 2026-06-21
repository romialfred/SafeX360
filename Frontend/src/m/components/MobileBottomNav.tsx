import { NavLink, useLocation } from 'react-router-dom';
import {
    IconHome2,
    IconClipboardList,
    IconAlertOctagon,
    IconExclamationCircle,
    IconUserCircle,
} from '@tabler/icons-react';
import { useHaptics } from '../hooks/useHaptics';
import { useSyncQueue } from '../hooks/useSyncQueue';

interface NavItem {
    path: string;
    label: string;
    icon: typeof IconHome2;
    accent: 'cyan' | 'rose' | 'amber' | 'slate';
    badgeKey?: 'pending' | 'incidents';
}

const ITEMS: NavItem[] = [
    { path: '/m/home',          label: 'Accueil',     icon: IconHome2,             accent: 'cyan' },
    { path: '/m/inspections',   label: 'Inspections', icon: IconClipboardList,     accent: 'cyan', badgeKey: 'pending' },
    { path: '/m/sos',           label: 'SOS',         icon: IconAlertOctagon,      accent: 'rose' },
    { path: '/m/incident/new',  label: 'Incident',    icon: IconExclamationCircle, accent: 'amber' },
    { path: '/m/profile',       label: 'Profil',      icon: IconUserCircle,        accent: 'slate' },
];

const ACCENT_CLASSES: Record<NavItem['accent'], { bg: string; text: string; ring: string }> = {
    cyan:  { bg: 'bg-cyan-50',   text: 'text-cyan-800',  ring: 'ring-cyan-200' },
    rose:  { bg: 'bg-rose-50',   text: 'text-rose-800',  ring: 'ring-rose-300' },
    amber: { bg: 'bg-amber-50',  text: 'text-amber-800', ring: 'ring-amber-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-800', ring: 'ring-slate-200' },
};

export function MobileBottomNav() {
    const haptic = useHaptics();
    const location = useLocation();
    const { pending: pendingCount } = useSyncQueue();

    const badges: Record<string, number> = {
        pending: pendingCount,
        incidents: 0,
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
                boxShadow: '0 -2px 16px rgba(15, 23, 42, 0.06)',
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
                    const badge = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;

                    if (isSos) {
                        return (
                            <li key={item.path} className="flex items-center justify-center -mt-5">
                                <NavLink
                                    to={item.path}
                                    onClick={() => haptic('medium')}
                                    aria-label="Déclencher un SOS"
                                    className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg ring-4 ring-white active:scale-95 transition"
                                    style={{ minHeight: 56 }}
                                >
                                    <Icon size={26} stroke={2.4} />
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-400 animate-ping opacity-75" />
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white" />
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
                                className={`relative w-full h-full flex flex-col items-center justify-center gap-0.5 text-[10.5px] transition ${
                                    isActive ? `${cls.text} font-semibold` : 'text-slate-400'
                                }`}
                                style={{ minHeight: 48 }}
                            >
                                <div
                                    className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                                        isActive ? `${cls.bg} ring-1 ${cls.ring} scale-110` : ''
                                    }`}
                                >
                                    <Icon
                                        size={20}
                                        stroke={isActive ? 2.2 : 1.6}
                                    />
                                    {badge > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                                            {badge > 99 ? '99+' : badge}
                                        </span>
                                    )}
                                </div>
                                <span className="leading-none">{item.label}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default MobileBottomNav;
