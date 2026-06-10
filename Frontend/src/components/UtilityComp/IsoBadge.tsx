/**
 * IsoBadge — badge officiel d'une norme ISO (LOT 49).
 *
 * Règle plateforme : toute mention autonome d'une norme ISO s'affiche avec
 * son badge couleur, jamais en texte nu. Le verrou bicolore [ISO][45001]
 * reprend les codes visuels des marques de certification : bloc « ISO »
 * plein dans la couleur du domaine, numéro sur fond teinté, liseré assorti.
 *
 *   <IsoBadge norm="ISO 45001" />                       → chip clair compact
 *   <IsoBadge norm="ISO 14001" size="md" withLabel />   → + domaine en clair
 *   <IsoBadge norm="ISO 9001" theme="dark" />           → sur fond sombre/photo
 */

export type IsoNorm = 'ISO 45001' | 'ISO 14001' | 'ISO 9001' | 'ISO 19011' | 'ISO 31000' | 'ISO 22301';

interface IsoIdentity {
    /** Couleur profonde (bloc ISO, texte du numéro). */
    deep: string;
    /** Couleur claire (dégradé du bloc ISO). */
    light: string;
    /** Fond teinté du bloc numéro (thème clair). */
    tint: string;
    /** Domaine couvert, pour le libellé optionnel. */
    domain: string;
}

export const ISO_IDENTITIES: Record<IsoNorm, IsoIdentity> = {
    'ISO 45001': { deep: '#0F766E', light: '#14B8A6', tint: '#F0FDFA', domain: 'Santé & sécurité au travail' },
    'ISO 14001': { deep: '#15803D', light: '#22C55E', tint: '#F0FDF4', domain: 'Management environnemental' },
    'ISO 9001':  { deep: '#1D4ED8', light: '#3B82F6', tint: '#EFF6FF', domain: 'Management de la qualité' },
    'ISO 19011': { deep: '#B45309', light: '#F59E0B', tint: '#FFFBEB', domain: 'Audit des systèmes de management' },
    'ISO 31000': { deep: '#6D28D9', light: '#8B5CF6', tint: '#F5F3FF', domain: 'Management du risque' },
    'ISO 22301': { deep: '#BE123C', light: '#F43F5E', tint: '#FFF1F2', domain: "Continuité d'activité" },
};

interface IsoBadgeProps {
    /** Norme, avec ou sans préfixe (« ISO 45001 » ou « 45001 »). */
    norm: string;
    size?: 'sm' | 'md';
    /** dark : à poser sur photo ou fond sombre. */
    theme?: 'light' | 'dark';
    /** Affiche le domaine couvert à droite du verrou. */
    withLabel?: boolean;
    className?: string;
}

const IsoBadge = ({ norm, size = 'sm', theme = 'light', withLabel = false, className = '' }: IsoBadgeProps) => {
    const normalized = (norm.startsWith('ISO') ? norm : `ISO ${norm}`).trim() as IsoNorm;
    const id = ISO_IDENTITIES[normalized];
    const number = normalized.replace('ISO', '').trim();

    // Norme inconnue : repli texte sobre, jamais de crash d'affichage.
    if (!id) {
        return <span className={`text-[11px] uppercase tracking-wider ${className}`}>{norm}</span>;
    }

    const isMd = size === 'md';
    const isoFont = isMd ? 'text-[10px]' : 'text-[9px]';
    const numFont = isMd ? 'text-[13px]' : 'text-[11.5px]';
    const blockPadX = isMd ? 'px-2' : 'px-1.5';
    const blockPadY = isMd ? 'py-[5px]' : 'py-[3px]';

    return (
        <span className={`inline-flex items-center gap-2 ${className}`} title={`${normalized} — ${id.domain}`}>
            <span
                className="inline-flex items-stretch rounded-[6px] overflow-hidden flex-shrink-0"
                style={{
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.35)' : `1px solid ${id.deep}40`,
                    boxShadow: theme === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.35)'
                        : `0 1px 4px ${id.deep}20`,
                }}
            >
                <span
                    className={`${isoFont} ${blockPadX} ${blockPadY} font-bold tracking-[0.08em] text-white flex items-center`}
                    style={{ background: `linear-gradient(150deg, ${id.light} 0%, ${id.deep} 90%)` }}
                >
                    ISO
                </span>
                <span
                    className={`${numFont} ${blockPadX} ${blockPadY} font-bold tabular-nums flex items-center`}
                    style={
                        theme === 'dark'
                            ? { background: 'rgba(255,255,255,0.92)', color: id.deep }
                            : { background: id.tint, color: id.deep }
                    }
                >
                    {number}
                </span>
            </span>
            {withLabel && (
                <span
                    className={`${isMd ? 'text-[11px]' : 'text-[10px]'} uppercase tracking-[0.14em] font-semibold`}
                    style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : id.deep }}
                >
                    {id.domain}
                </span>
            )}
        </span>
    );
};

export default IsoBadge;
