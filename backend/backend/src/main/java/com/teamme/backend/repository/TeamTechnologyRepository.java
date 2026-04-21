package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamTechnology;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamTechnologyRepository extends JpaRepository<TeamTechnology, Long> {
    List<TeamTechnology> findByTeam_IdOrderByNameAsc(Long teamId);
    void deleteByTeam_Id(Long teamId);
}