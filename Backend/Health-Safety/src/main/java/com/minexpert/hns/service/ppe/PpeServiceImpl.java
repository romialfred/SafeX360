package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PpeServiceImpl implements PpeService {

    private final PpeRepository ppeRepository;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true)
    })
    public PpeDTO create(PpeDTO dto) throws HSException {
        // Un EPI SANS mine (companyId absent) devient une entite orpheline,
        // invisible des qu'une mine est selectionnee. On refuse la creation
        // silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est injecte
        // dans le DTO par le controller depuis la mine active du header.
        if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true)
    })
    public PpeDTO update(PpeDTO dto, Long companyId) throws HSException {
        Ppe existing = ppeRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        // Vérification d'appartenance à la mine (companyId null = appel système, pas de contrôle).
        if (companyId != null && !companyId.equals(existing.getCompanyId())) {
            throw new HSException("PPE_NOT_FOUND");
        }
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
    @Cacheable(cacheNames = "ppeById", key = "#id + '-' + #companyId")
    public PpeDTO getById(Long id, Long companyId) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        // Ne pas divulguer un EPI d'une autre mine (companyId null = appel système).
        if (companyId != null && !companyId.equals(ppe.getCompanyId())) {
            throw new HSException("PPE_NOT_FOUND");
        }
        return ppe.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppesAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<PpeDTO> getAllStocks(Long companyId) throws HSException {
        return ppeRepository.findAllByCompany(companyId)
                .stream()
                .map(Ppe::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<PpeDTO> getActiveStocks(Long companyId) throws HSException {
        return ppeRepository.findByStatusAndCompany(PpeStatus.ACTIVE, companyId)
                .stream()
                .map(Ppe::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true)
    })
    public void activateStock(Long id, Long companyId) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(ppe.getCompanyId())) {
            throw new HSException("PPE_NOT_FOUND");
        }
        ppe.setStatus(PpeStatus.ACTIVE);
        ppeRepository.save(ppe);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true)
    })
    public void deactivateStock(Long id, Long companyId) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(ppe.getCompanyId())) {
            throw new HSException("PPE_NOT_FOUND");
        }
        ppe.setStatus(PpeStatus.INACTIVE);
        ppeRepository.save(ppe);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true)
    })
    public Integer updateStockQuantity(Long id, Integer quantity, String operation) throws HSException {
        Ppe ppe = ppeRepository.findById(id)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        if (quantity <= 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        if ("ADD".equals(operation)) {
            ppe.setStock(ppe.getStock() + quantity);
        } else if ("SUBTRACT".equals(operation)) {
            if (ppe.getStock() < quantity) {
                throw new HSException("INSUFFICIENT_STOCK");
            }
            ppe.setStock(ppe.getStock() - quantity);
        } else {
            throw new HSException("INVALID_OPERATION");
        }
        ppe.setUpdatedAt(LocalDateTime.now());
        Ppe updated = ppeRepository.save(ppe);
        return updated.getStock();
    }

    @Override
    public List<PpeDTO> getLowStock(Long companyId) throws HSException {
        // EPI actifs dont le stock est passé sous le seuil minimal — les EPI
        // sans seuil défini sont exclus (pas d'alerte pertinente possible).
        // (Remplace l'ancien stub UnsupportedOperationException : l'endpoint
        // GET /ppe/getLowStock est exposé et renvoyait systématiquement 500.)
        // Filtré par mine (companyId null = toutes mines).
        return ppeRepository.findByStatusAndCompany(PpeStatus.ACTIVE, companyId)
                .stream()
                .filter(ppe -> ppe.getMinStock() != null
                        && ppe.getStock() != null
                        && ppe.getStock() <= ppe.getMinStock())
                .map(Ppe::toDTO)
                .toList();
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true)
    })
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
