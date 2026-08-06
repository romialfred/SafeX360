package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeStocktakeDTO;
import com.minexpert.hns.dto.ppe.PpeStocktakeLineDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeStocktake;
import com.minexpert.hns.entity.ppe.PpeStocktakeLine;
import com.minexpert.hns.entity.ppe.PpeStocktakeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStocktakeLineRepository;
import com.minexpert.hns.repository.ppe.PpeStocktakeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Inventaire physique EPI — incrément 5.
 *
 * Règle d'or : la validation ne mute JAMAIS le stock en direct ; elle passe l'écart
 * par {@link PpeService#applyStockMovement} (mouvement ADJUSTMENT), donc l'invariant
 * {@code Ppe.stock == SUM(mouvements)} reste vrai et l'ajustement est auditable.
 */
@Service
@RequiredArgsConstructor
public class PpeStocktakeServiceImpl implements PpeStocktakeService {

    private final PpeStocktakeRepository stocktakeRepository;
    private final PpeStocktakeLineRepository lineRepository;
    private final PpeRepository ppeRepository;
    private final PpeService ppeService;

    private PpeStocktakeDTO withLines(PpeStocktakeDTO dto) {
        if (dto == null || dto.getId() == null) {
            return dto;
        }
        dto.setLines(lineRepository.findByStocktakeId(dto.getId())
                .stream().map(PpeStocktakeLine::toDTO).toList());
        return dto;
    }

    @Override
    @Transactional
    public PpeStocktakeDTO create(PpeStocktakeDTO dto, Long companyId, Long actorId) throws HSException {
        // Doctrine COMPANY_ID_REQUIRED : un inventaire sans mine est orphelin.
        if (companyId == null || companyId <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw new HSException("STOCKTAKE_EMPTY");
        }

        PpeStocktake header = PpeStocktake.builder()
                .reference(dto.getReference())
                .status(PpeStocktakeStatus.DRAFT)
                .notes(dto.getNotes())
                .countedBy(actorId)
                .createdAt(LocalDateTime.now())
                .companyId(companyId)
                .build();
        PpeStocktake saved = stocktakeRepository.save(header);

        List<PpeStocktakeLine> lines = new ArrayList<>();
        for (PpeStocktakeLineDTO line : dto.getLines()) {
            if (line.getPpeId() == null || line.getCountedQuantity() == null || line.getCountedQuantity() < 0) {
                throw new HSException("STOCKTAKE_LINE_INVALID");
            }
            // Le serveur FIGE lui-même le stock système (il ne fait pas confiance au
            // systemQuantity transmis) et vérifie l'appartenance à la mine.
            Ppe ppe = ppeRepository.findById(line.getPpeId())
                    .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
            if (!companyId.equals(ppe.getCompanyId())) {
                throw new HSException("PPE_NOT_FOUND");
            }
            int system = ppe.getStock() != null ? ppe.getStock() : 0;
            lines.add(PpeStocktakeLine.builder()
                    .stocktakeId(saved.getId())
                    .ppeId(line.getPpeId())
                    .systemQuantity(system)
                    .countedQuantity(line.getCountedQuantity())
                    .note(line.getNote())
                    .build());
        }
        lineRepository.saveAll(lines);
        return withLines(saved.toDTO());
    }

    @Override
    @Transactional
    public PpeStocktakeDTO validate(Long id, Long companyId, Long actorId) throws HSException {
        PpeStocktake take = stocktakeRepository.findById(id)
                .orElseThrow(() -> new HSException("STOCKTAKE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(take.getCompanyId())) {
            throw new HSException("STOCKTAKE_NOT_FOUND");
        }
        // Idempotence : seul un brouillon se valide (pas de double réconciliation).
        if (take.getStatus() != PpeStocktakeStatus.DRAFT) {
            throw new HSException("STOCKTAKE_NOT_DRAFT");
        }

        List<PpeStocktakeLine> lines = lineRepository.findByStocktakeId(id);
        for (PpeStocktakeLine line : lines) {
            Ppe ppe = ppeRepository.findById(line.getPpeId())
                    .orElseThrow(() -> new HSException("PPE_NOT_FOUND"));
            // L'écart est recalculé contre le stock VIF (et non le snapshot) : le stock
            // final égale EXACTEMENT le comptage, même s'il a bougé depuis la saisie.
            int live = ppe.getStock() != null ? ppe.getStock() : 0;
            int counted = line.getCountedQuantity() != null ? line.getCountedQuantity() : 0;
            int delta = counted - live;
            if (delta != 0) {
                ppeService.applyStockMovement(line.getPpeId(), delta, PpeMovementType.ADJUSTMENT,
                        "INV-" + id, take.getCompanyId(), actorId);
            }
        }

        take.setStatus(PpeStocktakeStatus.VALIDATED);
        take.setValidatedAt(LocalDateTime.now());
        PpeStocktake validated = stocktakeRepository.save(take);
        return withLines(validated.toDTO());
    }

    @Override
    @Transactional
    public PpeStocktakeDTO cancel(Long id, Long companyId) throws HSException {
        PpeStocktake take = stocktakeRepository.findById(id)
                .orElseThrow(() -> new HSException("STOCKTAKE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(take.getCompanyId())) {
            throw new HSException("STOCKTAKE_NOT_FOUND");
        }
        if (take.getStatus() != PpeStocktakeStatus.DRAFT) {
            throw new HSException("STOCKTAKE_NOT_DRAFT");
        }
        take.setStatus(PpeStocktakeStatus.CANCELLED);
        return withLines(stocktakeRepository.save(take).toDTO());
    }

    @Override
    public PpeStocktakeDTO getById(Long id, Long companyId) throws HSException {
        PpeStocktake take = stocktakeRepository.findById(id)
                .orElseThrow(() -> new HSException("STOCKTAKE_NOT_FOUND"));
        if (companyId != null && !companyId.equals(take.getCompanyId())) {
            throw new HSException("STOCKTAKE_NOT_FOUND");
        }
        return withLines(take.toDTO());
    }

    @Override
    public List<PpeStocktakeDTO> getAll(Long companyId) throws HSException {
        return stocktakeRepository.findAllByCompany(companyId)
                .stream()
                .map(PpeStocktake::toDTO)
                .map(this::withLines)
                .toList();
    }
}
