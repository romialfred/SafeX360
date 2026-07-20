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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.WeatherConditionDTO;
import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.WeatherConditionService;

@RestController
@RequestMapping("/weather-conditions")
@CrossOrigin
@Validated
public class WeatherConditionAPI {

    @Autowired
    private WeatherConditionService weatherConditionService;

    @PostMapping("/create")
    public ResponseEntity<Long> createWeatherCondition(@RequestParam Long companyId,
            @RequestBody WeatherConditionDTO weatherConditionDTO)
            throws HSException {
        return new ResponseEntity<>(weatherConditionService.addWeatherCondition(companyId, weatherConditionDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWeatherCondition(@RequestParam(required = false) Long companyId,
            @RequestBody WeatherConditionDTO weatherConditionDTO)
            throws HSException {
        weatherConditionService.updateWeatherCondition(companyId, weatherConditionDTO);
        return new ResponseEntity<>(new ResponseDTO("Weather Condition Updated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WeatherConditionDTO> getWeatherConditionById(
            @RequestParam(required = false) Long companyId, @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(weatherConditionService.getWeatherConditionById(companyId, id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateWeatherCondition(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        weatherConditionService.activateWeatherCondition(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Weather Condition Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateWeatherCondition(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        weatherConditionService.deactivateWeatherCondition(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Weather Condition Deactivated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WeatherConditionResponse>> getAllWeatherConditions(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(weatherConditionService.getAllWeatherConditions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<WeatherConditionResponse>> getAllActiveWeatherConditions(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(weatherConditionService.getAllActiveWeatherConditions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getByIds")
    public ResponseEntity<List<WeatherConditionResponse>> getWeatherConditionsByIds(
            @RequestParam(required = false) Long companyId, @RequestParam List<Long> ids)
            throws HSException {
        return new ResponseEntity<>(weatherConditionService.getWeatherConditionsByIds(companyId, ids), HttpStatus.OK);
    }
}
