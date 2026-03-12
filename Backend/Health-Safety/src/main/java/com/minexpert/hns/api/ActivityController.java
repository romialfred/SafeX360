package com.minexpert.hns.api;

import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.service.planning.ActivityService;
import com.minexpert.hns.exception.HSException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/activity")
@RequiredArgsConstructor
public class ActivityController {
    private final ActivityService activityService;

    @PostMapping("/create")
    public ResponseEntity<ActivityDTO> create(@RequestBody ActivityDTO dto) throws HSException {
        return ResponseEntity.ok(activityService.createActivity(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ActivityDTO> update(@RequestBody ActivityDTO dto) throws HSException {
        return ResponseEntity.ok(activityService.updateActivity(dto));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws HSException {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ActivityDTO>> getAll() throws HSException {
        return ResponseEntity.ok(activityService.getAllActivities());
    }

    @GetMapping("/get/year/{year}/status/{status}/category/{category}")
    public ResponseEntity<List<ActivityDTO>> getByYearStatusCategory(@PathVariable int year,
            @PathVariable ActivityStatus status, @PathVariable ActivityCategory category) throws HSException {
        return ResponseEntity.ok(activityService.getActivitiesByYearStatusCategory(year, status, category));
    }

    @GetMapping("/get/year/{year}")
    public ResponseEntity<List<ActivityDTO>> getAllByYear(@PathVariable int year) throws HSException {
        return ResponseEntity.ok(activityService.getAllActivitiesByYear(year));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ActivityDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }

}
