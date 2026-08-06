package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.entity.ppe.PpeRequest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeEmpDTO {
    private Long id;
    private Long empId;
    private Long ppeId;
    private Long ppeRequestId;
    private PpeEmpStatus status;

    // Incrément 2 — quantités par ligne (demandé / approuvé / distribué).
    private Integer quantityRequested;
    private Integer quantityApproved;
    private Integer quantityIssued;
    // Incrément 4 — quantité retournée (remise en stock ou réformée).
    private Integer quantityReturned;

    private LocalDate date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public PpeEmp toEntity() {
        // Builder : fin du constructeur positionnel (piège d'arité Lombok).
        return PpeEmp.builder()
                .id(id).empId(empId)
                .ppe(ppeId != null ? new Ppe(ppeId) : null)
                .ppeRequest(ppeRequestId != null ? new PpeRequest(ppeRequestId) : null)
                .status(status)
                .quantityRequested(quantityRequested).quantityApproved(quantityApproved)
                .quantityIssued(quantityIssued).quantityReturned(quantityReturned)
                .date(date).createdAt(createdAt).updatedAt(updatedAt).companyId(companyId)
                .build();
    }

}
