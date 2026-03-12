package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeStockDTO;
import com.minexpert.hns.entity.ppe.PpeStock;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeStockRepository;
import lombok.RequiredArgsConstructor;
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
    public PpeStockDTO create(PpeStockDTO dto) throws HSException {
        System.out.println(dto);
        PpeStock stock = dto.toEntity();
        System.out.println(stock);
        stock.setCreatedAt(LocalDateTime.now());
        stock.setUpdatedAt(LocalDateTime.now());
        PpeStock saved = stockRepository.save(stock);
        ppeService.updateStockQuantity(saved.getPpe().getId(), saved.getQuantity(), "ADD");
        return saved.toDTO();
    }

    @Override
    public PpeStockDTO update(PpeStockDTO dto) throws HSException {
        PpeStock existing = stockRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("STOCK_NOT_FOUND"));
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
    public PpeStockDTO getById(Long id) throws HSException {
        PpeStock stock = stockRepository.findById(id)
                .orElseThrow(() -> new HSException("STOCK_NOT_FOUND"));
        return stock.toDTO();
    }

    @Override
    public List<PpeStockDTO> getAllStocks() throws HSException {
        return stockRepository.findAll()
                .stream()
                .map(PpeStock::toDTO)
                .toList();
    }

    @Override
    public List<PpeStockDTO> getByPpeId(Long ppeId) throws HSException {
        return stockRepository.findByPpeId(ppeId)
                .stream()
                .map(PpeStock::toDTO)
                .toList();
    }
}
