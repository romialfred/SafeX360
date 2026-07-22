package com.minexpert.hns.entity.error;

import com.minexpert.hns.enums.CauseLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cause identifiee lors d'une {@link CausalAnalysis}. Le champ
 * {@code parentCauseId} (auto-reference souple) permet de construire un arbre
 * des causes. Table nommee {@code error_cause} pour eviter toute collision.
 */
@Entity
@Table(name = "error_cause")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Cause {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "causal_analysis_id")
    private Long causalAnalysisId;

    private String label;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private CauseLevel level;

    /** Categorie 5M/6M ou panier ICAM. */
    private String category;

    /** Auto-reference (souple) vers la cause parente — arbre des causes. */
    @Column(name = "parent_cause_id")
    private Long parentCauseId;

    /**
     * Marque une cause comme « contrôle/barrière défaillant(e) » (ISO 45001
     * §10.2 a-b · ICAM). Distingue une cause qui EST l'absence ou la défaillance
     * d'une mesure de maîtrise existante (barrière percée) d'une cause générique —
     * ce qui oriente directement l'action corrective vers la remise en état ou le
     * renforcement du contrôle. Additif, nullable.
     */
    @Column(name = "failed_control")
    private Boolean failedControl;

    public Cause(Long id) {
        this.id = id;
    }
}
