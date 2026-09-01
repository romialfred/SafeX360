import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('../../interceptors/AxiosInterceptor', () => ({
    default: { post },
}));

import { resetUserMfa, resetUserPassword } from '../../services/UserManagementService';

describe('réinitialisations administrateur des identifiants', () => {
    beforeEach(() => post.mockReset());

    it('conserve deux contrats API distincts : mot de passe seul et MFA avec mot de passe', async () => {
        post.mockResolvedValue({ data: { accountId: 42 } });

        await resetUserPassword(42);
        await resetUserMfa(42);

        expect(post).toHaveBeenNthCalledWith(1, '/hrms/admin/users/reset-password/42');
        expect(post).toHaveBeenNthCalledWith(2, '/hrms/admin/users/42/mfa/reset');
    });

    it('présente les deux actions et confirme la réinitialisation MFA avant exécution', () => {
        const list = readFileSync(resolve(
            process.cwd(),
            'src/components/NewComponents/UsersManagement/UsersAdminPage.tsx',
        ), 'utf8');
        const profile = readFileSync(resolve(
            process.cwd(),
            'src/components/NewComponents/UsersManagement/UserProfilePage.tsx',
        ), 'utf8');

        expect(list).toContain("userMgmt.list.actionResetPassword");
        expect(list).toContain("userMgmt.list.actionResetMfa");
        expect(list).toContain('mfaResetConfirmText');
        expect(profile).toContain('setConfirmResetMfa(true)');
        expect(profile).toContain('resetResult.temporaryPassword');
    });
});
