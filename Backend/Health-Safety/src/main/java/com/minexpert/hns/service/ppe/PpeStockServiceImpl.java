package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeStockDTO;
import com.minexpert.hns.entity.ppe.PpeStock;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeStockRepository;

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
public class PpeStockServiceImpl implements PpeStockService {
    private final PpeStockRepository stockRepository;
    private final PpeService ppeService;

    @Override
    @Transactional
    @Caching(evict = {
            // @CacheEvict(cacheNames = "ppeStockById", allEntries = true),
            @CacheEvict(cacheNames = "ppeStocksAll", allEntries = true),
            @CacheEvict(cacheNames = "ppeStocksByPpe", allEntries = true)
    })
    public PpeStockDTO create(PpeStockDTO dto) throws HSException {
        System.out.println(dto);
        PpeStock stock = dto.toEntity();
        stock.setCreatedAt(LocalDateTime.now());
        stock.setUpdatedAt(LocalDateTime.now());
        PpeStock saved = stockRepository.save(stock);
        ppeService.updateStockQuantity(saved.getPpe().getId(), saved.getQuantity(), "ADD");
        return saved.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ppeStockById", allEntries = true),
            @CacheEvict(cacheNames = "ppeStocksAll", allEntries = true),
            @CacheEvict(cacheNames = "ppeStocksByPpe", allEntries = true)
    })
    public PpeStockDTO update(PpeStockDTO dto, Long companyId) throws HSException {
        PpeStock existing = stockRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("STOCK_NOT_FOUND"));
        // Vérification d'appartenance à la mine (companyId null = appel système).
        if (companyId != null && !companyId.equals(existing.getCompanyId())) {
            throw new HSException("STOCK_NOT_FOUND");
        }
        existing.setQuantity(dto.getQuantity());
        existing.setUnitPrice(dto.getUnitPrice());
        existing.setSupplier(dto.getSupplier());
        existing.setBrand(dto.getBrand());
        existing.setModel(dto.getModel());
        existing.setSize(dto.getSize());
        existing.setExpiryDate(dto.getExpiryDate());
        existing.setUpdatedAt(LocalDateTime.now());
        PpeStock updated = stockRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeStockById", key = "#id + '-' + #companyId")
    public PpeStockDTO getById(Long id, Long companyId) throws HSException {
        PpeStock stock = stockRepository.findById(id)
                .orElseThrow(() -> new HSException("STOCK_NOT_FOUND"));
        if (companyId != null && !companyId.equals(stock.getCompanyId())) {
            throw new HSException("STOCK_NOT_FOUND");
        }
        return stock.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "ppeStocksAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<PpeStockDTO> getAllStocks(Long companyId) throws HSException {
        return stockRepository.findAllByCompany(companyId)
                .stream()
                .map(PpeStock::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "ppeStocksByPpe", key = "#ppeId + '-' + #companyId")
    public List<PpeStockDTO> getByPpeId(Long ppeId, Long companyId) throws HSException {
        return stockRepository.findByPpeIdAndCompany(ppeId, companyId)
                .stream()
                .map(PpeStock::toDTO)
                .toList();
    }
}
