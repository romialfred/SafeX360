import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    INVALID_SUBMIT_MESSAGE,
    installInvalidSubmitFeedback,
    revealFirstInvalidField,
} from './invalidSubmitFeedback';

/**
 * Le défaut couvert : un formulaire dont un champ invalide se trouve au-dessus
 * de la zone visible donne l'impression que le bouton « ne fait rien ».
 * Ces tests verrouillent le retour utilisateur ET, surtout, l'absence d'effet
 * sur une soumission valide — c'est là que se logerait une régression.
 */

// jsdom ne sait ni défiler ni mesurer : on instrumente pour observer l'intention.
const stubLayout = (el: HTMLElement, visible: boolean) => {
    el.getBoundingClientRect = () => ({
        width: visible ? 120 : 0, height: visible ? 32 : 0,
        top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}),
    });
    el.scrollIntoView = vi.fn();
};

const buildForm = (fields: { invalid: boolean; visible?: boolean; name: string }[]) => {
    const form = document.createElement('form');
    fields.forEach((f) => {
        const input = document.createElement('input');
        input.name = f.name;
        if (f.invalid) input.setAttribute('aria-invalid', 'true');
        stubLayout(input, f.visible ?? true);
        form.appendChild(input);
    });
    document.body.appendChild(form);
    return form;
};

afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('mise en évidence du premier champ invalide', () => {
    it('défile jusqu’au premier champ invalide et lui donne le focus', () => {
        const form = buildForm([
            { name: 'ok', invalid: false },
            { name: 'fautif', invalid: true },
            { name: 'autre', invalid: true },
        ]);
        const cible = revealFirstInvalidField(form);

        expect(cible).toBe(form.elements.namedItem('fautif'));
        expect((cible as HTMLElement).scrollIntoView).toHaveBeenCalled();
        expect(document.activeElement).toBe(cible);
    });

    it('ignore un champ invalide MASQUÉ et retient le premier champ visible', () => {
        const form = buildForm([
            { name: 'cache', invalid: true, visible: false },
            { name: 'visible', invalid: true },
        ]);
        expect(revealFirstInvalidField(form)).toBe(form.elements.namedItem('visible'));
    });

    it('ne fait rien quand aucun champ n’est invalide', () => {
        const form = buildForm([{ name: 'ok', invalid: false }]);
        expect(revealFirstInvalidField(form)).toBeNull();
        expect(document.activeElement).not.toBe(form.elements.namedItem('ok'));
    });
});

describe('filet global sur la soumission', () => {
    let notify: ReturnType<typeof vi.fn<(message: string) => void>>;
    let uninstall: () => void;

    beforeEach(() => {
        vi.useFakeTimers();
        notify = vi.fn<(message: string) => void>();
        uninstall = installInvalidSubmitFeedback(notify);
    });
    afterEach(() => { uninstall(); vi.useRealTimers(); });

    it('prévient l’utilisateur quand la soumission est bloquée par un champ invalide', () => {
        const form = buildForm([{ name: 'fautif', invalid: true }]);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        vi.runAllTimers();

        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith(INVALID_SUBMIT_MESSAGE);
    });

    it('NE PRÉVIENT PAS sur une soumission valide (non-régression)', () => {
        const form = buildForm([{ name: 'ok', invalid: false }]);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        vi.runAllTimers();

        expect(notify).not.toHaveBeenCalled();
    });

    it('reste muet si le formulaire a été démonté entre-temps (soumission suivie d’une navigation)', () => {
        const form = buildForm([{ name: 'fautif', invalid: true }]);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.remove();
        vi.runAllTimers();

        expect(notify).not.toHaveBeenCalled();
    });

    it('se débranche proprement', () => {
        uninstall();
        const form = buildForm([{ name: 'fautif', invalid: true }]);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        vi.runAllTimers();

        expect(notify).not.toHaveBeenCalled();
    });
});
