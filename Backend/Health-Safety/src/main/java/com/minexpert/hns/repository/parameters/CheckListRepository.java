package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.entity.parameters.CheckList;

public interface CheckListRepository extends CrudRepository<CheckList, Long> {

    Optional<CheckList> findByNameIgnoreCase(String name);

    @Query("SELECT i.id AS id, i.name AS name, i.description AS description, c.id AS incidentCategoryId, c.name AS incidentCategoryName, i.status AS status FROM CheckList i JOIN i.incidentCategory c")
    List<CheckListDetails> findAllWithName();

    @Query("SELECT i.id AS id, i.name AS name,c.id as incidentCategoryId, c.name as incidentCategoryName , i.description as description FROM CheckList i JOIN i.incidentCategory c where i.status = Status.ACTIVE")
    List<CheckListDetails> findAllActiveTypes();
}
