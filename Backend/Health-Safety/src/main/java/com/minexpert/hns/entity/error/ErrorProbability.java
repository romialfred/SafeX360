package com.minexpert.hns.entity.error;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Referentiel des niveaux de probabilite (1 = rare a 5 = quasi certain).
 */
@Entity
@Table(name = "error_probability")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorProbability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Niveau 1..5. */
    private Integer level;

    private String label;

    public ErrorProbability(Long id) {
        this.id = id;
    }
}
