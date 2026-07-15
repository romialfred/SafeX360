package com.minexpert.hns.service.equipment;

import java.util.List;

import com.minexpert.hns.dto.equipment.EquipmentDTO;
import com.minexpert.hns.exception.HSException;

public interface EquipmentService {

    Long createEquipment(Long companyId, EquipmentDTO equipmentDTO) throws HSException;

    void updateEquipment(Long companyId, EquipmentDTO equipmentDTO) throws HSException;

    List<EquipmentDTO> getAllEquipment(Long companyId) throws HSException;

    EquipmentDTO getEquipmentById(Long companyId, Long id) throws HSException;

    /** Désactivation logique (status → INACTIVE), avec garde d'appartenance. */
    void deleteEquipment(Long companyId, Long id) throws HSException;
}
