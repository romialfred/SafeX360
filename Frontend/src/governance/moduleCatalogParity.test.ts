import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GARDE-FOU DE FRONTIÈRE — le front et le serveur ne peuvent plus diverger en silence.
 *
 * Le défaut récurrent de cette base : une même liste de modules écrite côté
 * serveur ET côté client, qui finissent par ne plus concorder — c'est ainsi que
 * le droit « Gestion des erreurs » a été proposé par l'IHM puis perdu à
 * l'enregistrement. Le serveur est désormais la source unique (ModuleCatalog.java).
 * Ce test LIT ce fichier Java et exige que le front en soit le reflet exact.
 * Ajouter un module côté serveur sans le déclarer côté client casse ce test —
 * avant la mise en production, pas devant le client.
 *
 * Portée : local et intégration continue disposant du dépôt complet. En build
 * front isolé (Backend/ absent), le test se déclare SKIPPÉ avec un message
 * explicite plutôt que de passer en silence — une couverture non exécutée doit
 * se voir.
 */

const CATALOG_JAVA = resolve(
    process.cwd(),
    '../Backend/Health-Safety/src/main/java/com/minexpert/hns/api/users/ModuleCatalog.java',
);
const SIDEBAR = resolve(process.cwd(), 'src/components/NewComponents/Sidebar/Sidebar.tsx');
const PROFILE = resolve(
    process.cwd(),
    'src/components/NewComponents/UsersManagement/UserProfilePage.tsx',
);

const backendAvailable = existsSync(CATALOG_JAVA);

/** Clés de modules déclarées au catalogue serveur : m("x", …) et mine("x", …). */
function backendKeys(): { all: string[]; mineManaged: Set<string> } {
    const java = readFileSync(CATALOG_JAVA, 'utf8');
    const all = [...java.matchAll(/\b(?:m|mine)\("([A-Za-z]+)"/g)].map((m) => m[1]);
    const mineManaged = new Set(
        [...java.matchAll(/\bmine\("([A-Za-z]+)"/g)].map((m) => m[1]),
    );
    return { all, mineManaged };
}

/** Ensemble d'un `new Set([... 'a', 'b' ...])` repéré par le nom de la constante. */
function extractStringSet(source: string, constName: string): Set<string> {
    const block = new RegExp(`${constName}\\s*=\\s*new Set\\(\\[(.*?)\\]\\)`, 's').exec(source);
    if (!block) throw new Error(`Bloc introuvable : ${constName}`);
    return new Set([...block[1].matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]));
}

/** Valeurs (cibles) d'un Record<string,string> repéré par le nom de la constante. */
function extractRecordValues(source: string, constName: string): Set<string> {
    const block = new RegExp(`${constName}[^{]*\\{(.*?)\\}`, 's').exec(source);
    if (!block) throw new Error(`Bloc introuvable : ${constName}`);
    return new Set([...block[1].matchAll(/:\s*'([A-Za-z]+)'/g)].map((m) => m[1]));
}

/** Clés d'un Record<string,string> (les libellés) repéré par le nom de la constante. */
function extractRecordKeys(source: string, constName: string): Set<string> {
    const block = new RegExp(`${constName}[^{]*\\{(.*?)\\n\\};`, 's').exec(source);
    if (!block) throw new Error(`Bloc introuvable : ${constName}`);
    return new Set([...block[1].matchAll(/(?:^|\s|,)([A-Za-z]+):\s*['"]/g)].map((m) => m[1]));
}

describe('parité du catalogue de modules (serveur ⇄ front)', () => {
    if (!backendAvailable) {
        it.skip(
            'IGNORÉ : ModuleCatalog.java introuvable (build front isolé) — parité non vérifiée',
            () => undefined,
        );
        // eslint-disable-next-line no-console
        console.warn(
            '[gouvernance] Parité du catalogue de modules NON VÉRIFIÉE : le dépôt Backend/ '
            + 'est absent. Ce contrôle exige le dépôt complet (local ou CI intégration).',
        );
        return;
    }

    const { all, mineManaged } = backendKeys();
    const attributable = all.filter((k) => !mineManaged.has(k));
    const sidebarSource = readFileSync(SIDEBAR, 'utf8');
    const profileSource = readFileSync(PROFILE, 'utf8');

    const vocabulary = extractStringSet(sidebarSource, 'PERMISSION_VOCABULARY');
    const overrideTargets = extractRecordValues(sidebarSource, 'MENU_PERMISSION_OVERRIDES');
    const labelKeys = extractRecordKeys(profileSource, 'MODULE_LABELS');

    it('chaque module attribuable du serveur gouverne bien le menu (vocabulaire sidebar)', () => {
        // Un module attribuable absent du vocabulaire serait affiché SANS contrôle
        // de droit — divergence à conséquence de sécurité, pas seulement cosmétique.
        const missing = attributable.filter((k) => !vocabulary.has(k) && !overrideTargets.has(k));
        expect(missing, `Modules serveur non gouvernés par la sidebar : ${missing.join(', ')}`)
            .toEqual([]);
    });

    it('chaque module du serveur possède un libellé FR dans la fiche utilisateur', () => {
        const missing = all.filter((k) => !labelKeys.has(k));
        expect(missing, `Modules serveur sans libellé FR : ${missing.join(', ')}`).toEqual([]);
    });

    it('le vocabulaire de la sidebar ne référence aucun module inconnu du serveur', () => {
        const known = new Set(all);
        const orphans = [...vocabulary].filter((k) => !known.has(k));
        expect(orphans, `Clés sidebar sans équivalent serveur : ${orphans.join(', ')}`).toEqual([]);
    });
});
