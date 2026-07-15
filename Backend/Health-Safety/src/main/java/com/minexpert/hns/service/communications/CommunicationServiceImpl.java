package com.minexpert.hns.service.communications;

import com.minexpert.hns.config.CommunicationCacheNames;
import com.minexpert.hns.dto.communications.CommTimeDTO;
import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.dto.communications.CommunicationStatsDTO;
import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.communications.ScheduleType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.CommTimeRepository;
import com.minexpert.hns.repository.communications.CommunicationRepository;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.utility.StringListConverter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunicationServiceImpl implements CommunicationService {
    private final CommunicationRepository communicationRepository;
    private final CommTimeRepository commTimeRepository;
    private final CommTimeInitService commTimeInitService;
    private final MediaService mediaService;

    @Override
    @Transactional
    @CacheEvict(cacheNames = {
            CommunicationCacheNames.COMMUNICATION_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            CommunicationCacheNames.COMMUNICATION_STATS
    }, allEntries = true)
    public CommunicationDTO create(CommunicationDTO dto) throws HSException {
        Communication comm = dto.toEntity();
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            comm.setAttachments(mediaService.saveAllMedia(dto.getAttachments()));
        }
        Communication saved = communicationRepository.save(comm);
        CommTimeDTO scheduleRequest = dto.getSchedule();
        boolean hasSchedule = scheduleRequest != null && scheduleRequest.hasSchedule();

        CommTime schedule = hasSchedule ? persistSchedule(scheduleRequest, saved) : null;
        CommTimeDTO immediateSchedule = null;
        if (!hasSchedule) {
            // Self-invocation : la communication vient d'etre creee et est deja
            // cloisonnee ; pas de re-verification companyId necessaire.
            immediateSchedule = sendNow(saved.getId(), null);
        }

        CommunicationDTO response = mapToDto(saved, schedule);
        if (immediateSchedule != null) {
            response.setSchedule(immediateSchedule);
        }
        return response;
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = CommunicationCacheNames.COMMUNICATION_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = {
                    CommunicationCacheNames.COMMUNICATION_SUMMARIES,
                    CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
                    CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
                    CommunicationCacheNames.COMMUNICATION_STATS
            }, allEntries = true)
    })
    public CommunicationDTO update(CommunicationDTO dto, Long companyId) throws HSException {
        Communication existing = communicationRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));
        verifyCompany(existing, companyId);

        Communication updated = dto.toEntity();

        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        updated.setExpiresAt(existing.getExpiresAt());
        // Conserve la mine d'origine : companyId non modifiable via update.
        updated.setCompanyId(existing.getCompanyId());
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            updated.setAttachments(mediaService.saveAllMedia(dto.getAttachments()));
        }
        Communication saved = communicationRepository.save(updated);

        CommTime schedule = persistSchedule(dto.getSchedule(), saved);

        return mapToDto(saved, schedule);
    }

    @Override
    @Cacheable(cacheNames = CommunicationCacheNames.COMMUNICATION_BY_ID, key = "#id + '-' + #companyId")
    public CommunicationDTO getById(Long id, Long companyId) throws HSException {
        Communication comm = communicationRepository.findById(id)
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));
        verifyCompany(comm, companyId);
        CommTime schedule = commTimeRepository.findByCommunicationId(comm.getId()).orElse(null);
        return mapToDto(comm, schedule);
    }

    @Override
    @Cacheable(cacheNames = CommunicationCacheNames.COMMUNICATION_SUMMARIES, key = "#companyId")
    public List<CommunicationSummaryView> getAll(Long companyId) throws HSException {
        return communicationRepository.findAllSummaries(companyId);
    }

    @Override
    @Cacheable(cacheNames = CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            key = "#limit + '-' + #companyId")
    public List<CommunicationSummaryView> getRecentSummaries(int limit, Long companyId)
            throws HSException {
        int size = limit > 0 ? limit : 5;
        return communicationRepository.findSummaries(companyId, PageRequest.of(0, size));
    }

    @Override
    @Cacheable(cacheNames = CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            key = "#departmentId + '-' + #companyId")
    public List<CommunicationDTO> getByDepartmentId(Long departmentId, Long companyId)
            throws HSException {
        List<Communication> communications =
                communicationRepository.findByDepartmentIdAndCompany(departmentId, companyId);
        return mapToDtos(communications);
    }

    @Override
    @Cacheable(cacheNames = CommunicationCacheNames.COMMUNICATION_STATS, key = "#companyId")
    public CommunicationStatsDTO getCounts(Long companyId) throws HSException {
        List<CommunicationStatsDTO.TypeCount> byType = communicationRepository.countByType(companyId)
                .stream()
                .map(view -> new CommunicationStatsDTO.TypeCount(view.getType(), view.getTotal()))
                .toList();

        List<CommunicationStatsDTO.CategoryCount> byCategory =
                communicationRepository.countByCategory(companyId)
                .stream()
                .map(view -> new CommunicationStatsDTO.CategoryCount(view.getCategory(), view.getTotal()))
                .toList();

        List<CommunicationStatsDTO.DepartmentCount> byDepartment =
                communicationRepository.countByDepartment(companyId)
                .stream()
                .map(view -> new CommunicationStatsDTO.DepartmentCount(view.getDepartmentId(), view.getTotal()))
                .toList();

        return new CommunicationStatsDTO(byType, byCategory, byDepartment);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {
            CommunicationCacheNames.COMMUNICATION_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            CommunicationCacheNames.COMMUNICATION_STATS
    }, allEntries = true)
    public CommunicationDTO resumeSchedule(Long communicationId, Long companyId) throws HSException {
        verifyCommunicationCompany(communicationId, companyId);
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        CommTime reactivated = commTimeInitService.initializeAndActivate(commTime);
        return mapToDto(reactivated.getCommunication(), reactivated);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {
            CommunicationCacheNames.COMMUNICATION_BY_ID,
            CommunicationCacheNames.COMMUNICATION_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            CommunicationCacheNames.COMMUNICATION_STATS
    }, allEntries = true)
    public CommunicationDTO pauseSchedule(Long communicationId, Long companyId) throws HSException {
        verifyCommunicationCompany(communicationId, companyId);
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        commTime.setStatus(CommStatus.PAUSED);
        commTime.setNextRunAt(null);
        CommTime saved = commTimeRepository.save(commTime);
        return mapToDto(saved.getCommunication(), saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {
            CommunicationCacheNames.COMMUNICATION_BY_ID,
            CommunicationCacheNames.COMMUNICATION_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            CommunicationCacheNames.COMMUNICATION_STATS
    }, allEntries = true)
    public CommunicationDTO cancelSchedule(Long communicationId, Long companyId) throws HSException {
        verifyCommunicationCompany(communicationId, companyId);
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        commTime.setStatus(CommStatus.CANCELLED);
        commTime.setNextRunAt(null);
        CommTime saved = commTimeRepository.save(commTime);
        return mapToDto(saved.getCommunication(), saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {
            CommunicationCacheNames.COMMUNICATION_BY_ID,
            CommunicationCacheNames.COMMUNICATION_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_RECENT_SUMMARIES,
            CommunicationCacheNames.COMMUNICATION_BY_DEPARTMENT,
            CommunicationCacheNames.COMMUNICATION_STATS
    }, allEntries = true)
    public CommTimeDTO sendNow(Long communicationId, Long companyId) throws HSException {
        Communication communication = communicationRepository.findById(communicationId)
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));
        verifyCompany(communication, companyId);

        Optional<CommTime> existing = commTimeRepository.findByCommunicationId(communicationId);

        CommTime saved;
        if (existing.isPresent()) {
            CommTime commTime = existing.get();
            commTime.setStatus(CommStatus.ACTIVE);
            commTime.setNextRunAt(Instant.now());
            saved = commTimeRepository.save(commTime);
        } else {
            CommTime commTime = new CommTime();
            commTime.setCommunication(communication);
            commTime.setScheduleType(ScheduleType.ONE_TIME);
            commTime.setOneTimeAt(LocalDateTime.now());
            saved = commTimeInitService.initializeAndActivate(commTime);
        }

        return CommTimeDTO.fromEntity(saved);
    }

    /**
     * Verifie l'appartenance d'une communication a la mine appelante. companyId
     * null = pas de controle. Non-appartenance : COMM_NOT_FOUND (on ne divulgue
     * pas l'existence d'une communication d'une autre mine).
     */
    private void verifyCompany(Communication comm, Long companyId) throws HSException {
        if (companyId == null || comm == null) {
            return;
        }
        if (!companyId.equals(comm.getCompanyId())) {
            throw new HSException("COMM_NOT_FOUND");
        }
    }

    private void verifyCommunicationCompany(Long communicationId, Long companyId)
            throws HSException {
        if (companyId == null) {
            return;
        }
        Communication comm = communicationRepository.findById(communicationId)
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));
        verifyCompany(comm, companyId);
    }

    private CommTime persistSchedule(CommTimeDTO scheduleDto, Communication communication) {
        if (scheduleDto == null || !scheduleDto.hasSchedule()) {
            return null;
        }

        Optional<CommTime> existing = commTimeRepository.findByCommunicationId(communication.getId());
        CommTime commTime = existing.orElseGet(scheduleDto::toEntity);
        scheduleDto.applyTo(commTime);
        commTime.setCommunication(communication);

        return commTimeInitService.initializeAndActivate(commTime);
    }

    private List<CommunicationDTO> mapToDtos(List<Communication> communications) {
        if (communications.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> communicationIds = communications.stream()
                .map(Communication::getId)
                .toList();

        Map<Long, CommTime> schedules = commTimeRepository.findByCommunicationIdIn(communicationIds)
                .stream()
                .collect(Collectors.toMap(ct -> ct.getCommunication().getId(), Function.identity()));

        return communications.stream()
                .map(comm -> mapToDto(comm, schedules.get(comm.getId())))
                .toList();
    }

    private CommunicationDTO mapToDto(Communication communication, CommTime schedule) {
        CommunicationDTO dto = communication.toDTO();

        String attachmentIds = communication.getAttachments();
        if (StringUtils.hasText(attachmentIds)) {
            List<Long> ids = StringListConverter.convertToLongList(attachmentIds);
            if (ids != null && !ids.isEmpty()) {
                dto.setAttachments(mediaService.getAllMediaByArray(attachmentIds));
            }
        }

        dto.setSchedule(CommTimeDTO.fromEntity(schedule));
        return dto;
    }
}
