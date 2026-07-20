package com.minexpert.hns.inspections.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.entity.inspections.InspectionCheckpoint;
import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.enums.CheckpointResponseType;
import com.minexpert.hns.enums.InspectionTemplateType;
import com.minexpert.hns.inspections.dto.InspectionCheckpointDTO;
import com.minexpert.hns.inspections.dto.InspectionTemplateDTO;
import com.minexpert.hns.inspections.dto.InspectionTemplateSummaryDTO;
import com.minexpert.hns.repository.inspections.InspectionTemplateRepository;

/**
 * Service de gestion des templates d'inspection (referentiels reutilisables).
 *
 * <p>Resilience metier :</p>
 * <ul>
 *   <li>Suppression d'un template marque {@code active=false} plutot que
 *       suppression dure : conserve l'historique des inspections passees.</li>
 *   <li>Reordonnancement automatique des checkpoints : si {@code displayOrder}
 *       est null, l'index dans la liste sert.</li>
 *   <li>Validation metier ferme : NUMERIC_RANGE exige min/max coherents,
 *       BOOLEAN/VISUAL_GRADE exigent {@code expectedValue} valide.</li>
 * </ul>
 */
@Service
public class InspectionTemplateService {

    @Autowired
    private InspectionTemplateRepository templateRepository;

    /**
     * Liste les templates actifs filtres par type (utilise par le formulaire
     * de planification : afficher uniquement les templates du type choisi).
     */
    @Transactional(readOnly = true)
    public List<InspectionTemplateSummaryDTO> listByType(InspectionTemplateType type, Long companyId) {
        return listByType(type, companyId, false);
    }

    @Transactional(readOnly = true)
    public List<InspectionTemplateSummaryDTO> listByType(InspectionTemplateType type, Long companyId,
            boolean includeInactive) {
        List<InspectionTemplate> list = includeInactive
                ? templateRepository.findAllByTypeForCompany(type, companyId)
                : templateRepository.findActiveByTypeAndCompany(type, companyId);
        return list.stream().map(this::toSummary).toList();
    }

    /** Liste les templates (toutes types confondus) pour la mine. */
    @Transactional(readOnly = true)
    public List<InspectionTemplateSummaryDTO> listAll(Long companyId) {
        return listAll(companyId, false);
    }

    @Transactional(readOnly = true)
    public List<InspectionTemplateSummaryDTO> listAll(Long companyId, boolean includeInactive) {
        List<InspectionTemplate> list = includeInactive
                ? templateRepository.findAllForCompany(companyId)
                : templateRepository.findActiveByCompany(companyId);
        return list.stream().map(this::toSummary).toList();
    }

    /** Detail d'un template avec ses checkpoints ordonnes. */
    @Transactional(readOnly = true)
    public InspectionTemplateDTO getById(Long id, Long companyId) {
        InspectionTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template introuvable : " + id));
        assertSameCompany(t, companyId);
        return toDTO(t);
    }

    /**
     * Cree un nouveau template avec ses checkpoints. Le code doit etre unique
     * dans la mine (controle par contrainte BDD).
     */
    @Transactional
    public Long create(InspectionTemplateDTO dto, Long userId) {
        validateBusinessRules(dto);
        templateRepository.findByCode(dto.getCode()).ifPresent(existing -> {
            throw new IllegalArgumentException(
                    "Un template avec le code '" + dto.getCode() + "' existe deja.");
        });

        InspectionTemplate t = new InspectionTemplate();
        applyDTO(t, dto);
        t.setCreatedBy(userId);
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        // Bind cascade : les checkpoints sont sauves automatiquement
        applyCheckpoints(t, dto.getCheckpoints());
        InspectionTemplate saved = templateRepository.save(t);
        return saved.getId();
    }

    /**
     * Met a jour un template existant. Strategie pour les checkpoints :
     * remplacement integral de la liste (orphanRemoval=true). L'appelant
     * doit envoyer la liste complete des checkpoints souhaites.
     */
    @Transactional
    public void update(Long id, InspectionTemplateDTO dto, Long companyId) {
        validateBusinessRules(dto);
        InspectionTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template introuvable : " + id));
        assertSameCompany(t, companyId);
        applyDTO(t, dto);
        t.setUpdatedAt(LocalDateTime.now());
        // Reset checkpoints : orphanRemoval supprime les retires
        t.getCheckpoints().clear();
        applyCheckpoints(t, dto.getCheckpoints());
        templateRepository.save(t);
    }

    /** Soft-delete : marque inactif (les inspections passees gardent l'access). */
    @Transactional
    public void deactivate(Long id, Long companyId) {
        InspectionTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template introuvable : " + id));
        assertSameCompany(t, companyId);
        t.setActive(Boolean.FALSE);
        t.setUpdatedAt(LocalDateTime.now());
        templateRepository.save(t);
    }

    /** Reactivation d'un template precedemment desactive. */
    @Transactional
    public void activate(Long id, Long companyId) {
        InspectionTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template introuvable : " + id));
        assertSameCompany(t, companyId);
        t.setActive(Boolean.TRUE);
        t.setUpdatedAt(LocalDateTime.now());
        templateRepository.save(t);
    }

    /**
     * Cloisonnement : refuse l'accès à un template d'une autre mine.
     * companyId null (appel système / allMines) ne contrôle pas.
     */
    private void assertSameCompany(InspectionTemplate t, Long companyId) {
        if (companyId != null && !companyId.equals(t.getCompanyId())) {
            throw new IllegalArgumentException("Template introuvable : " + t.getId());
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Helpers internes
    // ─────────────────────────────────────────────────────────────

    private void applyDTO(InspectionTemplate t, InspectionTemplateDTO dto) {
        t.setCode(dto.getCode());
        t.setName(dto.getName());
        t.setDescription(dto.getDescription());
        t.setType(dto.getType());
        t.setScopeRef(dto.getScopeRef());
        t.setEstimatedDurationMin(dto.getEstimatedDurationMin());
        if (dto.getActive() != null) {
            t.setActive(dto.getActive());
        }
        // Renseigné à la création ; en édition, ne pas écraser la mine d'origine
        // si la requête n'en fournit pas (companyId null).
        if (dto.getCompanyId() != null) {
            t.setCompanyId(dto.getCompanyId());
        }
    }

    private void applyCheckpoints(InspectionTemplate t, List<InspectionCheckpointDTO> dtos) {
        if (dtos == null) return;
        // Tri par displayOrder si renseigne, puis position d'origine.
        List<InspectionCheckpointDTO> ordered = new ArrayList<>(dtos);
        ordered.sort(Comparator.comparing(
                d -> d.getDisplayOrder() != null ? d.getDisplayOrder() : Integer.MAX_VALUE));
        int autoOrder = 1;
        for (InspectionCheckpointDTO d : ordered) {
            InspectionCheckpoint cp = new InspectionCheckpoint();
            cp.setTemplate(t);
            cp.setLabel(d.getLabel());
            cp.setHelpText(d.getHelpText());
            cp.setResponseType(d.getResponseType());
            cp.setMinValue(d.getMinValue());
            cp.setMaxValue(d.getMaxValue());
            cp.setUnit(d.getUnit());
            cp.setExpectedValue(d.getExpectedValue());
            cp.setDisplayOrder(d.getDisplayOrder() != null ? d.getDisplayOrder() : autoOrder);
            cp.setCritical(Boolean.TRUE.equals(d.getCritical()));
            cp.setRequired(d.getRequired() == null || Boolean.TRUE.equals(d.getRequired()));
            t.getCheckpoints().add(cp);
            autoOrder++;
        }
    }

    private void validateBusinessRules(InspectionTemplateDTO dto) {
        if (dto.getCheckpoints() == null) return;
        for (InspectionCheckpointDTO cp : dto.getCheckpoints()) {
            if (cp.getResponseType() == CheckpointResponseType.NUMERIC_RANGE) {
                if (cp.getMinValue() == null || cp.getMaxValue() == null) {
                    throw new IllegalArgumentException(
                            "Point de controle '" + cp.getLabel() + "' (NUMERIC_RANGE) : "
                                    + "minValue et maxValue sont obligatoires.");
                }
                if (cp.getMinValue() > cp.getMaxValue()) {
                    throw new IllegalArgumentException(
                            "Point de controle '" + cp.getLabel() + "' : minValue > maxValue.");
                }
            }
            if (cp.getResponseType() == CheckpointResponseType.BOOLEAN
                    && cp.getExpectedValue() != null
                    && !cp.getExpectedValue().equalsIgnoreCase("true")
                    && !cp.getExpectedValue().equalsIgnoreCase("false")) {
                throw new IllegalArgumentException(
                        "Point de controle '" + cp.getLabel() + "' (BOOLEAN) : "
                                + "expectedValue doit valoir 'true' ou 'false'.");
            }
        }
    }

    private InspectionTemplateSummaryDTO toSummary(InspectionTemplate t) {
        return new InspectionTemplateSummaryDTO(
                t.getId(), t.getCode(), t.getName(), t.getType(),
                t.getScopeRef(), t.getEstimatedDurationMin(),
                t.getCheckpoints() != null ? t.getCheckpoints().size() : 0,
                t.getActive(),
                t.getCompanyId() == null);
    }

    private InspectionTemplateDTO toDTO(InspectionTemplate t) {
        InspectionTemplateDTO d = new InspectionTemplateDTO();
        d.setId(t.getId());
        d.setCode(t.getCode());
        d.setName(t.getName());
        d.setDescription(t.getDescription());
        d.setType(t.getType());
        d.setScopeRef(t.getScopeRef());
        d.setEstimatedDurationMin(t.getEstimatedDurationMin());
        d.setCreatedBy(t.getCreatedBy());
        d.setCreatedAt(t.getCreatedAt());
        d.setUpdatedAt(t.getUpdatedAt());
        d.setActive(t.getActive());
        d.setCompanyId(t.getCompanyId());
        d.setCheckpoints(t.getCheckpoints().stream().map(this::toCheckpointDTO).toList());
        return d;
    }

    private InspectionCheckpointDTO toCheckpointDTO(InspectionCheckpoint cp) {
        InspectionCheckpointDTO d = new InspectionCheckpointDTO();
        d.setId(cp.getId());
        d.setLabel(cp.getLabel());
        d.setHelpText(cp.getHelpText());
        d.setResponseType(cp.getResponseType());
        d.setMinValue(cp.getMinValue());
        d.setMaxValue(cp.getMaxValue());
        d.setUnit(cp.getUnit());
        d.setExpectedValue(cp.getExpectedValue());
        d.setDisplayOrder(cp.getDisplayOrder());
        d.setCritical(cp.getCritical());
        d.setRequired(cp.getRequired());
        return d;
    }
}
