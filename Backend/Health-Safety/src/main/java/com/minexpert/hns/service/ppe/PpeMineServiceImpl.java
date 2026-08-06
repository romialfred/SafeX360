package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.EmpConsumptionDTO;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PpeMineServiceImpl implements PpeMineService {

    private final PpeEmpRepository empRepository;

    @Override
    public List<EmpConsumptionDTO> getConsumptionByEmployee(Long companyId) {
        return empRepository.consumptionByEmp(companyId).stream()
                .map(r -> EmpConsumptionDTO.builder()
                        .empId(r[0] != null ? ((Number) r[0]).longValue() : null)
                        .quantity(r[1] != null ? ((Number) r[1]).longValue() : 0)
                        .cost(r[2] != null ? Math.round(((Number) r[2]).doubleValue() * 100d) / 100d : 0)
                        .build())
                .toList();
    }
}
