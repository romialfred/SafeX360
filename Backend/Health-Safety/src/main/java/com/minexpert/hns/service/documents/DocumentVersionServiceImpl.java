package com.minexpert.hns.service.documents;

import com.minexpert.hns.dto.documents.DocumentVersionDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.documents.DocumentVersion;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.documents.DocumentVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentVersionServiceImpl implements DocumentVersionService {
    private final DocumentVersionRepository versionRepository;

    @Override
    @Transactional
    public DocumentVersionDTO create(DocumentVersionDTO dto) throws HSException {

        DocumentVersion version = dto.toEntity();
        DocumentVersion saved = versionRepository.save(version);
        return saved.toDTO();
    }

    @Override

    @Transactional
    public DocumentVersionDTO create(Long documentId, String description, MediaDTO media) throws HSException {

        DocumentVersion version = new DocumentVersion();
        version.setDocument(new Document(documentId));
        version.setDescription(description);
        version.setMedia(media != null ? media.toEntity() : null);
        version.setVersion("1.0"); // Default version
        DocumentVersion saved = versionRepository.save(version);
        return saved.toDTO();
    }

    @Override
    public DocumentVersionDTO update(DocumentVersionDTO dto) throws HSException {
        DocumentVersion existing = versionRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));

        DocumentVersion updated = dto.toEntity();
        updated.setId(existing.getId());
        DocumentVersion saved = versionRepository.save(updated);
        return saved.toDTO();
    }

    @Override
    public DocumentVersionDTO getById(Long id) throws HSException {
        DocumentVersion version = versionRepository.findById(id)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        return version.toDTO();
    }

    @Override
    public List<DocumentVersionDetails> getByDocumentId(Long documentId) throws HSException {
        return versionRepository.findByDocumentId(documentId);
    }

    @Override
    public MediaDTO getMediaByVersionId(Long id) throws HSException {
        DocumentVersion version = versionRepository.findById(id)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        Media media = version.getMedia();
        return media != null ? media.toDTO() : null;
    }

    @Override
    public MediaDTO getLatestMediaByDocumentId(Long documentId) throws HSException {
        DocumentVersion version = versionRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        Media media = version.getMedia();
        return media != null ? media.toDTO() : null;
    }
}
