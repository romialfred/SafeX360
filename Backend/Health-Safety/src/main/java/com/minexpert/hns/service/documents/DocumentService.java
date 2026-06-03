package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface DocumentService {
    DocumentDTO create(DocumentDTO dto) throws HSException;

    DocumentDTO update(DocumentDTO dto) throws HSException;

    DocumentDTO getById(Long id) throws HSException;

    List<DocumentDTO> getAll() throws HSException;

    List<DocumentDTO> getActive() throws HSException;

    DocumentDTO changeStatus(Long id, DocumentStatus status) throws HSException;

    // Retrieve last 5 uploaded documents
    List<DocumentDTO> getLatest() throws HSException;

    List<DocumentDTO> getApproved() throws HSException;
}
