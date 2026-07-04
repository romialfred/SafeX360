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

                dto.setStatus(PpeRequestStatus.PENDING);
                PpeRequest req = dto.toEntity();
                PpeRequest saved = requestRepository.save(req);
                List<PpeEmpDTO> ppeEmpDTOs = dto.getEmpIds().stream().flatMap(empId -> {
                        return dto.getPpeIds().stream().map(ppeId -> {
                                PpeEmpDTO ppeEmpDTO = new PpeEmpDTO();
                                ppeEmpDTO.setEmpId(empId);
                                ppeEmpDTO.setPpeId(ppeId);
                                ppeEmpDTO.setPpeRequestId(saved.getId());
                                ppeEmpDTO.setDate(dto.getDesiredDate());
                                ppeEmpDTO.setStatus(PpeEmpStatus.PENDING);
                                return ppeEmpDTO;
                        });
                }).toList();
                ppeEmpService.createMultiple(ppeEmpDTOs);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "ppeRequestById", key = "#dto.id", condition = "#dto.id != null"),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO update(PpeRequestDTO dto) throws HSException {
                PpeRequest existing = requestRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
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
                        @CacheEvict(cacheNames = "ppeRequestById", key = "#id"),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO approveRequest(Long id, String comment) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
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
                        @CacheEvict(cacheNames = "ppeRequestById", key = "#id"),
                        @CacheEvict(cacheNames = "ppeRequestsAll", allEntries = true)
        })
        public PpeRequestDTO rejectRequest(Long id, String comment) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                req.setStatus(PpeRequestStatus.REJECTED);
                req.setComment(comment);
                PpeRequest rejected = requestRepository.save(req);
                ppeEmpService.deactivate(id);
                return rejected.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "ppeRequestById", key = "#id")
        public PpeRequestDTO getById(Long id) throws HSException {
                PpeRequest req = requestRepository.findById(id)
                                .orElseThrow(() -> new HSException("REQUEST_NOT_FOUND"));
                return req.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "ppeRequestsAll")
        public List<PpeRequestDTO> getAllRequests() throws HSException {
                return requestRepository.findAll()
                                .stream()
                                .map(PpeRequest::toDTO)
                                .toList();
        }

}
