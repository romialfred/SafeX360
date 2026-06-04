import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconAlertTriangle,
    IconWorld,
    IconArrowRight,
} from '@tabler/icons-react';
import { Button, PasswordInput, TextInput, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';
import SafeXBrandMark from '../../UtilityComp/SafeXBrandMark';

/**
 * SafeX 360 — Page de connexion v4 (LOT 41).
 *
 * REFONTE ÉPURÉE après audit utilisateur :
 *   - Suppression des 5 features bullets (colonne gauche encombrée)
 *   - Suppression du label "BIENVENUE" + barres horizontales (clutter)
 *   - Suppression du footer carte ("Connexion chiffrée · v2.4")
 *   - Typographie EN BLANC sur la photo (fini les titres noirs illisibles)
 *   - Carte de connexion compacte, centrée
 *   - Page épurée à 3 éléments : marque · phrase d'accroche · formulaire
 *
 * Contraste WCAG 2.2 AA garanti via text-shadow renforcé sur les textes
 * blancs et un overlay sombre suffisant sur l'image.
 */

const HERO_IMAGE_FALLBACK =
    'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=3840&q=85';

const LoginsPage = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);

    const t = language === 'fr'
        ? {
            tagline: 'Plateforme HSE pour l\'industrie minière',
            loginTitle: 'Connexion',
            loginSubtitle: 'Accédez à votre espace de pilotage',
            loginLabel: 'Identifiant',
            loginPlaceholder: 'votre identifiant',
            passwordLabel: 'Mot de passe',
            passwordPlaceholder: '••••••••',
            forgotPassword: 'Mot de passe oublié',
            loginButton: 'Se connecter',
            loginProgress: 'Connexion…',
            errorMessage: 'Identifiant ou mot de passe incorrect',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
        }
        : {
            tagline: 'HSE platform for mining operations',
            loginTitle: 'Sign in',
            loginSubtitle: 'Access your operations dashboard',
            loginLabel: 'User ID',
            loginPlaceholder: 'your user ID',
            passwordLabel: 'Password',
            passwordPlaceholder: '••••••••',
            forgotPassword: 'Forgot password',
            loginButton: 'Sign in',
            loginProgress: 'Signing in…',
            errorMessage: 'Incorrect user ID or password',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
        };

    const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');

    const form = useForm({
        initialValues: { login: '', password: '' },
        validate: {
            login: (value) => (value.trim().length === 0
                ? (language === 'fr' ? 'Requis' : 'Required')
                : null),
            password: (value) => (!value
                ? (language === 'fr' ? 'Requis' : 'Required')
                : null),
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

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">

            {/* ═══ Image plein écran — moins de flou, plus de luminosité ═══ */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('/login-bg.jpg'), url('${HERO_IMAGE_FALLBACK}')`,
                    filter: 'blur(4px) saturate(1.2) brightness(1.05)',
                    transform: 'scale(1.04)',
                }}
            />

            {/* ═══ Overlay dégradé — moins opaque pour laisser respirer l'image ═══ */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(135deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.42) 50%, rgba(15,23,42,0.65) 100%)`,
                }}
            />

            {/* Halo teal subtil au centre pour amener un accent de couleur */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 38%, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0) 45%)',
                }}
            />

            {/* ═══ Toggle langue (haut droit) ═══ */}
            <button
                onClick={toggleLanguage}
                className="absolute top-5 right-5 z-30 flex items-center gap-2 px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-[12.5px] text-white"
                aria-label={language === 'fr' ? 'Passer en anglais' : 'Switch to French'}
            >
                <IconWorld size={14} aria-hidden="true" />
                <span className="tracking-wide">{language === 'fr' ? 'FR' : 'EN'}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/60">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            {/* ═══ Container centré ═══ */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">

                {/* Marque + tagline — logo coloré (bouclier teal gradient) */}
                <div className="flex flex-col items-center text-center mb-8 max-w-md">
                    {/* Bouclier coloré (gradient teal → rouge — identité HSE forte) */}
                    <div
                        className="mb-4"
                        style={{ filter: 'drop-shadow(0 10px 30px rgba(20,184,166,0.6))' }}
                    >
                        <svg
                            width="84"
                            height="84"
                            viewBox="0 0 64 64"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="SafeX 360"
                        >
                            <defs>
                                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#5EEAD4" />
                                    <stop offset="55%" stopColor="#14B8A6" />
                                    <stop offset="100%" stopColor="#EF4444" />
                                </linearGradient>
                                <linearGradient id="shieldHighlight" x1="0%" y1="0%" x2="0%" y2="60%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </defs>
                            {/* Bouclier — fond gradient teal → rouge */}
                            <path
                                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                fill="url(#shieldGradient)"
                                stroke="rgba(255,255,255,0.35)"
                                strokeWidth="0.8"
                            />
                            {/* Highlight subtil */}
                            <path
                                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                fill="url(#shieldHighlight)"
                            />
                            {/* Coche blanche épaisse */}
                            <path
                                d="M 20 31 L 29 40 L 45 21"
                                stroke="white"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    {/* Wordmark — "Safe" blanc, "X" teal vif, "360" rouge accent identité */}
                    <h1
                        className="flex items-baseline gap-0.5"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(40px, 5.5vw, 52px)',
                            letterSpacing: '-0.022em',
                            lineHeight: 1,
                            textShadow: '0 4px 28px rgba(0,0,0,0.7)',
                        }}
                    >
                        <span className="text-white">Safe</span>
                        <span style={{
                            color: '#2DD4BF',
                            textShadow: '0 0 24px rgba(45,212,191,0.55), 0 2px 14px rgba(0,0,0,0.6)',
                        }}>X</span>
                        <span style={{
                            color: '#EF4444',
                            marginLeft: '0.4rem',
                            textShadow: '0 0 24px rgba(239,68,68,0.55), 0 2px 14px rgba(0,0,0,0.6)',
                        }}>360</span>
                    </h1>

                    {/* Tagline */}
                    <p
                        className="text-white/85 mt-4 max-w-sm"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 400,
                            fontSize: '15px',
                            letterSpacing: '0.005em',
                            lineHeight: 1.5,
                            textShadow: '0 2px 14px rgba(0,0,0,0.7)',
                        }}
                    >
                        {t.tagline}
                    </p>
                </div>

                {/* Carte de connexion compacte */}
                <div
                    className="w-full max-w-[400px] rounded-2xl border border-white/12 shadow-2xl overflow-hidden"
                    style={{
                        background: 'rgba(15, 23, 42, 0.62)',
                        backdropFilter: 'blur(24px) saturate(140%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                    }}
                >
                    <div className="p-7 sm:p-8">

                        {/* Titre Connexion — BLANC PUR, gros, sans décorations qui le rendent illisible */}
                        <h2
                            className="text-center text-white"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '28px',
                                letterSpacing: '-0.014em',
                                lineHeight: 1.15,
                                color: '#FFFFFF',
                            }}
                        >
                            {t.loginTitle}
                        </h2>
                        {/* Petite barre d'accent rouge SOUS le titre (pas autour) */}
                        <div
                            className="mx-auto mt-2 mb-3 h-[2px] rounded-full"
                            style={{
                                width: '40px',
                                background: 'linear-gradient(90deg, #2DD4BF 0%, #EF4444 100%)',
                            }}
                            aria-hidden="true"
                        />
                        <p className="text-[13.5px] text-white/85 text-center">
                            {t.loginSubtitle}
                        </p>

                        {/* Erreur */}
                        {error && (
                            <div
                                className="mt-5 p-3 rounded-lg bg-red-500/15 border border-red-400/40 flex items-center gap-2"
                                role="alert"
                                aria-live="assertive"
                            >
                                <IconAlertTriangle size={15} className="text-red-300 flex-shrink-0" aria-hidden="true" />
                                <span className="text-[13px] text-red-100">{t.errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={form.onSubmit(handleSubmit)} className="mt-6 space-y-4">

                            <TextInput
                                label={
                                    <span className="text-[11.5px] uppercase tracking-[0.14em] text-white/80">
                                        {t.loginLabel}
                                    </span>
                                }
                                placeholder={t.loginPlaceholder}
                                withAsterisk
                                size="md"
                                radius="md"
                                autoComplete="username"
                                leftSection={<IconUser size={15} className="text-white/55" aria-hidden="true" />}
                                styles={{
                                    input: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                                        borderColor: 'rgba(255, 255, 255, 0.14)',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                    },
                                }}
                                {...form.getInputProps('login')}
                            />

                            <PasswordInput
                                label={
                                    <span className="text-[11.5px] uppercase tracking-[0.14em] text-white/80">
                                        {t.passwordLabel}
                                    </span>
                                }
                                placeholder={t.passwordPlaceholder}
                                withAsterisk
                                size="md"
                                radius="md"
                                autoComplete="current-password"
                                visibilityToggleIcon={({ reveal }) =>
                                    reveal ? <IconEyeOff size={15} aria-hidden="true" /> : <IconEye size={15} aria-hidden="true" />
                                }
                                leftSection={<IconLock size={15} className="text-white/55" aria-hidden="true" />}
                                styles={{
                                    input: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                                        borderColor: 'rgba(255, 255, 255, 0.14)',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                    },
                                }}
                                {...form.getInputProps('password')}
                            />

                            {/* Mot de passe oublié — discret */}
                            <div className="flex justify-end -mt-1">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forget-password')}
                                    className="text-[12px] text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {/* CTA principal */}
                            <Button
                                type="submit"
                                fullWidth
                                loading={loading}
                                size="md"
                                radius="md"
                                rightSection={loading
                                    ? <Loader size="xs" color="white" />
                                    : <IconArrowRight size={16} aria-hidden="true" />
                                }
                                styles={{
                                    root: {
                                        background: '#ffffff',
                                        color: '#0f172a',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        letterSpacing: '0.005em',
                                        height: '46px',
                                        marginTop: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                    },
                                    label: {
                                        color: '#0f172a',
                                    },
                                }}
                                className="hover:!bg-slate-100 transition-colors"
                            >
                                {loading ? t.loginProgress : t.loginButton}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Footer minimal — uniquement les normes ISO */}
                <p
                    className="mt-8 text-[11px] uppercase tracking-[0.18em] text-white/60 text-center"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
                >
                    {t.standards}
                </p>
            </div>
        </div>
    );
};

export default LoginsPage;
