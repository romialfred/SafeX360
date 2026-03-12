package com.minexpert.hns.repository.documents;

import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.entity.documents.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {
    // List<DocumentVersion> findByDocumentId(Long documentId);

    @Query("SELECT dv.id as id, dv.description as description, dv.media.name as mediaName, dv.media.type as mediaType, dv.media.id as mediaId, dv.version as version, dv.createdAt as createdAt, dv.updatedAt as updatedAt FROM DocumentVersion dv WHERE dv.document.id = :documentId")
    List<DocumentVersionDetails> findByDocumentId(@Param("documentId") Long documentId);

    Optional<DocumentVersion> findFirstByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
