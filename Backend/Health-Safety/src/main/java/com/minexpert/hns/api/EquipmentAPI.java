package com.minexpert.hns.api;

import java.util.List;

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
import com.minexpert.hns.dto.equipment.EquipmentDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.equipment.EquipmentService;

import lombok.RequiredArgsConstructor;

/**
 * Registre des équipements — cibles d'inspection type ÉQUIPEMENT.
 *
 * <p>La Gateway strip le préfixe {@code /hns/} : le mapping réel côté HS est
 * {@code /equipment}. Le param {@code companyId} est injecté en query par
 * l'intercepteur Axios (mine active) et validé/clampé par le CompanyScopeFilter.</p>
 */
@RestController
@RequestMapping("/equipment")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class EquipmentAPI {

    private final EquipmentService equipmentService;

    @PostMapping("/create")
    public ResponseEntity<Long> createEquipment(@RequestParam(required = false) Long companyId,
            @RequestBody EquipmentDTO equipmentDTO) throws HSException {
        return new ResponseEntity<>(equipmentService.createEquipment(companyId, equipmentDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateEquipment(@RequestParam(required = false) Long companyId,
            @RequestBody EquipmentDTO equipmentDTO) throws HSException {
        equipmentService.updateEquipment(companyId, equipmentDTO);
        return new ResponseEntity<>(new ResponseDTO("Equipment updated."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<EquipmentDTO>> getAllEquipment(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(equipmentService.getAllEquipment(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<EquipmentDTO> getEquipmentById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(equipmentService.getEquipmentById(companyId, id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteEquipment(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        equipmentService.deleteEquipment(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Equipment deactivated."), HttpStatus.OK);
    }
}
