package com.minexpert.hns.service.documents;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.entity.documents.Document;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.documents.DocumentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

        public static final String CACHE_DOCUMENT_BY_ID = "documentById";
        public static final String CACHE_DOCUMENTS_ALL = "documentsAll";
        public static final String CACHE_DOCUMENTS_ACTIVE = "documentsActive";
        public static final String CACHE_DOCUMENTS_LATEST = "documentsLatest";
        public static final String CACHE_DOCUMENTS_APPROVED = "documentsApproved";

        private final DocumentRepository documentRepository;
        private final DocumentVersionService documentVersionService;

        @Override
        @Transactional
        @Caching(evict = {
                        // @CacheEvict(cacheNames = CACHE_DOCUMENT_BY_ID, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ALL, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ACTIVE, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_LATEST, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_APPROVED, allEntries = true)
        })
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
        @Caching(evict = {
                        @CacheEvict(cacheNames = CACHE_DOCUMENT_BY_ID, key = "#dto.id"),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ALL, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ACTIVE, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_LATEST, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_APPROVED, allEntries = true)
        })
        public DocumentDTO update(DocumentDTO dto) throws HSException {
                Document existing = documentRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                Document updated = dto.toEntity();
                updated.setId(existing.getId());
                Document saved = documentRepository.save(updated);
                return saved.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENT_BY_ID, key = "#id")
        public DocumentDTO getById(Long id) throws HSException {
                Document doc = documentRepository.findById(id)
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                return doc.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_ALL)
        public List<DocumentDTO> getAll() throws HSException {
                return documentRepository.findAll()
                                .stream().map(Document::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_ACTIVE)
        public List<DocumentDTO> getActive() throws HSException {
                return documentRepository.findByStatus(DocumentStatus.APPROVED)
                                .stream()
                                .map(Document::toDTO)
                                .toList();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = CACHE_DOCUMENT_BY_ID, key = "#id"),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ALL, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ACTIVE, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_LATEST, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_APPROVED, allEntries = true)
        })
        public DocumentDTO changeStatus(Long id, DocumentStatus status, String reason)
                        throws HSException {
                Document doc = documentRepository.findById(id)
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                doc.setStatus(status);
                // Traçabilité ISO : conserve le motif du changement de statut (peut être null).
                if (reason != null && !reason.isBlank()) {
                        doc.setStatusReason(reason);
                }
                Document saved = documentRepository.save(doc);
                return saved.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_LATEST)
        public List<DocumentDTO> getLatest() throws HSException {
                return documentRepository.findTop5ByOrderByCreatedAtDesc()
                                .stream().map(Document::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_APPROVED)
        public List<DocumentDTO> getApproved() throws HSException {
                return documentRepository.findByStatus(DocumentStatus.APPROVED)
                                .stream()
                                .map(Document::toDTO)
                                .toList();
        }
}
