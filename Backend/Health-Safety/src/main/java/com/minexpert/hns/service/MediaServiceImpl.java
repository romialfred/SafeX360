package com.minexpert.hns.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
    public List<MediaDTO> getAllMediaByArray(String mediaIds) {
        List<Long> mediaIdArray = StringListConverter.convertToLongList(mediaIds);
        return ((List<Media>) mediaRepository.findAllByIdIn(mediaIdArray)).stream().map(Media::toDTO).toList();

    }

    @Override
    public void deleteMediaById(Long id) {
        mediaRepository.deleteById(id);
    }

    @Override
    public String saveAllMedia(List<MediaDTO> mediaDTOs) {
        List<Media> mediaList = mediaDTOs.stream().map(MediaDTO::toEntity).toList();
        List<Long> savedMediaIds = ((List<Media>) mediaRepository.saveAll(mediaList)).stream().map(Media::getId)
                .toList();
        return savedMediaIds.toString();
    }

    @Override
    public Long saveMedia(MediaDTO mediaDTO) throws HSException {
        return mediaRepository.save(mediaDTO.toEntity()).getId();
    }

    @Override
    public MediaDTO getMediaById(Long id) throws HSException {
        return mediaRepository.findById(id)
                .orElseThrow(() -> new HSException("MEDIA_NOT_FOUND")).toDTO();
    }

}
