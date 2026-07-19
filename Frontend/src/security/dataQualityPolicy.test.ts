import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('qualité des données visibles', () => {
    it('ne publie plus le classement projet générique comme un résultat réel', () => {
        const dashboard = source('src/components/Dashboard/TopPerformers.tsx');

        expect(dashboard).not.toContain('John Doe');
        expect(dashboard).not.toContain('Project X');
        expect(dashboard).not.toContain('Best Products');
        expect(dashboard).toContain('Aucune donnée validée');
        expect(dashboard).toContain('source, le périmètre, la période de mesure');
    });

    it('identifie explicitement les personnes de démonstration restantes', () => {
        const communications = source('src/Data/dummyData/communicationData.tsx');
        expect(communications).not.toContain("name: 'Jean Dupont'");
        expect(communications).toContain('Utilisateur fictif — démonstration');
    });
});
