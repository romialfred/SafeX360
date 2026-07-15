package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;
import com.minexpert.hns.exception.HSException;

import java.util.List;

/**
 * Service documentaire cloisonne par mine (companyId). Le param companyId
 * (valide par le CompanyScopeFilter) filtre les lectures et verifie
 * l'appartenance avant mutation. companyId null = pas de cloisonnement
 * (appel systeme / allMines).
 */
public interface DocumentService {
    DocumentDTO create(DocumentDTO dto) throws HSException;

    DocumentDTO update(DocumentDTO dto, Long companyId) throws HSException;

    DocumentDTO getById(Long id, Long companyId) throws HSException;

    List<DocumentDTO> getAll(Long companyId) throws HSException;

    List<DocumentDTO> getActive(Long companyId) throws HSException;

    DocumentDTO changeStatus(Long id, DocumentStatus status, String reason, Long companyId)
            throws HSException;

    // Retrieve last 5 uploaded documents
    List<DocumentDTO> getLatest(Long companyId) throws HSException;

    List<DocumentDTO> getApproved(Long companyId) throws HSException;
}
