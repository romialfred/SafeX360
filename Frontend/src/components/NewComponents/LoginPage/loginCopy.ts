/**
 * e-SafeX 360 — Textes de la page de connexion (FR / EN).
 *
 * Convention `*Labels.ts` du projet : le dictionnaire local sert de source de
 * repli typée, la langue active vient du système i18n existant (`react-i18next`).
 * La page de connexion est publique et montée AVANT tout chargement de
 * namespace applicatif — on garde donc les libellés embarqués ici plutôt que
 * d'ajouter un namespace chargé à la demande (le formulaire afficherait des
 * clés brutes le temps du téléchargement).
 */

export type LoginCopy = {
    brandPrefix: string;
    brandName: string;
    brandSuffix: string;
    portalBadge: string;
    tagline: string;
    heroLine1: string;
    heroLine2: string;
    heroHighlight: string;
    heroSubtitle: string;
    heroImageAlt: string;

    welcomeTitle: string;
    welcomeSubtitle: string;
    loginLabel: string;
    loginPlaceholder: string;
    loginRequired: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordRequired: string;
    passwordShow: string;
    passwordHide: string;
    forgotPassword: string;
    loginButton: string;
    loginProgress: string;

    separatorOr: string;
    microsoftButton: string;
    microsoftProgress: string;
    microsoftUnavailable: string;
    microsoftError: string;
    designedBy: string;

    mobileTitle: string;
    mobileVersion: string;
    storeGroupLabel: string;
    storeAndroidTop: string;
    storeAndroidBottom: string;
    storeAndroidMeta: string;
    storeIosTop: string;
    storeIosBottom: string;
    mobileDownloadAria: string;
    iosSoonAria: string;

    footerCopyright: string;
    footerPrivacy: string;
    footerSupport: string;

    languageGroupLabel: string;
    languageSwitchFr: string;
    languageSwitchEn: string;
    backToSite: string;

    errorCredentials: string;
    errorNetwork: string;
    errorServer: string;
    errorWaking: string;
    errorRateLimit: string;
    popupTitleError: string;
    popupTitleTechnical: string;
    popupTitleBlocked: string;
    popupCredentials: string;
    popupNetwork: string;
    popupServer: string;
    popupWaking: string;
    popupRateLimit: string;
    popupInvitationExpired: string;
    popupClose: string;
};

const FR: LoginCopy = {
    brandPrefix: 'e-',
    brandName: 'SafeX',
    brandSuffix: '360',
    portalBadge: 'Portail employé',
    tagline: 'Plateforme HSE pour les opérations minières',
    heroLine1: 'La sécurité, guidée',
    heroLine2: 'par',
    heroHighlight: 'l’intelligence.',
    heroSubtitle: 'Anticiper les risques. Protéger les équipes. Décider en temps réel.',
    heroImageAlt: 'Deux professionnels HSE équipés de leurs EPI consultent e-SafeX 360 sur tablette devant une fosse minière',

    welcomeTitle: 'Bienvenue',
    welcomeSubtitle: 'Connectez-vous à votre espace e-SafeX 360',
    loginLabel: 'Identifiant',
    loginPlaceholder: 'Adresse e-mail ou matricule employé',
    loginRequired: 'Saisissez votre identifiant.',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: 'Votre mot de passe',
    passwordRequired: 'Saisissez votre mot de passe.',
    passwordShow: 'Afficher le mot de passe',
    passwordHide: 'Masquer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    loginButton: 'Se connecter',
    loginProgress: 'Connexion…',

    separatorOr: 'ou',
    microsoftButton: 'Continuer avec Microsoft',
    microsoftProgress: 'Redirection vers Microsoft…',
    microsoftUnavailable: 'Authentification Microsoft non configurée sur cet environnement.',
    microsoftError: 'La connexion Microsoft a échoué ou a été annulée.',
    designedBy: 'Conçu par',

    mobileTitle: 'Télécharger l’application mobile',
    mobileVersion: 'v3.0',
    storeGroupLabel: 'Application mobile SafeX 360 HSE',
    storeAndroidTop: 'Télécharger pour',
    storeAndroidBottom: 'Android',
    storeAndroidMeta: '86 Mo · Android 7.0+',
    storeIosTop: 'Bientôt disponible',
    storeIosBottom: 'iOS',
    mobileDownloadAria: 'Télécharger SafeX 360 HSE pour Android (APK, 86 Mo)',
    iosSoonAria: 'Application iOS bientôt disponible',

    footerCopyright: '© 2026 e-SafeX 360',
    footerPrivacy: 'Confidentialité',
    footerSupport: 'Assistance',

    languageGroupLabel: 'Choix de la langue',
    languageSwitchFr: 'Afficher la page en français',
    languageSwitchEn: 'Afficher la page en anglais',
    backToSite: 'Retour au site',

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
    popupServer: 'Le service rencontre un problème technique temporaire. Ce n’est pas lié à vos identifiants. Veuillez réessayer dans quelques instants ou contacter votre administrateur si le problème persiste.',
    popupWaking: 'Le serveur SafeX démarre, veuillez patienter…',
    popupRateLimit: 'Par mesure de sécurité, votre accès a été temporairement bloqué après plusieurs tentatives infructueuses. Veuillez réessayer dans 15 minutes.',
    popupInvitationExpired: 'Votre invitation a expiré. Veuillez contacter votre administrateur pour en recevoir une nouvelle.',
    popupClose: 'Compris',
};

const EN: LoginCopy = {
    brandPrefix: 'e-',
    brandName: 'SafeX',
    brandSuffix: '360',
    portalBadge: 'Employee portal',
    tagline: 'HSE platform for mining operations',
    heroLine1: 'Safety, guided',
    heroLine2: 'by',
    heroHighlight: 'intelligence.',
    heroSubtitle: 'Anticipate risks. Protect your teams. Decide in real time.',
    heroImageAlt: 'Two HSE professionals in personal protective equipment reviewing e-SafeX 360 on a tablet in front of a mining pit',

    welcomeTitle: 'Welcome',
    welcomeSubtitle: 'Sign in to your e-SafeX 360 workspace',
    loginLabel: 'User ID',
    loginPlaceholder: 'Email address or employee ID',
    loginRequired: 'Enter your user ID.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    passwordRequired: 'Enter your password.',
    passwordShow: 'Show password',
    passwordHide: 'Hide password',
    forgotPassword: 'Forgot password?',
    loginButton: 'Sign in',
    loginProgress: 'Signing in…',

    separatorOr: 'or',
    microsoftButton: 'Continue with Microsoft',
    microsoftProgress: 'Redirecting to Microsoft…',
    microsoftUnavailable: 'Microsoft sign-in is not configured on this environment.',
    microsoftError: 'Microsoft sign-in failed or was cancelled.',
    designedBy: 'Designed by',

    mobileTitle: 'Download the mobile app',
    mobileVersion: 'v3.0',
    storeGroupLabel: 'SafeX 360 HSE mobile app',
    storeAndroidTop: 'Download for',
    storeAndroidBottom: 'Android',
    storeAndroidMeta: '86 MB · Android 7.0+',
    storeIosTop: 'Coming soon',
    storeIosBottom: 'iOS',
    mobileDownloadAria: 'Download SafeX 360 HSE for Android (APK, 86 MB)',
    iosSoonAria: 'iOS app coming soon',

    footerCopyright: '© 2026 e-SafeX 360',
    footerPrivacy: 'Privacy',
    footerSupport: 'Support',

    languageGroupLabel: 'Language selection',
    languageSwitchFr: 'Display the page in French',
    languageSwitchEn: 'Display the page in English',
    backToSite: 'Back to site',

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
};

export type LoginLanguage = 'fr' | 'en';

/** Repli systématique sur le français, langue principale de la plateforme. */
export const getLoginCopy = (language: LoginLanguage): LoginCopy => (language === 'en' ? EN : FR);
