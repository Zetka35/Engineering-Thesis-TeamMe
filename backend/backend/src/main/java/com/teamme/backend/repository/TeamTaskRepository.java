package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamTaskRepository extends JpaRepository<TeamTask, Long> {
    List<TeamTask> findByTeam_IdOrderByCreatedAtDesc(Long teamId);
}