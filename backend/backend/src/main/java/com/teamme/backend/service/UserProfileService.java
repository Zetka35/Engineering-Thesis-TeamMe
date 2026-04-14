package com.teamme.backend.service;

import com.teamme.backend.entity.*;
import com.teamme.backend.repository.TeamMemberRepository;
import com.teamme.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class UserProfileService {

    public record ExperienceDto(
            Long id,
            String companyName,
            String position,
            String employmentType,
            String startDate,
            String endDate,
            boolean current,
            String description
    ) {}

    public record EducationDto(
            Long id,
            String schoolName,
            String degree,
            String fieldOfStudy,
            String startDate,
            String endDate,
            boolean current,
            String description
    ) {}

    public record SkillDto(
            Long id,
            String name,
            Integer level,
            String category
    ) {}

    public record LanguageDto(
            Long id,
            String name,
            String level
    ) {}

    public record ProjectHistoryDto(
            Long teamId,
            String teamName,
            String teamStatus,
            String roleLabel,
            String joinedAt,
            String leftAt,
            boolean current
    ) {}

    public record UserProfileDto(
            String username,
            String avatarUrl,
            String selectedRole,
            String firstName,
            String lastName,
            String fullName,
            String bio,
            String headline,
            String location,
            String availabilityStatus,
            String githubUrl,
            String linkedinUrl,
            String portfolioUrl,
            List<ExperienceDto> experiences,
            List<EducationDto> educations,
            List<SkillDto> skills,
            List<LanguageDto> languages,
            List<ProjectHistoryDto> projectHistory
    ) {}

    public record NetworkUserDto(
            String username,
            String avatarUrl,
            String selectedRole,
            String firstName,
            String lastName,
            String fullName,
            String bio,
            String headline,
            String location,
            String availabilityStatus,
            List<SkillDto> topSkills,
            List<LanguageDto> languages,
            ProjectHistoryDto latestProject
    ) {}

    public record ExperienceRequest(
            String companyName,
            String position,
            String employmentType,
            String startDate,
            String endDate,
            Boolean isCurrent,
            String description
    ) {}

    public record EducationRequest(
            String schoolName,
            String degree,
            String fieldOfStudy,
            String startDate,
            String endDate,
            Boolean isCurrent,
            String description
    ) {}

    public record SkillRequest(
            String name,
            Integer level,
            String category
    ) {}

    public record LanguageRequest(
            String name,
            String level
    ) {}

    public record UpdateProfileRequest(
            String firstName,
            String lastName,
            String bio,
            String headline,
            String location,
            String availabilityStatus,
            String githubUrl,
            String linkedinUrl,
            String portfolioUrl,
            List<ExperienceRequest> experiences,
            List<EducationRequest> educations,
            List<SkillRequest> skills,
            List<LanguageRequest> languages
    ) {}

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public UserProfileService(
            UserRepository userRepository,
            TeamMemberRepository teamMemberRepository
    ) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getMyProfile(String username) {
        return toProfileDto(loadUser(username));
    }

    @Transactional(readOnly = true)
    public UserProfileDto getPublicProfile(String username) {
        return toProfileDto(loadUser(username));
    }

    public UserProfileDto updateMyProfile(String username, UpdateProfileRequest req) {
        User user = loadUser(username);

        user.setFirstName(normalize(req.firstName(), 80));
        user.setLastName(normalize(req.lastName(), 80));
        user.setBio(normalize(req.bio(), 2000));
        user.setHeadline(normalize(req.headline(), 160));
        user.setLocation(normalize(req.location(), 120));
        user.setAvailabilityStatus(normalizeEnumLike(req.availabilityStatus(), 40));
        user.setGithubUrl(normalizeUrl(req.githubUrl()));
        user.setLinkedinUrl(normalizeUrl(req.linkedinUrl()));
        user.setPortfolioUrl(normalizeUrl(req.portfolioUrl()));

        replaceExperiences(user, req.experiences());
        replaceEducations(user, req.educations());
        replaceSkills(user, req.skills());
        replaceLanguages(user, req.languages());

        return toProfileDto(userRepository.save(user));
    }

    public UserProfileDto updateSelectedRole(String username, String selectedRole) {
        User user = loadUser(username);
        user.setSelectedRole(normalize(selectedRole, 60));
        return toProfileDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<NetworkUserDto> getNetwork(String currentUsername) {
        return userRepository.findByUsernameNotOrderByCreatedAtDesc(currentUsername).stream()
                .map(this::toNetworkDto)
                .toList();
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username).orElseThrow(() ->
                new IllegalArgumentException("Nie znaleziono użytkownika: " + username)
        );
    }

    private UserProfileDto toProfileDto(User user) {
        List<ExperienceDto> experiences = user.getExperiences().stream()
                .sorted(
                        Comparator.comparing(UserExperience::isCurrent).reversed()
                                .thenComparing(UserExperience::getStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserExperience::getId, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .map(x -> new ExperienceDto(
                        x.getId(),
                        x.getCompanyName(),
                        x.getPosition(),
                        x.getEmploymentType(),
                        x.getStartDate() == null ? null : x.getStartDate().toString(),
                        x.getEndDate() == null ? null : x.getEndDate().toString(),
                        x.isCurrent(),
                        x.getDescription()
                ))
                .toList();

        List<EducationDto> educations = user.getEducations().stream()
                .sorted(
                        Comparator.comparing(UserEducation::isCurrent).reversed()
                                .thenComparing(UserEducation::getStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserEducation::getId, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .map(x -> new EducationDto(
                        x.getId(),
                        x.getSchoolName(),
                        x.getDegree(),
                        x.getFieldOfStudy(),
                        x.getStartDate() == null ? null : x.getStartDate().toString(),
                        x.getEndDate() == null ? null : x.getEndDate().toString(),
                        x.isCurrent(),
                        x.getDescription()
                ))
                .toList();

        List<SkillDto> skills = user.getSkills().stream()
                .sorted(
                        Comparator.comparing(UserSkill::getLevel, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserSkill::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                )
                .map(x -> new SkillDto(
                        x.getId(),
                        x.getName(),
                        x.getLevel(),
                        x.getCategory()
                ))
                .toList();

        List<LanguageDto> languages = user.getLanguages().stream()
                .sorted(Comparator.comparing(UserLanguage::getName, String.CASE_INSENSITIVE_ORDER))
                .map(x -> new LanguageDto(
                        x.getId(),
                        x.getName(),
                        x.getLevel()
                ))
                .toList();

        List<ProjectHistoryDto> projectHistory = teamMemberRepository.findByUser_UsernameOrderByJoinedAtDesc(user.getUsername()).stream()
                .map(this::toProjectHistoryDto)
                .toList();

        return new UserProfileDto(
                user.getUsername(),
                user.getAvatarUrl(),
                user.getSelectedRole(),
                user.getFirstName(),
                user.getLastName(),
                fullName(user),
                user.getBio(),
                user.getHeadline(),
                user.getLocation(),
                user.getAvailabilityStatus(),
                user.getGithubUrl(),
                user.getLinkedinUrl(),
                user.getPortfolioUrl(),
                experiences,
                educations,
                skills,
                languages,
                projectHistory
        );
    }

    private NetworkUserDto toNetworkDto(User user) {
        List<SkillDto> topSkills = user.getSkills().stream()
                .sorted(
                        Comparator.comparing(UserSkill::getLevel, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserSkill::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                )
                .limit(3)
                .map(x -> new SkillDto(x.getId(), x.getName(), x.getLevel(), x.getCategory()))
                .toList();

        List<LanguageDto> languages = user.getLanguages().stream()
                .sorted(Comparator.comparing(UserLanguage::getName, String.CASE_INSENSITIVE_ORDER))
                .map(x -> new LanguageDto(x.getId(), x.getName(), x.getLevel()))
                .toList();

        Optional<TeamMember> currentMembership =
                teamMemberRepository.findFirstByUser_IdAndLeftAtIsNullOrderByJoinedAtDesc(user.getId());

        Optional<TeamMember> latestMembership = currentMembership.isPresent()
                ? currentMembership
                : teamMemberRepository.findFirstByUser_IdOrderByJoinedAtDesc(user.getId());

        return new NetworkUserDto(
                user.getUsername(),
                user.getAvatarUrl(),
                user.getSelectedRole(),
                user.getFirstName(),
                user.getLastName(),
                fullName(user),
                user.getBio(),
                user.getHeadline(),
                user.getLocation(),
                user.getAvailabilityStatus(),
                topSkills,
                languages,
                latestMembership.map(this::toProjectHistoryDto).orElse(null)
        );
    }

    private ProjectHistoryDto toProjectHistoryDto(TeamMember tm) {
        return new ProjectHistoryDto(
                tm.getTeam().getId(),
                tm.getTeam().getName(),
                tm.getTeam().getStatus(),
                tm.getRoleLabel(),
                tm.getJoinedAt() == null ? null : tm.getJoinedAt().toString(),
                tm.getLeftAt() == null ? null : tm.getLeftAt().toString(),
                tm.getLeftAt() == null
        );
    }

    private void replaceExperiences(User user, List<ExperienceRequest> requests) {
        user.getExperiences().clear();
        if (requests == null) return;

        for (ExperienceRequest req : requests) {
            if (req == null || isExperienceEmpty(req)) continue;

            String companyName = normalize(req.companyName(), 160);
            String position = normalize(req.position(), 160);

            if (companyName == null) {
                throw new IllegalArgumentException("Nazwa firmy w doświadczeniu jest wymagana.");
            }
            if (position == null) {
                throw new IllegalArgumentException("Stanowisko w doświadczeniu jest wymagane.");
            }

            LocalDate startDate = parseRequiredDate(req.startDate(), "Data rozpoczęcia doświadczenia jest wymagana.");
            LocalDate endDate = parseOptionalDate(req.endDate(), "Nieprawidłowa data zakończenia doświadczenia.");
            boolean current = Boolean.TRUE.equals(req.isCurrent());

            if (current) {
                endDate = null;
            }
            if (endDate != null && endDate.isBefore(startDate)) {
                throw new IllegalArgumentException("Data zakończenia doświadczenia nie może być wcześniejsza niż data rozpoczęcia.");
            }

            UserExperience entity = new UserExperience();
            entity.setUser(user);
            entity.setCompanyName(companyName);
            entity.setPosition(position);
            entity.setEmploymentType(normalize(req.employmentType(), 80));
            entity.setStartDate(startDate);
            entity.setEndDate(endDate);
            entity.setCurrent(current);
            entity.setDescription(normalize(req.description(), 4000));

            user.getExperiences().add(entity);
        }
    }

    private void replaceEducations(User user, List<EducationRequest> requests) {
        user.getEducations().clear();
        if (requests == null) return;

        for (EducationRequest req : requests) {
            if (req == null || isEducationEmpty(req)) continue;

            String schoolName = normalize(req.schoolName(), 160);
            if (schoolName == null) {
                throw new IllegalArgumentException("Nazwa szkoły lub uczelni jest wymagana.");
            }

            LocalDate startDate = parseRequiredDate(req.startDate(), "Data rozpoczęcia edukacji jest wymagana.");
            LocalDate endDate = parseOptionalDate(req.endDate(), "Nieprawidłowa data zakończenia edukacji.");
            boolean current = Boolean.TRUE.equals(req.isCurrent());

            if (current) {
                endDate = null;
            }
            if (endDate != null && endDate.isBefore(startDate)) {
                throw new IllegalArgumentException("Data zakończenia edukacji nie może być wcześniejsza niż data rozpoczęcia.");
            }

            UserEducation entity = new UserEducation();
            entity.setUser(user);
            entity.setSchoolName(schoolName);
            entity.setDegree(normalize(req.degree(), 120));
            entity.setFieldOfStudy(normalize(req.fieldOfStudy(), 160));
            entity.setStartDate(startDate);
            entity.setEndDate(endDate);
            entity.setCurrent(current);
            entity.setDescription(normalize(req.description(), 4000));

            user.getEducations().add(entity);
        }
    }

    private void replaceSkills(User user, List<SkillRequest> requests) {
        user.getSkills().clear();
        if (requests == null) return;

        for (SkillRequest req : requests) {
            if (req == null || isSkillEmpty(req)) continue;

            String name = normalize(req.name(), 80);
            if (name == null) {
                throw new IllegalArgumentException("Nazwa umiejętności jest wymagana.");
            }

            Integer level = req.level();
            if (level != null && (level < 1 || level > 5)) {
                throw new IllegalArgumentException("Poziom umiejętności musi być w zakresie 1-5.");
            }

            UserSkill entity = new UserSkill();
            entity.setUser(user);
            entity.setName(name);
            entity.setLevel(level);
            entity.setCategory(normalize(req.category(), 80));

            user.getSkills().add(entity);
        }

        deduplicateSkills(user);
    }

    private void replaceLanguages(User user, List<LanguageRequest> requests) {
        user.getLanguages().clear();
        if (requests == null) return;

        for (LanguageRequest req : requests) {
            if (req == null || isLanguageEmpty(req)) continue;

            String name = normalize(req.name(), 80);
            if (name == null) {
                throw new IllegalArgumentException("Nazwa języka jest wymagana.");
            }

            UserLanguage entity = new UserLanguage();
            entity.setUser(user);
            entity.setName(name);
            entity.setLevel(normalize(req.level(), 30));

            user.getLanguages().add(entity);
        }

        deduplicateLanguages(user);
    }

    private void deduplicateSkills(User user) {
        List<UserSkill> deduped = user.getSkills().stream()
                .collect(Collectors.toMap(
                        x -> x.getName().trim().toLowerCase(Locale.ROOT),
                        x -> x,
                        (left, right) -> chooseBetterSkill(left, right)
                ))
                .values()
                .stream()
                .sorted(
                        Comparator.comparing(UserSkill::getLevel, Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(UserSkill::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                )
                .toList();

        user.getSkills().clear();
        deduped.forEach(x -> {
            x.setUser(user);
            user.getSkills().add(x);
        });
    }

    private UserSkill chooseBetterSkill(UserSkill left, UserSkill right) {
        Integer leftLevel = left.getLevel();
        Integer rightLevel = right.getLevel();
        if (leftLevel == null && rightLevel != null) return right;
        if (leftLevel != null && rightLevel == null) return left;
        if (leftLevel != null && rightLevel != null && rightLevel > leftLevel) return right;
        return left;
    }

    private void deduplicateLanguages(User user) {
        List<UserLanguage> deduped = user.getLanguages().stream()
                .collect(Collectors.toMap(
                        x -> x.getName().trim().toLowerCase(Locale.ROOT),
                        x -> x,
                        (left, right) -> chooseBetterLanguage(left, right)
                ))
                .values()
                .stream()
                .sorted(Comparator.comparing(UserLanguage::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        user.getLanguages().clear();
        deduped.forEach(x -> {
            x.setUser(user);
            user.getLanguages().add(x);
        });
    }

    private UserLanguage chooseBetterLanguage(UserLanguage left, UserLanguage right) {
        if (left.getLevel() == null && right.getLevel() != null) return right;
        return left;
    }

    private boolean isExperienceEmpty(ExperienceRequest req) {
        return Stream.of(req.companyName(), req.position(), req.employmentType(), req.startDate(), req.endDate(), req.description())
                .allMatch(this::isBlank)
                && !Boolean.TRUE.equals(req.isCurrent());
    }

    private boolean isEducationEmpty(EducationRequest req) {
        return Stream.of(req.schoolName(), req.degree(), req.fieldOfStudy(), req.startDate(), req.endDate(), req.description())
                .allMatch(this::isBlank)
                && !Boolean.TRUE.equals(req.isCurrent());
    }

    private boolean isSkillEmpty(SkillRequest req) {
        return isBlank(req.name()) && req.level() == null && isBlank(req.category());
    }

    private boolean isLanguageEmpty(LanguageRequest req) {
        return isBlank(req.name()) && isBlank(req.level());
    }

    private String fullName(User user) {
        String value = Stream.of(user.getFirstName(), user.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "))
                .trim();
        return value.isBlank() ? user.getUsername() : value;
    }

    private LocalDate parseRequiredDate(String value, String messageIfMissing) {
        String normalized = normalize(value, 20);
        if (normalized == null) {
            throw new IllegalArgumentException(messageIfMissing);
        }
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Nieprawidłowy format daty. Oczekiwano YYYY-MM-DD.");
        }
    }

    private LocalDate parseOptionalDate(String value, String messageIfInvalid) {
        String normalized = normalize(value, 20);
        if (normalized == null) return null;
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(messageIfInvalid + " Oczekiwano YYYY-MM-DD.");
        }
    }

    private String normalize(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;
    }

    private String normalizeEnumLike(String value, int maxLen) {
        String normalized = normalize(value, maxLen);
        if (normalized == null) return null;
        return normalized.toUpperCase(Locale.ROOT)
                .replace(' ', '_')
                .replace('-', '_');
    }

    private String normalizeUrl(String value) {
        return normalize(value, 1000);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}