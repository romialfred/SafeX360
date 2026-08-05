/**
 * Z-index scale — single source of truth for stacking order.
 *
 * Scale:
 *   base            0   — default stacking
 *   sidebar       100   — sidebar fixed panel
 *   header        200   — top header bar
 *   dropdown      300   — dropdowns, popovers, tooltips (hors modale)
 *   overlay      1000   — loading overlays, backdrops
 *   modal        1100   — modals, drawers
 *   toast        2000   — notifications / toasts
 *   critical     4000   — inactivity handler, critical dialogs
 *   top          9999   — skip-to-content, company selector overlay
 *   fieldDropdown 4200  — liste déroulante d'un champ de saisie (voir ci-dessous)
 */
export const Z = {
    sidebar: 100,
    header: 200,
    dropdown: 300,
    overlay: 1000,
    tooltip: 1001,
    modal: 1100,
    toast: 2000,
    critical: 4000,
    criticalNested: 4100,
    /**
     * Liste déroulante d'un champ de saisie (Select, MultiSelect, DateInput…).
     *
     * ⚠️ POURQUOI CETTE VALEUR EST SI HAUTE — régression du 2026-08-03.
     * Mantine sort le dropdown d'un champ dans un PORTAIL, à la racine du
     * document, avec un z-index par défaut de 300. Un champ placé dans une
     * Modal (1100) voyait donc sa liste s'ouvrir DERRIÈRE la modale : au clic,
     * « rien ne s'affiche ». Le défaut touchait 225 champs répartis sur
     * 69 écrans (familles d'équipement, dispatch d'équipe, responsable de
     * campagne, travailleurs exposés…).
     *
     * La valeur doit dépasser le plus haut conteneur pouvant héberger un champ,
     * soit `criticalNested` (4100, cf. AmbientMeasurementForm). Elle reste sous
     * `top` (9999), réservé aux couches qui ne contiennent aucun champ.
     *
     * Appliquée UNE SEULE FOIS via les defaultProps du thème (src/theme.ts) —
     * ne pas la recopier champ par champ. Un test de gouvernance verrouille
     * l'invariant `fieldDropdown > criticalNested`.
     */
    fieldDropdown: 4200,
    top: 9999,
} as const;
