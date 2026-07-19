import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const documentationSource = readFileSync(resolve(
    process.cwd(),
    'src/components/NewComponents/ISODocuments/ISODocuments.tsx',
), 'utf8');

describe('maîtrise de la documentation ISO', () => {
    it('ne redistribue pas de texte normatif ni de faux téléchargement', () => {
        expect(documentationSource).not.toMatch(/\borganization shall\b/i);
        expect(documentationSource).not.toMatch(/\bfull document\b/i);
        expect(documentationSource).not.toMatch(/\bdownload pdf\b/i);
        expect(documentationSource).toContain("ne reproduit pas le texte des normes");
        expect(documentationSource).toContain('Licence externe requise');
    });

    it('rend visibles la source officielle, la version et l’approbation humaine', () => {
        expect(documentationSource).toContain('Consulter la fiche ISO officielle');
        expect(documentationSource).toContain('ISO_REGISTRY_VERSION');
        expect(documentationSource).toContain('Approbation humaine en attente');
    });
});

