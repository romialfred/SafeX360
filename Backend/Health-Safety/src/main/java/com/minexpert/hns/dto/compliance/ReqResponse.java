package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReqResponse {
    private Long requirementId;
    private String requirementName;
    private String category;
    private String status;
    private LocalDateTime updatedAt;
    private LocalDate expiryDate;
    private Long docId;
}
