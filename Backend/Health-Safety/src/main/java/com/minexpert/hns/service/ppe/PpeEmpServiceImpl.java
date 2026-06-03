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

import java.util.List;

@Service
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
        return empRepository.saveAll(dtos.stream()
                .map(PpeEmpDTO::toEntity)
                .toList())
                .stream()
                .map(PpeEmp::getId)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeEmpById", key = "#dto.id", condition = "#dto.id != null"),
            @CacheEvict(cacheNames = "ppeEmpByEmp", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByPpe", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpByStatus", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignedCount", allEntries = true),
            @CacheEvict(cacheNames = "ppeEmpAssignmentCounts", allEntries = true)
    })
    public PpeEmpDTO update(PpeEmpDTO dto) throws HSException {
        PpeEmp existing = empRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("EMPLOYEE_PPE_NOT_FOUND"));
        PpeEmp updated = dto.toEntity();
        updated.setId(existing.getId());
        PpeEmp saved = empRepository.save(updated);
        return saved.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpById", key = "#id")
    public PpeEmpDTO getById(Long id) throws HSException {
        PpeEmp e = empRepository.findById(id)
                .orElseThrow(() -> new HSException("EMPLOYEE_PPE_NOT_FOUND"));
        return e.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByEmp", key = "#empId")
    public List<PpeEmpDTO> getByEmpId(Long empId) throws HSException {
        return empRepository.findByEmpId(empId)
                .stream().map(PpeEmp::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByPpe", key = "#ppeId")
    public List<PpeEmpDTO> getByPpeId(Long ppeId) throws HSException {
        return empRepository.findByPpeId(ppeId)
                .stream().map(PpeEmp::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpByStatus", key = "#status")
    public List<PpeEmpDTO> getByStatus(String status) throws HSException {
        PpeEmpStatus st = PpeEmpStatus.valueOf(status);
        return empRepository.findByStatus(st)
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
    @Cacheable(cacheNames = "ppeEmpAssignedCount", key = "#empId")
    public long getAssignedCount(Long empId) throws HSException {
        return empRepository.countByEmpIdAndStatus(empId, PpeEmpStatus.ACTIVE);
    }

    @Override
    @Cacheable(cacheNames = "ppeEmpAssignmentCounts")
    public java.util.List<com.minexpert.hns.dto.ppe.EmpPpeCountDTO> getAllEmployeeAssignmentCounts()
            throws HSException {
        return empRepository.countActiveAssignmentsByEmp(PpeEmpStatus.ACTIVE);
    }
}
