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
import com.minexpert.hns.dto.parameters.MeasurementDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.MeasurementService;

@RestController
@RequestMapping("/measurements")
@CrossOrigin
@Validated
public class MeasurementAPI {

    @Autowired
    private MeasurementService measurementService;

    @PostMapping("/create")
    public ResponseEntity<Long> createMeasurement(@RequestParam Long companyId,
            @RequestBody MeasurementDTO measurementDTO) throws HSException {
        return new ResponseEntity<>(measurementService.addMeasurement(companyId, measurementDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateMeasurement(@RequestParam(required = false) Long companyId,
            @RequestBody MeasurementDTO measurementDTO)
            throws HSException {
        measurementService.updateMeasurement(companyId, measurementDTO);
        return new ResponseEntity<>(new ResponseDTO("Measurement Updated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateMeasurement(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        measurementService.activateMeasurement(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Measurement Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateMeasurement(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        measurementService.deactivateMeasurement(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Measurement Deactivated Successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteMeasurement(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        measurementService.deleteMeasurement(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Measurement Deleted Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MeasurementDTO> getMeasurementById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(measurementService.getMeasurementById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<MeasurementDTO>> getAllMeasurements(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(measurementService.getAllMeasurements(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<MeasurementDTO>> getAllActiveMeasurements(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(measurementService.getAllActiveMeasurements(companyId), HttpStatus.OK);
    }

}
