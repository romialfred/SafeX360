import { Component, type ErrorInfo, type ReactNode } from 'react';

import SafeXBrandMark from './SafeXBrandMark';

/**
 * AppErrorBoundary — la seule chose qui empêche une erreur de rendu de vider
 * l'écran.
 *
 * <p>Sans frontière d'erreur, React démonte TOUT l'arbre à la première exception
 * de rendu : l'utilisateur se retrouve devant une page blanche, sans message, et
 * n'a d'autre issue que de recharger. C'est exactement le symptôme rapporté.
 *
 * <p>Trois comportements, dans cet ordre :
 *  1. CHUNK PÉRIMÉ (après un déploiement, le fichier référencé n'existe plus) :
 *     rechargement automatique, UNE fois, gardé par sessionStorage — c'est le
 *     seul cas où recharger est la bonne réponse, et il est invisible.
 *  2. AUTRE ERREUR : écran de reprise portant la marque, avec « Réessayer » qui
 *     REMONTE LA VUE sans recharger la page — la session, les données déjà
 *     chargées et la position dans l'application sont conservées.
 *  3. La frontière se réarme sur changement de route (prop `resetKey`) : une
 *     erreur sur un écran ne condamne pas la navigation vers les autres.
 */

interface Props {
    children: ReactNode;
    /** Change de valeur → la frontière se réarme (typiquement la route courante). */
    resetKey?: string;
    /** Libellé de contexte affiché sous le message (nom du module, par ex.). */
    context?: string;
    /** Rend l'écran de reprise sur toute la hauteur (frontière racine). */
    fullHeight?: boolean;
}

interface State {
    error: Error | null;
    /** Incrémenté par « Réessayer » : force le remontage du sous-arbre. */
    attempt: number;
}

const CHUNK_ERROR_PATTERNS = [
    'failed to fetch dynamically imported module',
    'loading chunk',
    'loading css chunk',
    'importing a module script failed',
    'error loading dynamically imported module',
];

/** Une erreur de chargement de module = version périmée, pas un bug applicatif. */
function isStaleChunkError(error: Error): boolean {
    const message = `${error?.name ?? ''} ${error?.message ?? ''}`.toLowerCase();
    return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

// MÊME clé que le garde-fou de main.tsx : les deux mécanismes traitent la même
// situation, ils doivent partager le même compteur sous peine de se relancer
// mutuellement en boucle.
const RELOAD_GUARD_KEY = 'safex:chunk-reloaded';

export default class AppErrorBoundary extends Component<Props, State> {
    state: State = { error: null, attempt: 0 };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Trace de diagnostic : sans elle, l'écran de reprise masquerait la cause.
        console.error('[SafeX] Erreur de rendu interceptée', error, info?.componentStack);

        if (isStaleChunkError(error)) {
            try {
                if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
                    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
                    window.location.reload();
                }
            } catch {
                /* sessionStorage indisponible (navigation privée stricte) : on
                   laisse simplement l'écran de reprise s'afficher. */
            }
        }
    }

    componentDidUpdate(prevProps: Props) {
        // Nouvelle route → on réarme : rester bloqué sur l'erreur d'un écran
        // empêcherait d'en ouvrir un autre, ce qui transformerait un incident
        // local en application inutilisable.
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ error: null });
        }
    }

    private retry = () => {
        // On remonte le sous-arbre SANS recharger : la session reste ouverte et
        // l'utilisateur ne repart pas de l'écran d'accueil.
        this.setState((prev) => ({ error: null, attempt: prev.attempt + 1 }));
    };

    private goHome = () => {
        window.location.assign('/');
    };

    render() {
        const { error, attempt } = this.state;
        const { children, context, fullHeight } = this.props;

        if (!error) {
            return <div key={attempt} className="contents">{children}</div>;
        }

        return (
            <div
                className="flex items-center justify-center w-full bg-[#FAF8F3] px-6 py-12"
                style={{ minHeight: fullHeight ? '100vh' : '60vh' }}
                role="alert"
            >
                <div className="flex flex-col items-center gap-5 text-center max-w-md">
                    <SafeXBrandMark variant="stack" tone="dark" size={38} />
                    <div>
                        <p className="text-[15px] font-semibold text-slate-800">
                            Cet écran n'a pas pu s'afficher
                        </p>
                        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                            Votre session reste ouverte et vos données ne sont pas affectées.
                            Vous pouvez réessayer sans quitter l'application.
                        </p>
                        {context && (
                            <p className="text-[11px] text-slate-400 mt-2" translate="no">{context}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={this.retry}
                            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-[13px] font-semibold hover:bg-teal-700 transition-colors"
                        >
                            Réessayer
                        </button>
                        <button
                            type="button"
                            onClick={this.goHome}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-[13px] font-semibold hover:border-slate-400 transition-colors"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                    {/* Le détail technique reste consultable sans encombrer : un
                        support qui ne peut rien lire ne peut rien diagnostiquer. */}
                    <details className="w-full text-left">
                        <summary className="text-[11px] text-slate-400 cursor-pointer">Détail technique</summary>
                        <pre className="mt-2 text-[10.5px] text-slate-500 bg-white border border-slate-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap">
                            {error.name}: {error.message}
                        </pre>
                    </details>
                </div>
            </div>
        );
    }
}
