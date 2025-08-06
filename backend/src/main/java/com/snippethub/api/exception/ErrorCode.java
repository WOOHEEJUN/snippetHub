package com.snippethub.api.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "Invalid Input Value"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C002", "Method Not Allowed"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C003", "Internal Server Error"),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "파일 업로드에 실패했습니다."),
    NO_PERMISSION(HttpStatus.FORBIDDEN, "C005", "권한이 없습니다."),

    // User
    EMAIL_DUPLICATION(HttpStatus.CONFLICT, "U001", "이미 사용중인 이메일입니다."),
    NICKNAME_DUPLICATION(HttpStatus.CONFLICT, "U002", "이미 사용중인 닉네임입니다."),
    LOGIN_INPUT_INVALID(HttpStatus.BAD_REQUEST, "U003", "로그인 정보가 올바르지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U004", "사용자를 찾을 수 없습니다."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "U005", "비밀번호가 일치하지 않습니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.UNAUTHORIZED, "U006", "이메일 인증이 필요합니다."),

    // Snippet
    SNIPPET_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "스니펫을 찾을 수 없습니다."),

    // Post
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "게시글을 찾을 수 없습니다."),

    // Problem
    PROBLEM_NOT_FOUND(HttpStatus.NOT_FOUND, "PR001", "문제를 찾을 수 없습니다."),
    DAILY_PROBLEM_NOT_FOUND(HttpStatus.NOT_FOUND, "PR002", "일일 문제를 찾을 수 없습니다."),
    SUBMISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "PR003", "제출을 찾을 수 없습니다."),

    // Comment
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "C004", "댓글을 찾을 수 없습니다."),

    // Notification
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "N001", "알림을 찾을 수 없습니다."),

    // Token
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "T001", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "T002", "만료된 토큰입니다."),
    INVALID_VERIFICATION_TOKEN(HttpStatus.BAD_REQUEST, "T003", "유효하지 않은 인증 토큰입니다."),
    EXPIRED_VERIFICATION_TOKEN(HttpStatus.BAD_REQUEST, "T004", "만료된 인증 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "T005", "리프레시 토큰을 찾을 수 없습니다."),
    INVALID_PASSWORD_RESET_TOKEN(HttpStatus.BAD_REQUEST, "T006", "유효하지 않은 비밀번호 재설정 토큰입니다."),
    EXPIRED_PASSWORD_RESET_TOKEN(HttpStatus.BAD_REQUEST, "T007", "만료된 비밀번호 재설정 토큰입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
