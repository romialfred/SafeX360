package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import com.minexpert.hns.dosimetry.dto.DoseCumulativeDTO;
import com.minexpert.hns.dosimetry.service.DoseCumulativeService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/dosimetry/dose-cumulative")
@CrossOrigin
@RequiredArgsConstructor
public class DoseCumulativeController {

    private final DoseCumulativeService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody DoseCumulativeDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody DoseCumulativeDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("DoseCumulative updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DoseCumulativeDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DoseCumulativeDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("DoseCumulative deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getByWorkerAndYear")
    public ResponseEntity<DoseCumulativeDTO> getByWorkerAndYear(@RequestParam("workerId") Long workerId,
            @RequestParam("year") int year) {
        return new ResponseEntity<>(service.getByWorkerAndYear(workerId, year), HttpStatus.OK);
    }
}
