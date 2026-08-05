package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRequestRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PpeRequestServiceImpl implements PpeRequestService {
        private final PpeRequestRepository requestRepository;
        private final PpeEmpService ppeEmpService;
        private final PpeEmpRepository ppeEmpRepository;
        private final PpeService ppeService;

        /** Attache à la demande ses lignes (bénéficiaire × EPI × quantités). */
        private PpeRequestDTO withLines(PpeRequestDTO dto) {
                if (dto == null || dto.getId() == null) {
                        return dto;
                }
                dto.setLines(ppeEmpRepository.findByPpeRequestId(dto.getId())
                                .stream().map(PpeEmp::toDTO).toList());
                return dto;
        }

        /**
         * Normalise l'entrée de création en lignes exploitables. Priorité au format
         * `lines` (avec quantités) ; à défaut, reconstruit un produit cartésien
         * empIds×ppeIds à 1 unité (compatibilité legacy / mobile).
         */
        private List<PpeEmpDTO> normalizeLines(PpeRequestDTO dto) throws HSException {
                if (dto.getLines() != null && !dto.getLines().isEmpty()) {
                        List<PpeEmpDTO> out = new java.util.ArrayList<>();
                        for (PpeEmpDTO line : dto.getLines()) {
                                if (line.getEmpId() == null || line.getPpeId() == null) {
                                        throw new HSException("PPE_REQUEST_LINE_INVALID");
                                }
                                int qty = line.getQuantityRequested() != null ? line.getQuantityRequested() : 1;
                                if (qty <= 0) {
                                        throw new HSException("PPE_REQUEST_LINE_INVALID");
                                }
                                PpeEmpDTO l = new PpeEmpDTO();
                                l.setEmpId(line.getEmpId());
                                l.setPpeId(line.getPpeId());
                                l.setQuantityRequested(qty);
                                out.add(l);
                        }
                        return out;
                }
                // Legacy : produit cartésien, 1 unité par (employé, EPI).
                if (dto.getEmpIds() == null || dto.getEmpIds().isEmpty()
                                || dto.getPpeIds() == null || dto.getPpeIds().isEmpty()) {
                        return List.of();
                }
                List<PpeEmpDTO> out = new java.util.ArrayList<>();
                for (Long empId : dto.getEmpIds()) {
                        for (Long ppeId : dto.getPpeIds()) {
                                PpeEmpDTO l = new PpeEmpDTO();
                                l.setEmpId(empId);
                                l.setPpeId(ppeId);
                                l.setQuantityRequested(1);
                                out.add(l);
                        }
                }
                return out;
        }

        @Override
        @Transactional
        @Caching(evict = {
                        // @CacheEvict(cacheNames = "ppeRequestById", allEntries = true),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO create(PpeRequestDTO dto) throws HSException {
                // Une demande EPI SANS mine (companyId absent) devient une entite
                // orpheline, invisible des qu'une mine est selectionnee — et propage
                // ce companyId nul a toutes ses attributions filles. On refuse la
                // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
                // injecte dans le DTO par le controller depuis la mine active du header.
                if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
                        throw new HSException("COMPANY_ID_REQUIRED");
                }

                final Long companyId = dto.getCompanyId();
                // Incrément 2 — deux formats acceptés :
                //   • NOUVEAU : `lines` = liste de (bénéficiaire, EPI, quantité). Chaque
                //     ligne a sa propre quantité → « employé A : 2 gants, employé B : 1 casque ».
                //   • LEGACY  : empIds + ppeIds (listes plates) → produit cartésien, 1 unité
                //     par (employé, EPI). Conservé pour l'ascendant / la version mobile.
                List<PpeEmpDTO> lines = normalizeLines(dto);
                if (lines.isEmpty()) {
                        throw new HSException("PPE_REQUEST_EMPTY");
                }
                // On (re)synchronise les listes plates depuis les lignes : les anciens
                // lecteurs (liste, mobile) restent fonctionnels sans connaître les lignes.
                dto.setEmpIds(lines.stream().map(PpeEmpDTO::getEmpId).distinct().toList());
                dto.setPpeIds(lines.stream().map(PpeEmpDTO::getPpeId).distinct().toList());
                dto.setStatus(PpeRequestStatus.PENDING);
                PpeRequest saved = requestRepository.save(dto.toEntity());

                for (PpeEmpDTO line : lines) {
                        line.setPpeRequestId(saved.getId());
                        line.setDate(dto.getDesiredDate());
                        line.setStatus(PpeEmpStatus.PENDING);
                        line.setCompanyId(companyId);
                        line.setQuantityApproved(0);
                        line.setQuantityIssued(0);
                }
                ppeEmpService.createMultiple(lines);
                return withLines(saved.toDTO());
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

                // Incrément 2 — sortie de stock pilotée par les LIGNES et leurs quantités.
                // Chaque ligne (bénéficiaire × EPI) est approuvée pour sa quantité demandée,
                // puis le stock sort par EPI de la SOMME des quantités approuvées — un seul
                // mouvement ISSUE par EPI, tracé (« REQ-<id> ») et cloisonné sur la mine.
                List<PpeEmp> lines = ppeEmpRepository.findByPpeRequestId(id);
                if (lines.isEmpty()) {
                        throw new HSException("PPE_REQUEST_EMPTY");
                }
                Map<Long, Integer> issueByPpe = new LinkedHashMap<>();
                for (PpeEmp line : lines) {
                        int requested = line.getQuantityRequested() != null ? line.getQuantityRequested() : 1;
                        line.setQuantityApproved(requested);       // approbation intégrale (l'ajustement fin par ligne viendra plus tard)
                        line.setQuantityIssued(requested);          // dans le modèle actuel, approuver = sortir (distribution séparée à l'incrément 4)
                        line.setStatus(PpeEmpStatus.ACTIVE);
                        Long ppeId = line.getPpe() != null ? line.getPpe().getId() : null;
                        if (ppeId != null) {
                                issueByPpe.merge(ppeId, requested, Integer::sum);
                        }
                }
                for (Map.Entry<Long, Integer> e : issueByPpe.entrySet()) {
                        ppeService.applyStockMovement(e.getKey(), -e.getValue(), PpeMovementType.ISSUE,
                                        "REQ-" + id, req.getCompanyId(), null);
                }
                ppeEmpRepository.saveAll(lines);
                PpeRequest approved = requestRepository.save(req);

                return withLines(approved.toDTO());
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
                return withLines(req.toDTO());
        }

        @Override
        @Cacheable(cacheNames = "ppeRequestsAll", key = "#companyId != null ? #companyId : 'ALL'")
        public List<PpeRequestDTO> getAllRequests(Long companyId) throws HSException {
                // Les lignes (avec quantités) sont attachées à chaque demande pour que
                // la liste puisse afficher le détail par bénéficiaire et par EPI.
                return requestRepository.findAllByCompany(companyId)
                                .stream()
                                .map(PpeRequest::toDTO)
                                .map(this::withLines)
                                .toList();
        }

}
