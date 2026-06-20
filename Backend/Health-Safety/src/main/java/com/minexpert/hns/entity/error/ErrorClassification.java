package com.minexpert.hns.entity.error;

import com.minexpert.hns.enums.ErrorNature;
import com.minexpert.hns.enums.ViolationSubtype;

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
 * Classification de l'erreur (taxonomie de Reason). Relation logique 1-1 avec
 * un {@link ErrorEvent} (un seul enregistrement actif par evenement).
 */
@Entity
@Table(name = "error_classification")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorClassification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_event_id")
    private Long errorEventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "error_nature", length = 16)
    private ErrorNature errorNature;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_subtype", length = 16)
    private ViolationSubtype violationSubtype;

    @Column(name = "is_latent")
    private boolean isLatent;

    @Lob
    private String notes;

    public ErrorClassification(Long id) {
        this.id = id;
    }
}
