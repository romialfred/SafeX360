package com.minexpert.hns.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.MediaService;

@RestController
@RequestMapping("/media")
@CrossOrigin
@Validated
public class MediaAPI {

    @Autowired
    private MediaService mediaService;

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteMediaById(@PathVariable Long id) {
        mediaService.deleteMediaById(id);
        return new ResponseEntity<>(new ResponseDTO("Media deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MediaDTO> getMediaById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(mediaService.getMediaById(id), HttpStatus.OK);
    }

}
