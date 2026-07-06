import { useState } from 'react';
import {
    IconEye,
    IconEyeOff,
    IconLock,
    IconUser,
    IconWorld,
    IconArrowRight,
    IconArrowLeft,
} from '@tabler/icons-react';
import { Button, Modal, PasswordInput, TextInput, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { isNativePlatform } from '../../../m/utils/capacitorBridge';
import { getUser, loginUser } from '../../../services/LoginService';
import { useAppDispatch } from '../../../slices/hooks';
import { setUser } from '../../../slices/UserSlice';
import { useForm } from '@mantine/form';
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
    type LoginErrorKind = 'credentials' | 'network' | 'server' | 'waking' | 'rateLimit' | 'invitationExpired' | null;
    const [errorKind, setErrorKind] = useState<LoginErrorKind>(null);
    const [wakingStep, setWakingStep] = useState(0);

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
            errorRateLimit: 'Trop de tentatives échouées — réessayez dans quelques minutes.',
            popupTitleError: 'Connexion impossible',
            popupTitleTechnical: 'Problème technique',
            popupTitleBlocked: 'Accès temporairement bloqué',
            popupCredentials: 'Les informations saisies ne correspondent à aucun compte. Vérifiez votre identifiant et votre mot de passe, puis réessayez.',
            popupNetwork: 'Le serveur SafeX est actuellement injoignable. Cela ne vient pas de vos identifiants — vérifiez votre connexion internet ou réessayez dans quelques instants.',
            popupServer: 'Le service rencontre un problème technique temporaire. Ce n\'est pas lié à vos identifiants. Veuillez réessayer dans quelques instants ou contacter votre administrateur si le problème persiste.',
            popupWaking: 'Le serveur SafeX démarre, veuillez patienter…',
            popupRateLimit: 'Par mesure de sécurité, votre accès a été temporairement bloqué après plusieurs tentatives infructueuses. Veuillez réessayer dans 15 minutes.',
            popupInvitationExpired: 'Votre invitation a expiré. Veuillez contacter votre administrateur pour en recevoir une nouvelle.',
            popupClose: 'Compris',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
            mobileEyebrow: 'APPLICATION MOBILE',
            mobileTitle: 'SafeX 360 HSE',
            mobileVersion: 'v2.1',
            mobileSizeLabel: '83 Mo',
            mobileFeature1: 'Mode hors ligne',
            mobileFeature2: 'Caméra IA',
            mobileFeature3: 'GPS terrain',
            mobileDownloadCta: 'Installer sur Android',
            mobileDownloadAria: 'Télécharger SafeX 360 HSE pour Android',
            mobileCompat: 'Android 7.0+ requis',
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
            errorRateLimit: 'Too many failed attempts — please try again in a few minutes.',
            popupTitleError: 'Unable to Sign In',
            popupTitleTechnical: 'Technical Issue',
            popupTitleBlocked: 'Access Temporarily Blocked',
            popupCredentials: 'The credentials you entered do not match any account. Please check your user ID and password, then try again.',
            popupNetwork: 'The SafeX server is currently unreachable. This is not related to your credentials — please check your internet connection or try again shortly.',
            popupServer: 'The service is experiencing a temporary technical issue. This is not related to your credentials. Please try again shortly or contact your administrator if the problem persists.',
            popupWaking: 'The SafeX server is starting up, please wait…',
            popupRateLimit: 'For security purposes, your access has been temporarily blocked after several unsuccessful attempts. Please try again in 15 minutes.',
            popupInvitationExpired: 'Your invitation has expired. Please contact your administrator for a new one.',
            popupClose: 'Got it',
            standards: 'ISO 45001 · 14001 · 9001 · 19011',
            mobileEyebrow: 'MOBILE APP',
            mobileTitle: 'SafeX 360 HSE',
            mobileVersion: 'v2.1',
            mobileSizeLabel: '83 MB',
            mobileFeature1: 'Offline mode',
            mobileFeature2: 'AI Camera',
            mobileFeature3: 'Field GPS',
            mobileDownloadCta: 'Install on Android',
            mobileDownloadAria: 'Download SafeX 360 HSE for Android',
            mobileCompat: 'Android 7.0+ required',
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
        setWakingStep(0);
        form.validate();
        if (!form.isValid()) return;
        setLoading(true);

        const MAX_RETRIES = 8;
        let finalErrorKind: LoginErrorKind = null;

        const attempt = async (retriesLeft: number): Promise<void> => {
            let loginSucceeded = false;
            try {
                await loginUser({ ...values });
                loginSucceeded = true;
                setWakingStep(4);
                const res: any = await getUser();
                dispatch(setUser(res));
                navigate(isNativePlatform() ? '/m/home' : '/');
            } catch (err: any) {
                const isNetwork = !err?.response;
                const status = err?.response?.status;
                const errMsg = err?.response?.data?.errorMessage ?? '';

                if (status === 429) {
                    finalErrorKind = 'rateLimit';
                    setErrorKind('rateLimit');
                    return;
                }
                if (errMsg === 'INVITATION_EXPIRED') {
                    finalErrorKind = 'invitationExpired';
                    setErrorKind('invitationExpired');
                    return;
                }

                if (loginSucceeded) {
                    finalErrorKind = 'server';
                    setErrorKind('server');
                    return;
                }

                const isAuthError = status === 401 || status === 403
                    || errMsg === 'Incorrect username or password'
                    || errMsg === 'Authentication failed';
                if (isAuthError) {
                    finalErrorKind = 'credentials';
                    setErrorKind('credentials');
                    return;
                }

                const isColdStart = isNetwork || status === 502 || status === 503 || status === 504;
                if (isColdStart && retriesLeft > 0) {
                    const elapsed = MAX_RETRIES - retriesLeft;
                    const step = Math.min(Math.floor((elapsed / MAX_RETRIES) * 4) + 1, 4);
                    setWakingStep(step);
                    setErrorKind('waking');
                    finalErrorKind = 'waking';
                    await new Promise((r) => setTimeout(r, 5000));
                    return attempt(retriesLeft - 1);
                }

                finalErrorKind = isNetwork ? 'network' : 'server';
                setErrorKind(finalErrorKind);
            }
        };

        try {
            await attempt(MAX_RETRIES);
        } finally {
            setLoading(false);
            if (finalErrorKind !== 'waking') setWakingStep(0);
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
                    <div className="px-6 py-8 sm:px-7 sm:py-10">

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


                        <form onSubmit={form.onSubmit(handleSubmit)} className="mt-6 space-y-5">

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

                {/* Pied : bouton Google Play + badges ISO sur une même ligne horizontale */}
                <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 w-full max-w-[620px]">

                {/* Carte téléchargement APK — masquée dans l'APK Capacitor */}
                {!isNativePlatform() && <a
                    href="/downloads/SafexMobile.apk"
                    download="SafeX 360 HSE.apk"
                    className="group flex items-stretch gap-0 bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/10 hover:border-teal-400/30 rounded-2xl transition-all duration-300 overflow-hidden"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset', maxWidth: 380 }}
                    aria-label={t.mobileDownloadAria}
                >
                    {/* Colonne gauche — icône bouclier SafeX */}
                    <div
                        className="flex items-center justify-center px-4 py-3 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(15,118,110,0.35), rgba(13,148,136,0.15))' }}
                    >
                        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10" aria-hidden="true">
                            <path d="M32 3L56 11C56.5 11.2 57 11.6 57 12.3L57 30C57 44 36 60 32.7 61.6C32.3 61.8 31.7 61.8 31.3 61.6C28 60 7 44 7 30L7 12.3C7 11.6 7.5 11.2 8 11Z" fill="url(#dl-shield)" />
                            <path d="M19 33L32 20L45 33" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 43L32 33L42 43" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                            <defs>
                                <linearGradient id="dl-shield" x1="32" y1="3" x2="32" y2="62" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#14B8A6" />
                                    <stop offset="1" stopColor="#0F766E" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    {/* Colonne droite — infos + CTA */}
                    <div className="flex-1 min-w-0 py-3 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] uppercase tracking-[0.16em] text-teal-400/80 font-semibold">{t.mobileEyebrow}</span>
                            <span className="text-[9px] px-1.5 py-px rounded-full bg-teal-500/20 text-teal-300 font-medium">{t.mobileVersion}</span>
                        </div>
                        <div
                            className="text-[15px] font-bold leading-tight text-white flex items-baseline gap-0.5"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: '-0.01em' }}
                        >
                            <span>Safe</span>
                            <span style={{ color: '#2DD4BF' }}>X</span>
                            <span style={{ color: '#EF4444', marginLeft: '0.18rem' }}>360</span>
                            <span className="text-white/60 ml-1 text-[13px] font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>HSE</span>
                        </div>
                        {/* Feature chips */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {[t.mobileFeature1, t.mobileFeature2, t.mobileFeature3].map((f) => (
                                <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/8 text-white/60 border border-white/6">{f}</span>
                            ))}
                        </div>
                        {/* Bouton CTA */}
                        <div className="flex items-center gap-2 mt-2.5">
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-white transition-colors"
                                style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)' }}
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {t.mobileDownloadCta}
                            </span>
                            <span className="text-[9.5px] text-white/40">{t.mobileSizeLabel}</span>
                        </div>
                        <div className="text-[8.5px] text-white/30 mt-1.5">{t.mobileCompat}</div>
                    </div>
                </a>}

                {/* Badges officiels des normes ISO (règle plateforme : jamais de norme en texte nu) */}
                <div className="flex items-center gap-2.5">
                    {(['ISO 45001', 'ISO 14001', 'ISO 9001', 'ISO 19011'] as const).map((norm) => (
                        <IsoBadge key={norm} norm={norm} theme="dark" size="sm" />
                    ))}
                </div>

                </div>

                {/* ═══ Popup d'erreur SafeX — professionnelle avec logo officiel ═══ */}
                <Modal
                    opened={errorKind !== null && errorKind !== 'waking'}
                    onClose={() => setErrorKind(null)}
                    centered
                    withCloseButton={false}
                    radius="lg"
                    size="sm"
                    overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
                    styles={{
                        content: {
                            backgroundColor: '#0a1f1d',
                            border: 'none',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(20,184,166,0.08)',
                        },
                        body: { padding: 0 },
                    }}
                >
                    <div className="flex flex-col items-center text-center px-6 py-7">
                        {/* Logo officiel SafeX 360 — identique à la page de login */}
                        <div style={{ filter: 'drop-shadow(0 6px 20px rgba(20,184,166,0.45))' }}>
                            <svg
                                width="48" height="48"
                                viewBox="0 0 64 64"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-label="SafeX 360"
                            >
                                <defs>
                                    <linearGradient id="popupShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#5EEAD4" />
                                        <stop offset="55%" stopColor="#14B8A6" />
                                        <stop offset="100%" stopColor="#EF4444" />
                                    </linearGradient>
                                    <linearGradient id="popupShieldHL" x1="0%" y1="0%" x2="0%" y2="60%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#popupShieldGrad)"
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth="0.8"
                                />
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#popupShieldHL)"
                                />
                                <path
                                    d="M 20 31 L 29 40 L 45 21"
                                    stroke="white" strokeWidth="5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>
                        {/* Wordmark SafeX 360 */}
                        <div className="flex items-baseline gap-0.5 mt-2" style={{ userSelect: 'none' }}>
                            <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Safe</span>
                            <span style={{ color: '#5EEAD4', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>X</span>
                            <span style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600, marginLeft: '3px' }}>360</span>
                        </div>

                        <h3
                            style={{ color: '#ffffff', fontSize: '17px', fontWeight: 600, marginTop: '14px', letterSpacing: '-0.01em' }}
                        >
                            {errorKind === 'rateLimit' ? t.popupTitleBlocked
                                : (errorKind === 'server' || errorKind === 'network') ? t.popupTitleTechnical
                                : t.popupTitleError}
                        </h3>

                        <p
                            style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13.5px', maxWidth: '300px', marginTop: '12px', lineHeight: '1.6' }}
                        >
                            {errorKind === 'credentials' && t.popupCredentials}
                            {errorKind === 'rateLimit' && t.popupRateLimit}
                            {errorKind === 'network' && t.popupNetwork}
                            {errorKind === 'server' && t.popupServer}
                            {errorKind === 'invitationExpired' && t.popupInvitationExpired}
                        </p>

                        <Button
                            onClick={() => setErrorKind(null)}
                            size="md"
                            radius="md"
                            mt={24}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    border: 'none',
                                    height: '40px',
                                    fontSize: '13.5px',
                                    fontWeight: 500,
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                    boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                                },
                            }}
                            className="hover:brightness-110 transition-all"
                        >
                            {t.popupClose}
                        </Button>
                    </div>
                </Modal>

                {/* Popup immersif : réveil serveur avec étapes progressives */}
                <Modal
                    opened={errorKind === 'waking'}
                    onClose={() => {}}
                    centered
                    withCloseButton={false}
                    closeOnClickOutside={false}
                    closeOnEscape={false}
                    radius="lg"
                    size="sm"
                    overlayProps={{ backgroundOpacity: 0.6, blur: 8 }}
                    styles={{
                        content: {
                            backgroundColor: '#0a1f1d',
                            border: 'none',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(20,184,166,0.08)',
                        },
                        body: { padding: 0 },
                    }}
                >
                    <div className="flex flex-col items-center text-center px-6 py-7">
                        {/* Logo SafeX 360 animé */}
                        <div className="animate-pulse">
                            <svg
                                width="44" height="44"
                                viewBox="0 0 64 64"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-label="SafeX 360"
                            >
                                <defs>
                                    <linearGradient id="wakingShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#5EEAD4" />
                                        <stop offset="55%" stopColor="#14B8A6" />
                                        <stop offset="100%" stopColor="#EF4444" />
                                    </linearGradient>
                                    <linearGradient id="wakingShieldHL" x1="0%" y1="0%" x2="0%" y2="60%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#wakingShieldGrad)"
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth="0.8"
                                />
                                <path
                                    d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                                    fill="url(#wakingShieldHL)"
                                />
                                <path
                                    d="M 20 31 L 29 40 L 45 21"
                                    stroke="white" strokeWidth="5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-0.5 mt-2" style={{ userSelect: 'none' }}>
                            <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>Safe</span>
                            <span style={{ color: '#5EEAD4', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>X</span>
                            <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600, marginLeft: '3px' }}>360</span>
                        </div>

                        <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, marginTop: '16px' }}>
                            {language === 'fr' ? 'Préparation de votre espace' : 'Preparing your workspace'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.5 }}>
                            {language === 'fr'
                                ? 'Première connexion du jour — cela prend quelques instants'
                                : 'First connection of the day — this takes a moment'}
                        </p>

                        {/* Étapes avec barres de progression */}
                        <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { fr: 'Connexion aux serveurs SafeX', en: 'Connecting to SafeX servers' },
                                { fr: 'Initialisation des services', en: 'Initializing services' },
                                { fr: 'Chargement des modules de sécurité', en: 'Loading security modules' },
                                { fr: 'Préparation de votre session sécurisée', en: 'Preparing your secure session' },
                            ].map((step, i) => {
                                const isDone = wakingStep > i + 1;
                                const isActive = wakingStep === i + 1;
                                const isPending = wakingStep < i + 1;
                                return (
                                    <div key={i} style={{ textAlign: 'left', opacity: isPending ? 0.35 : 1, transition: 'opacity 0.5s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                background: isDone ? 'linear-gradient(135deg, #14B8A6, #0D9488)' : isActive ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)',
                                                border: isActive ? '2px solid #14B8A6' : isDone ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                            }}>
                                                {isDone && (
                                                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                                        <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                                {isActive && <Loader size={10} color="teal" />}
                                            </div>
                                            <span style={{ color: isDone ? '#5EEAD4' : isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', fontSize: '12.5px', fontWeight: isActive ? 500 : 400 }}>
                                                {language === 'fr' ? step.fr : step.en}
                                            </span>
                                        </div>
                                        {(isActive || isDone) && (
                                            <div style={{ marginLeft: '26px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '2px',
                                                    background: 'linear-gradient(90deg, #14B8A6, #5EEAD4)',
                                                    width: isDone ? '100%' : '70%',
                                                    transition: 'width 4s ease-out',
                                                    animation: isActive ? 'none' : 'none',
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Barre de progression globale */}
                        <div style={{ width: '100%', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                                    {language === 'fr' ? 'Progression globale' : 'Overall progress'}
                                </span>
                                <span style={{ color: '#5EEAD4', fontSize: '11px', fontWeight: 500 }}>
                                    {Math.min(Math.round((wakingStep / 4) * 100), 100)}%
                                </span>
                            </div>
                            <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: '3px',
                                    background: 'linear-gradient(90deg, #0D9488, #14B8A6, #5EEAD4)',
                                    width: `${Math.min((wakingStep / 4) * 100, 100)}%`,
                                    transition: 'width 1s ease-out',
                                    boxShadow: '0 0 12px rgba(20,184,166,0.4)',
                                }} />
                            </div>
                        </div>
                    </div>
                </Modal>

            </div>
        </div>
    );
};

export default LoginsPage;
