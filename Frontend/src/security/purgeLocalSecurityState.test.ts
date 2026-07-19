import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    purgeField: vi.fn(),
    purgeDosimetry: vi.fn(),
    countSos: vi.fn(),
    purgeSos: vi.fn(),
    listCheckIns: vi.fn(),
    purgeCheckIns: vi.fn(),
    purgePartitionKey: vi.fn(),
    resetBiometric: vi.fn(),
}));

vi.mock('../m/offline/db', () => ({
    purgeFieldSecurityState: mocks.purgeField,
}));
vi.mock('../services/DosimetryOfflineService', () => ({
    purgeDosimetrySecurityState: mocks.purgeDosimetry,
}));
vi.mock('../utility/OfflineSosQueue', () => ({
    countPending: mocks.countSos,
    purgePendingSos: mocks.purgeSos,
}));
vi.mock('../utility/OfflineCheckInQueue', () => ({
    listPendingCheckIns: mocks.listCheckIns,
    purgePendingCheckIns: mocks.purgeCheckIns,
}));
vi.mock('../m/services/biometricService', () => ({
    resetBiometricSession: mocks.resetBiometric,
}));
vi.mock('./offlineVault', () => ({
    purgeCurrentOfflinePartitionKey: mocks.purgePartitionKey,
}));

import { purgeLocalSecurityState } from './purgeLocalSecurityState';

const originalCaches = globalThis.caches;
const cacheKeys = vi.fn();
const deleteCache = vi.fn();

describe('purgeLocalSecurityState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(globalThis, 'caches', {
            configurable: true,
            value: { keys: cacheKeys, delete: deleteCache },
        });
        cacheKeys.mockResolvedValue(['safex-api-get', 'safex-shell']);
        deleteCache.mockResolvedValue(true);
        mocks.purgeField.mockImplementation(async (preserveUnsynced: boolean) =>
            preserveUnsynced
                ? { preservedMutations: 2, preservedPhotos: 1 }
                : { preservedMutations: 0, preservedPhotos: 0 });
        mocks.purgeDosimetry.mockImplementation(async (preserveUnsynced: boolean) =>
            preserveUnsynced
                ? { preservedDoses: 3, preservedMeasurements: 4 }
                : { preservedDoses: 0, preservedMeasurements: 0 });
        mocks.countSos.mockResolvedValue(5);
        mocks.listCheckIns.mockResolvedValue([{}, {}]);
        mocks.purgeSos.mockResolvedValue(undefined);
        mocks.purgeCheckIns.mockResolvedValue(undefined);
        mocks.purgePartitionKey.mockResolvedValue(undefined);
    });

    afterAll(() => {
        Object.defineProperty(globalThis, 'caches', {
            configurable: true,
            value: originalCaches,
        });
    });

    it('efface les caches lisibles mais preserve les queues non synchronisees par defaut', async () => {
        const result = await purgeLocalSecurityState();

        expect(cacheKeys).toHaveBeenCalledOnce();
        expect(deleteCache).toHaveBeenCalledTimes(2);
        expect(mocks.purgeField).toHaveBeenCalledWith(true);
        expect(mocks.purgeDosimetry).toHaveBeenCalledWith(true);
        expect(mocks.purgeSos).not.toHaveBeenCalled();
        expect(mocks.purgeCheckIns).not.toHaveBeenCalled();
        expect(mocks.purgePartitionKey).not.toHaveBeenCalled();
        expect(result).toEqual({
            deletedCaches: 2,
            preservedOfflineWork: {
                fieldMutations: 2,
                fieldPhotos: 1,
                dosimetryDoses: 3,
                dosimetryMeasurements: 4,
                emergencySos: 5,
                emergencyCheckIns: 2,
            },
            failures: [],
        });
        expect(mocks.resetBiometric).toHaveBeenCalledOnce();
    });

    it('ne supprime les queues non synchronisees quavec une option explicite', async () => {
        const result = await purgeLocalSecurityState({ purgeUnsynced: true });

        expect(mocks.purgeField).toHaveBeenCalledWith(false);
        expect(mocks.purgeDosimetry).toHaveBeenCalledWith(false);
        expect(mocks.purgeSos).toHaveBeenCalledOnce();
        expect(mocks.purgeCheckIns).toHaveBeenCalledOnce();
        expect(mocks.purgePartitionKey).toHaveBeenCalledOnce();
        expect(mocks.countSos).not.toHaveBeenCalled();
        expect(mocks.listCheckIns).not.toHaveBeenCalled();
        expect(result.preservedOfflineWork).toEqual({
            fieldMutations: 0,
            fieldPhotos: 0,
            dosimetryDoses: 0,
            dosimetryMeasurements: 0,
            emergencySos: 0,
            emergencyCheckIns: 0,
        });
    });

    it('continue la purge si un stockage est indisponible', async () => {
        mocks.purgeField.mockRejectedValue(new Error('IndexedDB indisponible'));

        const result = await purgeLocalSecurityState();

        expect(result.failures).toEqual(['field-indexeddb']);
        expect(mocks.purgeDosimetry).toHaveBeenCalledOnce();
        expect(mocks.resetBiometric).toHaveBeenCalledOnce();
    });

    it('conserve la cle si une queue na pas pu etre purgee', async () => {
        mocks.purgeSos.mockRejectedValue(new Error('IndexedDB indisponible'));

        const result = await purgeLocalSecurityState({ purgeUnsynced: true });

        expect(result.failures).toContain('emergency-sos-indexeddb');
        expect(mocks.purgePartitionKey).not.toHaveBeenCalled();
    });
});
