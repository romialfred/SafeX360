package com.minexpert.hns.entity.equipment;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.equipment.EquipmentDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registre des équipements (référentiel des cibles d'inspection type ÉQUIPEMENT).
 *
 * <p>Un équipement représente un engin, véhicule, machine ou installation
 * susceptible d'être inspecté. Sa liste alimente le sélecteur de cible du
 * formulaire d'inspection ({@code targetRefId} = {@link #id}).</p>
 *
 * <p><b>Cloisonnement multi-mine :</b> le champ {@code companyId} scope
 * l'équipement à une mine, selon le patron habituel de la plateforme. Il est
 * renseigné à la création depuis le companyId de la requête (validé/clampé par
 * le CompanyScopeFilter). Nullable pour d'éventuelles données legacy ; filtré en
 * lecture par le service.</p>
 *
 * <p>La table {@code equipment} est créée par Hibernate (ddl-auto=update).</p>
 */
@Entity
@Table(
        name = "equipment",
        indexes = {
                @Index(name = "idx_equipment_company", columnList = "companyId"),
                @Index(name = "idx_equipment_status", columnList = "status"),
                @Index(name = "idx_equipment_code", columnList = "code")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Code métier de l'équipement (ex. "CAM-A40G-18"). Unique par mine (garanti côté service). */
    @Column(length = 64)
    private String code;

    /** Désignation lisible (ex. "Camion benne Volvo A40G #18"). */
    @Column(length = 200)
    private String name;

    /** Famille libre : ENGIN, VEHICULE, MACHINE, INSTALLATION… */
    @Column(length = 64)
    private String type;

    private String brand;
    private String model;

    @Column(length = 120)
    private String serialNumber;

    /** Lieu de rattachement (Location.id), nullable. Référence souple, pas de FK stricte. */
    private Long locationId;

    /** Statut courant ("ACTIVE" par défaut, "INACTIVE" après désactivation). */
    @Column(length = 24)
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Mine propriétaire (cloisonnement). Renseigné à la création. Nullable pour legacy. */
    private Long companyId;

    public Equipment(Long id) {
        this.id = id;
    }

    public EquipmentDTO toDTO() {
        return new EquipmentDTO(id, code, name, type, brand, model, serialNumber, locationId,
                status, createdAt, updatedAt, companyId);
    }
}
