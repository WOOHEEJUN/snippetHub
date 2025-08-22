package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_executions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CodeExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snippet_id")
    private Snippet snippet;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String code;

    @Column(name = "input_data", columnDefinition = "LONGTEXT")
    private String input;

    @Column(name = "output_data", columnDefinition = "LONGTEXT")
    private String output;

    @Column(name = "error_data", columnDefinition = "LONGTEXT")
    private String error;

    @Column(name = "execution_time")
    private Integer executionTime;

    @Column(name = "memory_used")
    private Integer memoryUsed;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    @Column(name = "executed_at", updatable = false)
    private LocalDateTime executedAt;

    public enum Status {
        SUCCESS,
        ERROR,
        TIMEOUT,
        MEMORY_LIMIT
    }

    @Builder
    public CodeExecution(User user, Snippet snippet, String language, String code, String input, String output, String error, Integer executionTime, Integer memoryUsed, Status status) {
        this.user = user;
        this.snippet = snippet;
        this.language = language;
        this.code = code;
        this.input = input;
        this.output = output;
        this.error = error;
        this.executionTime = executionTime;
        this.memoryUsed = memoryUsed;
        this.status = status;
    }
}
