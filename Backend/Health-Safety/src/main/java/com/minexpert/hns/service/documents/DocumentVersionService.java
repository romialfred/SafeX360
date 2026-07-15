package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentVersionDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.dto.MediaDTO;

import java.util.List;

public interface DocumentVersionService {
    DocumentVersionDTO create(DocumentVersionDTO dto, Long companyId) throws HSException;

    public DocumentVersionDTO create(Long documentId, String description, MediaDTO media) throws HSException;

    DocumentVersionDTO update(DocumentVersionDTO dto, Long companyId) throws HSException;

    DocumentVersionDTO getById(Long id) throws HSException;

    List<DocumentVersionDetails> getByDocumentId(Long documentId, Long companyId) throws HSException;

    MediaDTO getMediaByVersionId(Long id) throws HSException;

    MediaDTO getLatestMediaByDocumentId(Long documentId, Long companyId) throws HSException;
}
