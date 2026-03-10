package com.teamme.backend.service;

import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class TeamsService {

  private final UserRepository userRepository;

  public TeamsService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public record TeamView(Long id, String name, String role, List<String> members, String meetingDate) {}

  // Na start: zwracamy dane podobne do Twojego mocka z frontu.
  // Potem podepniesz to pod tabele teams/team_members/team_meetings.
  public List<TeamView> getTeamsForUser(String username) {
    userRepository.findByUsername(username).orElseThrow();

    return List.of(
        new TeamView(
            1L,
            "Super Zespół",
            "Implementer",
            List.of(username + " [S]"),
            OffsetDateTime.parse("2025-05-15T14:00:00+00:00").toString()
        ),
        new TeamView(
            2L,
            "Prezentacja",
            "Implementer",
            List.of(username + " [P]"),
            OffsetDateTime.parse("2025-05-22T10:00:00+00:00").toString()
        )
    );
  }
}