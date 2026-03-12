package com.minexpert.hns.repository.documents;

import com.minexpert.hns.entity.documents.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByStatus(com.minexpert.hns.entity.documents.Document.DocumentStatus status);

    // Retrieve the last 5 uploaded documents ordered by creation time
    List<Document> findTop5ByOrderByCreatedAtDesc();
}
