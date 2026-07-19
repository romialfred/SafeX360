package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PpeEmpServiceImpl implements PpeEmpService {
    private final PpeEmpRepository empRepository;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "ppeEmpById", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public PpeEmpDTO create(PpeEmpDTO dto) throws HSException {
        // Une attribution EPI SANS mine (companyId absent) devient une entite
        // orpheline, invisible des qu'une mine est selectionnee. On refuse la
        // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
        // injecte dans le DTO par le controller (ou propage par PpeRequest).
        if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        PpeEmp e = dto.toEntity();
        PpeEmp saved = empRepository.save(e);
        return saved.toDTO();
    }

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "ppeEmpById", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public List<Long> createMultiple(List<PpeEmpDTO> dtos) throws HSException {
        // Meme regle qu'en creation unitaire : aucune attribution EPI ne doit etre
        // persistee sans mine (companyId absent = entite orpheline invisible).
        // Defense en profondeur meme si l'appelant (PpeRequest) propage deja la mine.
        if (dtos != null) {
            for (PpeEmpDTO dto : dtos) {
                if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
                    throw new HSException("COMPANY_ID_REQUIRED");
                }
            }
        }
        return empRepository.saveAll(dtos.stream()
                .map(PpeEmpDTO::toEntity)
                .toList())
                .stream()
                .map(PpeEmp::getId)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeEmpById", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public PpeEmpDTO update(PpeEmpDTO dto, Long companyId) throws HSException {
        PpeEmp existing = empRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("EMPLOYEE_PPE_NOT_FOUND"));
        // Vérification d'appartenance à la mine (companyId null = appel système).
        if (companyId != null && !companyId.equals(existing.getCompanyId())) {
            throw new HSException("EMPLOYEE_PPE_NOT_FOUND");
        }
        PpeEmp updated = dto.toEntity();
        updated.setId(existing.getId());
        // Conserver le companyId d'origine si non fourni dans le DTO.
        if (updated.getCompanyId() == null) {
            updated.setCompanyId(existing.getCompanyId());
        }
        PpeEmp saved = empRepository.save(updated);
        return saved.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpById", key = "#id + '-' + #companyId")
    public PpeEmpDTO getById(Long id, Long companyId) throws HSException {
        PpeEmp e = empRepository.findById(id)
                .orElseThrow(() -> new HSException("EMPLOYEE_PPE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(e.getCompanyId())) {
            throw new HSException("EMPLOYEE_PPE_NOT_FOUND");
        }
        return e.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByEmp", key = "#empId + '-' + #companyId")
    public List<PpeEmpDTO> getByEmpId(Long empId, Long companyId) throws HSException {
        return empRepository.findByEmpIdAndCompany(empId, companyId)
                .stream().map(PpeEmp::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByPpe", key = "#ppeId + '-' + #companyId")
    public List<PpeEmpDTO> getByPpeId(Long ppeId, Long companyId) throws HSException {
        return empRepository.findByPpeIdAndCompany(ppeId, companyId)
                .stream().map(PpeEmp::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByStatus", key = "#status + '-' + #companyId")
    public List<PpeEmpDTO> getByStatus(String status, Long companyId) throws HSException {
        PpeEmpStatus st = PpeEmpStatus.valueOf(status);
        return empRepository.findByStatusAndCompany(st, companyId)
                .stream().map(PpeEmp::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeEmpById", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public void activate(Long requestId) throws HSException {
        List<PpeEmp> emps = empRepository.findByPpeRequestId(requestId);
        for (PpeEmp emp : emps) {
            emp.setStatus(PpeEmpStatus.ACTIVE);
        }
        empRepository.saveAll(emps);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeEmpById", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public void deactivate(Long requestId) throws HSException {
        List<PpeEmp> emps = empRepository.findByPpeRequestId(requestId);
        for (PpeEmp emp : emps) {
            emp.setStatus(PpeEmpStatus.INACTIVE);
        }
        empRepository.saveAll(emps);
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpAssignedCount", key = "#empId + '-' + #companyId")
    public long getAssignedCount(Long empId, Long companyId) throws HSException {
        return empRepository.countByEmpIdAndStatusAndCompany(empId, PpeEmpStatus.ACTIVE, companyId);
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpAssignmentCounts", key = "#companyId != null ? #companyId : 'ALL'")
    public java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> getAllEmployeeAssignmentCounts(Long companyId)
            throws HSException {
        return empRepository.countActiveAssignmentsByEmpAndCompany(PpeEmpStatus.ACTIVE, companyId);
    }
}
