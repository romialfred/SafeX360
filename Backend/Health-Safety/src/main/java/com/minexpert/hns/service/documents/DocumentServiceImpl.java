package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.documents.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {
    private final DocumentRepository documentRepository;
    private final DocumentVersionService documentVersionService;

    @Override
    @Transactional
    public DocumentDTO create(DocumentDTO dto) throws HSException {
        if (dto.getId() != null && documentRepository.existsById(dto.getId())) {
            throw new HSException("DOCUMENT_ALREADY_EXISTS");
        }
        Document entity = dto.toEntity();
        Document saved = documentRepository.save(entity);
        documentVersionService.create(saved.getId(), dto.getDescription(), dto.getMedia());
        return saved.toDTO();
    }

    @Override
    public DocumentDTO update(DocumentDTO dto) throws HSException {
        Document existing = documentRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        Document updated = dto.toEntity();
        updated.setId(existing.getId());
        Document saved = documentRepository.save(updated);
        return saved.toDTO();
    }

    @Override
    public DocumentDTO getById(Long id) throws HSException {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        return doc.toDTO();
    }

    @Override
    public List<DocumentDTO> getAll() throws HSException {
        return documentRepository.findAll()
                .stream().map(Document::toDTO)
                .toList();
    }

    @Override
    public List<DocumentDTO> getActive() throws HSException {
        return getApproved();
    }

    @Override
    public DocumentDTO changeStatus(Long id, DocumentStatus status)
            throws HSException {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
        doc.setStatus(status);
        Document saved = documentRepository.save(doc);
        return saved.toDTO();
    }

    @Override
    public List<DocumentDTO> getLatest() throws HSException {
        return documentRepository.findTop5ByOrderByCreatedAtDesc()
                .stream().map(Document::toDTO)
                .toList();
    }

    @Override
    public List<DocumentDTO> getApproved() throws HSException {
        return documentRepository.findByStatus(DocumentStatus.APPROVED)
                .stream()
                .map(Document::toDTO)
                .toList();
    }
}
