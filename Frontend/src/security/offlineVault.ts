import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import store from '../Store';

const KEY_DB_NAME = 'safex-offline-keyring';
const KEY_DB_VERSION = 1;
const KEY_STORE = 'partitionKeys';
const ENVELOPE_VERSION = 1 as const;
const ALGORITHM = 'AES-GCM' as const;

export interface OfflineOwnerContext {
    ownerKey: string;
    mineId: number;
}

export interface EncryptedOfflinePayload {
    version: typeof ENVELOPE_VERSION;
    algorithm: typeof ALGORITHM;
    keyId: string;
    iv: string;
    ciphertext: string;
    contentType: 'json' | 'blob';
    byteLength: number;
    mimeType?: string;
}

interface StoredPartitionKey {
    keyId: string;
    key: CryptoKey;
    createdAt: number;
}

interface OfflineKeyRingSchema extends DBSchema {
    partitionKeys: {
        key: string;
        value: StoredPartitionKey;
    };
}

export interface OfflineKeyRepository {
    get(keyId: string): Promise<CryptoKey | undefined>;
    add(keyId: string, key: CryptoKey): Promise<void>;
    delete(keyId: string): Promise<void>;
}

class IndexedDbOfflineKeyRepository implements OfflineKeyRepository {
    private dbPromise: Promise<IDBPDatabase<OfflineKeyRingSchema>> | null = null;

    private getDb(): Promise<IDBPDatabase<OfflineKeyRingSchema>> {
        if (typeof indexedDB === 'undefined') {
            return Promise.reject(new Error('OFFLINE_KEYSTORE_UNAVAILABLE'));
        }
        if (!this.dbPromise) {
            this.dbPromise = openDB<OfflineKeyRingSchema>(KEY_DB_NAME, KEY_DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(KEY_STORE)) {
                        db.createObjectStore(KEY_STORE, { keyPath: 'keyId' });
                    }
                },
            });
        }
        return this.dbPromise;
    }

    async get(keyId: string): Promise<CryptoKey | undefined> {
        const record = await (await this.getDb()).get(KEY_STORE, keyId);
        return record?.key;
    }

    async add(keyId: string, key: CryptoKey): Promise<void> {
        await (await this.getDb()).add(KEY_STORE, { keyId, key, createdAt: Date.now() });
    }

    async delete(keyId: string): Promise<void> {
        await (await this.getDb()).delete(KEY_STORE, keyId);
    }
}

const requireCrypto = (): Crypto => {
    const provider = globalThis.crypto;
    if (!provider?.subtle || typeof provider.getRandomValues !== 'function') {
        throw new Error('OFFLINE_CRYPTO_UNAVAILABLE');
    }
    return provider;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

const normalizeOwner = (owner: OfflineOwnerContext): OfflineOwnerContext => {
    const ownerKey = String(owner.ownerKey ?? '').trim();
    const mineId = Number(owner.mineId);
    if (!ownerKey || !Number.isInteger(mineId) || mineId <= 0) {
        throw new Error('OFFLINE_IDENTITY_AND_MINE_REQUIRED');
    }
    return { ownerKey, mineId };
};

export const currentOfflineOwnerContext = (): OfflineOwnerContext => {
    const state = store.getState() as unknown as {
        user?: Record<string, unknown> | null;
        companySelection?: { selectedCompanyId?: unknown };
    };
    const user = state.user;
    const identity = user?.id ?? user?.sub ?? user?.login;
    const mine = state.companySelection?.selectedCompanyId
        ?? user?.workingCompanyId
        ?? user?.mineId
        ?? user?.company
        ?? user?.companyId;
    return normalizeOwner({ ownerKey: String(identity ?? ''), mineId: Number(mine) });
};

export const belongsToOfflineOwner = (
    entry: { ownerKey?: string; mineId?: number },
    owner: OfflineOwnerContext,
): boolean => entry.ownerKey === owner.ownerKey && entry.mineId === owner.mineId;

export const createOfflineCryptoId = (): string => {
    const provider = requireCrypto();
    if (typeof provider.randomUUID === 'function') return provider.randomUUID();
    const bytes = provider.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

export class OfflineVault {
    private readonly pendingKeys = new Map<string, Promise<CryptoKey>>();

    constructor(
        private readonly repository: OfflineKeyRepository,
        private readonly cryptoProvider?: Crypto,
    ) {}

    private crypto(): Crypto {
        return this.cryptoProvider ?? requireCrypto();
    }

    async partitionKeyId(ownerInput: OfflineOwnerContext): Promise<string> {
        const owner = normalizeOwner(ownerInput);
        const digest = await this.crypto().subtle.digest(
            'SHA-256',
            new TextEncoder().encode(`safex-offline-v1\u0000${owner.ownerKey}\u0000${owner.mineId}`),
        );
        return bytesToBase64(new Uint8Array(digest))
            .split('+').join('-')
            .split('/').join('_')
            .split('=').join('');
    }

    private validateKey(key: CryptoKey | undefined): CryptoKey {
        if (!key || key.extractable || key.algorithm?.name !== ALGORITHM
                || !key.usages.includes('encrypt') || !key.usages.includes('decrypt')) {
            throw new Error('OFFLINE_KEY_INVALID');
        }
        return key;
    }

    private async getExistingKey(keyId: string): Promise<CryptoKey> {
        return this.validateKey(await this.repository.get(keyId));
    }

    private async getOrCreateKey(keyId: string): Promise<CryptoKey> {
        const inFlight = this.pendingKeys.get(keyId);
        if (inFlight) return inFlight;

        const pending = (async () => {
            const existing = await this.repository.get(keyId);
            if (existing) return this.validateKey(existing);

            const generated = await this.crypto().subtle.generateKey(
                { name: ALGORITHM, length: 256 },
                false,
                ['encrypt', 'decrypt'],
            );
            const key = this.validateKey(generated);
            try {
                await this.repository.add(keyId, key);
                return key;
            } catch {
                // Deux onglets peuvent creer la meme partition simultanement.
                // Le perdant reutilise obligatoirement la cle deja persistee.
                return this.getExistingKey(keyId);
            }
        })().finally(() => this.pendingKeys.delete(keyId));
        this.pendingKeys.set(keyId, pending);
        return pending;
    }

    private associatedData(keyId: string, purpose: string, cryptoId: string): Uint8Array {
        if (!purpose || !cryptoId) throw new Error('OFFLINE_CRYPTO_BINDING_REQUIRED');
        return new TextEncoder().encode(`safex-envelope-v1\u0000${keyId}\u0000${purpose}\u0000${cryptoId}`);
    }

    private async encryptBytes(
        ownerInput: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        plaintext: Uint8Array,
        contentType: 'json' | 'blob',
        mimeType?: string,
    ): Promise<EncryptedOfflinePayload> {
        const owner = normalizeOwner(ownerInput);
        const keyId = await this.partitionKeyId(owner);
        const key = await this.getOrCreateKey(keyId);
        const iv = this.crypto().getRandomValues(new Uint8Array(12));
        const ciphertext = await this.crypto().subtle.encrypt(
            {
                name: ALGORITHM,
                iv,
                additionalData: this.associatedData(keyId, purpose, cryptoId),
                tagLength: 128,
            },
            key,
            plaintext,
        );
        return {
            version: ENVELOPE_VERSION,
            algorithm: ALGORITHM,
            keyId,
            iv: bytesToBase64(iv),
            ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
            contentType,
            byteLength: plaintext.byteLength,
            ...(mimeType ? { mimeType } : {}),
        };
    }

    private async decryptBytes(
        ownerInput: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        envelope: EncryptedOfflinePayload,
        expectedType: 'json' | 'blob',
    ): Promise<Uint8Array> {
        const owner = normalizeOwner(ownerInput);
        if (envelope?.version !== ENVELOPE_VERSION
                || envelope.algorithm !== ALGORITHM
                || envelope.contentType !== expectedType) {
            throw new Error('OFFLINE_ENVELOPE_INVALID');
        }
        const expectedKeyId = await this.partitionKeyId(owner);
        if (envelope.keyId !== expectedKeyId) throw new Error('OFFLINE_ENTRY_FORBIDDEN');
        const key = await this.getExistingKey(expectedKeyId);
        try {
            const plaintext = await this.crypto().subtle.decrypt(
                {
                    name: ALGORITHM,
                    iv: base64ToBytes(envelope.iv),
                    additionalData: this.associatedData(expectedKeyId, purpose, cryptoId),
                    tagLength: 128,
                },
                key,
                base64ToBytes(envelope.ciphertext),
            );
            const bytes = new Uint8Array(plaintext);
            if (bytes.byteLength !== envelope.byteLength) throw new Error('OFFLINE_PAYLOAD_LENGTH_MISMATCH');
            return bytes;
        } catch (error) {
            if (error instanceof Error && error.message === 'OFFLINE_PAYLOAD_LENGTH_MISMATCH') throw error;
            throw new Error('OFFLINE_PAYLOAD_AUTHENTICATION_FAILED');
        }
    }

    async encryptJson<T>(
        owner: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        value: T,
    ): Promise<EncryptedOfflinePayload> {
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        return this.encryptBytes(owner, purpose, cryptoId, bytes, 'json');
    }

    async decryptJson<T>(
        owner: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        envelope: EncryptedOfflinePayload,
    ): Promise<T> {
        const bytes = await this.decryptBytes(owner, purpose, cryptoId, envelope, 'json');
        try {
            return JSON.parse(new TextDecoder().decode(bytes)) as T;
        } catch {
            throw new Error('OFFLINE_PAYLOAD_INVALID');
        }
    }

    async encryptBlob(
        owner: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        blob: Blob,
    ): Promise<EncryptedOfflinePayload> {
        return this.encryptBytes(
            owner,
            purpose,
            cryptoId,
            new Uint8Array(await blob.arrayBuffer()),
            'blob',
            blob.type || 'application/octet-stream',
        );
    }

    async decryptBlob(
        owner: OfflineOwnerContext,
        purpose: string,
        cryptoId: string,
        envelope: EncryptedOfflinePayload,
    ): Promise<Blob> {
        const bytes = await this.decryptBytes(owner, purpose, cryptoId, envelope, 'blob');
        return new Blob([bytes], { type: envelope.mimeType || 'application/octet-stream' });
    }

    async deletePartitionKey(owner: OfflineOwnerContext): Promise<void> {
        const keyId = await this.partitionKeyId(owner);
        this.pendingKeys.delete(keyId);
        await this.repository.delete(keyId);
    }
}

const defaultOfflineVault = new OfflineVault(new IndexedDbOfflineKeyRepository());

export const encryptOfflineJson = <T>(
    owner: OfflineOwnerContext,
    purpose: string,
    cryptoId: string,
    value: T,
) => defaultOfflineVault.encryptJson(owner, purpose, cryptoId, value);

export const decryptOfflineJson = <T>(
    owner: OfflineOwnerContext,
    purpose: string,
    cryptoId: string,
    envelope: EncryptedOfflinePayload,
) => defaultOfflineVault.decryptJson<T>(owner, purpose, cryptoId, envelope);

export const encryptOfflineBlob = (
    owner: OfflineOwnerContext,
    purpose: string,
    cryptoId: string,
    blob: Blob,
) => defaultOfflineVault.encryptBlob(owner, purpose, cryptoId, blob);

export const decryptOfflineBlob = (
    owner: OfflineOwnerContext,
    purpose: string,
    cryptoId: string,
    envelope: EncryptedOfflinePayload,
) => defaultOfflineVault.decryptBlob(owner, purpose, cryptoId, envelope);

export const offlinePartitionStorageKey = async (
    owner: OfflineOwnerContext,
    storeName: string,
    logicalId: string | number,
): Promise<string> => `${await defaultOfflineVault.partitionKeyId(owner)}:${storeName}:${String(logicalId)}`;

export const purgeCurrentOfflinePartitionKey = async (): Promise<void> => {
    await defaultOfflineVault.deletePartitionKey(currentOfflineOwnerContext());
};
