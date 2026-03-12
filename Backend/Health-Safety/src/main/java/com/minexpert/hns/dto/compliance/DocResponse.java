package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.DocStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocResponse {
    private Long id;
    private String docName;
    private Long docId;
    private String requirement;
    private String uploadedBy;
    private Long employeeId;
    private LocalDateTime uploadDate;
    private LocalDate expiryDate;
    private DocStatus status;
    private String comment;

}
