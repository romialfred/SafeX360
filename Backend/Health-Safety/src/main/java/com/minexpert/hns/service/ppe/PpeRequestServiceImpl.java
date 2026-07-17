package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRequestRepository;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PpeRequestServiceImpl implements PpeRequestService {
        private final PpeRequestRepository requestRepository;
        private final PpeEmpService ppeEmpService;
        private final PpeService ppeService;

        @Override
        @Transactional
        @Caching(evict = {
                        // @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO create(PpeRequestDTO dto) throws HSException {

                if (dto.getEmpIds() == null || dto.getEmpIds().isEmpty()
                                || dto.getPpeIds() == null || dto.getPpeIds().isEmpty()) {
                        throw new HSException("PPE_REQUEST_EMPTY");
                }
                dto.setStatus(PpeRequestStatus.PENDING);
                PpeRequest req = dto.toEntity();
                PpeRequest saved = requestRepository.save(req);
                // Propager le companyId de la demande vers les attributions EPI filles.
                final Long companyId = dto.getCompanyId();
                List<PpeEmpDTO> ppeEmpDTOs = dto.getEmpIds().stream().flatMap(empId -> {
                        return dto.getPpeIds().stream().map(ppeId -> {
                                PpeEmpDTO ppeEmpDTO = new PpeEmpDTO();
                                ppeEmpDTO.setEmpId(empId);
                                ppeEmpDTO.setPpeId(ppeId);
                                ppeEmpDTO.setPpeRequestId(saved.getId());
                                ppeEmpDTO.setDate(dto.getDesiredDate());
                                ppeEmpDTO.setStatus(PpeEmpStatus.PENDING);
                                ppeEmpDTO.setCompanyId(companyId);
                                return ppeEmpDTO;
                        });
                }).toList();
                ppeEmpService.createMultiple(ppeEmpDTOs);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO update(PpeRequestDTO dto, Long companyId) throws HSException {
                PpeRequest existing = requestRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                // Vérification d'appartenance à la mine (companyId null = appel système).
                if (companyId != null && !companyId.equals(existing.getCompanyId())) {
                        throw new HSException("REQUEST_NOT_FOUND");
                }
                existing.setDesiredDate(dto.getDesiredDate());
                existing.setPriority(dto.getPriority());
                existing.setReason(dto.getReason());
                existing.setComment(dto.getComment());
                PpeRequest updated = requestRepository.save(existing);
                return updated.toDTO();
        }

        @Override

        @Transactional
        @Caching(evict = {
                        @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO approveRequest(Long id, String comment, Long companyId) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                if (companyId != null && !companyId.equals(req.getCompanyId())) {
                        throw new HSException("REQUEST_NOT_FOUND");
                }
                // Idempotence : seule une demande PENDING peut être approuvée. Sans
                // cette garde, un double-clic (ou un rejeu direct de l'endpoint)
                // re-décrémentait le stock à chaque appel.
                if (req.getStatus() != PpeRequestStatus.PENDING) {
                        throw new HSException("REQUEST_NOT_PENDING");
                }
                req.setStatus(PpeRequestStatus.APPROVED);
                req.setComment(comment);
                ppeService.updateStockQuantities(StringListConverter.convertToLongList(req.getPpeIds()),
                                StringListConverter.convertToLongList(req.getEmpIds()).size(), "SUBTRACT");
                PpeRequest approved = requestRepository.save(req);
                ppeEmpService.activate(id);

                return approved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO rejectRequest(Long id, String comment, Long companyId) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                if (companyId != null && !companyId.equals(req.getCompanyId())) {
                        throw new HSException("REQUEST_NOT_FOUND");
                }
                // Idempotence : on ne rejette qu'une demande encore PENDING (évite
                // de rejeter une demande déjà approuvée/livrée).
                if (req.getStatus() != PpeRequestStatus.PENDING) {
                        throw new HSException("REQUEST_NOT_PENDING");
                }
                req.setStatus(PpeRequestStatus.REJECTED);
                req.setComment(comment);
                PpeRequest rejected = requestRepository.save(req);
                ppeEmpService.deactivate(id);
                return rejected.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO deliverRequest(Long id, String comment, Long companyId) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                if (companyId != null && !companyId.equals(req.getCompanyId())) {
                        throw new HSException("REQUEST_NOT_FOUND");
                }
                // Garde de machine à états : seule une demande APPROVED peut être livrée.
                if (req.getStatus() != PpeRequestStatus.APPROVED) {
                        throw new HSException("REQUEST_NOT_APPROVED");
                }
                req.setStatus(PpeRequestStatus.DELIVERED);
                req.setDeliveredAt(java.time.LocalDateTime.now());
                if (comment != null && !comment.isBlank()) {
                        req.setComment(comment);
                }
                PpeRequest delivered = requestRepository.save(req);
                return delivered.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "ppeRequestById", key = "#id + '-' + #companyId")
        public PpeRequestDTO getById(Long id, Long companyId) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                if (companyId != null && !companyId.equals(req.getCompanyId())) {
                        throw new HSException("REQUEST_NOT_FOUND");
                }
                return req.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "ppeRequestsAll", key = "#companyId != null ? #companyId : 'ALL'")
        public List<PpeRequestDTO> getAllRequests(Long companyId) throws HSException {
                return requestRepository.findAllByCompany(companyId)
                                .stream()
                                .map(PpeRequest::toDTO)
                                .toList();
        }

}
