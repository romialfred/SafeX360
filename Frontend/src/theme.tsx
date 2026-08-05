/**
 * SafeX360 — Theme v2 (R-045 Phase 2.a)
 *
 * Refonte : palette HSE sémantique distincte du primary brand,
 *           support dark mode, échelle typo + spacing tokens.
 *
 * Tokens source : audit/proposed_design_tokens.json
 *
 * Convention couleur :
 *  - brandTeal  → primary brand (boutons primaires, actions UI)
 *  - hseRed     → critique / danger / LTI / fatalité
 *  - hseOrange  → alerte / majeur / MTI / action en retard
 *  - hseYellow  → attention / mineur / vigilance / observation
 *  - hseGreen   → conforme / safe / clôturé / validé
 *  - hseBlue    → information / neutre / near-miss / en cours
 *
 * Usage Mantine :
 *   <Button color="hseRed">       → bouton danger
 *   <Badge color="hseGreen">      → badge conforme
 *   <Alert color="hseOrange">     → alerte majeure
 *   theme.colors.brandTeal[7]     → couleur primary brand
 *
 * Rétrocompatibilité : alias `primary` et `secondary` préservés pour ne rien casser.
 */

import { createTheme, colorsTuple, MantineColorsTuple } from '@mantine/core';
import { Z } from './constants/zIndex';

// ────────────────────────────────────────────────────────────────
// Palette tokens (11 nuances chacune, 50→950)
// ────────────────────────────────────────────────────────────────

// Brand primary — teal sombre, institutionnel, distinct du bleu information
const brandTeal: MantineColorsTuple = [
  '#F0FDFA', '#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF',
  '#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A',
];

// HSE — Rouge danger / critique / LTI
const hseRed: MantineColorsTuple = [
  '#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171',
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
];

// HSE — Orange alerte / majeur / MTI
const hseOrange: MantineColorsTuple = [
  '#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C',
  '#F97316', '#EA580C', '#C2410C', '#9A3412', '#7C2D12',
];

// HSE — Jaune attention / mineur / vigilance
const hseYellow: MantineColorsTuple = [
  '#FEFCE8', '#FEF9C3', '#FEF08A', '#FDE047', '#FACC15',
  '#EAB308', '#CA8A04', '#A16207', '#854D0E', '#713F12',
];

// HSE — Vert conforme / safe / clôturé / validé
const hseGreen: MantineColorsTuple = [
  '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80',
  '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D',
];

// HSE — Bleu information / neutre / near-miss / en cours
const hseBlue: MantineColorsTuple = [
  '#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
];

// Amber — palette utilitaire (Tailwind amber-50 a amber-900) utilisee par les
// modules Blast (signature visuelle "tir/dynamitage") et certains badges
// thermiques. Mantine requiert exactement 10 nuances par color tuple.
const amber: MantineColorsTuple = [
  '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
  '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F',
];

// ────────────────────────────────────────────────────────────────
// Theme — primary pointe désormais vers brandTeal pour clarté,
//         tout en gardant les alias `primary` et `secondary` pour
//         ne rien casser dans les ~601 composants existants.
// ────────────────────────────────────────────────────────────────

export const theme = createTheme({
  colors: {
    // Brand
    brandTeal,

    // HSE sémantique
    hseRed,
    hseOrange,
    hseYellow,
    hseGreen,
    hseBlue,

    // Utilitaire amber (module Blast Management — P2.1)
    amber,

    // Aliases rétrocompatibles (le code existant utilise color="primary" et color="secondary")
    primary: brandTeal,
    secondary: hseGreen,
  },

  primaryColor: 'primary', // = brandTeal via alias — pas de breaking change
  primaryShade: { light: 7, dark: 5 },

  // Typographie — Inter (à charger via Google Fonts dans index.html en complément)
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',

  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '36px', lineHeight: '40px', fontWeight: '700' },
      h2: { fontSize: '30px', lineHeight: '36px', fontWeight: '700' },
      h3: { fontSize: '24px', lineHeight: '32px', fontWeight: '600' },
      h4: { fontSize: '20px', lineHeight: '28px', fontWeight: '600' },
      h5: { fontSize: '18px', lineHeight: '28px', fontWeight: '600' },
      h6: { fontSize: '16px', lineHeight: '24px', fontWeight: '600' },
    },
  },

  spacing: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  radius:  { xs: '4px', sm: '6px', md: '8px',  lg: '12px', xl: '16px' },
  defaultRadius: 'md',

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,.05)',
    sm: '0 2px 4px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
    md: '0 4px 8px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.06)',
    lg: '0 10px 15px rgba(0,0,0,.10), 0 4px 6px rgba(0,0,0,.08)',
    xl: '0 20px 25px rgba(0,0,0,.12), 0 8px 10px rgba(0,0,0,.10)',
  },

  components: {
    // ─────────────────────────────────────────────────────────────────────
    // Z-INDEX DES LISTES DÉROULANTES — régression corrigée le 2026-08-03.
    //
    // Mantine sort la liste d'un champ dans un PORTAIL (racine du document)
    // avec un z-index par défaut de 300, alors que nos modales sont à 1100
    // (`Z.modal`). Tout champ à liste placé dans une modale ouvrait donc sa
    // liste DERRIÈRE elle : au clic, l'utilisateur ne voyait « rien ».
    // 225 champs sur 69 écrans étaient concernés (famille d'équipement,
    // dispatch d'équipe, responsable de campagne, travailleurs exposés…) :
    // cinq symptômes remontés séparément, une seule et même cause.
    //
    // On corrige ICI, une fois pour toutes : aucun des 69 écrans n'est
    // touché (donc aucun risque de régression) et tout champ ajouté plus
    // tard hérite automatiquement du correctif. Un composant qui passe
    // explicitement `comboboxProps`/`popoverProps` garde la main.
    // L'invariant est verrouillé par src/governance/fieldDropdownZIndex.test.ts.
    // ─────────────────────────────────────────────────────────────────────
    TextInput:       { defaultProps: { size: 'md' } },
    Select:          { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl', zIndex: Z.fieldDropdown } } },
    NumberInput:     { defaultProps: { size: 'md' } },
    PasswordInput:   { defaultProps: { size: 'md' } },
    Textarea:        { defaultProps: { size: 'md' } },
    DateTimePicker:  { defaultProps: { size: 'md', popoverProps: { zIndex: Z.fieldDropdown } } },
    Checkbox:        { defaultProps: { size: 'md' } },
    MultiSelect:     { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl', zIndex: Z.fieldDropdown } } },
    Autocomplete:    { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl', zIndex: Z.fieldDropdown } } },
    TagsInput:       { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl', zIndex: Z.fieldDropdown } } },
    DatePickerInput: { defaultProps: { size: 'md', popoverProps: { zIndex: Z.fieldDropdown } } },
    MonthPickerInput:{ defaultProps: { size: 'md', popoverProps: { zIndex: Z.fieldDropdown } } },
    YearPickerInput: { defaultProps: { size: 'md', popoverProps: { zIndex: Z.fieldDropdown } } },
    TimeInput:       { defaultProps: { size: 'md' } },
    DateInput:       { defaultProps: { size: 'md', popoverProps: { zIndex: Z.fieldDropdown } } },
    FileInput:       { defaultProps: { size: 'md' } },
    Button:          { defaultProps: { radius: 'md' } },
    Badge:           { defaultProps: { radius: 'sm', variant: 'light' } },
    Card:            { defaultProps: { radius: 'lg', withBorder: true, padding: 'lg' } },
    Modal:           { defaultProps: { radius: 'lg', centered: true, overlayProps: { blur: 2 } } },
    Tooltip:         { defaultProps: { withArrow: true, transitionProps: { duration: 150 } } },
  },

  cursorType: 'pointer',

  defaultGradient: {
    from: 'brandTeal.7',
    to: 'hseGreen.6',
    deg: 132,
  },

  autoContrast: true,
  luminanceThreshold: 0.3,

  other: {
    // Helpers de mapping pour statuts HSE — utilisables dans tout composant via useMantineTheme
    hseSeverity: {
      critique: { color: 'hseRed',    label: 'Critique' },
      majeur:   { color: 'hseOrange', label: 'Majeur' },
      modere:   { color: 'hseYellow', label: 'Modéré' },
      mineur:   { color: 'hseYellow', label: 'Mineur' },
      conforme: { color: 'hseGreen',  label: 'Conforme' },
      info:     { color: 'hseBlue',   label: 'Information' },
    },
    incidentStatus: {
      PENDING:                 { color: 'gray',      label: 'En attente' },
      REPORTED:                { color: 'hseBlue',   label: 'Déclaré' },
      INVESTIGATION:           { color: 'hseBlue',   label: 'Investigation' },
      INVESTIGATION_COMPLETED: { color: 'hseYellow', label: 'Investigation clôturée' },
      CORRECTIVE_ACTIONS:      { color: 'hseOrange', label: 'Actions correctives' },
      CLOSED:                  { color: 'hseGreen',  label: 'Clôturé' },
      REJECTED:                { color: 'gray',      label: 'Rejeté' },
    },
  },
});

// Re-export legacy helper (utilisé par le code existant)
export { colorsTuple };

// Tokens accessibles hors Mantine (pour Recharts, Tailwind via CSS vars, etc.)
export const designTokens = {
  brand: brandTeal,
  hse: { red: hseRed, orange: hseOrange, yellow: hseYellow, green: hseGreen, blue: hseBlue },
  amber,
};
