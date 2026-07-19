import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
    purge: vi.fn(),
    setUser: vi.fn((user) => ({ type: 'user/set', payload: user })),
}));

vi.mock('../interceptors/AxiosInterceptor', () => ({
    default: { get: mocks.axiosGet, post: mocks.axiosPost },
}));
vi.mock('./purgeLocalSecurityState', () => ({
    purgeLocalSecurityState: mocks.purge,
}));
vi.mock('../slices/UserSlice', () => ({
    setUser: mocks.setUser,
}));

import navigateToLogin from '../interceptors/Navigation';
import { loginUser, logoutUser } from '../services/LoginService';

describe('hooks de purge de session', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.purge.mockResolvedValue(undefined);
        window.history.replaceState({}, '', '/dashboard');
    });

    it('purge apres une deconnexion serveur reussie', async () => {
        mocks.axiosPost.mockResolvedValue({ data: { success: true } });

        await expect(logoutUser()).resolves.toEqual({ success: true });

        expect(mocks.axiosPost).toHaveBeenCalledWith('/hrms/auth/logout');
        expect(mocks.purge).toHaveBeenCalledOnce();
    });

    it('purge les lectures de lancien compte apres un login reussi', async () => {
        mocks.axiosGet.mockResolvedValue({ data: { token: 'cookie-http-only' } });
        mocks.axiosPost.mockResolvedValue({ data: { userId: 7 } });

        await expect(loginUser({ login: 'next-user' })).resolves.toEqual({ userId: 7 });

        expect(mocks.purge).toHaveBeenCalledOnce();
    });

    it('purge aussi lorsque le serveur de deconnexion est indisponible', async () => {
        const failure = new Error('reseau indisponible');
        mocks.axiosPost.mockRejectedValue(failure);

        await expect(logoutUser()).rejects.toBe(failure);

        expect(mocks.purge).toHaveBeenCalledOnce();
    });

    it('purge les donnees de lecture avant la redirection dun 401 applicatif', async () => {
        const navigate = vi.fn();
        const dispatch = vi.fn();

        await navigateToLogin(navigate, dispatch);

        expect(dispatch).toHaveBeenCalledWith({ type: 'user/set', payload: null });
        expect(mocks.purge).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith('/login');
        expect(mocks.purge.mock.invocationCallOrder[0])
            .toBeLessThan(navigate.mock.invocationCallOrder[0]);
    });

    it('ignore une nouvelle redirection si la page de connexion est deja active', async () => {
        window.history.replaceState({}, '', '/login');
        const navigate = vi.fn();

        await navigateToLogin(navigate, vi.fn());

        expect(mocks.purge).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });
});
