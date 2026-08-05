package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeStatus;
import com.minexpert.hns.entity.ppe.PpeStockMovement;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStockMovementRepository;

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
    private final PpeStockMovementRepository movementRepository;

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
        // Incrément 3 — caractéristiques techniques et commerciales (le stock reste
        // exclu : il est piloté par le journal de mouvements, jamais par l'édition).
        existing.setBrand(dto.getBrand());
        existing.setManufacturer(dto.getManufacturer());
        existing.setModel(dto.getModel());
        existing.setSize(dto.getSize());
        existing.setUnitOfMeasure(dto.getUnitOfMeasure());
        existing.setProtectionBodyPart(dto.getProtectionBodyPart());
        existing.setLifespanMonths(dto.getLifespanMonths());
        existing.setReusable(dto.getReusable());
        existing.setMandatory(dto.getMandatory());
        existing.setReferencePrice(dto.getReferencePrice());
        existing.setCurrency(dto.getCurrency());
        existing.setPreferredSupplier(dto.getPreferredSupplier());
        existing.setSupplierReference(dto.getSupplierReference());
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

    /**
     * SEULE VOIE DE MUTATION DU STOCK — journal + agrégat dans une transaction.
     * Toutes les autres méthodes de stock délèguent ici. Voir {@link PpeStockMovement}.
     */
    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeById", allEntries = true),
            @CacheEvict(cacheNames = "ppeActive", allEntries = true),
            @CacheEvict(cacheNames = "ppesAll", allEntries = true)
    })
    public int applyStockMovement(Long ppeId, int signedDelta, PpeMovementType type, String reference,
            Long companyId, Long actorId) throws HSException {
        if (signedDelta == 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        Ppe ppe = ppeRepository.findById(ppeId)
                .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
        // Cloisonnement : une mine ne peut pas mouvementer le stock d'une autre.
        // (Corrige la fuite de l'ancien updateStockQuantities/findByIdIn sans filtre.)
        if (companyId != null && !companyId.equals(ppe.getCompanyId())) {
            throw new HSException("PPE_NOT_FOUND");
        }
        // Données legacy : stock peut être null → traité comme 0 (plus de NPE d'autoboxing).
        int current = ppe.getStock() != null ? ppe.getStock() : 0;
        int newBalance = current + signedDelta;
        if (newBalance < 0) {
            throw new HSException("INSUFFICIENT_STOCK");
        }
        ppe.setStock(newBalance);
        ppe.setUpdatedAt(LocalDateTime.now());
        ppeRepository.save(ppe); // save AVANT le mouvement : le verrou optimiste (@Version) tranche la concurrence ici

        movementRepository.save(PpeStockMovement.builder()
                .ppeId(ppeId)
                .movementType(type)
                .quantity(signedDelta)
                .balanceAfter(newBalance)
                .reference(reference)
                .createdBy(actorId)
                .companyId(ppe.getCompanyId())
                .createdAt(LocalDateTime.now())
                .build());
        return newBalance;
    }

    /**
     * Conservé pour compatibilité : délègue à {@link #applyStockMovement}. Le libellé
     * ADD/SUBTRACT devient un mouvement d'AJUSTEMENT tracé (plus de mutation directe).
     */
    @Override
    public Integer updateStockQuantity(Long id, Integer quantity, String operation) throws HSException {
        if (quantity == null || quantity <= 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        int delta = signedDeltaFor(operation, quantity);
        return applyStockMovement(id, delta, PpeMovementType.ADJUSTMENT, "MANUAL", null, null);
    }

    /** Convertit un couple (operation, quantité positive) en delta signé. */
    private int signedDeltaFor(String operation, int quantity) throws HSException {
        if ("ADD".equals(operation)) {
            return quantity;
        }
        if ("SUBTRACT".equals(operation)) {
            return -quantity;
        }
        throw new HSException("INVALID_OPERATION");
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

    /**
     * Conservé pour compatibilité : applique le MÊME mouvement à plusieurs EPI, chacun
     * tracé et cloisonné, en une transaction. Délègue à {@link #applyStockMovement}.
     * (Corrige l'ancienne version : findByIdIn SANS filtre mine + mutation non tracée.)
     */
    @Override
    @Transactional
    public List<Integer> updateStockQuantities(List<Long> ids, Integer quantity, String operation) throws HSException {
        if (quantity == null || quantity <= 0) {
            throw new HSException("INVALID_STOCK_QUANTITY");
        }
        int delta = signedDeltaFor(operation, quantity);
        List<Integer> balances = new java.util.ArrayList<>();
        for (Long id : ids) {
            balances.add(applyStockMovement(id, delta, PpeMovementType.ADJUSTMENT, "MANUAL", null, null));
        }
        return balances;
    }

}
