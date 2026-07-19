import { useEffect, useState } from 'react';
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
import {
    confirmMfaEnrollment,
    getUser,
    loginUser,
    startMfaEnrollment,
    verifyMfa,
    type MfaEnrollment,
} from '../../../services/LoginService';
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

/* ── Tuiles de téléchargement — style « badge store » compact ─────────────
   Android : télécharge l'APK signé. iOS : annonce (pas encore de build IPA).
   Réutilisées en bas à gauche (desktop) et sous les badges ISO (mobile). */

type StoreT = { mobileVersion: string; storeAndroidTop: string; storeAndroidBottom: string; storeAndroidMeta: string; storeIosTop: string; storeIosBottom: string; mobileDownloadAria: string; iosSoonAria: string };

const StoreTileAndroid = ({ t }: { t: StoreT }) => (
    <a
        href="/downloads/SafexMobile.apk"
        download="SafeX 360 HSE.apk"
        aria-label={t.mobileDownloadAria}
        title={t.storeAndroidMeta}
        className="group flex items-center gap-2.5 pl-3 pr-3.5 h-[52px] rounded-xl bg-black/65 hover:bg-black/80 border border-white/15 hover:border-teal-400/45 backdrop-blur-md transition-all"
        style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}
    >
        {/* Logo officiel Google Play (triangle quadricolore) */}
        <svg viewBox="0 0 512 512" className="w-6 h-6 flex-shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
            <path fill="#34A853" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z" />
            <path fill="#FBBC04" d="m472.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
            <path fill="#EA4335" d="m104.6 499 280.8-161.2-60.1-60.1L104.6 499z" />
        </svg>
        <div className="leading-tight text-left">
            <div className="text-[8.5px] uppercase tracking-[0.14em] text-white/60">
                {t.storeAndroidTop}
            </div>
            <div className="text-[14px] font-semibold text-white flex items-center gap-1.5">
                {t.storeAndroidBottom}
                <span className="text-[9px] px-1.5 py-px rounded-full bg-teal-500/25 text-teal-300 font-medium">{t.mobileVersion}</span>
            </div>
        </div>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1 text-teal-300/80 group-hover:text-teal-200 transition-colors" aria-hidden="true">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    </a>
);

const StoreTileIos = ({ t }: { t: StoreT }) => (
    <div
        role="img"
        aria-label={t.iosSoonAria}
        title={t.iosSoonAria}
        className="flex items-center gap-2.5 pl-3 pr-3.5 h-[52px] rounded-xl bg-black/45 border border-white/10 backdrop-blur-md opacity-80 cursor-default select-none"
        style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}
    >
        {/* Pomme Apple */}
        <svg viewBox="0 0 384 512" className="w-5 h-6 flex-shrink-0" fill="#E2E8F0" aria-hidden="true">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        <div className="leading-tight text-left">
            <div className="text-[8.5px] uppercase tracking-[0.14em] text-white/55">
                {t.storeIosTop}
            </div>
            <div className="text-[14px] font-semibold text-white/85">
                {t.storeIosBottom}
            </div>
        </div>
    </div>
);

const LoginsPage = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    type LoginErrorKind = 'credentials' | 'network' | 'server' | 'waking' | 'rateLimit' | 'invitationExpired' | null;
    const [errorKind, setErrorKind] = useState<LoginErrorKind>(null);
    const [wakingStep, setWakingStep] = useState(0);
    type MfaMode = 'verify' | 'enroll' | 'recoveryCodes' | null;
    const [mfaMode, setMfaMode] = useState<MfaMode>(null);
    const [mfaChallenge, setMfaChallenge] = useState('');
    const [mfaEnrollment, setMfaEnrollment] = useState<MfaEnrollment | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
    const [mfaError, setMfaError] = useState('');
    // Le defi MFA expire cote serveur (expiresInSeconds, 300 s par defaut).
    // Sans compte a rebours ni sortie, l'utilisateur decouvrait l'expiration
    // par un echec sec et ne pouvait que recharger la page.
    const [mfaDeadline, setMfaDeadline] = useState<number | null>(null);
    const [mfaRemaining, setMfaRemaining] = useState<number>(0);

    useEffect(() => {
        if (mfaDeadline === null || mfaMode === null || mfaMode === 'recoveryCodes') return;
        const tick = () => setMfaRemaining(Math.max(0, Math.ceil((mfaDeadline - Date.now()) / 1000)));
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [mfaDeadline, mfaMode]);

    /** Abandon du parcours MFA : retour a l'ecran de connexion, etat purge. */
    const cancelMfa = () => {
        setMfaMode(null);
        setMfaChallenge('');
        setMfaEnrollment(null);
        setMfaCode('');
        setMfaError('');
        setUseRecoveryCode(false);
        setMfaDeadline(null);
    };

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
            mobileVersion: 'v3.0',
            storeGroupLabel: 'Application mobile SafeX 360 HSE',
            storeAndroidTop: 'Télécharger pour',
            storeAndroidBottom: 'Android',
            storeAndroidMeta: '86 Mo · Android 7.0+',
            storeIosTop: 'Bientôt disponible',
            storeIosBottom: 'iOS',
            mobileDownloadAria: 'Télécharger SafeX 360 HSE pour Android (APK, 86 Mo)',
            iosSoonAria: 'Application iOS bientôt disponible',
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
            mobileVersion: 'v3.0',
            storeGroupLabel: 'SafeX 360 HSE mobile app',
            storeAndroidTop: 'Download for',
            storeAndroidBottom: 'Android',
            storeAndroidMeta: '86 MB · Android 7.0+',
            storeIosTop: 'Coming soon',
            storeIosBottom: 'iOS',
            mobileDownloadAria: 'Download SafeX 360 HSE for Android (APK, 86 MB)',
            iosSoonAria: 'iOS app coming soon',
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
                const errCode = err?.response?.data?.errorCode ?? '';

                if (status === 428 && (errCode === 'MFA_REQUIRED' || errCode === 'MFA_ENROLLMENT_REQUIRED')) {
                    const challenge = String(err?.response?.data?.challenge ?? '');
                    if (!challenge) {
                        finalErrorKind = 'server';
                        setErrorKind('server');
                        return;
                    }
                    setMfaChallenge(challenge);
                    setMfaCode('');
                    setMfaError('');
                    const ttl = Number(err?.response?.data?.expiresInSeconds) || 300;
                    setMfaDeadline(Date.now() + ttl * 1000);
                    if (errCode === 'MFA_ENROLLMENT_REQUIRED') {
                        try {
                            const enrollment = await startMfaEnrollment(challenge);
                            setMfaEnrollment(enrollment);
                            setMfaMode('enroll');
                        } catch {
                            finalErrorKind = 'server';
                            setErrorKind('server');
                        }
                    } else {
                        setMfaMode('verify');
                    }
                    return;
                }

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

    const completeAuthenticatedSession = async () => {
        const res = await getUser();
        dispatch(setUser(res));
        navigate(isNativePlatform() ? '/m/home' : '/');
    };

    const handleMfaVerification = async () => {
        if (!mfaCode.trim()) return;
        setLoading(true);
        setMfaError('');
        try {
            await verifyMfa(mfaChallenge, useRecoveryCode ? '' : mfaCode, useRecoveryCode ? mfaCode : undefined);
            setMfaMode(null);
            await completeAuthenticatedSession();
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            setMfaError(status === 429
                ? (language === 'fr' ? 'Challenge bloqué après cinq essais. Recommencez la connexion.' : 'Challenge locked after five attempts. Start sign-in again.')
                : (language === 'fr' ? 'Code invalide, expiré ou déjà utilisé.' : 'Invalid, expired, or previously used code.'));
        } finally {
            setLoading(false);
        }
    };

    const handleMfaEnrollment = async () => {
        if (!mfaCode.trim()) return;
        setLoading(true);
        setMfaError('');
        try {
            const result = await confirmMfaEnrollment(mfaChallenge, mfaCode);
            setMfaRecoveryCodes(result.recoveryCodes);
            setMfaMode('recoveryCodes');
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            setMfaError(status === 429
                ? (language === 'fr' ? 'Challenge bloqué. Recommencez la connexion.' : 'Challenge locked. Start sign-in again.')
                : (language === 'fr' ? 'Code de vérification incorrect.' : 'Incorrect verification code.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        // Refonte 2026-06-09 : plein écran + overflow-hidden pour ZERO scroll vertical.
        // h-dvh (viewport dynamique) : sur mobile, le clavier virtuel réduit le
        // viewport — h-screen (100vh statique) masquait le bas du formulaire.
        <div className="h-screen h-dvh w-screen fixed inset-0 overflow-hidden bg-slate-950 text-white">

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

            {/* ═══ Retour au site vitrine (haut gauche) — texte bleu sur pastille
                sombre : le fond blanc translucide rendait le lien illisible sur
                le ciel clair de la photo ═══ */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-5 left-5 z-30 flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 backdrop-blur-md transition-all"
                style={{ color: '#7CB8FF', fontSize: '12px', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
                aria-label={language === 'fr' ? 'Retourner sur le site SafeX 360' : 'Back to the SafeX 360 website'}
            >
                <IconArrowLeft size={13} aria-hidden="true" />
                <span className="tracking-wide font-medium">{language === 'fr' ? 'Retour au site' : 'Back to site'}</span>
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

            {/* ═══ Tuiles de téléchargement (bas gauche, desktop) ═══
                Compactes façon badges de store, hors du flux central : le logo,
                la carte et les badges ISO restent parfaitement centrés.
                Masquées dans l'APK Capacitor et sur mobile (< md : version
                inline sous les badges ISO, dans le flux scrollable). */}
            {!isNativePlatform() && (
                <div
                    className="absolute left-5 z-30 hidden md:flex flex-row items-center gap-2.5"
                    // Alignées sur la ligne du bouton « Se connecter » : le bloc central
                    // est centré verticalement, le centre du bouton est à +203px du
                    // centre du viewport (mesuré) — écart constant quel que soit l'écran.
                    style={{ top: 'calc(50% + 203px)', transform: 'translateY(-50%)' }}
                    role="group"
                    aria-label={t.storeGroupLabel}
                >
                    <StoreTileAndroid t={t} />
                    <StoreTileIos t={t} />
                </div>
            )}

            {/* Refonte centrage 2026-07-08 : PLUS AUCUN décalage horizontal — le
                logo, la carte de connexion et les badges ISO partagent le même
                axe vertical, parfaitement centrés dans le viewport. Les tuiles
                de téléchargement vivent désormais en bas à gauche (hors flux). */}
            <div className="relative z-10 h-full w-full flex flex-col items-center [justify-content:safe_center] px-4 py-3 md:py-4 overflow-y-auto">

                {/* Marque + tagline — logo coloré (bouclier teal gradient) */}
                <div className="flex flex-col items-center text-center mb-3 md:mb-5 max-w-md shrink-0">
                    {/* Bouclier coloré (gradient teal → rouge — identité HSE forte) */}
                    <div
                        className="mb-2 md:mb-3"
                        style={{ filter: 'drop-shadow(0 10px 30px rgba(20,184,166,0.6))' }}
                    >
                        <svg
                            width="52"
                            height="52"
                            className="md:w-[60px] md:h-[60px]"
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
                            fontSize: 'clamp(28px, 3.6vw, 38px)',
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

                {/* Carte de connexion compacte — seule au centre, sous le logo.
                    LOT 48 P6.d : verre teal profond avec bordure teal lumineuse —
                    cohérent avec l'identité HSE SafeX (bouclier teal→rouge). */}
                <div
                    className="w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 78, 70, 0.58) 0%, rgba(4, 47, 46, 0.62) 100%)',
                        backdropFilter: 'blur(22px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
                        border: '1px solid rgba(94, 234, 212, 0.28)',
                        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.65), 0 0 0 1px rgba(94,234,212,0.08) inset',
                    }}
                >
                    <div className="px-6 py-6 sm:px-7 sm:py-7">

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


                        <form onSubmit={form.onSubmit(handleSubmit)} className="mt-5 space-y-4">

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
                                disabled={loading}
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

                {/* Repères des référentiels pris en compte ; ils n'ont pas valeur d'attestation. */}
                <div
                    className="mt-3 md:mt-4 flex items-center justify-center gap-2.5 shrink-0"
                    aria-label={language === 'fr' ? 'Référentiels pris en compte' : 'Referenced frameworks'}
                >
                    {(['ISO 45001', 'ISO 14001', 'ISO 9001', 'ISO 19011'] as const).map((norm) => (
                        <IsoBadge key={norm} norm={norm} theme="dark" size="sm" />
                    ))}
                </div>

                {/* Tuiles de téléchargement — version mobile (< md) : dans le flux,
                    sous les badges ISO. Sur desktop elles vivent en bas à gauche. */}
                {!isNativePlatform() && (
                    <div className="mt-4 flex md:hidden items-center justify-center gap-2.5 shrink-0" role="group" aria-label={t.storeGroupLabel}>
                        <StoreTileAndroid t={t} />
                        <StoreTileIos t={t} />
                    </div>
                )}

                {/* ═══ Popup d'erreur SafeX — professionnelle avec logo officiel ═══ */}
                <Modal
                    opened={mfaMode !== null}
                    /* Echappable — SAUF pendant l'affichage unique des codes de
                       recuperation : les fermer sans les avoir enregistres les
                       perdrait definitivement. */
                    onClose={() => { if (mfaMode !== 'recoveryCodes') cancelMfa(); }}
                    closeOnClickOutside={false}
                    closeOnEscape={mfaMode !== 'recoveryCodes'}
                    withCloseButton={mfaMode !== 'recoveryCodes'}
                    centered
                    title={language === 'fr' ? 'Vérification multifacteur' : 'Multi-factor verification'}
                    radius="lg"
                    size="md"
                    overlayProps={{ backgroundOpacity: 0.65, blur: 6 }}
                >
                    {mfaMode === 'enroll' && mfaEnrollment && (
                        <div className="space-y-4 text-sm text-slate-800">
                            <p>{language === 'fr'
                                ? 'Ce rôle sensible exige un second facteur. Ajoutez cette clé dans votre application TOTP, puis saisissez le code à six chiffres.'
                                : 'This sensitive role requires a second factor. Add this key to your TOTP app, then enter the six-digit code.'}</p>
                            <div className="rounded-md bg-slate-100 p-3 font-mono break-all" aria-label={language === 'fr' ? 'Clé MFA manuelle' : 'Manual MFA key'}>
                                {mfaEnrollment.manualKey}
                            </div>
                            <a className="text-teal-700 underline" href={mfaEnrollment.otpAuthUri}>
                                {language === 'fr' ? 'Ouvrir dans une application compatible' : 'Open in a compatible app'}
                            </a>
                            <TextInput
                                label={language === 'fr' ? 'Code de vérification' : 'Verification code'}
                                value={mfaCode}
                                onChange={(event) => setMfaCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                            />
                            {mfaError && <p role="alert" className="text-red-700">{mfaError}</p>}
                            <Button fullWidth loading={loading} onClick={handleMfaEnrollment} disabled={mfaCode.length !== 6}>
                                {language === 'fr' ? 'Activer la MFA' : 'Enable MFA'}
                            </Button>
                        </div>
                    )}

                    {mfaMode === 'verify' && (
                        <div className="space-y-4 text-sm text-slate-800">
                            <p>{useRecoveryCode
                                ? (language === 'fr' ? 'Saisissez un code de récupération non encore utilisé.' : 'Enter an unused recovery code.')
                                : (language === 'fr' ? 'Saisissez le code à six chiffres de votre application TOTP.' : 'Enter the six-digit code from your TOTP app.')}</p>
                            <TextInput
                                label={useRecoveryCode
                                    ? (language === 'fr' ? 'Code de récupération' : 'Recovery code')
                                    : (language === 'fr' ? 'Code de vérification' : 'Verification code')}
                                value={mfaCode}
                                onChange={(event) => setMfaCode(useRecoveryCode
                                    ? event.currentTarget.value.toUpperCase().slice(0, 20)
                                    : event.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                                autoComplete="one-time-code"
                            />
                            <button
                                type="button"
                                className="text-teal-700 underline"
                                onClick={() => { setUseRecoveryCode(!useRecoveryCode); setMfaCode(''); setMfaError(''); }}
                            >
                                {useRecoveryCode
                                    ? (language === 'fr' ? 'Utiliser l’application TOTP' : 'Use the TOTP app')
                                    : (language === 'fr' ? 'Utiliser un code de récupération' : 'Use a recovery code')}
                            </button>
                            {mfaError && <p role="alert" className="text-red-700">{mfaError}</p>}
                            {/* Le defi expire cote serveur : l'utilisateur doit le VOIR
                                venir, pas le decouvrir par un echec sec. */}
                            {mfaDeadline !== null && mfaRemaining > 0 && (
                                <p className={`text-xs tabular-nums ${mfaRemaining <= 60 ? 'text-amber-700' : 'text-slate-500'}`}>
                                    {language === 'fr'
                                        ? `Défi valable encore ${Math.floor(mfaRemaining / 60)}:${String(mfaRemaining % 60).padStart(2, '0')}`
                                        : `Challenge valid for ${Math.floor(mfaRemaining / 60)}:${String(mfaRemaining % 60).padStart(2, '0')}`}
                                </p>
                            )}
                            {mfaDeadline !== null && mfaRemaining <= 0 ? (
                                <div className="space-y-2">
                                    <p role="alert" className="text-amber-800">
                                        {language === 'fr'
                                            ? 'Défi expiré. Reconnectez-vous pour en obtenir un nouveau.'
                                            : 'Challenge expired. Sign in again to get a new one.'}
                                    </p>
                                    <Button fullWidth variant="default" onClick={cancelMfa}>
                                        {language === 'fr' ? 'Revenir à la connexion' : 'Back to sign in'}
                                    </Button>
                                </div>
                            ) : (
                                <Button fullWidth loading={loading} onClick={handleMfaVerification} disabled={!mfaCode.trim()}>
                                    {language === 'fr' ? 'Vérifier et se connecter' : 'Verify and sign in'}
                                </Button>
                            )}
                        </div>
                    )}

                    {mfaMode === 'recoveryCodes' && (
                        <div className="space-y-4 text-sm text-slate-800">
                            <p className="font-semibold">{language === 'fr'
                                ? 'Conservez ces codes hors ligne. Chacun ne fonctionne qu’une fois et ne sera plus affiché.'
                                : 'Store these codes offline. Each works once and will not be shown again.'}</p>
                            <ul className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-3 font-mono" aria-label={language === 'fr' ? 'Codes de récupération' : 'Recovery codes'}>
                                {mfaRecoveryCodes.map((code) => <li key={code}>{code}</li>)}
                            </ul>
                            <Button fullWidth onClick={() => {
                                setMfaMode(null);
                                setMfaRecoveryCodes([]);
                                setMfaCode('');
                                form.setFieldValue('password', '');
                            }}>
                                {language === 'fr' ? 'J’ai conservé les codes — me reconnecter' : 'I saved the codes — sign in again'}
                            </Button>
                        </div>
                    )}
                </Modal>

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
