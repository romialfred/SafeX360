package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PpeServiceImpl implements PpeService {

    private final PpeRepository ppeRepository;

    @Override
    public PpeDTO create(PpeDTO dto) throws HSException {
        if (dto.getId() != null && ppeRepository.existsById(dto.getId())) {
            throw new HSException("PPE_ALREADY_EXISTS");
        }
        Ppe entity = dto.toEntity();
        entity.setStatus(PpeStatus.ACTIVE);
        entity.setStock(0);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        Ppe saved = ppeRepository.save(entity);
        return saved.toDTO();
    }

    @Override
    public PpeDTO update(PpeDTO dto) throws HSException {
        Ppe existing = ppeRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        existing.setName(dto.getName());
        existing.setCategory(dto.getCategory());
        existing.setDescription(dto.getDescription());
        existing.setMinStock(dto.getMinStock());
        existing.setCertificationStandard(dto.getCertificationStandard());
        existing.setStatus(dto.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        Ppe updated = ppeRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    public PpeDTO getById(Long id) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        return ppe.toDTO();
    }

    @Override
    public List<PpeDTO> getAllStocks() throws HSException {
        return ppeRepository.findAll()
                .stream()
                .map(Ppe::toDTO)
                .toList();
    }

    @Override
    public List<PpeDTO> getActiveStocks() throws HSException {
        return ppeRepository.findByStatus(PpeStatus.ACTIVE)
                .stream()
                .map(Ppe::toDTO)
                .toList();
    }

    @Override
    public void activateStock(Long id) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        ppe.setStatus(PpeStatus.ACTIVE);
        ppeRepository.save(ppe);
    }

    @Override
    public void deactivateStock(Long id) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        ppe.setStatus(PpeStatus.INACTIVE);
        ppeRepository.save(ppe);
    }

    @Override
    public Integer updateStockQuantity(Long id, Integer quantity, String operation) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        if (quantity <= 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        if (operation == "ADD") {
            ppe.setStock(ppe.getStock() + quantity);
        } else {
            ppe.setStock(ppe.getStock() - quantity);
        }
        ppe.setUpdatedAt(LocalDateTime.now());
        Ppe updated = ppeRepository.save(ppe);
        return updated.getStock();
    }

    @Override
    public List<PpeDTO> getLowStock() throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLowStock'");
    }

    @Override
    @Transactional
    public List<Integer> updateStockQuantities(List<Long> ids, Integer quantity, String operation) throws HSException {
        if (quantity <= 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        List<Ppe> ppes = ppeRepository.findByIdIn(ids);
        for (Ppe ppe : ppes) {
            if (operation.equals("ADD")) {
                ppe.setStock(ppe.getStock() + quantity);
            } else if (operation.equals("SUBTRACT")) {
                if (ppe.getStock() < quantity) {
                    throw new HSException("INSUFFICIENT_STOCK_FOR_PPE");
                }
                ppe.setStock(ppe.getStock() - quantity);
            } else {
                throw new HSException("INVALID_OPERATION");
            }
        }
        ppeRepository.saveAll(ppes);

        return ppes.stream().map(Ppe::getStock).toList();
    }

}
