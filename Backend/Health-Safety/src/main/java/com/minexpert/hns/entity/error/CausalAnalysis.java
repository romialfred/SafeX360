package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.CausalMethod;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Analyse causale rattachee a une SOURCE (evenement d'erreur OU incident) — modele
 * de causes unifie ISO 45001 §10.2 a-b. Porte la methode employee (5 pourquoi,
 * Ishikawa, arbre des causes, ICAM), la synthese, et N {@link Cause} hierarchisees.
 *
 * Rattachement par liens SOUPLES (Long nullable), comme CorrectiveAction : une
 * analyse porte errorEventId XOR incidentId. C'est le meme modele partage — la
 * meme table causal_analysis / error_cause sert les deux modules.
 */
@Entity
@Table(name = "causal_analysis")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CausalAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    /** Rattachement a un incident (module Investigation). Exclusif de errorEventId. */
    @Column(name = "incident_id")
    private Long incidentId;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private CausalMethod method;

    @Lob
    private String summary;

    @Column(name = "conducted_by")
    private Long conductedBy;

    private LocalDateTime conductedAt;

    public CausalAnalysis(Long id) {
        this.id = id;
    }
}
