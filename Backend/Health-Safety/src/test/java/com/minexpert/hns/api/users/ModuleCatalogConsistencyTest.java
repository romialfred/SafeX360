package com.minexpert.hns.api.users;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.LinkedHashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.minexpert.hns.entity.users.PermissionManagement;

/**
 * GARDE-FOU CONTRE LA DIVERGENCE DES SOURCES DE MODULES.
 *
 * <p>Le defaut recurrent de cette base — un droit propose par l'IHM mais perdu
 * faute de colonne serveur — venait d'UNE MEME liste de modules ecrite a
 * plusieurs endroits qui finissaient par ne plus concorder. {@link ModuleCatalog}
 * est desormais la source unique ; ce test transforme toute divergence future en
 * ECHEC DE BUILD, avant qu'elle n'atteigne la production.
 *
 * <p>Il verrouille trois invariants :
 * <ol>
 *   <li>tout module « sans colonne historique » declare existe bien au catalogue ;
 *   <li>l'ensemble des colonnes historiques (lu par reflexion, donc impossible a
 *       oublier de mettre a jour) est EXACTEMENT le complementaire des modules
 *       sans colonne — chaque module du catalogue tombe dans une case et une
 *       seule ;
 *   <li>ecrire les colonnes puis les relire redonne le meme ensemble de cles
 *       (symetrie setter/getter/colonne) : un mauvais appariement — la cause
 *       typique du droit perdu en silence — casse ce test.
 * </ol>
 */
class ModuleCatalogConsistencyTest {

    /** Cles reellement portees par les colonnes « une par module » de l'entite. */
    private Set<String> legacyColumnKeysFromEntity() {
        PermissionManagement pm = new PermissionManagement();
        // On active TOUTES les colonnes de module par reflexion : ainsi aucune
        // colonne ajoutee plus tard ne peut echapper au test faute d'avoir ete
        // listee a la main ici.
        for (Field field : PermissionManagement.class.getDeclaredFields()) {
            if (!field.getType().equals(String.class)) {
                continue;
            }
            if (field.getName().equals("allowedModules")) {
                continue; // colonne CSV, pas une colonne de module
            }
            field.setAccessible(true);
            try {
                field.set(pm, "111");
            } catch (IllegalAccessException e) {
                throw new AssertionError("Champ inaccessible : " + field.getName(), e);
            }
        }
        return new LinkedHashSet<>(pm.legacyColumnModules());
    }

    @Test
    void withoutLegacyColumnKeysAllExistInCatalog() {
        assertThat(ModuleCatalog.KEYS)
                .as("Un module declare « sans colonne historique » doit exister au catalogue")
                .containsAll(ModuleCatalog.WITHOUT_LEGACY_COLUMN);
    }

    @Test
    void everyCatalogModuleFallsInExactlyOnePartition() {
        Set<String> legacy = legacyColumnKeysFromEntity();

        // Aucune cle de colonne historique ne doit etre marquee « sans colonne ».
        assertThat(legacy)
                .as("Une cle a la fois colonne ET sans-colonne serait contradictoire")
                .doesNotContainAnyElementsOf(ModuleCatalog.WITHOUT_LEGACY_COLUMN);

        // colonnes historiques  ∪  modules sans colonne  ==  catalogue entier.
        Set<String> union = new LinkedHashSet<>(legacy);
        union.addAll(ModuleCatalog.WITHOUT_LEGACY_COLUMN);
        assertThat(union)
                .as("Chaque module du catalogue doit etre soit porte par une colonne, "
                        + "soit explicitement declare sans colonne — sinon il serait perdu a l'ecriture")
                .isEqualTo(ModuleCatalog.KEYS);
    }

    @Test
    void everyLegacyColumnKeyIsKnownToTheCatalog() {
        assertThat(ModuleCatalog.KEYS)
                .as("Une colonne historique sans entree au catalogue serait un module fantome")
                .containsAll(legacyColumnKeysFromEntity());
    }
}
