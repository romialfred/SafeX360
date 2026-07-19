package com.minexpert.hns.dosimetry.enums;

/**
 * Categorie d'agregation utilisee par les snapshots KPI Dosimetrie (Phase 8).
 *
 * <p>Contrairement a {@link DoseCategory} qui ne represente que A/B (categories de
 * travailleurs exposes au sens CIPR 103), {@code KpiCategory} elargit la dimension de
 * regroupement pour les tableaux de bord executifs :
 *
 * <ul>
 *   <li>{@link #WORKER_A} : travailleurs classes categorie A (dose effective &gt; 6 mSv/an).</li>
 *   <li>{@link #WORKER_B} : travailleurs classes categorie B ; 6 mSv est le seuil
 *       de classification et non une limite reglementaire.</li>
 *   <li>{@link #APPRENTICE} : apprentis (statut special sur ExposedWorker).</li>
 *   <li>{@link #PREGNANCY} : femmes enceintes declarees (statut special).</li>
 *   <li>{@link #PUBLIC} : public / personnel non classe.</li>
 * </ul>
 *
 * <p>La correspondance avec {@link com.minexpert.hns.dosimetry.entity.ExposedWorker} est :
 * <ul>
 *   <li>specialStatus = PREGNANCY -&gt; PREGNANCY (prioritaire)</li>
 *   <li>specialStatus = APPRENTICE -&gt; APPRENTICE</li>
 *   <li>category = A -&gt; WORKER_A</li>
 *   <li>category = B -&gt; WORKER_B</li>
 *   <li>sinon -&gt; PUBLIC</li>
 * </ul>
 */
public enum KpiCategory {
    WORKER_A,
    WORKER_B,
    APPRENTICE,
    PREGNANCY,
    PUBLIC
}
