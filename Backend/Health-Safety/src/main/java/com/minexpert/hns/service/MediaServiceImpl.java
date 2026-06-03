package com.minexpert.hns.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.utility.StringListConverter;

@Service
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
        List<Media> mediaList = mediaDTOs.stream().map(MediaDTO::toEntity).toList();
        List<Long> savedMediaIds = ((List<Media>) mediaRepository.saveAll(mediaList)).stream().map(Media::getId)
                .toList();
        return savedMediaIds.toString();
    }

    @Override
    // @CacheEvict(cacheNames = { "mediaById", "mediaByIdsArray" }, allEntries =
    // true)
    public Long saveMedia(MediaDTO mediaDTO) throws HSException {
        return mediaRepository.save(mediaDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "mediaById", key = "#id")
    public MediaDTO getMediaById(Long id) throws HSException {
        return mediaRepository.findById(id)
                .orElseThrow(() -> new HSException("MEDIA_NOT_FOUND")).toDTO();
    }

}
