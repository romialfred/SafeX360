import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconAlertTriangle,
    IconWorld,
    IconArrowRight,
    IconArrowLeft,
} from '@tabler/icons-react';
import { Button, PasswordInput, TextInput, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';
import SafeXBrandMark from '../../UtilityComp/SafeXBrandMark';
import IsoBadge from '../../UtilityComp/IsoBadge';

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
    type LoginErrorKind = 'credentials' | 'network' | 'server' | 'waking' | null;
    const [errorKind, setErrorKind] = useState<LoginErrorKind>(null);

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
            errorCredentials: 'Identifiant ou mot de passe incorrect.',
            errorNetwork: 'Service injoignable — réessayez dans un instant.',
            errorServer: 'Erreur serveur — réessayez.',
            errorWaking: 'Réveil du serveur… nouvelle tentative.',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
            mobileTitle: 'Application mobile terrain',
            mobileSubtitle: 'Android · Hors ligne · ISO 45001',
            // LOT — Suppression de "Field", texte raccourci a "Telecharger SafeX 360"
            // SafeX 360 sera stylise comme le logo (X teal, 360 rouge) dans le JSX.
            mobileDownloadPrefix: 'Télécharger',
            mobileDownloadAria: 'Télécharger SafeX 360',
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
            errorCredentials: 'Incorrect user ID or password.',
            errorNetwork: 'Service unreachable — please retry shortly.',
            errorServer: 'Server error — please retry.',
            errorWaking: 'Server waking up… retrying.',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
            mobileTitle: 'Mobile application',
            mobileSubtitle: 'Android · Offline · ISO 45001',
            mobileDownloadPrefix: 'Download',
            mobileDownloadAria: 'Download SafeX 360',
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
        setErrorKind(null);
        form.validate();
        if (!form.isValid()) return;
        setLoading(true);

        // Render free-tier : le gateway peut être en veille (cold start ~30-60 s).
        // Une erreur RÉSEAU (aucune réponse HTTP : DNS, timeout, connexion refusée)
        // n'est PAS une erreur d'identifiants → on le distingue clairement et on
        // retente automatiquement quelques fois le temps que le serveur se réveille.
        const attempt = async (retriesLeft: number): Promise<void> => {
            try {
                await loginUser({ ...values });
                const res: any = await getUser();
                dispatch(setUser(res));
                navigate('/');
            } catch (err: any) {
                const isNetwork = !err?.response; // pas de réponse HTTP = problème réseau/serveur injoignable
                const status = err?.response?.status;
                // Cold start Render free-tier : pas de réponse OU 5xx transitoire (502/503/504/500)
                // pendant le réveil du conteneur → on retente automatiquement.
                const isColdStart = isNetwork || (typeof status === 'number' && status >= 500);
                if (isColdStart && retriesLeft > 0) {
                    setErrorKind('waking');
                    await new Promise((r) => setTimeout(r, 4000));
                    return attempt(retriesLeft - 1);
                }
                if (status === 401 || status === 403) setErrorKind('credentials');
                else if (isNetwork) setErrorKind('network');
                else setErrorKind('server');
            }
        };

        try {
            await attempt(3);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Refonte 2026-06-09 : h-screen + overflow-hidden pour ZERO scroll vertical
        <div className="h-screen w-screen fixed inset-0 overflow-hidden bg-slate-950 text-white">

            {/* ═══ Image plein écran — flou minimal pour rendre la scene mine bien visible ═══ */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    // LOT — Background Login : photo reelle "2 mineurs africains + tablette
                    // + overlay digital HSE cyan, mine au coucher de soleil"
                    // Source : imgs/Login/Login 1.png → public/login-mine-team.png
                    // Fallback en chaine : nouvelle image, ancienne image, image Unsplash
                    backgroundImage: `url('/login-mine-team.png'), url('/login-bg.jpg'), url('${HERO_IMAGE_FALLBACK}')`,
                    // LOT 49 — Photo nette : flou ramene a 1.5px (le 5px noyait la scene).
                    // La lisibilite est portee par l'overlay leger + le panneau verre depoli.
                    filter: 'blur(1.5px) saturate(1.05)',
                    transform: 'scale(1.03)', // absorbe les bords adoucis
                }}
            />

            {/* ═══ Overlay dégradé — opacite augmentee pour effet "translucide/depoli" ═══ */}
            <div
                className="absolute inset-0"
                style={{
                    // LOT 49 — Voile allege : la photo reste visible et nette, le
                    // contraste du texte est assure par les text-shadows et le panneau.
                    background: `linear-gradient(135deg, rgba(2,44,40,0.38) 0%, rgba(2,44,40,0.26) 50%, rgba(2,44,40,0.48) 100%)`,
                }}
            />

            {/* Halo teal subtil au centre pour amener un accent de couleur */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 38%, rgba(20,184,166,0.14) 0%, rgba(20,184,166,0) 50%)',
                }}
            />

            {/* ═══ Retour au site vitrine (haut gauche) ═══ */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-5 left-5 z-30 flex items-center gap-2 px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-[12.5px] text-white"
                aria-label={language === 'fr' ? 'Retourner sur le site SafeX 360' : 'Back to the SafeX 360 website'}
            >
                <IconArrowLeft size={14} aria-hidden="true" />
                <span className="tracking-wide">{language === 'fr' ? 'Retour au site' : 'Back to site'}</span>
            </button>

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

            {/* LOT — Container : le bloc complet (logo + formulaire + badge) est decale
                de 200px vers la GAUCHE par rapport au centre de la page, MAIS chaque element
                reste centre HORIZONTALEMENT par rapport aux autres (alignement interne).
                Sur mobile (< md), pas de decalage pour rester lisible. */}
            <div className="relative z-10 h-full w-full flex flex-col items-center [justify-content:safe_center] px-4 py-3 md:py-5 overflow-y-auto md:-translate-x-[100px] lg:-translate-x-[200px]">

                {/* Marque + tagline — logo coloré (bouclier teal gradient) */}
                <div className="flex flex-col items-center text-center mb-3 md:mb-5 max-w-md">
                    {/* Bouclier coloré (gradient teal → rouge — identité HSE forte) */}
                    <div
                        className="mb-2 md:mb-3"
                        style={{ filter: 'drop-shadow(0 10px 30px rgba(20,184,166,0.6))' }}
                    >
                        <svg
                            width="64"
                            height="64"
                            className="md:w-[76px] md:h-[76px]"
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
                            fontSize: 'clamp(32px, 4.5vw, 44px)',
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
                        className="text-white/85 mt-2 md:mt-3 max-w-sm"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 400,
                            fontSize: '13.5px',
                            letterSpacing: '0.005em',
                            lineHeight: 1.45,
                            textShadow: '0 2px 14px rgba(0,0,0,0.7)',
                        }}
                    >
                        {t.tagline}
                    </p>
                </div>

                {/* Carte de connexion compacte
                    LOT 48 P6.d : changement de couleur
                    - Avant : bleu marine slate (rgba(15, 23, 42, 0.62)) → trop sombre, peu identitaire
                    - Après : verre teal profond (rgba(6, 78, 70, 0.55)) avec bordure teal lumineuse
                      → cohérent avec l'identité HSE SafeX (bouclier teal→rouge), plus chaleureux,
                      et plus transparent pour laisser respirer l'image de fond. */}
                <div
                    className="w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 78, 70, 0.58) 0%, rgba(4, 47, 46, 0.62) 100%)',
                        backdropFilter: 'blur(22px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
                        border: '1px solid rgba(94, 234, 212, 0.28)',
                        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.65), 0 0 0 1px rgba(94,234,212,0.08) inset',
                    }}
                >
                    <div className="p-5 sm:p-6">

                        {/* Titre Connexion — BLANC PUR, gros, sans décorations qui le rendent illisible */}
                        <h2
                            className="text-center text-white"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '24px',
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
                        <p className="text-[12.5px] text-white/85 text-center">
                            {t.loginSubtitle}
                        </p>

                        {/* Erreur / état réseau */}
                        {errorKind && (
                            <div
                                className={`mt-3 p-2 rounded-lg border flex items-center gap-2 ${
                                    errorKind === 'waking'
                                        ? 'bg-amber-500/15 border-amber-400/40'
                                        : 'bg-red-500/15 border-red-400/40'
                                }`}
                                role="alert"
                                aria-live="assertive"
                            >
                                <IconAlertTriangle
                                    size={14}
                                    className={`flex-shrink-0 ${errorKind === 'waking' ? 'text-amber-300' : 'text-red-300'}`}
                                    aria-hidden="true"
                                />
                                <span className={`text-[12.5px] ${errorKind === 'waking' ? 'text-amber-100' : 'text-red-100'}`}>
                                    {errorKind === 'credentials' && t.errorCredentials}
                                    {errorKind === 'network' && t.errorNetwork}
                                    {errorKind === 'server' && t.errorServer}
                                    {errorKind === 'waking' && t.errorWaking}
                                </span>
                            </div>
                        )}

                        <form onSubmit={form.onSubmit(handleSubmit)} className="mt-4 space-y-3">

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
                                        // Refonte teal : fond légèrement plus profond + bordure teal subtile
                                        backgroundColor: 'rgba(3, 36, 34, 0.65)',
                                        borderColor: 'rgba(94, 234, 212, 0.22)',
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
                                        // Refonte teal : fond légèrement plus profond + bordure teal subtile
                                        backgroundColor: 'rgba(3, 36, 34, 0.65)',
                                        borderColor: 'rgba(94, 234, 212, 0.22)',
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
                                        height: '42px',
                                        marginTop: '4px',
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

                {/* Bouton "Télécharger l'app Android" — Phase M6 */}
                <a
                    href="/downloads/SafexMobile.apk"
                    download="SafexMobile.apk"
                    className="mt-3 md:mt-4 mx-auto flex items-center justify-between gap-3 px-3 py-2 bg-black/70 hover:bg-black/85 backdrop-blur-sm border border-white/15 rounded-xl transition-colors max-w-[340px] w-full"
                    style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.35)' }}
                    aria-label={t.mobileDownloadAria}
                >
                    {/* Icône Google Play officielle (SVG triangle quadricolore) */}
                    <svg
                        viewBox="0 0 24 24"
                        className="w-7 h-7 flex-shrink-0"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id="gp-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00D2FF" />
                                <stop offset="100%" stopColor="#3A7BD5" />
                            </linearGradient>
                            <linearGradient id="gp-red" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF3A44" />
                                <stop offset="100%" stopColor="#C31162" />
                            </linearGradient>
                            <linearGradient id="gp-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFD43B" />
                                <stop offset="100%" stopColor="#FF8800" />
                            </linearGradient>
                            <linearGradient id="gp-green" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00F076" />
                                <stop offset="100%" stopColor="#00B96B" />
                            </linearGradient>
                        </defs>
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a.996.996 0 01.61-.92z" fill="url(#gp-blue)" />
                        <path d="M16.61 8.819L5.51 1.86l9.89 9.89 1.21-2.93z" fill="url(#gp-green)" />
                        <path d="M16.61 15.181L5.51 22.14l9.89-9.89 1.21 2.93z" fill="url(#gp-red)" />
                        <path d="M20.16 10.81l-3.43-2.05L13.79 12l2.94 3.24 3.43-2.05a1.379 1.379 0 000-2.38z" fill="url(#gp-yellow)" />
                    </svg>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-[9.5px] uppercase tracking-[0.14em] text-white/70">
                            {t.mobileTitle}
                        </div>
                        {/* LOT — Wordmark stylise comme le logo de marque : "Safe" + X teal + 360 rouge */}
                        <div
                            className="text-[14px] font-medium leading-tight mt-0.5 flex items-baseline gap-1"
                            aria-label={t.mobileDownloadAria}
                        >
                            <span className="text-white">{t.mobileDownloadPrefix}</span>
                            <span
                                className="inline-flex items-baseline"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 700,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                <span className="text-white">Safe</span>
                                <span
                                    style={{
                                        color: '#2DD4BF',
                                        textShadow: '0 0 10px rgba(45,212,191,0.55)',
                                    }}
                                >
                                    X
                                </span>
                                <span
                                    style={{
                                        color: '#EF4444',
                                        marginLeft: '0.2rem',
                                        textShadow: '0 0 10px rgba(239,68,68,0.55)',
                                    }}
                                >
                                    360
                                </span>
                            </span>
                        </div>
                        <div className="text-[10px] text-white/55 mt-0.5">
                            {t.mobileSubtitle}
                        </div>
                    </div>
                </a>

                {/* Footer minimal — badges officiels des normes ISO (règle plateforme :
                    jamais de norme en texte nu) */}
                <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    {(['ISO 45001', 'ISO 14001', 'ISO 9001', 'ISO 19011'] as const).map((norm) => (
                        <IsoBadge key={norm} norm={norm} theme="dark" size="sm" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginsPage;
