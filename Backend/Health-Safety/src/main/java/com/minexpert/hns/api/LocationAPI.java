package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.minexpert.hns.dto.parameters.LocationDTO;
import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.LocationService;

@RestController
@RequestMapping("/locations")
@CrossOrigin
@Validated
public class LocationAPI {
    @Autowired
    private LocationService locationService;

    @PostMapping("/create")
    public ResponseEntity<Long> createLocation(@RequestParam("companyId") Long companyId,
            @RequestBody LocationDTO locationDTO) throws HSException {
        return new ResponseEntity<>(locationService.addLocation(companyId, locationDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateLocation(@RequestParam(name = "companyId", required = false) Long companyId,
            @RequestBody LocationDTO locationDTO) throws HSException {
        locationService.updateLocation(companyId, locationDTO);
        return new ResponseEntity<>("Location Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<LocationDTO> getLocationById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(locationService.getLocationById(companyId, id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateLocation(@RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        locationService.activateLocation(companyId, id);
        return new ResponseEntity<>("Location Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateLocation(@RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        locationService.deactivateLocation(companyId, id);
        return new ResponseEntity<>("Location Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<LocationResponse>> getAllLocations(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(locationService.getAllLocations(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<LocationResponse>> getAllActiveLocations(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(locationService.getAllActiveLocations(companyId), HttpStatus.OK);
    }

}
