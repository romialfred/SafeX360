package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.JustCultureOutcome;

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
 * Evaluation Just Culture (culture juste) d'un {@link ErrorEvent}. Documente le
 * resultat, le test de substitution et la decision argumentee.
 */
@Entity
@Table(name = "error_just_culture")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class JustCultureAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private JustCultureOutcome outcome;

    /** Test de substitution : conclusion + notes (texte libre). */
    @Column(name = "substitution_test")
    private String substitutionTest;

    @Lob
    @Column(name = "decision_notes")
    private String decisionNotes;

    @Column(name = "assessed_by")
    private Long assessedBy;

    private LocalDateTime assessedAt;

    public JustCultureAssessment(Long id) {
        this.id = id;
    }
}
