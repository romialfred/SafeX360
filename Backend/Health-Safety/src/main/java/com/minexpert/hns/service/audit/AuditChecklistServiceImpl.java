package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditChecklistItemDTO;
import com.minexpert.hns.dto.audit.AuditChecklistTemplateDTO;
import com.minexpert.hns.entity.audit.AuditChecklistItem;
import com.minexpert.hns.entity.audit.AuditChecklistTemplate;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditChecklistItemRepository;
import com.minexpert.hns.repository.audit.AuditChecklistTemplateRepository;
import com.minexpert.hns.repository.audit.AuditRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Checklists d'audit par référentiel ISO (45001 / 14001 / 9001).
 *
 * La checklist guide l'exécution : copie des questions types au démarrage de
 * l'audit, puis évaluation question par question (CONFORME / NON_CONFORME /
 * NON_APPLICABLE / A_EVALUER) avec commentaire, preuve et lien constat.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuditChecklistServiceImpl implements AuditChecklistService {

    private static final Set<String> REFERENTIALS = Set.of("ISO_45001", "ISO_14001", "ISO_9001");
    private static final Set<String> RESULTS = Set.of("CONFORME", "NON_CONFORME", "NON_APPLICABLE", "A_EVALUER");

    private final AuditChecklistTemplateRepository templateRepository;
    private final AuditChecklistItemRepository itemRepository;
    private final AuditRepository auditRepository;

    @Override
    public List<AuditChecklistTemplateDTO> getTemplates(String referential) throws HSException {
        List<AuditChecklistTemplate> templates = (referential == null || referential.isBlank())
                ? templateRepository.findByActiveTrueOrderByReferentialAscOrderIndexAsc()
                : templateRepository.findByReferentialAndActiveTrueOrderByOrderIndexAsc(referential.trim());
        return templates.stream().map(AuditChecklistTemplate::toDTO).collect(Collectors.toList());
    }

    @Override
    public int initChecklist(Long auditId, List<String> referentials) throws HSException {
        auditRepository.findById(auditId).orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        if (referentials == null || referentials.isEmpty()) {
            throw new HSException("REFERENTIALS_REQUIRED");
        }
        int created = 0;
        for (String raw : referentials) {
            String referential = raw == null ? "" : raw.trim();
            if (!REFERENTIALS.contains(referential)) {
                throw new HSException("REFERENTIAL_INVALID");
            }
            // Idempotence : un référentiel déjà initialisé pour cet audit est ignoré.
            if (itemRepository.existsByAuditIdAndReferential(auditId, referential)) {
                continue;
            }
            for (AuditChecklistTemplate template
                    : templateRepository.findByReferentialAndActiveTrueOrderByOrderIndexAsc(referential)) {
                AuditChecklistItem item = new AuditChecklistItem();
                item.setAuditId(auditId);
                item.setTemplateId(template.getId());
                item.setReferential(template.getReferential());
                item.setClause(template.getClause());
                item.setQuestion(template.getQuestion());
                item.setResult("A_EVALUER");
                item.setUpdatedAt(LocalDateTime.now());
                itemRepository.save(item);
                created++;
            }
        }
        return created;
    }

    @Override
    public List<AuditChecklistItemDTO> getChecklist(Long auditId) throws HSException {
        return itemRepository.findByAuditIdOrderByReferentialAscIdAsc(auditId)
                .stream().map(AuditChecklistItem::toDTO).collect(Collectors.toList());
    }

    @Override
    public void updateItem(Long itemId, AuditChecklistItemDTO itemDTO) throws HSException {
        AuditChecklistItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new HSException("CHECKLIST_ITEM_NOT_FOUND"));
        if (itemDTO.getResult() != null) {
            if (!RESULTS.contains(itemDTO.getResult())) {
                throw new HSException("CHECKLIST_RESULT_INVALID");
            }
            // Rigueur ISO : une non-conformité de checklist exige un commentaire
            // factuel (le constat formel se crée ensuite côté observations).
            if ("NON_CONFORME".equals(itemDTO.getResult())
                    && (itemDTO.getComment() == null || itemDTO.getComment().isBlank())) {
                throw new HSException("COMMENT_REQUIRED_FOR_NON_CONFORME");
            }
            item.setResult(itemDTO.getResult());
        }
        if (itemDTO.getComment() != null) item.setComment(itemDTO.getComment());
        if (itemDTO.getEvidence() != null) item.setEvidence(itemDTO.getEvidence());
        if (itemDTO.getObservationId() != null) item.setObservationId(itemDTO.getObservationId());
        item.setUpdatedAt(LocalDateTime.now());
        itemRepository.save(item);
    }
}
