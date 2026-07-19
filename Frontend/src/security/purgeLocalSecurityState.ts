import { purgeFieldSecurityState } from '../m/offline/db';
import { purgeDosimetrySecurityState } from '../services/DosimetryOfflineService';
import {
    countPending as countPendingSos,
    purgePendingSos,
} from '../utility/OfflineSosQueue';
import {
    listPendingCheckIns,
    purgePendingCheckIns,
} from '../utility/OfflineCheckInQueue';
import { resetBiometricSession } from '../m/services/biometricService';
import { purgeCurrentOfflinePartitionKey } from './offlineVault';

export interface PreservedOfflineWork {
    fieldMutations: number;
    fieldPhotos: number;
    dosimetryDoses: number;
    dosimetryMeasurements: number;
    emergencySos: number;
    emergencyCheckIns: number;
}

export interface LocalSecurityPurgeResult {
    deletedCaches: number;
    preservedOfflineWork: PreservedOfflineWork;
    failures: string[];
}

export interface LocalSecurityPurgeOptions {
    /**
     * Faux par defaut : un logout ou un 401 ne doit jamais detruire une saisie
     * terrain non synchronisee sans confirmation explicite de l'utilisateur.
     */
    purgeUnsynced?: boolean;
}

const emptyPreservedWork = (): PreservedOfflineWork => ({
    fieldMutations: 0,
    fieldPhotos: 0,
    dosimetryDoses: 0,
    dosimetryMeasurements: 0,
    emergencySos: 0,
    emergencyCheckIns: 0,
});

async function purgeCacheStorage(): Promise<number> {
    if (typeof caches === 'undefined') return 0;
    const keys = await caches.keys();
    const deleted = await Promise.all(keys.map((key) => caches.delete(key)));
    return deleted.filter(Boolean).length;
}

/**
 * Point d'entree unique de non-remanence locale pour logout et expiration.
 *
 * Les caches de lecture, historiques deja synchronises et CacheStorage sont
 * toujours effaces. Les queues non synchronisees sont conservees par defaut ;
 * leur suppression exige `purgeUnsynced: true` apres avertissement explicite.
 * Chaque stockage est traite en best-effort pour que l'indisponibilite d'une
 * API navigateur ne bloque jamais la fin de session.
 */
export async function purgeLocalSecurityState(
    options: LocalSecurityPurgeOptions = {},
): Promise<LocalSecurityPurgeResult> {
    const purgeUnsynced = options.purgeUnsynced === true;
    const result: LocalSecurityPurgeResult = {
        deletedCaches: 0,
        preservedOfflineWork: emptyPreservedWork(),
        failures: [],
    };

    const attempt = async (label: string, action: () => Promise<void>) => {
        try {
            await action();
        } catch {
            result.failures.push(label);
        }
    };

    await attempt('cache-storage', async () => {
        result.deletedCaches = await purgeCacheStorage();
    });

    await attempt('field-indexeddb', async () => {
        const field = await purgeFieldSecurityState(!purgeUnsynced);
        result.preservedOfflineWork.fieldMutations = field.preservedMutations;
        result.preservedOfflineWork.fieldPhotos = field.preservedPhotos;
    });

    await attempt('dosimetry-indexeddb', async () => {
        const dosimetry = await purgeDosimetrySecurityState(!purgeUnsynced);
        result.preservedOfflineWork.dosimetryDoses = dosimetry.preservedDoses;
        result.preservedOfflineWork.dosimetryMeasurements = dosimetry.preservedMeasurements;
    });

    if (purgeUnsynced) {
        await attempt('emergency-sos-indexeddb', purgePendingSos);
        await attempt('emergency-checkin-indexeddb', purgePendingCheckIns);

        const partitionPurgeFailures = new Set([
            'field-indexeddb',
            'dosimetry-indexeddb',
            'emergency-sos-indexeddb',
            'emergency-checkin-indexeddb',
        ]);
        if (!result.failures.some((failure) => partitionPurgeFailures.has(failure))) {
            // Supprimer la cle avant une queue aurait rendu les donnees restantes
            // irrecuperables. Elle n'est donc detruite qu'apres purge complete.
            await attempt('offline-partition-key', purgeCurrentOfflinePartitionKey);
        }
    } else {
        await attempt('emergency-sos-indexeddb', async () => {
            result.preservedOfflineWork.emergencySos = await countPendingSos();
        });
        await attempt('emergency-checkin-indexeddb', async () => {
            result.preservedOfflineWork.emergencyCheckIns =
                (await listPendingCheckIns()).length;
        });
    }

    resetBiometricSession();
    return result;
}

export default purgeLocalSecurityState;
