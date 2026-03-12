package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.nonConformity.NcHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.nonConformity.NcHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/nc-history")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class NcHistoryApi {
    private final NcHistoryService ncHistoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> saveNcHistory(@RequestBody NcHistoryDTO ncHistoryDTO) throws HSException {
        return new ResponseEntity<>(ncHistoryService.saveNcHistory(ncHistoryDTO), HttpStatus.CREATED);
    }

    @GetMapping("/getByNonConformityId/{nonConformityId}")
    public ResponseEntity<?> getNcHistoryByNonConformityId(@PathVariable Long nonConformityId) throws HSException {
        return new ResponseEntity<>(ncHistoryService.getNcHistoryByNonConformityId(nonConformityId), HttpStatus.OK);
    }
}
