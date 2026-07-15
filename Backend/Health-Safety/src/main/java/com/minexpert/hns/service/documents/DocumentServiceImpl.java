package com.minexpert.hns.service.documents;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
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
                        @CacheEvict(cacheNames = CACHE_DOCUMENT_BY_ID, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ALL, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ACTIVE, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_LATEST, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_APPROVED, allEntries = true)
        })
        public DocumentDTO update(DocumentDTO dto, Long companyId) throws HSException {
                Document existing = documentRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                verifyCompany(existing, companyId);
                Document updated = dto.toEntity();
                updated.setId(existing.getId());
                // Conserve la mine d'origine : la companyId n'est pas modifiable
                // via update (empeche un transfert de mine par le payload).
                updated.setCompanyId(existing.getCompanyId());
                Document saved = documentRepository.save(updated);
                return saved.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENT_BY_ID, key = "#id + '-' + #companyId")
        public DocumentDTO getById(Long id, Long companyId) throws HSException {
                Document doc = documentRepository.findById(id)
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                verifyCompany(doc, companyId);
                return doc.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
        public List<DocumentDTO> getAll(Long companyId) throws HSException {
                return documentRepository.findAllByCompany(companyId)
                                .stream().map(Document::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_ACTIVE, key = "#companyId != null ? #companyId : 'ALL'")
        public List<DocumentDTO> getActive(Long companyId) throws HSException {
                return documentRepository.findByStatusAndCompany(DocumentStatus.APPROVED, companyId)
                                .stream()
                                .map(Document::toDTO)
                                .toList();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = CACHE_DOCUMENT_BY_ID, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ALL, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_ACTIVE, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_LATEST, allEntries = true),
                        @CacheEvict(cacheNames = CACHE_DOCUMENTS_APPROVED, allEntries = true)
        })
        public DocumentDTO changeStatus(Long id, DocumentStatus status, String reason,
                        Long companyId) throws HSException {
                Document doc = documentRepository.findById(id)
                                .orElseThrow(() -> new HSException("DOCUMENT_NOT_FOUND"));
                verifyCompany(doc, companyId);
                doc.setStatus(status);
                // Traçabilité ISO : conserve le motif du changement de statut (peut être null).
                if (reason != null && !reason.isBlank()) {
                        doc.setStatusReason(reason);
                }
                Document saved = documentRepository.save(doc);
                return saved.toDTO();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_LATEST, key = "#companyId != null ? #companyId : 'ALL'")
        public List<DocumentDTO> getLatest(Long companyId) throws HSException {
                return documentRepository.findLatestByCompany(companyId, PageRequest.of(0, 5))
                                .stream().map(Document::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = CACHE_DOCUMENTS_APPROVED, key = "#companyId != null ? #companyId : 'ALL'")
        public List<DocumentDTO> getApproved(Long companyId) throws HSException {
                return documentRepository.findByStatusAndCompany(DocumentStatus.APPROVED, companyId)
                                .stream()
                                .map(Document::toDTO)
                                .toList();
        }

        /**
         * Verifie l'appartenance d'un document a la mine appelante. companyId
         * null = pas de controle. Non-appartenance : DOCUMENT_NOT_FOUND (on ne
         * divulgue pas l'existence d'un document d'une autre mine).
         */
        private void verifyCompany(Document doc, Long companyId) throws HSException {
                if (companyId == null || doc == null) {
                        return;
                }
                if (!companyId.equals(doc.getCompanyId())) {
                        throw new HSException("DOCUMENT_NOT_FOUND");
                }
        }
}
