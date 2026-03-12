package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentVersionDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.exception.HSException;
import java.util.List;

public interface DocumentVersionService {
    DocumentVersionDTO create(DocumentVersionDTO dto) throws HSException;

    public DocumentVersionDTO create(Long documentId, String description, MediaDTO media) throws HSException;

    DocumentVersionDTO update(DocumentVersionDTO dto) throws HSException;

    DocumentVersionDTO getById(Long id) throws HSException;

    List<DocumentVersionDetails> getByDocumentId(Long documentId) throws HSException;

    MediaDTO getMediaByVersionId(Long id) throws HSException;

    MediaDTO getLatestMediaByDocumentId(Long documentId) throws HSException;
}
