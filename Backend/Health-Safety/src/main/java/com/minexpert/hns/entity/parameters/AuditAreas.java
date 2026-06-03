package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditAreas {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String type;
    private Long owner;
    private Status status;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AuditAreas(Long id) {
        this.id = id;
    }

    public AuditAreasDTO toDTO() {
        return new AuditAreasDTO(this.id, this.name, this.type, this.owner, null, this.status, this.companyId,
                this.createdAt, this.updatedAt);
    }
}
