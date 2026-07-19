/**
 * IsoBadge — repère visuel interne d'un référentiel ISO (LOT 49).
 *
 * Règle plateforme : toute mention autonome d'une norme ISO s'affiche avec
 * son badge couleur, jamais en texte nu. Ce composant facilite l'identification
 * d'un référentiel dans l'interface et ne constitue pas une attestation tierce.
 *
 *   <IsoBadge norm="ISO 45001" />                       → médaillon seul (30px)
 *   <IsoBadge norm="ISO 14001" size="md" withLabel />   → 42px + norme et domaine
 *   <IsoBadge norm="ISO 9001" theme="dark" withLabel /> → libellés blancs (photo)
 */

export type IsoNorm = 'ISO 45001' | 'ISO 14001' | 'ISO 9001' | 'ISO 19011' | 'ISO 31000' | 'ISO 22301';

interface IsoIdentity {
    /** Couleur principale de la sphère. */
    color: string;
    /** Couleur profonde (anneau, dégradé). */
    deep: string;
    /** Édition en vigueur. */
    year: string;
    /** Domaine couvert, pour le libellé optionnel. */
    domain: string;
}

// Palette alignée sur les repères de la landing (section Référentiels).
export const ISO_IDENTITIES: Record<IsoNorm, IsoIdentity> = {
    'ISO 9001':  { color: '#1D4ED8', deep: '#1E40AF', year: '2015', domain: 'Management qualité' },
    'ISO 14001': { color: '#15803D', deep: '#166534', year: '2026', domain: 'Environnement' },
    'ISO 19011': { color: '#6D28D9', deep: '#5B21B6', year: '2026', domain: 'Audits des systèmes' },
    'ISO 45001': { color: '#0F766E', deep: '#115E59', year: '2018', domain: 'Santé & Sécurité' },
    'ISO 31000': { color: '#C2410C', deep: '#9A3412', year: '2018', domain: 'Gestion des risques' },
    'ISO 22301': { color: '#BE123C', deep: '#9F1239', year: '2019', domain: "Continuité d'activité" },
};

interface IsoBadgeProps {
    /** Norme, avec ou sans préfixe (« ISO 45001 » ou « 45001 »). */
    norm: string;
    size?: 'sm' | 'md';
    /** dark : libellés blancs, liseré clair — à poser sur photo ou fond sombre. */
    theme?: 'light' | 'dark';
    /** Affiche « ISO XXXXX » + domaine à droite du médaillon. */
    withLabel?: boolean;
    className?: string;
}

const IsoBadge = ({ norm, size = 'sm', theme = 'light', withLabel = false, className = '' }: IsoBadgeProps) => {
    const normalized = (norm.startsWith('ISO') ? norm : `ISO ${norm}`).trim() as IsoNorm;
    const id = ISO_IDENTITIES[normalized];
    const code = normalized.replace('ISO', '').trim();

    // Norme inconnue : repli texte sobre, jamais de crash d'affichage.
    if (!id) {
        return <span className={`text-[11px] uppercase tracking-wider ${className}`}>{norm}</span>;
    }

    const px = size === 'md' ? 42 : 30;
    const uid = `isob-${code}`;

    return (
        <span className={`inline-flex items-center gap-2 ${className}`} title={`${normalized}:${id.year} — ${id.domain}`}>
            <svg width={px} height={px} viewBox="0 0 64 64" aria-hidden="true" className="flex-shrink-0">
                <defs>
                    <radialGradient id={`${uid}-globe`} cx="35%" cy="30%" r="75%">
                        <stop offset="0%" stopColor={id.color} />
                        <stop offset="55%" stopColor={id.color} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={id.deep} />
                    </radialGradient>
                    <linearGradient id={`${uid}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={id.deep} />
                        <stop offset="50%" stopColor={id.color} />
                        <stop offset="100%" stopColor={id.deep} />
                    </linearGradient>
                    <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                        <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                {/* Liseré de détourage sur fond sombre */}
                {theme === 'dark' && (
                    <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
                )}

                {/* Anneau extérieur du sceau */}
                <circle cx="32" cy="32" r="29" fill="none" stroke={`url(#${uid}-ring)`} strokeWidth="2.5" />

                {/* Sphère-globe colorée */}
                <circle cx="32" cy="32" r="24.5" fill={`url(#${uid}-globe)`} />

                {/* Maillage longitudes/latitudes */}
                <g opacity="0.2" stroke="white" strokeWidth="0.5" fill="none">
                    <ellipse cx="32" cy="32" rx="24.5" ry="9" />
                    <ellipse cx="32" cy="32" rx="24.5" ry="17" />
                    <ellipse cx="32" cy="32" rx="9" ry="24.5" />
                    <ellipse cx="32" cy="32" rx="17" ry="24.5" />
                </g>

                {/* Bordure blanche interne + brillance sphère */}
                <circle cx="32" cy="32" r="24.5" fill="none" stroke="white" strokeWidth="1.5" />
                <ellipse cx="32" cy="22" rx="18" ry="9" fill={`url(#${uid}-shine)`} />

                {/* ISO / séparateur / numéro / édition */}
                <text x="32" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" letterSpacing="2.5">
                    ISO
                </text>
                <line x1="20" y1="29.5" x2="44" y2="29.5" stroke="white" strokeWidth="0.8" opacity="0.6" />
                <text
                    x="32" y="42" textAnchor="middle" fontSize="13" fontWeight="700" fill="white"
                    fontFamily="'Source Serif 4', Georgia, serif" letterSpacing="-0.5"
                >
                    {code}
                </text>
                <text x="32" y="50.5" textAnchor="middle" fontSize="6" fontWeight="600" fill="white" opacity="0.9">
                    :{id.year}
                </text>
            </svg>

            {withLabel && (
                <span className="leading-tight">
                    <span
                        className="block text-[11.5px] font-bold tracking-tight"
                        style={{ color: theme === 'dark' ? 'white' : id.deep }}
                    >
                        {normalized}
                    </span>
                    <span
                        className="block text-[9.5px] uppercase tracking-[0.12em] font-semibold"
                        style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.75)' : id.color }}
                    >
                        {id.domain}
                    </span>
                </span>
            )}
        </span>
    );
};

export default IsoBadge;
