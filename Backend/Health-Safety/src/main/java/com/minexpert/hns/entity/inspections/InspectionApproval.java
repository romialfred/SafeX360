package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.GeneralInspection;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Approbation individuelle d'un membre de l'equipe sur une inspection
 * soumise (SUBMITTED).
 *
 * <p>Le workflow de validation collegial fonctionne ainsi :</p>
 * <ol>
 *   <li>L'inspecteur soumet l'inspection (statut SUBMITTED).</li>
 *   <li>Chaque membre de l'equipe d'inspection (champ {@code participants})
 *       recoit une notification.</li>
 *   <li>Chaque membre se prononce : APPROVE ou REJECT (champ {@code decision}).</li>
 *   <li>Quand 100% des membres ont APPROVE : l'inspection passe APPROVED puis
 *       est archivee automatiquement (ARCHIVED).</li>
 *   <li>Au moindre REJECT : l'inspection retourne IN_PROGRESS pour correction.</li>
 * </ol>
 *
 * <p>Le tableau {@code (inspection_id, approver_id)} est unique : un membre
 * ne peut se prononcer qu'une seule fois par cycle de validation. En cas de
 * REJECT puis re-soumission, les approbations anterieures sont effacees.</p>
 */
@Entity
@Table(
        name = "inspection_approval",
        indexes = {
                @Index(name = "idx_approval_inspection", columnList = "inspection_id"),
                @Index(name = "idx_approval_approver", columnList = "approver_id"),
                @Index(name = "uk_approval_inspection_approver",
                       columnList = "inspection_id,approver_id", unique = true)
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private GeneralInspection inspection;

    /** ID de l'employe approbateur (membre de l'equipe d'inspection). */
    @Column(name = "approver_id", nullable = false)
    private Long approverId;

    /**
     * Decision exprimee. Stockee en string pour permettre un eventuel
     * 3e etat (ABSTAIN) sans migration enum.
     * Valeurs valides : APPROVE | REJECT.
     */
    @Column(nullable = false, length = 16)
    private String decision;

    /**
     * Commentaire optionnel justifiant la decision. Obligatoire (cote service)
     * en cas de REJECT.
     */
    @Column(length = 1000)
    private String comment;

    /** Horodatage de la decision. */
    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;

    /**
     * Mine propriétaire (cloisonnement). Recopié depuis l'inspection parente à
     * la création. Nullable pour les données legacy (backfill=1).
     */
    private Long companyId;
}
