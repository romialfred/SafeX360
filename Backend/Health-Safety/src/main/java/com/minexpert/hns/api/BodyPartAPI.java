package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.BodyPartDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.BodyPartService;

@RestController
@RequestMapping("/body-parts")
@CrossOrigin
@Validated
public class BodyPartAPI {

    @Autowired
    private BodyPartService bodyPartService;

    @PostMapping("/create")
    public ResponseEntity<Long> addBodyPart(@RequestParam Long companyId, @RequestBody BodyPartDTO bodyPartDTO)
            throws HSException {
        return new ResponseEntity<>(bodyPartService.addBodyPart(companyId, bodyPartDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateBodyPart(@RequestParam(required = false) Long companyId,
            @RequestBody BodyPartDTO bodyPartDTO) throws HSException {
        bodyPartService.updateBodyPart(companyId, bodyPartDTO);
        return new ResponseEntity<>(new ResponseDTO("Body Part updated."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteBodyPart(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        bodyPartService.deleteBodyPart(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Body Part deleted."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<BodyPartDTO> getBodyPartById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(bodyPartService.getBodyPartById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<BodyPartDTO>> getAllBodyParts(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(bodyPartService.getAllBodyParts(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<BodyPartDTO>> getAllActiveBodyParts(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(bodyPartService.getAllActiveBodyParts(companyId), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateBodyPart(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        bodyPartService.activateBodyPart(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Body Part activated."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateBodyPart(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        bodyPartService.deactivateBodyPart(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Body Part deactivated."), HttpStatus.OK);
    }
}
