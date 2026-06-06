package com.minexpert.hns.api.emergency.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.api.emergency.entity.EmergencyUserPermission;
import com.minexpert.hns.api.emergency.enums.EmergencyPermission;

/**
 * Accès BDD aux permissions Emergency (LOT 48 Phase 1).
 * Pas d'écriture sur permissions révoquées — on archive via {@code revokedAt}.
 */
public interface EmergencyUserPermissionRepository extends JpaRepository<EmergencyUserPermission, Long> {

    /** Toutes les permissions actives d'un utilisateur (toutes mines confondues). */
    @Query("SELECT p FROM EmergencyUserPermission p " +
           "WHERE p.userId = :userId AND p.revokedAt IS NULL")
    List<EmergencyUserPermission> findActiveByUser(@Param("userId") Long userId);

    /** Permissions actives d'un utilisateur pour une mine (companyId nullable = global). */
    @Query("SELECT p FROM EmergencyUserPermission p " +
           "WHERE p.userId = :userId AND p.revokedAt IS NULL " +
           "AND (p.companyId IS NULL OR p.companyId = :companyId)")
    List<EmergencyUserPermission> findActiveByUserAndCompany(@Param("userId") Long userId,
                                                              @Param("companyId") Long companyId);

    /** Liste tous les utilisateurs détenteurs d'une permission active sur une mine. */
    @Query("SELECT p FROM EmergencyUserPermission p " +
           "WHERE p.permission = :permission AND p.revokedAt IS NULL " +
           "AND (p.companyId IS NULL OR p.companyId = :companyId)")
    List<EmergencyUserPermission> findActiveHolders(@Param("permission") EmergencyPermission permission,
                                                     @Param("companyId") Long companyId);

    /** Match exact (user, permission, company) parmi les actives. */
    @Query("SELECT p FROM EmergencyUserPermission p " +
           "WHERE p.userId = :userId AND p.permission = :permission " +
           "AND ((p.companyId IS NULL AND :companyId IS NULL) OR p.companyId = :companyId) " +
           "AND p.revokedAt IS NULL")
    Optional<EmergencyUserPermission> findActiveMatch(@Param("userId") Long userId,
                                                      @Param("permission") EmergencyPermission permission,
                                                      @Param("companyId") Long companyId);
}
