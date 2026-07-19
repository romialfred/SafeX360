import { describe, expect, it } from 'vitest';
import {
    OfflineVault,
    type OfflineKeyRepository,
    type OfflineOwnerContext,
} from './offlineVault';

class MemoryKeyRepository implements OfflineKeyRepository {
    readonly keys = new Map<string, CryptoKey>();

    async get(keyId: string): Promise<CryptoKey | undefined> {
        return this.keys.get(keyId);
    }

    async add(keyId: string, key: CryptoKey): Promise<void> {
        if (this.keys.has(keyId)) throw new DOMException('duplicate', 'ConstraintError');
        this.keys.set(keyId, key);
    }

    async delete(keyId: string): Promise<void> {
        this.keys.delete(keyId);
    }
}

const ownerA: OfflineOwnerContext = { ownerKey: 'account-A', mineId: 7 };
const ownerB: OfflineOwnerContext = { ownerKey: 'account-B', mineId: 7 };

describe('OfflineVault AES-GCM partitionné', () => {
    it('chiffre sans rémanence en clair et conserve une clé non extractible', async () => {
        const repository = new MemoryKeyRepository();
        const vault = new OfflineVault(repository, globalThis.crypto);
        const sensitive = { workerName: 'Alice Sensitive', dose: 4.2 };

        const envelope = await vault.encryptJson(ownerA, 'dosimetry-dose', 'entry-1', sensitive);

        expect(JSON.stringify(envelope)).not.toContain('Alice Sensitive');
        expect(envelope.algorithm).toBe('AES-GCM');
        expect(envelope.iv).not.toHaveLength(0);
        expect(await vault.decryptJson(ownerA, 'dosimetry-dose', 'entry-1', envelope)).toEqual(sensitive);
        const storedKey = repository.keys.get(envelope.keyId);
        expect(storedKey?.extractable).toBe(false);
        expect(storedKey?.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
    });

    it('refuse lecture compte A vers compte B et rejeu sous un autre identifiant', async () => {
        const vault = new OfflineVault(new MemoryKeyRepository(), globalThis.crypto);
        const envelope = await vault.encryptJson(ownerA, 'field-mutation', 'mutation-A', {
            employeeId: 41,
        });

        await expect(vault.decryptJson(ownerB, 'field-mutation', 'mutation-A', envelope))
            .rejects.toThrow('OFFLINE_ENTRY_FORBIDDEN');
        await expect(vault.decryptJson(ownerA, 'field-mutation', 'mutation-B', envelope))
            .rejects.toThrow('OFFLINE_PAYLOAD_AUTHENTICATION_FAILED');
    });

    it('détecte toute mutation du ciphertext', async () => {
        const vault = new OfflineVault(new MemoryKeyRepository(), globalThis.crypto);
        const envelope = await vault.encryptJson(ownerA, 'sos', 'sos-1', { latitude: 5.3 });
        const first = envelope.ciphertext[0] === 'A' ? 'B' : 'A';
        const tampered = { ...envelope, ciphertext: first + envelope.ciphertext.slice(1) };

        await expect(vault.decryptJson(ownerA, 'sos', 'sos-1', tampered))
            .rejects.toThrow('OFFLINE_PAYLOAD_AUTHENTICATION_FAILED');
    });

    it('chiffre les Blob et rend les données irrécupérables après purge de clé', async () => {
        const repository = new MemoryKeyRepository();
        const vault = new OfflineVault(repository, globalThis.crypto);
        const source = new Blob(['photo-personnelle'], { type: 'image/jpeg' });
        const envelope = await vault.encryptBlob(ownerA, 'field-photo', 'photo-1', source);

        expect(JSON.stringify(envelope)).not.toContain('photo-personnelle');
        const restored = await vault.decryptBlob(ownerA, 'field-photo', 'photo-1', envelope);
        expect(await restored.text()).toBe('photo-personnelle');

        await vault.deletePartitionKey(ownerA);
        await expect(vault.decryptBlob(ownerA, 'field-photo', 'photo-1', envelope))
            .rejects.toThrow('OFFLINE_KEY_INVALID');
    });
});
