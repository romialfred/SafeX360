package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.enums.FindingConformity;

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
 * Constat (finding) : reponse d'un inspecteur a un {@link InspectionCheckpoint}
 * lors de la realisation d'une inspection sur le terrain.
 *
 * <p>Une {@link GeneralInspection} comporte autant de findings que de
 * checkpoints dans son template (1:1 sauf si checkpoint marque non
 * applicable). Le finding est cree au moment de la planification (vide,
 * statut NOT_APPLICABLE par defaut) ou a la premiere reponse de l'inspecteur,
 * selon la strategie choisie.</p>
 *
 * <p>La conformite est calculee automatiquement par le service en fonction
 * du type de checkpoint et de la reponse fournie, mais peut etre surchargee
 * manuellement par l'inspecteur (cas d'usage : valeur dans la plage mais
 * tendance anormale → forcer WATCH).</p>
 */
@Entity
@Table(
        name = "inspection_finding",
        indexes = {
                @Index(name = "idx_finding_inspection", columnList = "inspection_id"),
                @Index(name = "idx_finding_checkpoint", columnList = "checkpoint_id"),
                @Index(name = "idx_finding_conformity", columnList = "conformity")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Inspection terrain a laquelle ce finding appartient. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private GeneralInspection inspection;

    /** Point de controle reference. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkpoint_id", nullable = false)
    private InspectionCheckpoint checkpoint;

    /**
     * Reponse brute serialisee selon le type de checkpoint :
     * <ul>
     *   <li>BOOLEAN        → "true" / "false"</li>
     *   <li>VISUAL_GRADE   → "GOOD" / "WATCH" / "POOR"</li>
     *   <li>NUMERIC_RANGE  → valeur numerique formatee (ex : "4.2")</li>
     *   <li>PHOTO_REQUIRED → IDs media CSV (ex : "12,13,14")</li>
     *   <li>FREE_TEXT      → texte libre (limite 2000 caracteres)</li>
     * </ul>
     */
    @Column(name = "raw_value", length = 2000)
    private String rawValue;

    /**
     * Niveau de conformite calcule (peut etre surcharge manuellement).
     * Sert au calcul des KPI et au formatage du rapport.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FindingConformity conformity = FindingConformity.NOT_APPLICABLE;

    /**
     * Note libre de l'inspecteur en complement de la reponse (ex : "Pression
     * basse mais tendance stable depuis 2 semaines, surveillance bimensuelle
     * recommandee"). Limite 1000 caracteres.
     */
    @Column(length = 1000)
    private String note;

    /**
     * IDs media (photos prises sur le terrain) associes a ce finding,
     * separes par virgules. Permet de prouver visuellement une
     * non-conformite.
     */
    @Column(name = "photo_ids", length = 500)
    private String photoIds;

    /** Auteur du constat (inspecteur). */
    private Long recordedBy;

    /** Horodatage du constat (moment de la saisie sur le terrain). */
    @Column(nullable = false)
    private LocalDateTime recordedAt;

    /**
     * Si surcharge manuelle de la conformite (par rapport au calcul auto),
     * raison documentee. Limite 500 caracteres.
     */
    @Column(length = 500)
    private String overrideReason;

    /**
     * Mine propriétaire (cloisonnement). Recopié depuis l'inspection parente à
     * la création. Nullable pour les données legacy (backfill=1).
     */
    private Long companyId;
}
