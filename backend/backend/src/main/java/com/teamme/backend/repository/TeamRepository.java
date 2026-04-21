package com.teamme.backend.repository;

import com.teamme.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    @Query("""
        select tm.team
        from TeamMember tm
        where tm.user.username = :username
        order by tm.team.createdAt desc
    """)
    List<Team> findAllForUsername(String username);

    @Query("""
    select t
    from Team t
    where t.recruitmentStatus = 'OPEN'
    order by t.createdAt desc
""")
    List<Team> findAllOpenRecruitment();
}

