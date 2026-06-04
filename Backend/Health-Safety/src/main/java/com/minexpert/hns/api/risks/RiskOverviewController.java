package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.risks.RiskDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskOverviewController {

    private final RiskService riskService;

    @GetMapping
    public ResponseEntity<List<RiskDTO>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q) throws HSException {
        return ResponseEntity.ok(riskService.search(status, departmentId, ownerId, from, to, q));
    }

    @GetMapping("/overview")
    public ResponseEntity<RiskOverviewResponse> overview(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q) throws HSException {
        return ResponseEntity.ok(riskService.getOverview(status, departmentId, ownerId, from, to, q));
    }
}
