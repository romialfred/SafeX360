package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.audit.ChangeLogDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.audit.ChangeLog;
import com.minexpert.hns.repository.audit.ChangeLogRepository;
import com.minexpert.hns.utility.AuthUtils;

@Service
@Transactional
public class ChangeLogServiceImpl implements ChangeLogService {

    @Autowired
    private ChangeLogRepository changeLogRepository;
    @Autowired
    private HrmsClient hrmsClient;

    @Override
    public void record(String entityType, Long entityId, Long companyId,
            String field, String oldValue, String newValue) {
        // Aucun changement réel → rien à tracer (évite le bruit dans le journal).
        if (Objects.equals(oldValue, newValue)) {
            return;
        }
        ChangeLog log = new ChangeLog();
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setCompanyId(companyId);
        // Acteur dérivé de l'identité AUTHENTIFIÉE (non répudiable), pas d'un param.
        log.setActorId(AuthUtils.currentActorId());
        log.setField(field);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setChangedAt(LocalDateTime.now());
        changeLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeLogDTO> list(String entityType, Long entityId, Long companyId) {
        List<ChangeLog> logs = changeLogRepository.findForEntity(entityType, entityId, companyId);
        List<ChangeLogDTO> result = logs.stream().map(ChangeLogDTO::fromEntity).collect(Collectors.toList());

        // Résolution best-effort des noms d'acteurs (batch HRMS).
        List<Long> actorIds = result.stream().map(ChangeLogDTO::getActorId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        if (!actorIds.isEmpty()) {
            try {
                List<EmployeeNameDTO> names = hrmsClient.getEmployeeNameByIds(actorIds);
                if (names != null) {
                    Map<Long, String> byId = names.stream()
                            .filter(n -> n.getId() != null && n.getName() != null)
                            .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName, (a, b) -> a));
                    result.forEach(dto -> {
                        if (dto.getActorId() != null) {
                            dto.setActorName(byId.get(dto.getActorId()));
                        }
                    });
                }
            } catch (Exception ignore) {
                // La résolution des noms ne doit jamais casser la lecture du journal.
            }
        }
        return result;
    }
}
