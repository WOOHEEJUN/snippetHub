package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "daily_problem_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "problem_date", nullable = false, unique = true)
    private LocalDate problemDate;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "total_participants")
    private Integer totalParticipants = 0;

    @Column(name = "correct_participants")
    private Integer correctParticipants = 0;

    @Column(name = "success_rate")
    private Double successRate = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public DailyProblem(Problem problem, LocalDate problemDate) {
        this.problem = problem;
        this.problemDate = problemDate;
    }

    public void incrementParticipants(boolean isCorrect) {
        this.totalParticipants = (this.totalParticipants == null ? 0 : this.totalParticipants) + 1;
        if (isCorrect) {
            this.correctParticipants = (this.correctParticipants == null ? 0 : this.correctParticipants) + 1;
        }
        this.successRate = (double) this.correctParticipants / this.totalParticipants * 100;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }
} 