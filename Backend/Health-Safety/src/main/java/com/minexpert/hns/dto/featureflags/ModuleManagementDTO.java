package com.minexpert.hns.dto.featureflags;

import com.minexpert.hns.entity.featureflags.ModuleManagement;
import com.minexpert.hns.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ModuleManagementDTO {
    private Long id;
    private String module;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ModuleManagement toEntity() {
        return new ModuleManagement(
                this.id,
                this.module,
                this.status,
                this.createdAt,
                this.updatedAt
        );
    }

    public static ModuleManagementDTO fromEntity(ModuleManagement entity) {
        return new ModuleManagementDTO(
                entity.getId(),
                entity.getModule(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}

