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
    public ResponseEntity<Long> createLocation(@RequestBody LocationDTO locationDTO) throws HSException {
        return new ResponseEntity<>(locationService.addLocation(locationDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateLocation(@RequestBody LocationDTO locationDTO) throws HSException {
        locationService.updateLocation(locationDTO);
        return new ResponseEntity<>("Location Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<LocationDTO> getLocationById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(locationService.getLocationById(id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateLocation(@PathVariable Long id) throws HSException {
        locationService.activateLocation(id);
        return new ResponseEntity<>("Location Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateLocation(@PathVariable Long id) throws HSException {
        locationService.deactivateLocation(id);
        return new ResponseEntity<>("Location Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<LocationResponse>> getAllLocations() throws HSException {
        return new ResponseEntity<>(locationService.getAllLocations(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<LocationResponse>> getAllActiveLocations() throws HSException {
        return new ResponseEntity<>(locationService.getAllActiveLocations(), HttpStatus.OK);
    }

}
