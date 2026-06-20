package com.minexpert.hns.entity.error;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Referentiel des niveaux de gravite (1 = mineur a 5 = catastrophique).
 */
@Entity
@Table(name = "error_severity")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorSeverity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Niveau 1..5. */
    private Integer level;

    private String label;

    @Column(name = "color_hex", length = 9)
    private String colorHex;

    public ErrorSeverity(Long id) {
        this.id = id;
    }
}
