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
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<ResponseDTO> deleteMediaById(@PathVariable Long id,
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        assertMediaInScope(id, companyId);
        mediaService.deleteMediaById(id);
        return new ResponseEntity<>(new ResponseDTO("Media deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MediaDTO> getMediaById(@PathVariable Long id,
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        assertMediaInScope(id, companyId);
        return new ResponseEntity<>(mediaService.getMediaById(id), HttpStatus.OK);
    }

    /**
     * Garde IDOR : refuse l'accès à un média d'une AUTRE mine. On refuse uniquement
     * quand les deux mines sont connues et différentes — un média hérité (companyId
     * null, avant le correctif) ou un appelant « toutes mines » (companyId absent,
     * clampé à null) reste toléré, pour ne pas régresser l'existant.
     */
    private void assertMediaInScope(Long id, Long companyId) throws HSException {
        Long owner = mediaService.getMediaCompanyId(id);
        if (owner != null && companyId != null && !owner.equals(companyId)) {
            throw new HSException("MEDIA_NOT_FOUND");
        }
    }

}
