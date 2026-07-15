package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.bouncycastle.util.StringList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeRequestDTO {
    private Long id;
    private List<Long> empIds;
    private List<Long> ppeIds;
    private LocalDate desiredDate;
    private String priority;
    private String reason;
    private String comment;
    private PpeRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;
    private Long companyId;

    public PpeRequest toEntity() {
        return new PpeRequest(id, StringListConverter.listToString(empIds), StringListConverter.listToString(ppeIds),
                desiredDate, priority, reason, comment, status,
                createdAt,
                updatedAt, deliveredAt, companyId);
    }

}
