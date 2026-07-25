package com.minexpert.hns.entity.featureflags;

import com.minexpert.hns.enums.Status;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Activation d'un module POUR UNE MINE (cloisonnement par tenant).
 *
 * <p>Distinct du flag GLOBAL {@link ModuleManagement} (un interrupteur par module
 * pour toute l'instance) : ici chaque ligne dit « le module M est ACTIF/INACTIF
 * sur la mine C ». Une mine peut donc avoir un jeu de modules different d'une
 * autre.
 *
 * <p><b>Defaut = ACTIF</b> : l'absence de ligne pour (mine, module) vaut ACTIF.
 * On ne stocke donc que les DESACTIVATIONS explicites (et les reactivations).
 * Cela preserve le comportement anterieur (tout etait disponible) et evite de
 * devoir semer une ligne par mine et par module.
 *
 * <p>La cle module est toujours une cle du {@code ModuleCatalog} (source unique) ;
 * le service refuse toute cle inconnue.
 */
@Entity
@Table(
        name = "company_module_activation",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_company_module",
                columnNames = {"company_id", "module"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyModuleActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mine concernee (company.id cote HRMS ; simple Long ici, pas de FK locale). */
    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Cle du module (ModuleCatalog), camelCase — identique cote IHM. */
    @Column(name = "module", nullable = false, length = 128)
    private String module;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
