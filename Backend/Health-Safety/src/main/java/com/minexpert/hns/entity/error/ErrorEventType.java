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
 * Referentiel parametrable des types d'evenement erreur.
 * {@code companyId} null = type global (commun a toutes les societes).
 */
@Entity
@Table(name = "error_event_type")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorEventType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null = referentiel global. */
    @Column(name = "company_id")
    private Long companyId;

    @Column(length = 48)
    private String code;

    private String label;

    @Column(name = "color_hex", length = 9)
    private String colorHex;

    private boolean active;

    public ErrorEventType(Long id) {
        this.id = id;
    }
}
