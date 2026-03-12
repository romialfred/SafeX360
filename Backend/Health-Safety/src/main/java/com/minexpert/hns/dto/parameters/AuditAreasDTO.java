package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditAreasDTO {
    private Long id;
    private String name;
    private String type;
    private Long owner;
    private String ownerName;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AuditAreas toEntity() {
        return new AuditAreas(this.id, this.name, this.type, this.owner, this.status, this.createdAt,
                this.updatedAt);
    }
}
