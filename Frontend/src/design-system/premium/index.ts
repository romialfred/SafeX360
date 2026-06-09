/**
 * Design System Premium — Exports centralisés.
 *
 * Bibliothèque de composants extraits du module Non-conformité (source
 * intacte). Réutilisable dans tous les autres modules HSE refondus.
 *
 * Usage :
 *   import { PremiumPageHeader, PremiumKpiTile, getSeverityColor } from '@/design-system/premium';
 */

// Composants
export { default as PremiumPageHeader } from './PremiumPageHeader';
export { default as PremiumKpiTile } from './PremiumKpiTile';
export { default as PremiumStatusBadge } from './PremiumStatusBadge';
export { default as PremiumFormSection } from './PremiumFormSection';
export { default as PremiumHelpPanel } from './PremiumHelpPanel';

// Types
export type { PremiumPageHeaderProps } from './PremiumPageHeader';
export type { PremiumKpiTileProps } from './PremiumKpiTile';
export type { PremiumStatusBadgeProps } from './PremiumStatusBadge';
export type { PremiumFormSectionProps } from './PremiumFormSection';
export type { PremiumHelpPanelProps } from './PremiumHelpPanel';

// Tokens et helpers
export {
    SEVERITY_COLORS,
    PRIORITY_COLORS,
    STATUS_COLORS,
    KPI_GRADIENTS,
    ISO_REFS,
    getSeverityColor,
    getPriorityColor,
    getStatusColor,
    getKpiGradient,
    getKpiIconBg,
    getKpiIconColor,
} from './tokens';
export type { SeverityLevel, PriorityLevel, StatusValue } from './tokens';
