package com.minexpert.hns.service.equipment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.equipment.EquipmentDTO;
import com.minexpert.hns.entity.equipment.Equipment;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.equipment.EquipmentRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service du registre des équipements. Applique le patron de cloisonnement
 * standard : companyId requis en écriture, positionné à la création, filtré en
 * lecture, garde d'appartenance sur get/update/delete. Clés @Cacheable
 * null-safe (companyId null → 'ALL').
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    private final EquipmentRepository equipmentRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private Equipment loadEquipment(Long companyId, Long id) throws HSException {
        return equipmentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("EQUIPMENT_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "equipmentAll", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long createEquipment(Long companyId, EquipmentDTO equipmentDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        if (equipmentDTO.getCode() != null && !equipmentDTO.getCode().isBlank()) {
            Optional<Equipment> existing = equipmentRepository
                    .findByCompanyIdAndCodeIgnoreCase(companyId, equipmentDTO.getCode());
            if (existing.isPresent()) {
                throw new HSException("EQUIPMENT_ALREADY_EXISTS");
            }
        }
        equipmentDTO.setId(null);
        equipmentDTO.setCompanyId(companyId);
        if (equipmentDTO.getStatus() == null || equipmentDTO.getStatus().isBlank()) {
            equipmentDTO.setStatus(STATUS_ACTIVE);
        }
        equipmentDTO.setCreatedAt(LocalDateTime.now());
        equipmentDTO.setUpdatedAt(LocalDateTime.now());
        return equipmentRepository.save(equipmentDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "equipmentById", key = "#companyId != null && #equipmentDTO.id != null ? (#companyId + '-' + #equipmentDTO.id) : 'ALL-' + #equipmentDTO.id", condition = "#equipmentDTO.id != null"),
            @CacheEvict(cacheNames = "equipmentAll", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateEquipment(Long companyId, EquipmentDTO equipmentDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Equipment existing = loadEquipment(companyId, equipmentDTO.getId());
        // Garde d'unicité du code si modifié.
        if (equipmentDTO.getCode() != null && !equipmentDTO.getCode().isBlank()
                && !equipmentDTO.getCode().equalsIgnoreCase(existing.getCode())) {
            Optional<Equipment> clash = equipmentRepository
                    .findByCompanyIdAndCodeIgnoreCase(companyId, equipmentDTO.getCode());
            if (clash.isPresent() && !clash.get().getId().equals(existing.getId())) {
                throw new HSException("EQUIPMENT_ALREADY_EXISTS");
            }
        }
        existing.setCode(equipmentDTO.getCode());
        existing.setName(equipmentDTO.getName());
        existing.setType(equipmentDTO.getType());
        existing.setBrand(equipmentDTO.getBrand());
        existing.setModel(equipmentDTO.getModel());
        existing.setSerialNumber(equipmentDTO.getSerialNumber());
        existing.setLocationId(equipmentDTO.getLocationId());
        if (equipmentDTO.getStatus() != null && !equipmentDTO.getStatus().isBlank()) {
            existing.setStatus(equipmentDTO.getStatus());
        }
        existing.setCompanyId(companyId);
        existing.setUpdatedAt(LocalDateTime.now());
        equipmentRepository.save(existing);
    }

    @Override
    @Cacheable(cacheNames = "equipmentAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<EquipmentDTO> getAllEquipment(Long companyId) throws HSException {
        return equipmentRepository.findAllByCompany(companyId)
                .stream()
                .map(Equipment::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "equipmentById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public EquipmentDTO getEquipmentById(Long companyId, Long id) throws HSException {
        return loadEquipment(companyId, id).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "equipmentById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "equipmentAll", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteEquipment(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        Equipment equipment = loadEquipment(companyId, id);
        // Désactivation logique : on préserve l'historique (inspections rattachées).
        equipment.setStatus(STATUS_INACTIVE);
        equipment.setUpdatedAt(LocalDateTime.now());
        equipmentRepository.save(equipment);
    }
}
