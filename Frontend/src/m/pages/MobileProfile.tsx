/**
 * MobileProfile — Hub du profil HSE personnel.
 *
 * 4 cartes d'acces : Mes EPI, Mes formations, Ma dosimetrie, Mon dossier
 * medical. Plus un bloc identite + un lien "Version web" qui force la
 * version desktop via localStorage flag.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconShield,
    IconCertificate,
    IconRadioactive,
    IconStethoscope,
    IconArrowLeft,
    IconExternalLink,
    IconLogout,
    IconChevronRight,
    IconUserCircle,
    IconAlertOctagon,
    IconLoader2,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useAppSelector } from '../../slices/hooks';
import { logoutUser } from '../../services/LoginService';

interface ProfileTile {
    label: string;
    sublabel: string;
    path: string;
    Icon: typeof IconShield;
    accent: string;
}

const TILES: ProfileTile[] = [
    { label: 'Mes EPI', sublabel: 'Dotation personnelle, demande', path: '/m/profile/ppe', Icon: IconShield, accent: 'from-emerald-500 to-teal-600' },
    { label: 'Mes formations', sublabel: 'Habilitations, certifications', path: '/m/profile/trainings', Icon: IconCertificate, accent: 'from-violet-500 to-purple-600' },
    { label: 'Ma dosimétrie', sublabel: 'Cumul annuel, exposition', path: '/m/profile/dosimetry', Icon: IconRadioactive, accent: 'from-amber-500 to-orange-600' },
    { label: 'Mon dossier médical', sublabel: 'Aptitude, visites', path: '/m/profile/medical', Icon: IconStethoscope, accent: 'from-cyan-500 to-blue-600' },
    { label: 'Mes signalements', sublabel: 'Historique de mes incidents', path: '/m/incidents/history', Icon: IconAlertOctagon, accent: 'from-rose-500 to-pink-600' },
];

export default function MobileProfile() {
    useStatusBarColor('#0F172A', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const [loggingOut, setLoggingOut] = useState(false);

    const rawName = user?.firstName
        ? `${user.firstName} ${user.familyName || ''}`.trim()
        : user?.name || user?.username || '';
    const displayName = (typeof rawName === 'string' && rawName) ? rawName : 'Utilisateur';
    const role = (typeof user?.role === 'string' && user.role) ? user.role
        : (typeof user?.position === 'string' && user.position) ? user.position
        : '—';

    const go = (path: string) => {
        haptic('light');
        navigate(path);
    };

    const switchToDesktop = () => {
        try {
            localStorage.setItem('safex360-prefer-desktop', '1');
            sessionStorage.removeItem('safex360-mobile-redirected');
        } catch {
            // ignore
        }
        window.location.assign('/?desktop=1');
    };

    return (
        <>
            <MobileTopBar
                title="Mon profil"
                subtitle="Dossier HSE personnel"
                accent="#0F172A"
                onBack={() => navigate('/m/home')}
            />

            {/* Identite */}
            <section className="px-4 pt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                        <IconUserCircle size={28} stroke={1.6} />
                    </div>
                    <div className="min-w-0">
                        <h2
                            className="text-slate-900 truncate"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '17px',
                            }}
                        >
                            {displayName}
                        </h2>
                        <p className="text-[12px] text-slate-500 truncate">{role}</p>
                    </div>
                </div>
            </section>

            {/* Cartes acces */}
            <section className="px-4 pt-4 space-y-2.5">
                {TILES.map((t) => {
                    const Icon = t.Icon;
                    return (
                        <button
                            key={t.path}
                            type="button"
                            onClick={() => go(t.path)}
                            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition flex items-center gap-3 shadow-sm"
                            style={{ minHeight: 72 }}
                        >
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.accent} text-white flex items-center justify-center flex-shrink-0`}>
                                <Icon size={20} stroke={1.8} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-semibold text-slate-900">{t.label}</div>
                                <div className="text-[11.5px] text-slate-500 truncate mt-0.5">{t.sublabel}</div>
                            </div>
                            <IconChevronRight size={18} stroke={1.8} className="text-slate-300 flex-shrink-0" />
                        </button>
                    );
                })}
            </section>

            {/* Actions secondaires */}
            <section className="px-4 pt-5 space-y-2">
                <button
                    type="button"
                    onClick={switchToDesktop}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-xl"
                    style={{ minHeight: 44 }}
                >
                    <IconExternalLink size={15} stroke={1.8} />
                    Basculer vers la version web
                </button>
                <button
                    type="button"
                    disabled={loggingOut}
                    onClick={async () => {
                        haptic('warning');
                        setLoggingOut(true);
                        try {
                            await logoutUser();
                        } catch {
                            // session déjà expirée — on redirige quand même
                        }
                        window.location.assign('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-rose-700 bg-white border border-rose-200 rounded-xl disabled:opacity-50"
                    style={{ minHeight: 44 }}
                >
                    {loggingOut
                        ? <IconLoader2 size={15} stroke={1.8} className="animate-spin" />
                        : <IconLogout size={15} stroke={1.8} />}
                    {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
                </button>
            </section>

            <section className="px-4 pt-4 pb-2 text-center">
                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] text-slate-500"
                >
                    <IconArrowLeft size={13} stroke={1.8} />
                    Retour à l'accueil
                </button>
                <p className="text-[10.5px] text-slate-400 mt-2">
                    SafeX 360 : HSE · v1.0.0 · ISO 45001
                </p>
                <p className="text-[9.5px] text-slate-300 mt-1">
                    Data Universe · contact@datauniverse.bf · +226 77963525
                </p>
            </section>
        </>
    );
}
