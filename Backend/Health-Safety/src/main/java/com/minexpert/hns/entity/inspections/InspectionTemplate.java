package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.enums.InspectionTemplateType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Modele d'inspection reutilisable, defini une seule fois et reutilise pour
 * planifier plusieurs inspections sur le terrain.
 *
 * <p>Un template regroupe un ensemble de {@link InspectionCheckpoint} (points
 * de controle) adaptes au type d'objet inspecte (equipement, lieu, procedure).
 * Les inspecteurs ne saisissent plus la liste a la volee : ils selectionnent
 * un template existant et repondent uniquement aux questions pre-configurees.</p>
 *
 * <p><b>Exemples :</b></p>
 * <ul>
 *   <li>Type EQUIPMENT : "Camion benne 100t" → 12 points (pneus, freins, niveau d'huile, klaxon...)</li>
 *   <li>Type LOCATION  : "Magasin d'explosifs" → 8 points (extincteurs, ventilation, signalisation...)</li>
 *   <li>Type PROCEDURE : "Consignation LOTO" → 6 points (autorisation, cadenas, etiquetage...)</li>
 * </ul>
 *
 * <p>Le code unique facilite la recherche et le seed. Le champ {@code active}
 * permet de retirer un template obsolete sans casser les inspections passees.</p>
 */
@Entity
@Table(
        name = "inspection_template",
        indexes = {
                @Index(name = "idx_inspection_template_type", columnList = "type"),
                @Index(name = "idx_inspection_template_active", columnList = "active"),
                @Index(name = "idx_inspection_template_code", columnList = "code", unique = true)
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Code unique du template (ex : "EQ-CAMION-BENNE-100T", "PROC-LOTO").
     * Permet le seed reproductible et la recherche rapide.
     */
    @Column(nullable = false, unique = true, length = 64)
    private String code;

    /** Nom lisible affiche aux utilisateurs (ex : "Camion benne 100 tonnes"). */
    @Column(nullable = false, length = 160)
    private String name;

    /** Description longue pour aider l'inspecteur a choisir le bon template. */
    @Column(length = 1000)
    private String description;

    /** Type d'objet inspecte (EQUIPMENT / LOCATION / PROCEDURE). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private InspectionTemplateType type;

    /**
     * Reference optionnelle a un sous-type metier au sein du type. Permet de
     * filtrer plusieurs templates pour le meme type (ex : type=EQUIPMENT,
     * scopeRef="HEAVY_TRUCK" pour distinguer camions/excavateurs/foreuses).
     */
    @Column(length = 64)
    private String scopeRef;

    /**
     * Duree estimee de l'inspection sur le terrain (minutes). Utilise pour
     * la planification et l'estimation de charge.
     */
    private Integer estimatedDurationMin;

    /** Auteur du template (employe createur). */
    private Long createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Indique si le template est encore propose a la planification. */
    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    /**
     * Points de controle ordonnes du template. La cascade ALL permet de
     * persister et supprimer les checkpoints avec le template parent.
     * Le orphanRemoval garantit qu'un checkpoint retire de la liste est
     * effacement supprime de la BDD (et non orphelin).
     */
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<InspectionCheckpoint> checkpoints = new ArrayList<>();
}
