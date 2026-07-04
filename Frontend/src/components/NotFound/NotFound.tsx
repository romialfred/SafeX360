import { Link } from 'react-router-dom';
import {
    IconArrowLeft,
    IconAlertTriangle,
    IconHome,
    IconLifebuoy,
} from '@tabler/icons-react';
import { Button } from '@mantine/core';
import SafeXLogoColor from '../UtilityComp/SafeXLogoColor';

/**
 * NotFound — Page 404 personnalisée SafeX 360 (LOT 41).
 *
 * Refonte : illustration HSE (superviseuse en EPI sur site minier) en
 * remplacement du stock "Something is not right".
 *
 * NOTE : ancien hack auto-redirect vers /safex-analytics retiré car il
 * provoquait une boucle infinie (Vite SPA fallback → SPA → NotFound →
 * redirect → Vite SPA fallback → ...). La sidebar ouvre maintenant
 * explicitement /safex-analytics/index.html.
 */

const NotFound = () => {

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F3] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">

                {/* ─── Texte gauche ─── */}
                <div>
                    <div className="mb-6">
                        <SafeXLogoColor variant="icon" size={44} />
                    </div>

                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">
                        Erreur 404 · Page introuvable
                    </p>

                    <h1
                        className="text-slate-900 leading-tight"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 500,
                            fontSize: 'clamp(34px, 5vw, 52px)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Cette page n'existe pas
                    </h1>

                    <p className="text-[15px] text-slate-600 mt-5 leading-relaxed max-w-md">
                        L'URL demandée ne correspond à aucune ressource de la plateforme SafeX&nbsp;360.
                        Elle a peut-être été déplacée, ou le lien que vous avez suivi est obsolète.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Button
                            component={Link}
                            to="/"
                            size="md"
                            radius="md"
                            leftSection={<IconHome size={16} />}
                            styles={{ root: { backgroundColor: '#0F766E', color: 'white' } }}
                        >
                            Retour au tableau de bord
                        </Button>
                        <Button
                            onClick={() => window.history.back()}
                            variant="default"
                            size="md"
                            radius="md"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Page précédente
                        </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 max-w-md">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2 flex items-center gap-1.5">
                            <IconLifebuoy size={13} aria-hidden="true" />
                            Besoin d'aide&nbsp;?
                        </p>
                        <p className="text-[13.5px] text-slate-600 leading-relaxed">
                            Si vous pensez qu'il s'agit d'un bug, contactez le support à&nbsp;
                            <a
                                href="mailto:contact@datauniverse.bf"
                                className="text-teal-700 hover:text-teal-900 hover:underline"
                            >
                                contact@datauniverse.bf
                            </a>
                            &nbsp;ou consultez le&nbsp;
                            <Link to="/how-to" className="text-teal-700 hover:text-teal-900 hover:underline">
                                centre d'aide
                            </Link>.
                        </p>
                    </div>
                </div>

                {/* ─── Illustration droite : superviseuse HSE en EPI ─── */}
                <div className="relative">
                    <HSESupervisorIllustration />
                </div>
            </div>
        </div>
    );
};

/**
 * HSESupervisorIllustration — SVG vectoriel d'une superviseuse HSE
 * en EPI complets (casque, gilet haute visibilité, tablette).
 * Inspiration : photo de référence d'ingénieurs miniers ouest-africains.
 */
function HSESupervisorIllustration() {
    return (
        <div className="relative w-full max-w-md mx-auto">
            <svg
                viewBox="0 0 480 520"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Superviseuse HSE en EPI sur un site minier"
                className="w-full h-auto drop-shadow-lg"
            >
                <defs>
                    <radialGradient id="sky" cx="50%" cy="35%" r="70%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="50%" stopColor="#fed7aa" />
                        <stop offset="100%" stopColor="#fdba74" />
                    </radialGradient>
                    <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#92400e" />
                        <stop offset="100%" stopColor="#451a03" />
                    </linearGradient>
                    <linearGradient id="vest" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                    <linearGradient id="helmet" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                </defs>

                {/* Fond rond — coucher de soleil sur la mine */}
                <circle cx="240" cy="260" r="220" fill="url(#sky)" />

                {/* Silhouette mine au fond */}
                <path
                    d="M 60 360 L 130 280 L 180 320 L 240 250 L 310 300 L 380 240 L 420 290 L 420 380 L 60 380 Z"
                    fill="url(#ground)"
                    opacity="0.7"
                />

                {/* Sol */}
                <ellipse cx="240" cy="440" rx="200" ry="20" fill="#451a03" opacity="0.3" />

                {/* ─── Personnage : superviseuse HSE ─── */}
                {/* Jambes pantalon de travail bleu marine */}
                <rect x="195" y="350" width="32" height="80" rx="4" fill="#1e3a8a" />
                <rect x="252" y="350" width="32" height="80" rx="4" fill="#1e3a8a" />

                {/* Chaussures de sécurité */}
                <ellipse cx="211" cy="438" rx="22" ry="8" fill="#1c1917" />
                <ellipse cx="268" cy="438" rx="22" ry="8" fill="#1c1917" />

                {/* Gilet haute visibilité jaune */}
                <path
                    d="M 175 220 Q 170 215 175 210 L 200 195 L 280 195 L 305 210 Q 310 215 305 220 L 305 360 Q 305 365 300 365 L 180 365 Q 175 365 175 360 Z"
                    fill="url(#vest)"
                />
                {/* Bandes réfléchissantes argentées */}
                <rect x="178" y="265" width="124" height="8" fill="#e5e7eb" />
                <rect x="178" y="320" width="124" height="8" fill="#e5e7eb" />

                {/* Col t-shirt */}
                <path d="M 215 195 L 240 215 L 265 195" fill="#0f766e" />

                {/* Cou */}
                <rect x="225" y="155" width="30" height="40" fill="#78350f" />

                {/* Visage — teint chaleureux (illustration inclusive ouest-africaine) */}
                <circle cx="240" cy="135" r="42" fill="#92400e" />

                {/* Cheveux courts texturés sous le casque */}
                <path
                    d="M 205 120 Q 200 105 215 100 Q 230 92 250 95 Q 270 98 275 115 Q 278 125 275 135 L 270 130 Q 265 115 245 115 Q 220 115 210 130 Z"
                    fill="#1c1917"
                />

                {/* Sourcils */}
                <path d="M 218 128 Q 225 125 232 128" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M 248 128 Q 255 125 262 128" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Yeux */}
                <circle cx="225" cy="138" r="2" fill="#1c1917" />
                <circle cx="255" cy="138" r="2" fill="#1c1917" />

                {/* Nez */}
                <path d="M 240 145 Q 238 152 240 155" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                {/* Sourire concentré */}
                <path d="M 232 160 Q 240 163 248 160" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Casque jaune */}
                <path
                    d="M 195 105 Q 195 75 240 75 Q 285 75 285 105 L 285 115 Q 285 120 280 120 L 200 120 Q 195 120 195 115 Z"
                    fill="url(#helmet)"
                    stroke="#a16207"
                    strokeWidth="1"
                />
                <rect x="237" y="75" width="6" height="45" fill="#a16207" />
                {/* Mini bouclier SafeX sur casque */}
                <path
                    d="M 240 90 L 246 92 L 246 100 Q 246 105 240 108 Q 234 105 234 100 L 234 92 Z"
                    fill="#0F766E"
                />

                {/* Bras droit qui tient la tablette */}
                <path
                    d="M 305 230 Q 320 235 330 260 L 335 320 Q 333 325 328 325 L 320 325 Q 315 325 313 320 L 305 280 Z"
                    fill="url(#vest)"
                />
                {/* Bras gauche qui pointe */}
                <path
                    d="M 175 230 Q 160 240 155 280 Q 153 285 158 287 L 175 290 L 180 280 Z"
                    fill="url(#vest)"
                />

                {/* Tablette */}
                <rect x="195" y="270" width="115" height="80" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="200" y="275" width="105" height="70" rx="3" fill="#0f172a" />

                {/* Contenu écran tablette : KPI HSE */}
                <rect x="206" y="282" width="35" height="4" rx="1" fill="#5eead4" opacity="0.9" />
                <rect x="206" y="291" width="50" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
                <rect x="206" y="298" width="42" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
                <rect x="206" y="305" width="55" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
                <rect x="265" y="305" width="6" height="15" fill="#5eead4" opacity="0.8" />
                <rect x="274" y="298" width="6" height="22" fill="#5eead4" opacity="0.8" />
                <rect x="283" y="290" width="6" height="30" fill="#5eead4" opacity="0.8" />
                <rect x="292" y="302" width="6" height="18" fill="#5eead4" opacity="0.8" />

                {/* Mains */}
                <ellipse cx="318" cy="320" rx="10" ry="8" fill="#78350f" />
                <ellipse cx="178" cy="285" rx="10" ry="8" fill="#78350f" />

                {/* Poussières (ambiance mine au crépuscule) */}
                <circle cx="120" cy="180" r="2" fill="#fbbf24" opacity="0.6" />
                <circle cx="380" cy="200" r="2" fill="#fbbf24" opacity="0.6" />
                <circle cx="90" cy="240" r="1.5" fill="#f59e0b" opacity="0.5" />
                <circle cx="400" cy="280" r="1.5" fill="#f59e0b" opacity="0.5" />
                <circle cx="140" cy="100" r="1.5" fill="#fbbf24" opacity="0.4" />
                <circle cx="360" cy="120" r="1.5" fill="#fbbf24" opacity="0.4" />

                {/* "404" subtil en arrière-plan */}
                <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    fontFamily="serif"
                    fontSize="180"
                    fontWeight="500"
                    fill="#1e293b"
                    opacity="0.06"
                >
                    404
                </text>
            </svg>

            <p className="text-center mt-4 text-[11.5px] text-slate-500 italic flex items-center justify-center gap-1.5">
                <IconAlertTriangle size={11} className="text-amber-500" aria-hidden="true" />
                La page est introuvable, mais la sécurité ne s'arrête jamais.
            </p>
        </div>
    );
}

export default NotFound;
