import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import CanonicalLandingRedirect from '../../routes/CanonicalLandingRedirect';

afterEach(() => cleanup());

function createRouter(initialEntries: string[], initialIndex = 0) {
    return createMemoryRouter(
        [
            {
                path: '/landing',
                element: <CanonicalLandingRedirect />,
            },
            {
                path: '/',
                element: <main>Vitrine SafeX canonique</main>,
            },
            {
                path: '/origine',
                element: <main>Page precedente</main>,
            },
        ],
        { initialEntries, initialIndex },
    );
}

describe('AUD-UX-002 — route legacy /landing', () => {
    it('redirige vers la vitrine canonique en conservant query string et fragment', async () => {
        const router = createRouter(['/landing?source=legacy&campaign=iso#contact']);

        render(<RouterProvider router={router} />);

        expect(await screen.findByText('Vitrine SafeX canonique')).toBeTruthy();
        expect(router.state.location).toMatchObject({
            pathname: '/',
            search: '?source=legacy&campaign=iso',
            hash: '#contact',
        });
        expect(router.state.historyAction).toBe('REPLACE');
    });

    it('remplace la route obsolete dans l’historique pour eviter une boucle au retour', async () => {
        const router = createRouter(['/origine', '/landing?source=legacy#contact'], 1);

        render(<RouterProvider router={router} />);

        await waitFor(() => expect(router.state.location.pathname).toBe('/'));

        await act(async () => {
            await router.navigate(-1);
        });

        await waitFor(() => expect(router.state.location.pathname).toBe('/origine'));
        expect(screen.getByText('Page precedente')).toBeTruthy();
    });
});
