package com.teamme.backend.repository;

import com.teamme.backend.entity.TeamMeeting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMeetingRepository extends JpaRepository<TeamMeeting, Long> {
    List<TeamMeeting> findByTeam_IdOrderByStartsAtAsc(Long teamId);
}