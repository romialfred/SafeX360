import { describe, expect, it } from 'vitest';
import { theme } from '../theme';
import { Z } from '../constants/zIndex';

/**
 * Garde-fou anti-régression — « listes déroulantes invisibles » (2026-08-03).
 *
 * Mantine rend la liste d'un champ dans un PORTAIL, à la racine du document,
 * avec un z-index par défaut de 300. Nos modales sont à 1100. Résultat : un
 * champ à liste placé dans une modale ouvrait sa liste DERRIÈRE elle et
 * l'utilisateur ne voyait « rien » au clic. 225 champs sur 69 écrans étaient
 * concernés — la correction tient dans les defaultProps du thème.
 *
 * Ces tests cassent le build si quelqu'un retire le z-index, le repasse sous
 * le plus haut conteneur pouvant héberger un champ, ou ajoute un composant à
 * liste sans le protéger. La règle n'est ainsi écrite qu'à un seul endroit.
 */

/** Champs dont la liste s'ancre via un Combobox. */
const COMBOBOX_FIELDS = ['Select', 'MultiSelect', 'Autocomplete', 'TagsInput'] as const;

/** Champs dont le calendrier flotte via un Popover. */
const POPOVER_FIELDS = [
    'DateInput',
    'DatePickerInput',
    'DateTimePicker',
    'MonthPickerInput',
    'YearPickerInput',
] as const;

type ThemeComponent = { defaultProps?: Record<string, unknown> };

const componentOf = (name: string): ThemeComponent => {
    const entry = (theme.components as Record<string, ThemeComponent> | undefined)?.[name];
    expect(entry, `Le thème ne déclare aucun defaultProps pour « ${name} »`).toBeDefined();
    return entry as ThemeComponent;
};

const zIndexOf = (name: string, propKey: 'comboboxProps' | 'popoverProps'): unknown => {
    const props = componentOf(name).defaultProps?.[propKey] as Record<string, unknown> | undefined;
    expect(props, `« ${name} » doit déclarer ${propKey} dans ses defaultProps`).toBeDefined();
    return (props as Record<string, unknown>).zIndex;
};

describe('z-index des listes déroulantes de champ', () => {
    it("place la liste au-dessus du plus haut conteneur pouvant héberger un champ", () => {
        // AmbientMeasurementForm ouvre une modale imbriquée à `criticalNested`.
        // Une liste au-dessous resterait invisible dans cet écran.
        expect(Z.fieldDropdown).toBeGreaterThan(Z.criticalNested);
        expect(Z.fieldDropdown).toBeGreaterThan(Z.modal);
        // Doit rester sous `top`, réservé aux couches sans champ de saisie.
        expect(Z.fieldDropdown).toBeLessThan(Z.top);
    });

    it.each(COMBOBOX_FIELDS)('%s expose comboboxProps.zIndex = Z.fieldDropdown', (name) => {
        expect(zIndexOf(name, 'comboboxProps')).toBe(Z.fieldDropdown);
    });

    it.each(POPOVER_FIELDS)('%s expose popoverProps.zIndex = Z.fieldDropdown', (name) => {
        expect(zIndexOf(name, 'popoverProps')).toBe(Z.fieldDropdown);
    });
});
