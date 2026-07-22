package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.audit.ChangeLog;

public interface ChangeLogRepository extends JpaRepository<ChangeLog, Long> {

    /**
     * Journal d'une entité, du plus récent au plus ancien. companyId nul (vue
     * consolidée « Toutes les Mines ») renvoie toutes les mines — le cloisonnement
     * amont (gateway / CompanyScopeFilter) garantit qu'un mono-mine est clampé.
     */
    @Query("SELECT c FROM ChangeLog c WHERE c.entityType = :entityType AND c.entityId = :entityId "
            + "AND (:companyId IS NULL OR c.companyId = :companyId) ORDER BY c.changedAt DESC, c.id DESC")
    List<ChangeLog> findForEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId,
            @Param("companyId") Long companyId);
}
