package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.entity.ppe.PpeRequest;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeEmpDTO {
    private Long id;
    private Long empId;
    private Long ppeId;
    private Long ppeRequestId;
    private PpeEmpStatus status;

    private LocalDate date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public PpeEmp toEntity() {
        PpeEmp e = new PpeEmp(
                id,
                empId,
                ppeId != null ? new Ppe(ppeId) : null,
                ppeRequestId != null ? new PpeRequest(ppeRequestId) : null,
                status,
                date,
                createdAt,
                updatedAt,
                companyId);
        return e;
    }

}
