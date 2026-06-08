package com.minexpert.hns.entity.inspections;

import com.minexpert.hns.enums.CheckpointResponseType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Point de controle d'un {@link InspectionTemplate}.
 *
 * <p>Chaque checkpoint est une question concrete posee a l'inspecteur sur le
 * terrain. Le {@code responseType} determine le widget tactile affiche (2
 * tuiles boolean, 3 tuiles graduees, input numerique, photo). Les bornes
 * {@code minValue}/{@code maxValue} servent uniquement pour les checkpoints
 * de type {@code NUMERIC_RANGE} et permettent la coloration automatique en
 * rouge si la mesure est hors plage.</p>
 *
 * <p><b>Exemple concret — Camion benne :</b></p>
 * <pre>
 *   - Etat des pneus avant       | VISUAL_GRADE  |              | (Bon/Surveiller/Mauvais)
 *   - Pression huile moteur      | NUMERIC_RANGE | 3.5 - 5.5 bar
 *   - Klaxon fonctionnel         | BOOLEAN       |              | (Oui/Non)
 *   - Photo plaque immatriculation | PHOTO_REQUIRED |             |
 * </pre>
 */
@Entity
@Table(
        name = "inspection_checkpoint",
        indexes = {
                @Index(name = "idx_checkpoint_template", columnList = "template_id"),
                @Index(name = "idx_checkpoint_order", columnList = "template_id,display_order")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionCheckpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Template parent. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private InspectionTemplate template;

    /**
     * Libelle court affiche en tete de la carte tactile (ex : "Pression
     * pneu avant gauche", "Niveau d'huile moteur"). Reste sous 80 caracteres
     * pour la lisibilite mobile.
     */
    @Column(nullable = false, length = 160)
    private String label;

    /**
     * Texte d'aide optionnel affiche sous le libelle (ex : "Lire avec
     * manometre, vehicule chaud, moteur arrete"). Aide l'inspecteur a faire
     * la bonne mesure.
     */
    @Column(length = 500)
    private String helpText;

    /** Type de reponse attendue (determine le widget tactile). */
    @Enumerated(EnumType.STRING)
    @Column(name = "response_type", nullable = false, length = 24)
    private CheckpointResponseType responseType;

    /**
     * Borne minimale acceptee (NUMERIC_RANGE uniquement). Valeur sous cette
     * borne → non conforme automatique.
     */
    private Double minValue;

    /**
     * Borne maximale acceptee (NUMERIC_RANGE uniquement). Valeur au-dessus
     * → non conforme automatique.
     */
    private Double maxValue;

    /**
     * Unite affichee a l'utilisateur (ex : "bar", "L", "°C", "%"). Optionnel.
     */
    @Column(length = 16)
    private String unit;

    /**
     * Valeur attendue pour BOOLEAN ou VISUAL_GRADE.
     * BOOLEAN : "true" pour "Conforme" attendu, "false" pour "Non conforme" attendu.
     * VISUAL_GRADE : "GOOD" ou "WATCH" comme seuil de conformite.
     */
    @Column(length = 24)
    private String expectedValue;

    /**
     * Ordre d'affichage (croissant) dans la liste des checkpoints du template.
     * Permet a l'inspecteur de progresser dans un ordre logique (ex : tour
     * du vehicule du capot vers l'arriere).
     */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /**
     * Marqueur de criticite : un point critique non conforme bloque
     * l'utilisation de l'objet inspecte (ex : freins HS sur un camion).
     * Affiche en rouge dans le rapport.
     */
    @Column(nullable = false)
    private Boolean critical = Boolean.FALSE;

    /**
     * Si vrai, la reponse a ce checkpoint est obligatoire pour soumettre
     * l'inspection. Si faux, peut etre marquee non applicable.
     */
    @Column(nullable = false)
    private Boolean required = Boolean.TRUE;
}
