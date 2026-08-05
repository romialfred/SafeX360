package com.minexpert.hns.entity.ppe;

import lombok.*;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.ppe.PpeDTO;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ppe")
public class Ppe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String category;
    @Lob
    private String description;
    private Integer minStock;
    private Integer stock;
    private String certificationStandard;
    @Enumerated(EnumType.STRING)
    private PpeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId). Alimenté par le CompanyScopeFilter via le controller.
    private Long companyId;

    /**
     * Verrou optimiste. Deux approbations concurrentes qui décrémentent le même
     * EPI ne peuvent plus s'écraser silencieusement (lost update) : la seconde
     * échoue proprement (OptimisticLockException) au lieu de laisser passer un
     * stock incohérent. Sur les lignes existantes, la colonne démarre à null et
     * Hibernate l'initialise au premier écrit — aucune reprise de données requise.
     */
    @Version
    private Long version;

    public Ppe(Long id) {
        this.id = id;
    }

    public PpeDTO toDTO() {
        return new PpeDTO(id, name, category, description, minStock, stock, certificationStandard, status, createdAt,
                updatedAt, companyId);
    }
}
