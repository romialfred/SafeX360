package com.minexpert.hns.repository.documents;

import com.minexpert.hns.entity.documents.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByStatus(com.minexpert.hns.entity.documents.Document.DocumentStatus status);

    // Retrieve the last 5 uploaded documents ordered by creation time
    List<Document> findTop5ByOrderByCreatedAtDesc();

    // ── Cloisonnement par mine (companyId). null = pas de filtre. ───────────

    @Query("SELECT d FROM Document d WHERE (:companyId IS NULL OR d.companyId = :companyId)")
    List<Document> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT d FROM Document d WHERE d.status = :status "
            + "AND (:companyId IS NULL OR d.companyId = :companyId)")
    List<Document> findByStatusAndCompany(
            @Param("status") com.minexpert.hns.entity.documents.Document.DocumentStatus status,
            @Param("companyId") Long companyId);

    @Query("SELECT d FROM Document d WHERE (:companyId IS NULL OR d.companyId = :companyId) "
            + "ORDER BY d.createdAt DESC")
    List<Document> findLatestByCompany(@Param("companyId") Long companyId,
            org.springframework.data.domain.Pageable pageable);
}
