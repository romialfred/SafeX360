package com.minexpert.hns.entity.ppe;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.utility.StringListConverter;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String empIds;

    private String ppeIds;
    private LocalDate desiredDate;
    private String priority;
    private String reason;
    private String comment;

    @Enumerated(EnumType.STRING)
    private PpeRequestStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PpeRequest(Long id) {
        this.id = id;
    }

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public PpeRequestDTO toDTO() {
        return new PpeRequestDTO(id, StringListConverter.convertToLongList(empIds),
                StringListConverter.convertToLongList(ppeIds), desiredDate, priority, reason, comment,
                status, createdAt, updatedAt);
    }
}
