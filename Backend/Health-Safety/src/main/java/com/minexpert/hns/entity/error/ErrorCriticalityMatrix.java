package com.minexpert.hns.entity.error;

import com.minexpert.hns.enums.CriticalityLevel;

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
 * Matrice de criticite 5x5 : croise un niveau de gravite et un niveau de
 * probabilite pour produire un {@link CriticalityLevel} et sa couleur.
 */
@Entity
@Table(name = "error_criticality_matrix")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorCriticalityMatrix {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "severity_level")
    private Integer severityLevel;

    @Column(name = "probability_level")
    private Integer probabilityLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "criticality_level", length = 16)
    private CriticalityLevel criticalityLevel;

    @Column(name = "color_hex", length = 9)
    private String colorHex;

    public ErrorCriticalityMatrix(Long id) {
        this.id = id;
    }
}
