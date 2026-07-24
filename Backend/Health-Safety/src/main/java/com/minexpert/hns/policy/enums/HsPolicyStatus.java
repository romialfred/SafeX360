package com.minexpert.hns.policy.enums;

/**
 * Cycle de vie d'une politique SST (ISO 45001 §5.2).
 *
 * <ul>
 *   <li>{@code DRAFT} — en préparation par le management ; modifiable, non visible
 *       des travailleurs.</li>
 *   <li>{@code PUBLISHED} — signée par la direction et diffusée ; UNE SEULE version
 *       publiée par mine à la fois (publier archive la précédente). Une politique
 *       publiée est une preuve figée : elle n'est plus modifiable.</li>
 *   <li>{@code ARCHIVED} — remplacée par une version plus récente ; conservée pour
 *       la traçabilité et l'historique (une revue de direction §9.3 doit pouvoir
 *       remonter les versions successives).</li>
 * </ul>
 */
public enum HsPolicyStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED
}
