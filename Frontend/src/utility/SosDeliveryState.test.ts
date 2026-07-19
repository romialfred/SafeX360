import { describe, expect, it } from 'vitest';
import {
    createSosClientRequestId,
    deriveSosDeliveryState,
    getSosDeliveryNotice,
} from './SosDeliveryState';

describe('SosDeliveryState', () => {
    it('ne confond pas une mise en file et une réception serveur', () => {
        expect(deriveSosDeliveryState(false)).toBe('QUEUED');
        expect(deriveSosDeliveryState(true, 'RECEIVED')).toBe('RECEIVED');
    });

    it('ne confirme la prise en charge que pour un état serveur ultérieur', () => {
        expect(deriveSosDeliveryState(true, 'ACKNOWLEDGED')).toBe('ACKNOWLEDGED');
        expect(getSosDeliveryNotice('RECEIVED').body).toContain("n'est pas encore confirmée");
    });

    it("génère une clé d'idempotence distincte", () => {
        expect(createSosClientRequestId()).not.toBe(createSosClientRequestId());
    });
});

