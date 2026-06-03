import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconShield,
    IconAlertTriangle,
    IconWorld,
    IconShieldCheck,
    IconBolt,
    IconLockSquare,
    IconChecks,
    IconSun,
    IconMoon,
} from '@tabler/icons-react';
import { Button, Checkbox, PasswordInput, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';

const LOGO_FONT = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

type Theme = 'light' | 'dark';

const LoginsPage = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [theme, setTheme] = useState<Theme>('dark');
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);
    const isDark = theme === 'dark';

    const translations = {
        fr: {
            tagline: 'Santé. Sécurité. Conformité.',
            heroTitle: "La plateforme HSE de référence pour l'industrie minière",
            heroSubtitle: "Pilotez incidents, audits, EPI et conformité réglementaire depuis une console unique.",
            loginTitle: 'Connexion sécurisée',
            loginSubtitle: 'Accédez à votre console HSE',
            loginLabel: 'Identifiant',
            loginPlaceholder: 'prenom.nom@minexpert.com',
            passwordLabel: 'Mot de passe',
            passwordPlaceholder: '••••••••',
            rememberMe: 'Se souvenir de moi',
            forgotPassword: 'Mot de passe oublié ?',
            loginButton: 'Se connecter',
            loginProgress: 'Connexion en cours…',
            errorMessage: 'Identifiant ou mot de passe incorrect',
            securityBadge: 'Connexion chiffrée TLS 1.3 · OAuth 2.0',
            footer: 'Conforme RGPD · Audit logging · Multi-tenant',
        },
        en: {
            tagline: 'Health. Safety. Compliance.',
            heroTitle: 'The reference HSE platform for the mining industry',
            heroSubtitle: 'Pilot incidents, audits, PPE and regulatory compliance from a single console.',
            loginTitle: 'Secure login',
            loginSubtitle: 'Access your HSE console',
            loginLabel: 'User ID',
            loginPlaceholder: 'firstname.lastname@minexpert.com',
            passwordLabel: 'Password',
            passwordPlaceholder: '••••••••',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            loginButton: 'Sign in',
            loginProgress: 'Signing in…',
            errorMessage: 'Incorrect user ID or password',
            securityBadge: 'TLS 1.3 encrypted · OAuth 2.0',
            footer: 'GDPR compliant · Audit logging · Multi-tenant',
        },
    };

    const t = translations[language];
    const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');
    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    const form = useForm({
        initialValues: { login: '', password: '' },
        validate: {
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return language === 'fr' ? "L'identifiant est requis" : 'Login is required';
                return trimmed.length > 50 ? (language === 'fr' ? 'Maximum 50 caractères' : 'Maximum 50 characters') : null;
            },
            password: (value) => (!value ? (language === 'fr' ? 'Le mot de passe est requis' : 'Password is required') : null),
        },
    });

    const handleSubmit = async (values: any) => {
        setError(false);
        form.validate();
        if (!form.isValid()) return;
        setLoading(true);
        try {
            await loginUser({ ...values });
            const res: any = await getUser();
            dispatch(setUser(res));
            navigate('/');
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    // ═══ Standards de référence — ISO 45001 (SST) + ISO 19011 (Audit) ═══
    const standards = [
        {
            code: 'ISO 45001:2018',
            title: language === 'fr' ? 'Santé et sécurité au travail' : 'Occupational Health & Safety',
            short: 'SST',
            Icon: IconShieldCheck,
            gradient: 'from-emerald-500 to-teal-600',
            iconColor: 'text-white',
            ring: 'ring-emerald-400/40',
        },
        {
            code: 'ISO 19011:2018',
            title: language === 'fr' ? "Audit des systèmes de management" : 'Auditing management systems',
            short: 'AUDIT',
            Icon: IconChecks,
            gradient: 'from-indigo-500 to-violet-600',
            iconColor: 'text-white',
            ring: 'ring-indigo-400/40',
        },
    ];

    // ═══ Palette conditionnelle dark/light ═══
    const palette = isDark
        ? {
            bg: 'bg-slate-950',
            text: 'text-slate-100',
            heroText: 'text-white',
            heroSub: 'text-slate-400',
            standardsTitle: 'text-slate-300',
            stdItemText: 'text-slate-200',
            stdItemSub: 'text-slate-500',
            stdItemHoverBg: 'hover:bg-white/5',
            stdItemBorder: 'border-white/10',
            cardBg: 'bg-sky-100/10',
            cardBorder: 'border-sky-200/20',
            cardText: 'text-white',
            cardSubtext: 'text-slate-300',
            inputBg: 'rgba(15, 23, 42, 0.45)',
            inputBorder: 'rgba(186, 230, 253, 0.25)',
            inputText: '#f1f5f9',
            inputLabel: 'text-sky-200',
            inputPlaceholder: 'rgba(186, 230, 253, 0.5)',
            checkboxLabel: 'text-slate-200',
            forgotLink: 'text-cyan-300 hover:text-cyan-200',
            footerText: 'text-slate-500',
            toggleBg: 'bg-white/5 border-white/10 hover:bg-white/10',
            toggleText: 'text-slate-200',
            toggleAccent: 'text-cyan-300',
            taglineText: 'text-emerald-300',
            taglineLabel: 'text-slate-400',
            securityIcon: 'text-emerald-400',
            errorBg: 'bg-red-500/10 border-red-400/40',
            errorText: 'text-red-200',
            errorIcon: 'text-red-400',
            cardDividerBg: 'border-white/5',
        }
        : {
            bg: 'bg-gradient-to-br from-sky-50 via-white to-emerald-50',
            text: 'text-slate-900',
            heroText: 'text-slate-900',
            heroSub: 'text-slate-600',
            standardsTitle: 'text-slate-700',
            stdItemText: 'text-slate-900',
            stdItemSub: 'text-slate-500',
            stdItemHoverBg: 'hover:bg-white',
            stdItemBorder: 'border-slate-200',
            cardBg: 'bg-white/60',
            cardBorder: 'border-sky-200/60',
            cardText: 'text-slate-900',
            cardSubtext: 'text-slate-600',
            inputBg: 'rgba(255, 255, 255, 0.75)',
            inputBorder: 'rgba(14, 165, 233, 0.30)',
            inputText: '#0f172a',
            inputLabel: 'text-sky-700',
            inputPlaceholder: 'rgba(100, 116, 139, 0.6)',
            checkboxLabel: 'text-slate-700',
            forgotLink: 'text-sky-700 hover:text-sky-800',
            footerText: 'text-slate-500',
            toggleBg: 'bg-white/80 border-slate-200 hover:bg-white',
            toggleText: 'text-slate-700',
            toggleAccent: 'text-sky-600',
            taglineText: 'text-emerald-700',
            taglineLabel: 'text-slate-500',
            securityIcon: 'text-emerald-600',
            errorBg: 'bg-red-50 border-red-300',
            errorText: 'text-red-800',
            errorIcon: 'text-red-500',
            cardDividerBg: 'border-slate-200',
        };

    return (
        <div className={`min-h-screen relative overflow-hidden ${palette.bg} ${palette.text} transition-colors duration-500`}>

            {/* === Fond futuriste === */}
            <div
                className={
                    isDark
                        ? 'absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.18),_transparent_55%),_radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.18),_transparent_55%),_radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.10),_transparent_70%)]'
                        : 'absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(186,230,253,0.5),_transparent_55%),_radial-gradient(ellipse_at_bottom_right,_rgba(167,243,208,0.4),_transparent_55%),_radial-gradient(circle_at_50%_50%,_rgba(199,210,254,0.25),_transparent_70%)]'
                }
            />

            {/* Grille technique subtile */}
            <div
                className={isDark ? 'absolute inset-0 opacity-[0.07]' : 'absolute inset-0 opacity-[0.05]'}
                style={{
                    backgroundImage: isDark
                        ? 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(15,23,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />

            {/* Particules animées */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(14)].map((_, i) => {
                    const colorsDark = ['rgba(52,211,153,0.6)', 'rgba(34,211,238,0.55)', 'rgba(165,180,252,0.5)'];
                    const colorsLight = ['rgba(14,165,233,0.5)', 'rgba(16,185,129,0.45)', 'rgba(99,102,241,0.4)'];
                    const colors = isDark ? colorsDark : colorsLight;
                    return (
                        <span
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: `${2 + Math.random() * 3}px`,
                                height: `${2 + Math.random() * 3}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: colors[i % 3],
                                boxShadow: `0 0 ${6 + Math.random() * 8}px ${colors[i % 3]}`,
                                animation: `safex-float ${8 + Math.random() * 8}s ease-in-out ${Math.random() * 4}s infinite`,
                            }}
                        />
                    );
                })}
            </div>

            {/* Arcs SVG lumineux */}
            <svg className={isDark ? 'absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none' : 'absolute inset-0 w-full h-full opacity-[0.20] pointer-events-none'} preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDark ? '#34d399' : '#0ea5e9'} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={isDark ? '#22d3ee' : '#10b981'} stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                <circle cx="15%" cy="85%" r="280" fill="none" stroke="url(#arcGrad)" strokeWidth="1.5" />
                <circle cx="85%" cy="15%" r="220" fill="none" stroke="url(#arcGrad)" strokeWidth="1.5" />
                <circle cx="50%" cy="50%" r="450" fill="none" stroke="url(#arcGrad)" strokeWidth="1" strokeDasharray="4 12" />
            </svg>

            {/* Keyframes injectés */}
            <style>{`
                @keyframes safex-float {
                    0%, 100% { transform: translate3d(0,0,0); opacity: 0.5; }
                    50% { transform: translate3d(20px,-30px,0); opacity: 1; }
                }
                @keyframes safex-glow-pulse-dark {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(125,211,252,0.0), 0 0 30px rgba(56,189,248,0.15); }
                    50% { box-shadow: 0 0 0 4px rgba(125,211,252,0.10), 0 0 50px rgba(56,189,248,0.28); }
                }
                @keyframes safex-glow-pulse-light {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0.0), 0 0 25px rgba(14,165,233,0.12); }
                    50% { box-shadow: 0 0 0 4px rgba(14,165,233,0.10), 0 0 40px rgba(14,165,233,0.22); }
                }
                .safex-card-glow-dark  { animation: safex-glow-pulse-dark  4s ease-in-out infinite; }
                .safex-card-glow-light { animation: safex-glow-pulse-light 4s ease-in-out infinite; }
            `}</style>

            {/* === Toggles haut droit (thème + langue) === */}
            <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    title={isDark ? (language === 'fr' ? 'Passer en clair' : 'Switch to light') : (language === 'fr' ? 'Passer en sombre' : 'Switch to dark')}
                    className={`flex items-center justify-center w-9 h-9 rounded-md ${palette.toggleBg} backdrop-blur-md transition-all`}
                    aria-label="Toggle theme"
                >
                    {isDark ? <IconSun size={16} className="text-amber-300" /> : <IconMoon size={16} className="text-indigo-600" />}
                </button>
                <button
                    onClick={toggleLanguage}
                    className={`flex items-center gap-2 px-3 h-9 rounded-md ${palette.toggleBg} backdrop-blur-md transition-all text-xs ${palette.toggleText}`}
                >
                    <IconWorld size={14} className={palette.toggleAccent} />
                    <span className="font-medium">{language === 'fr' ? 'FR' : 'EN'}</span>
                    <span className={palette.stdItemSub}>·</span>
                    <span>{language === 'fr' ? 'EN' : 'FR'}</span>
                </button>
            </div>

            {/* === Layout split === */}
            <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-0">

                {/* ═══════════════ COLONNE GAUCHE ═══════════════ */}
                <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14">

                    {/* Logo SafeX 360 */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start leading-[0.82] select-none">
                            <span
                                className={isDark ? 'text-[44px] text-white' : 'text-[44px] text-slate-900'}
                                style={{
                                    fontFamily: LOGO_FONT,
                                    fontWeight: 900,
                                    letterSpacing: '-0.045em',
                                    textShadow: isDark
                                        ? '0 2px 14px rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.5)'
                                        : '0 1px 2px rgba(15,23,42,0.15)',
                                }}
                            >
                                SafeX
                            </span>
                            <div className="flex items-baseline ml-[1px]" style={{ marginTop: '-2px' }}>
                                <span
                                    className="text-[34px] leading-none text-emerald-500"
                                    style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em', textShadow: isDark ? '0 0 16px rgba(52,211,153,0.45)' : '0 1px 4px rgba(52,211,153,0.30)' }}
                                >3</span>
                                <span
                                    className="text-[34px] leading-none text-blue-500"
                                    style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em', textShadow: isDark ? '0 0 16px rgba(96,165,250,0.45)' : '0 1px 4px rgba(59,130,246,0.30)' }}
                                >6</span>
                                <span
                                    className="text-[34px] leading-none text-red-500"
                                    style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em', textShadow: isDark ? '0 0 16px rgba(248,113,113,0.45)' : '0 1px 4px rgba(239,68,68,0.30)' }}
                                >0</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className={`text-[10px] uppercase tracking-[0.22em] ${palette.taglineLabel}`}>Plateforme HSE</span>
                            </div>
                            <span className={`text-[11px] tracking-wide ${palette.taglineText}`}>{t.tagline}</span>
                        </div>
                    </div>

                    {/* Hero + Standards */}
                    <div className="flex flex-col gap-7 max-w-[560px]">
                        <div>
                            <h1
                                className={`text-3xl xl:text-[34px] leading-[1.15] tracking-tight ${palette.heroText}`}
                                style={{ fontFamily: LOGO_FONT, fontWeight: 700, letterSpacing: '-0.02em' }}
                            >
                                La plateforme HSE de référence{' '}
                                <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                                    pour l'industrie minière
                                </span>
                            </h1>
                            <p className={`text-[13px] mt-3 leading-relaxed max-w-[480px] font-normal ${palette.heroSub}`}>
                                {t.heroSubtitle}
                            </p>
                        </div>

                        {/* ═══ Standards ISO — liste sans titre (épuré) ═══ */}
                        <ul className="space-y-2 max-w-[480px]">
                            {standards.map((s) => {
                                const Icon = s.Icon;
                                return (
                                    <li
                                        key={s.code}
                                        className={`group flex items-center gap-3 px-3 py-2 rounded-lg border ${palette.stdItemBorder} ${palette.stdItemHoverBg} backdrop-blur-sm transition-colors`}
                                    >
                                        <div className={`relative flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md ring-2 ${s.ring} group-hover:scale-105 transition-transform`}>
                                            <Icon size={20} className={s.iconColor} stroke={2} />
                                            <span className={`absolute -bottom-1 -right-1 px-1.5 py-px text-[8px] tracking-wider rounded-sm bg-white ${isDark ? 'text-slate-900' : 'text-slate-800'} shadow-md border border-white/50`}>
                                                {s.short}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm ${palette.stdItemText}`}>{s.code}</p>
                                            <p className={`text-[11px] ${palette.stdItemSub} leading-tight`}>{s.title}</p>
                                        </div>
                                        <IconShield size={14} className={isDark ? 'text-emerald-400/70 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Bas : indicateurs sécurité */}
                    <div className={`flex items-center gap-4 text-[11px] ${palette.footerText}`}>
                        <div className="flex items-center gap-1.5">
                            <IconLockSquare size={12} className={palette.securityIcon} />
                            <span>{t.securityBadge}</span>
                        </div>
                        <span className={palette.stdItemSub}>|</span>
                        <div className="flex items-center gap-1.5">
                            <IconBolt size={12} className={palette.toggleAccent} />
                            <span>{t.footer}</span>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ COLONNE DROITE — Carte ═══════════════ */}
                <div className="flex items-center justify-center p-6 sm:p-10 relative">

                    {/* Logo compact mobile uniquement (le logo desktop est dans la colonne gauche) */}
                    <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
                        <div className="flex flex-col items-start leading-[0.82] select-none">
                            <span className={isDark ? 'text-[24px] text-white' : 'text-[24px] text-slate-900'} style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.045em' }}>SafeX</span>
                            <div className="flex items-baseline" style={{ marginTop: '-1px' }}>
                                <span className="text-[18px] leading-none text-emerald-500" style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em' }}>3</span>
                                <span className="text-[18px] leading-none text-blue-500" style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em' }}>6</span>
                                <span className="text-[18px] leading-none text-red-500" style={{ fontFamily: LOGO_FONT, fontWeight: 900, letterSpacing: '-0.04em' }}>0</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-[420px] relative">

                        {/* Carte glassmorphism — bleu clair subtil */}
                        <div className={`${isDark ? 'safex-card-glow-dark' : 'safex-card-glow-light'} relative ${palette.cardBg} backdrop-blur-2xl rounded-2xl border ${palette.cardBorder} shadow-2xl overflow-hidden`}>

                            {/* Bordure interne lumineuse */}
                            <div
                                className="absolute inset-0 rounded-2xl pointer-events-none"
                                style={{
                                    background: isDark
                                        ? 'linear-gradient(135deg, rgba(125,211,252,0.30), transparent 35%, transparent 65%, rgba(56,189,248,0.30))'
                                        : 'linear-gradient(135deg, rgba(14,165,233,0.35), transparent 35%, transparent 65%, rgba(16,185,129,0.30))',
                                    padding: '1px',
                                    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    maskComposite: 'exclude',
                                }}
                            />

                            <div className="relative p-7">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-lg ${isDark ? 'bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-400/40' : 'bg-gradient-to-br from-sky-100 to-cyan-100 border border-sky-300'}`}>
                                        <IconShieldCheck size={22} className={isDark ? 'text-sky-200' : 'text-sky-700'} stroke={2} />
                                    </div>
                                    <h2 className={`text-lg tracking-tight ${palette.cardText}`} style={{ fontFamily: LOGO_FONT, fontWeight: 700 }}>
                                        {t.loginTitle}
                                    </h2>
                                    <p className={`text-xs mt-1 ${palette.cardSubtext}`}>{t.loginSubtitle}</p>
                                </div>

                                {/* Erreur */}
                                {error && (
                                    <div className={`mb-4 p-2.5 rounded-md ${palette.errorBg} flex items-center gap-2 backdrop-blur-sm border`}>
                                        <IconAlertTriangle size={14} className={`${palette.errorIcon} flex-shrink-0`} />
                                        <span className={`text-xs ${palette.errorText}`}>{t.errorMessage}</span>
                                    </div>
                                )}

                                {/* Formulaire */}
                                <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
                                    <TextInput
                                        label={<span className={`text-xs uppercase tracking-wider ${palette.inputLabel}`}>{t.loginLabel}</span>}
                                        placeholder={t.loginPlaceholder}
                                        withAsterisk
                                        size="md"
                                        radius="md"
                                        leftSection={<IconUser size={15} className={isDark ? 'text-sky-200/70' : 'text-sky-600/80'} />}
                                        styles={{
                                            input: {
                                                backgroundColor: palette.inputBg,
                                                borderColor: palette.inputBorder,
                                                color: palette.inputText,
                                                fontSize: '14px',
                                            },
                                        }}
                                        {...form.getInputProps('login')}
                                    />

                                    <PasswordInput
                                        label={<span className={`text-xs uppercase tracking-wider ${palette.inputLabel}`}>{t.passwordLabel}</span>}
                                        placeholder={t.passwordPlaceholder}
                                        withAsterisk
                                        size="md"
                                        radius="md"
                                        visibilityToggleIcon={({ reveal }) => (reveal ? <IconEyeOff size={15} /> : <IconEye size={15} />)}
                                        leftSection={<IconLock size={15} className={isDark ? 'text-sky-200/70' : 'text-sky-600/80'} />}
                                        styles={{
                                            input: {
                                                backgroundColor: palette.inputBg,
                                                borderColor: palette.inputBorder,
                                                color: palette.inputText,
                                                fontSize: '14px',
                                            },
                                        }}
                                        {...form.getInputProps('password')}
                                    />

                                    {/* Remember + Forgot */}
                                    <div className="flex items-center justify-between pt-1">
                                        <Checkbox
                                            label={<span className={`text-xs ${palette.checkboxLabel}`}>{t.rememberMe}</span>}
                                            size="xs"
                                            color="cyan"
                                            styles={{
                                                input: {
                                                    backgroundColor: palette.inputBg,
                                                    borderColor: palette.inputBorder,
                                                },
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forget-password')}
                                            className={`text-xs transition-colors ${palette.forgotLink}`}
                                        >
                                            {t.forgotPassword}
                                        </button>
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        loading={loading}
                                        size="md"
                                        radius="md"
                                        leftSection={<IconShield size={16} />}
                                        styles={{
                                            root: {
                                                background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                letterSpacing: '0.01em',
                                                boxShadow: isDark
                                                    ? '0 8px 24px rgba(14, 165, 233, 0.30), 0 2px 6px rgba(6, 182, 212, 0.20)'
                                                    : '0 8px 24px rgba(14, 165, 233, 0.25), 0 2px 6px rgba(16, 185, 129, 0.20)',
                                                border: 'none',
                                            },
                                        }}
                                        className="hover:!opacity-90 transition-opacity"
                                    >
                                        {loading ? t.loginProgress : t.loginButton}
                                    </Button>
                                </form>

                                {/* Footer carte */}
                                <div className={`mt-6 pt-4 border-t ${palette.cardDividerBg} flex items-center justify-center gap-1.5 text-[10px] ${palette.footerText}`}>
                                    <IconLockSquare size={11} className={palette.securityIcon} />
                                    <span>{t.securityBadge}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer copyright */}
                        <p className={`text-center text-[10px] mt-5 tracking-wide ${palette.footerText}`}>
                            © {new Date().getFullYear()} MineXpert · SafeX 360 · {t.footer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginsPage;
