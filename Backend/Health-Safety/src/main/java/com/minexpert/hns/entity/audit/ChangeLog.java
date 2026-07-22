package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Journal d'audit champ-par-champ (ISO 45001 §7.5.3) — QUI a changé QUOI, de
 * quelle valeur À quelle valeur, QUAND.
 *
 * Générique et réutilisable : rattaché à n'importe quelle entité par le couple
 * ({@code entityType}, {@code entityId}) plutôt qu'une FK dure — un seul socle
 * sert incidents, actions correctives, investigations… Cloisonné par mine
 * ({@code companyId}). Enregistrement explicite (appel service au point de
 * mutation), pas d'AOP/Envers : traçable, contrôlé, sans toucher chaque entité.
 */
@Entity
@Table(name = "change_log", indexes = {
        @Index(name = "idx_change_log_entity", columnList = "entity_type,entity_id"),
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangeLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "field", length = 64)
    private String field;

    @Lob
    @Column(name = "old_value")
    private String oldValue;

    @Lob
    @Column(name = "new_value")
    private String newValue;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @Column(name = "company_id")
    private Long companyId;
}
