/**
 * OfflineSyncBanner.test.tsx — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Smoke tests pour le banner offline / sync :
 *   - Visible lorsque navigator.onLine === false.
 *   - Visible lorsque pending > 0 (DosimetryOfflineService.getPendingCount mock).
 *   - Non-visible (returns null) lorsque online ET pending == 0.
 *
 * <p>Strategie : on mock {@code react-i18next} et le service offline pour
 * eviter les dependances reseau / IndexedDB en environnement Vitest jsdom.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ─── Mocks ─────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) =>
            opts ? `${key}:${JSON.stringify(opts)}` : key,
    }),
}));

vi.mock('../../services/DosimetryOfflineService', () => ({
    default: {
        getPendingCount: vi.fn(),
        syncPending: vi.fn(),
    },
}));

import DosimetryOfflineService from '../../services/DosimetryOfflineService';
import OfflineSyncBanner from '../../components/Dosimetry/OfflineSyncBanner';

const setOnlineStatus = (online: boolean) => {
    Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => online,
    });
};

describe('OfflineSyncBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setOnlineStatus(true);
        // Reset DOM
        document.body.innerHTML = '';
    });

    afterEach(() => {
        setOnlineStatus(true);
        document.body.innerHTML = '';
    });

    it('renders nothing when online and no pending entries', async () => {
        setOnlineStatus(true);
        (DosimetryOfflineService.getPendingCount as ReturnType<typeof vi.fn>).mockResolvedValue({
            doses: 0,
            measurements: 0,
        });
        const { container } = render(<OfflineSyncBanner pollIntervalMs={0} />);
        await waitFor(() => {
            // Aucun banner rendu => container vide.
            expect(container.firstChild).toBeNull();
        });
    });

    it('renders a banner with offline title when navigator.onLine is false', async () => {
        setOnlineStatus(false);
        (DosimetryOfflineService.getPendingCount as ReturnType<typeof vi.fn>).mockResolvedValue({
            doses: 0,
            measurements: 0,
        });
        render(<OfflineSyncBanner pollIntervalMs={0} />);
        const banner = await screen.findByTestId('offline-sync-banner');
        expect(banner).toBeTruthy();
        expect(banner.textContent).toContain('offline.banner.offlineTitle');
    });

    it('renders a pending banner when online but pending > 0', async () => {
        // Important : on force la valeur online APRES le reset (et avant render)
        // pour eviter une lecture stale dans le state initial du hook.
        setOnlineStatus(true);
        (DosimetryOfflineService.getPendingCount as ReturnType<typeof vi.fn>).mockResolvedValue({
            doses: 2,
            measurements: 1,
        });
        (DosimetryOfflineService.syncPending as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: 3,
            failed: 0,
            blocked: 0,
        });
        render(<OfflineSyncBanner pollIntervalMs={0} />);
        const banner = await screen.findByTestId('offline-sync-banner');
        await waitFor(() => {
            expect(banner.textContent).toContain('offline.banner.pendingTitle');
        });
    });
});
