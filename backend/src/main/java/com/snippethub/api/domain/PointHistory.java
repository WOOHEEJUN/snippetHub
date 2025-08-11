package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_history_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "point_type", nullable = false, length = 50)
    private PointType pointType;

    @Column(name = "point_change", nullable = false)
    private Integer pointChange; // 양수: 획득, 음수: 차감

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "related_id")
    private Long relatedId; // 관련 게시글, 스니펫, 문제 등의 ID

    @Column(name = "related_type", length = 50)
    private String relatedType; // POST, SNIPPET, PROBLEM, COMMENT 등

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public PointHistory(User user, PointType pointType, Integer pointChange, String description, Long relatedId, String relatedType) {
        this.user = user;
        this.pointType = pointType;
        this.pointChange = pointChange;
        this.description = description;
        this.relatedId = relatedId;
        this.relatedType = relatedType;
    }

    public enum PointType {
        POST_CREATE("게시글 작성"),
        SNIPPET_CREATE("스니펫 작성"),
        COMMENT_CREATE("댓글 작성"),
        LIKE_RECEIVE("좋아요 받음"),
        DAILY_LOGIN("일일 로그인"),
        CONSECUTIVE_LOGIN("연속 로그인"),
        LEVEL_UP("레벨업"),
        BADGE_EARN("뱃지 획득"),
        CODE_EXECUTION("코드 실행"),
        PROBLEM_SOLVE("문제 해결"),
        AI_EVALUATION("AI 평가"),
        AI_PROBLEM_GENERATE("AI 문제 생성"),
        SPECIAL_AWARD("특별 보상"),
        PENALTY("벌칙");

        private final String displayName;

        PointType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
