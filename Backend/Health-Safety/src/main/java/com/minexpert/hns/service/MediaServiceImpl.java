package com.minexpert.hns.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.utility.StringListConverter;

@Service
@Transactional
public class MediaServiceImpl implements MediaService {

    @Autowired
    private MediaRepository mediaRepository;

    @Override
    @Cacheable(cacheNames = "mediaByIdsArray", key = "#mediaIds != null ? #mediaIds : 'EMPTY'")
    public List<MediaDTO> getAllMediaByArray(String mediaIds) {
        if (mediaIds == null || mediaIds.isBlank()) {
            return List.of();
        }
        List<Long> mediaIdArray = StringListConverter.convertToLongList(mediaIds);
        if (mediaIdArray.isEmpty()) {
            return List.of();
        }
        return ((List<Media>) mediaRepository.findAllByIdIn(mediaIdArray)).stream().map(Media::toDTO).toList();

    }

    @Override
    @CacheEvict(cacheNames = { "mediaById", "mediaByIdsArray" }, allEntries = true)
    public void deleteMediaById(Long id) {
        mediaRepository.deleteById(id);
    }

    @Override
    // @CacheEvict(cacheNames = { "mediaById", "mediaByIdsArray" }, allEntries =
    // true)
    public String saveAllMedia(List<MediaDTO> mediaDTOs) {
        // Garde null/vide : un incident/évènement sans pièce jointe transmettait
        // une liste null -> NullPointerException -> 500 à l'enregistrement.
        if (mediaDTOs == null || mediaDTOs.isEmpty()) {
            return java.util.List.of().toString();
        }
        Long companyId = currentCompanyId();
        List<Media> mediaList = mediaDTOs.stream().map(dto -> {
            Media m = dto.toEntity();
            if (m.getCompanyId() == null) {
                m.setCompanyId(companyId);
            }
            return m;
        }).toList();
        List<Long> savedMediaIds = ((List<Media>) mediaRepository.saveAll(mediaList)).stream().map(Media::getId)
                .toList();
        return savedMediaIds.toString();
    }

    @Override
    // @CacheEvict(cacheNames = { "mediaById", "mediaByIdsArray" }, allEntries =
    // true)
    public Long saveMedia(MediaDTO mediaDTO) throws HSException {
        Media media = mediaDTO.toEntity();
        if (media.getCompanyId() == null) {
            media.setCompanyId(currentCompanyId());
        }
        return mediaRepository.save(media).getId();
    }

    @Override
    @Cacheable(cacheNames = "mediaById", key = "#id")
    public MediaDTO getMediaById(Long id) throws HSException {
        return mediaRepository.findById(id)
                .orElseThrow(() -> new HSException("MEDIA_NOT_FOUND")).toDTO();
    }

    @Override
    public Long getMediaCompanyId(Long id) {
        return mediaRepository.findCompanyIdById(id).orElse(null);
    }

    /**
     * Mine de la requête courante (paramètre companyId injecté/clampé par
     * CompanyScopeFilter). null hors contexte HTTP ou en vue « toutes mines ».
     */
    private Long currentCompanyId() {
        var attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes servletAttrs) {
            String value = servletAttrs.getRequest().getParameter("companyId");
            if (value != null && !value.isBlank()) {
                try {
                    return Long.parseLong(value.trim());
                } catch (NumberFormatException ignored) {
                    // valeur non parsable -> pas de mine
                }
            }
        }
        return null;
    }

}
