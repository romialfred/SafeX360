/**
 * Filet global « le bouton ne fait rien ».
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT (relevé au test du 2026-07-29 sur « Créer la suggestion »)
 * ─────────────────────────────────────────────────────────────────────────
 * `form.onSubmit(handler)` de Mantine appelle `preventDefault()` puis valide.
 * Si un champ est invalide, la soumission est abandonnée et l'erreur est
 * rendue SOUS LE CHAMP concerné. Or l'utilisateur est en bas du formulaire,
 * près du bouton : quand le champ fautif est plus haut, l'erreur s'affiche
 * hors de l'écran et le clic paraît sans effet.
 *
 * Ce n'est pas propre à un écran : 63 formulaires appellent `form.onSubmit`
 * sans second argument, donc sans aucun retour en cas d'échec.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI UN ÉCOUTEUR GLOBAL PLUTÔT QUE 63 RETOUCHES
 * ─────────────────────────────────────────────────────────────────────────
 * Modifier 63 appels, c'est 63 occasions de régression pour un comportement
 * strictement identique. Ici on n'ajoute QUE du retour visuel, après coup :
 *   • aucun formulaire n'est modifié ;
 *   • aucune soumission valide n'est affectée (sans champ invalide, on ne
 *     fait rien) ;
 *   • tout formulaire créé plus tard en bénéficie sans y penser.
 *
 * Le signal utilisé est `aria-invalid="true"`, que Mantine pose sur un champ
 * en erreur — c'est aussi le marqueur standard lu par les lecteurs d'écran.
 */

/** Message affiché quand une soumission est bloquée par la validation. */
export const INVALID_SUBMIT_MESSAGE =
    'Certains champs obligatoires sont incomplets. Le premier champ concerné a été mis en évidence.';

/** Sélecteur des champs qu'un moteur de validation a marqués invalides. */
const INVALID_FIELD = '[aria-invalid="true"]';

/** Vrai si l'élément est réellement affiché (un champ masqué ne se défile pas). */
const isVisible = (el: Element): boolean => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return r.width > 0 || r.height > 0;
};

/**
 * Traite un formulaire qui vient d'être soumis : si un champ est invalide,
 * on l'amène sous les yeux de l'utilisateur et on lui donne le focus.
 *
 * @returns le champ mis en évidence, ou `null` si la soumission était valide.
 */
export const revealFirstInvalidField = (form: HTMLFormElement): HTMLElement | null => {
    const candidates = Array.from(form.querySelectorAll(INVALID_FIELD)).filter(isVisible);
    const first = candidates[0] as HTMLElement | undefined;
    if (!first) return null;

    // `block: 'center'` plutôt que 'start' : un en-tête collant masquerait
    // sinon le champ que l'on vient d'amener en haut de l'écran.
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // `preventScroll` : le défilement doux ci-dessus fait déjà le travail ;
    // sans cette option le focus provoquerait un saut brutal concurrent.
    first.focus({ preventScroll: true });
    return first;
};

/**
 * Branche le filet sur tout le document. Idempotent : un seul écouteur, même
 * si la fonction est appelée plusieurs fois (StrictMode monte deux fois).
 *
 * @param notify appelé une seule fois par soumission bloquée.
 * @returns fonction de débranchement.
 */
export const installInvalidSubmitFeedback = (notify: (message: string) => void): (() => void) => {
    if (typeof document === 'undefined') return () => undefined;

    const onSubmit = (event: Event) => {
        const form = event.target as HTMLFormElement | null;
        if (!form || form.tagName !== 'FORM') return;
        // La validation de Mantine s'exécute dans le gestionnaire React, et le
        // rendu des erreurs au tick suivant : on inspecte donc APRÈS le rendu.
        setTimeout(() => {
            // Le formulaire peut avoir été démonté entre-temps (soumission réussie
            // suivie d'une navigation) : on ne touche alors à rien.
            if (!form.isConnected) return;
            if (revealFirstInvalidField(form)) notify(INVALID_SUBMIT_MESSAGE);
        }, 0);
    };

    // Phase de capture : `submit` ne bulle pas depuis certains conteneurs.
    document.addEventListener('submit', onSubmit, true);
    return () => document.removeEventListener('submit', onSubmit, true);
};
