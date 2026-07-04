/**
 * Z-index scale — single source of truth for stacking order.
 *
 * Scale:
 *   base        0   — default stacking
 *   sidebar    100   — sidebar fixed panel
 *   header     200   — top header bar
 *   dropdown   300   — dropdowns, popovers, tooltips
 *   overlay   1000   — loading overlays, backdrops
 *   modal     1100   — modals, drawers
 *   toast     2000   — notifications / toasts
 *   critical  4000   — inactivity handler, critical dialogs
 *   top       9999   — skip-to-content, company selector overlay
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
    top: 9999,
} as const;
