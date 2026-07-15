package com.minexpert.hns.dto.equipment;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.equipment.Equipment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO du registre des équipements. Le champ {@code companyId} est positionné en
 * DERNIER pour rester cohérent avec le constructeur positionnel de l'entité
 * ({@link Equipment#Equipment}) utilisé par {@link #toEntity()}.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EquipmentDTO {
    private Long id;
    private String code;
    private String name;
    private String type;
    private String brand;
    private String model;
    private String serialNumber;
    private Long locationId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public Equipment toEntity() {
        return new Equipment(id, code, name, type, brand, model, serialNumber, locationId,
                status, createdAt, updatedAt, companyId);
    }
}
