package com.teamme.backend.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 80)
  private String username;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "selected_role", length = 60)
  private String selectedRole;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Column(name = "first_name", length = 80)
  private String firstName;

  @Column(name = "last_name", length = 80)
  private String lastName;

  @Column(name = "bio")
  private String bio;

  @Column(name = "headline", length = 160)
  private String headline;

  @Column(name = "location", length = 120)
  private String location;

  @Column(name = "availability_status", length = 40)
  private String availabilityStatus;

  @Column(name = "github_url")
  private String githubUrl;

  @Column(name = "linkedin_url")
  private String linkedinUrl;

  @Column(name = "portfolio_url")
  private String portfolioUrl;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserExperience> experiences = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserEducation> educations = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserSkill> skills = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserLanguage> languages = new ArrayList<>();

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
  private OffsetDateTime updatedAt;

  public Long getId() { return id; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public String getSelectedRole() { return selectedRole; }
  public void setSelectedRole(String selectedRole) { this.selectedRole = selectedRole; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }

  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }

  public String getBio() { return bio; }
  public void setBio(String bio) { this.bio = bio; }

  public String getHeadline() { return headline; }
  public void setHeadline(String headline) { this.headline = headline; }

  public String getLocation() { return location; }
  public void setLocation(String location) { this.location = location; }

  public String getAvailabilityStatus() { return availabilityStatus; }
  public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

  public String getGithubUrl() { return githubUrl; }
  public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }

  public String getLinkedinUrl() { return linkedinUrl; }
  public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

  public String getPortfolioUrl() { return portfolioUrl; }
  public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

  public List<UserExperience> getExperiences() { return experiences; }
  public void setExperiences(List<UserExperience> experiences) { this.experiences = experiences; }

  public List<UserEducation> getEducations() { return educations; }
  public void setEducations(List<UserEducation> educations) { this.educations = educations; }

  public List<UserSkill> getSkills() { return skills; }
  public void setSkills(List<UserSkill> skills) { this.skills = skills; }

  public List<UserLanguage> getLanguages() { return languages; }
  public void setLanguages(List<UserLanguage> languages) { this.languages = languages; }

  public OffsetDateTime getCreatedAt() { return createdAt; }
  public OffsetDateTime getUpdatedAt() { return updatedAt; }
}