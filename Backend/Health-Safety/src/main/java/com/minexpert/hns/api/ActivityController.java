package com.minexpert.hns.api;

import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.planning.ActivityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/activity")
@RequiredArgsConstructor
@CrossOrigin
public class ActivityController {
    private final ActivityService activityService;

    @PostMapping("/create")
    public ResponseEntity<ActivityDTO> create(@Valid @RequestBody ActivityDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement : la mine appelante validee prime sur le payload.
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(activityService.createActivity(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ActivityDTO> update(@Valid @RequestBody ActivityDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(activityService.updateActivity(dto, companyId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        activityService.deleteActivity(id, companyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ActivityDTO>> getAll(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(activityService.getAllActivities(companyId));
    }

    @GetMapping("/get/year/{year}/status/{status}/category/{category}")
    public ResponseEntity<List<ActivityDTO>> getByYearStatusCategory(@PathVariable int year,
            @PathVariable ActivityStatus status, @PathVariable ActivityCategory category,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(
                activityService.getActivitiesByYearStatusCategory(year, status, category, companyId));
    }

    @GetMapping("/get/year/{year}")
    public ResponseEntity<List<ActivityDTO>> getAllByYear(@PathVariable int year,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(activityService.getAllActivitiesByYear(year, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ActivityDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(activityService.getActivityById(id, companyId));
    }

}
