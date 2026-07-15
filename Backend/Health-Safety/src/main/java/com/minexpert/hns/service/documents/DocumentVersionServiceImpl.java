package com.minexpert.hns.service.documents;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.entity.documents.DocumentVersion;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.documents.DocumentRepository;
import com.minexpert.hns.repository.documents.DocumentVersionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentVersionServiceImpl implements DocumentVersionService {

    public static final String CACHE_DOCUMENT_VERSION_BY_ID = "documentVersionById";
    public static final String CACHE_DOCUMENT_VERSIONS_BY_DOCUMENT = "documentVersionsByDocument";
    public static final String CACHE_DOCUMENT_VERSION_MEDIA_BY_ID = "documentVersionMediaById";
    public static final String CACHE_DOCUMENT_LATEST_MEDIA_BY_DOCUMENT = "documentLatestMediaByDocument";

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_DOCUMENT_VERSIONS_BY_DOCUMENT, key = "#result.documentId", condition = "#result != null && #result.documentId != null"),
            @CacheEvict(cacheNames = CACHE_DOCUMENT_LATEST_MEDIA_BY_DOCUMENT, key = "#result.documentId", condition = "#result != null && #result.documentId != null")
    })
    public DocumentVersionDTO create(DocumentVersionDTO dto, Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de créer une version sur un document
        // (id du body, spoofable) appartenant à une autre mine.
        verifyParentDocument(dto.getDocumentId(), companyId);
        DocumentVersion version = dto.toEntity();
        DocumentVersion saved = versionRepository.save(version);
        return saved.toDTO();
    }

    @Override

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_DOCUMENT_VERSIONS_BY_DOCUMENT, key = "#documentId"),
            @CacheEvict(cacheNames = CACHE_DOCUMENT_LATEST_MEDIA_BY_DOCUMENT, key = "#documentId")
    })
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
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_DOCUMENT_VERSION_BY_ID, key = "#dto.id", condition = "#dto.id != null"),
            @CacheEvict(cacheNames = CACHE_DOCUMENT_VERSION_MEDIA_BY_ID, key = "#dto.id", condition = "#dto.id != null"),
            @CacheEvict(cacheNames = CACHE_DOCUMENT_VERSIONS_BY_DOCUMENT, key = "#result.documentId", condition = "#result != null && #result.documentId != null"),
            @CacheEvict(cacheNames = CACHE_DOCUMENT_LATEST_MEDIA_BY_DOCUMENT, key = "#result.documentId", condition = "#result != null && #result.documentId != null")
    })
    public DocumentVersionDTO update(DocumentVersionDTO dto, Long companyId) throws HSException {
        DocumentVersion existing = versionRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        // Cloisonnement par mine : la version existante doit relever d'un document
        // de la mine appelante ; et la cible de reparentage (dto) également.
        Long existingDocId = existing.getDocument() != null ? existing.getDocument().getId() : null;
        verifyParentDocument(existingDocId, companyId);
        verifyParentDocument(dto.getDocumentId(), companyId);

        DocumentVersion updated = dto.toEntity();
        updated.setId(existing.getId());
        DocumentVersion saved = versionRepository.save(updated);
        return saved.toDTO();
    }

    @Override
    @Cacheable(cacheNames = CACHE_DOCUMENT_VERSION_BY_ID, key = "#id")
    public DocumentVersionDTO getById(Long id) throws HSException {
        DocumentVersion version = versionRepository.findById(id)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        return version.toDTO();
    }

    @Override
    @Cacheable(cacheNames = CACHE_DOCUMENT_VERSIONS_BY_DOCUMENT, key = "#documentId + '-' + #companyId")
    public List<DocumentVersionDetails> getByDocumentId(Long documentId, Long companyId)
            throws HSException {
        verifyParentDocument(documentId, companyId);
        return versionRepository.findByDocumentId(documentId);
    }

    @Override
    @Cacheable(cacheNames = CACHE_DOCUMENT_VERSION_MEDIA_BY_ID, key = "#id")
    public MediaDTO getMediaByVersionId(Long id) throws HSException {
        DocumentVersion version = versionRepository.findById(id)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        Media media = version.getMedia();
        return media != null ? media.toDTO() : null;
    }

    @Override
    @Cacheable(cacheNames = CACHE_DOCUMENT_LATEST_MEDIA_BY_DOCUMENT, key = "#documentId + '-' + #companyId")
    public MediaDTO getLatestMediaByDocumentId(Long documentId, Long companyId) throws HSException {
        verifyParentDocument(documentId, companyId);
        DocumentVersion version = versionRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId)
                .orElseThrow(() -> new HSException("VERSION_NOT_FOUND"));
        Media media = version.getMedia();
        return media != null ? media.toDTO() : null;
    }

    /**
     * Garde d'appartenance : le document parent (docId) doit relever de la mine
     * appelante. companyId null = pas de controle. Empeche la lecture des
     * versions d'un document d'une autre mine via un docId enumere.
     */
    private void verifyParentDocument(Long documentId, Long companyId) throws HSException {
        if (companyId == null) {
            return;
        }
        Long docCompanyId = documentRepository.findCompanyIdById(documentId).orElse(null);
        if (docCompanyId != null && !companyId.equals(docCompanyId)) {
            throw new HSException("DOCUMENT_NOT_FOUND");
        }
    }
}
