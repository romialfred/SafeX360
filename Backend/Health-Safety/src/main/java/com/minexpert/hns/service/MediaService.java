package com.minexpert.hns.service;

import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.exception.HSException;

public interface MediaService {

    public List<MediaDTO> getAllMediaByArray(String mediaIds);

    public String saveAllMedia(List<MediaDTO> mediaDTOs);

    public void deleteMediaById(Long id);

    public Long saveMedia(MediaDTO mediaDTO) throws HSException;

    public MediaDTO getMediaById(Long id) throws HSException;

}
