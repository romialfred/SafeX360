import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('minimisation des données sensibles hors ligne', () => {
    it('interdit la persistance des profils personnels', () => {
        const fieldDb = source('src/m/offline/db.ts');
        expect(fieldDb).toContain("if (store === 'userProfileCache') return null");
        expect(fieldDb).toContain("await db.clear('userProfileCache')");
        expect(fieldDb).toContain('const DB_VERSION = 3');
        expect(fieldDb).toContain('encryptedRequest');
        expect(fieldDb).toContain('encryptedBlob');
        expect(fieldDb).toContain('belongsToOfflineOwner');
    });

    it('ne conserve plus de copie locale après synchronisation d’une dose', () => {
        const service = source('src/services/DosimetryOfflineService.ts');
        const syncBlock = service.slice(service.indexOf('export const syncPending'), service.indexOf('export const clearSynced'));
        expect(syncBlock).toContain("await db.delete('queued_doses', entry.id)");
        expect(syncBlock).not.toContain("db.put('synced_doses'");
        expect(service).toContain('const DB_VERSION = 4');
        expect(service).toContain('encryptedPayload');
        expect(service).toContain('belongsToOfflineOwner');
    });

    it('chiffre et partitionne les queues personnelles SOS et check-in', () => {
        const sos = source('src/utility/OfflineSosQueue.ts');
        const checkIn = source('src/utility/OfflineCheckInQueue.ts');

        expect(sos).toContain('const DB_VERSION = 2');
        expect(sos).toContain('encryptedSensitive');
        expect(sos).toContain('belongsToOfflineOwner');
        expect(checkIn).toContain('const DB_VERSION = 2');
        expect(checkIn).toContain('encryptedSensitive');
        expect(checkIn).toContain('belongsToOfflineOwner');
    });

    it('utilise AES-GCM et des cles non extractibles liees a la partition', () => {
        const vault = source('src/security/offlineVault.ts');

        expect(vault).toContain("const ALGORITHM = 'AES-GCM'");
        expect(vault).toContain("'SHA-256'");
        expect(vault).toContain('false,');
        expect(vault).toContain('additionalData');
    });
});
