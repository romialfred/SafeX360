package com.minexpert.hns.dto.ppe;

import java.time.LocalDateTime;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeDTO {
    private Long id;
    private String name;
    private String category;
    private String description;
    private Integer minStock;
    private Integer stock;
    private String certificationStandard;
    private PpeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Ppe toEntity() {
        return new Ppe(id, name, category, description, minStock, stock, certificationStandard, status, createdAt,
                updatedAt);
    }

}
