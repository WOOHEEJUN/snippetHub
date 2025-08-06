package com.snippethub.api.controller;

import com.snippethub.api.domain.SubmissionStatus;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.problem.ProblemSubmissionRequestDto;
import com.snippethub.api.dto.problem.ProblemSubmissionResponseDto;
import com.snippethub.api.service.ProblemSubmissionService;
import com.snippethub.api.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {

    private final ProblemSubmissionService submissionService;
    private final UserService userService;

    /**
     * 코드 제출
     */
    @PostMapping("/problems/{problemId}")
    public ResponseEntity<ApiResponse<ProblemSubmissionResponseDto>> submitCode(
            @PathVariable Long problemId,
            @RequestBody ProblemSubmissionRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        ProblemSubmissionResponseDto submission = submissionService.submitCode(userId, problemId, requestDto);
        
        return ResponseEntity.ok(ApiResponse.success("코드가 제출되었습니다.", submission));
    }

    /**
     * 사용자의 제출 이력 조회
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemSubmissionResponseDto>>> getMySubmissions(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        Page<ProblemSubmissionResponseDto> submissions = submissionService.getUserSubmissions(userId, pageable);
        PageResponseDto<ProblemSubmissionResponseDto> response = new PageResponseDto<>(submissions);
        
        return ResponseEntity.ok(ApiResponse.success("내 제출 이력을 조회했습니다.", response));
    }

    /**
     * 특정 문제의 사용자 제출 이력 조회
     */
    @GetMapping("/my/problems/{problemId}")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemSubmissionResponseDto>>> getMySubmissionsForProblem(
            @PathVariable Long problemId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        Page<ProblemSubmissionResponseDto> submissions = submissionService.getUserSubmissionsForProblem(userId, problemId, pageable);
        PageResponseDto<ProblemSubmissionResponseDto> response = new PageResponseDto<>(submissions);
        
        return ResponseEntity.ok(ApiResponse.success("해당 문제의 제출 이력을 조회했습니다.", response));
    }

    /**
     * 사용자의 정답 제출만 조회
     */
    @GetMapping("/my/correct")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemSubmissionResponseDto>>> getMyCorrectSubmissions(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        Page<ProblemSubmissionResponseDto> submissions = submissionService.getUserCorrectSubmissions(userId, pageable);
        PageResponseDto<ProblemSubmissionResponseDto> response = new PageResponseDto<>(submissions);
        
        return ResponseEntity.ok(ApiResponse.success("내 정답 제출 이력을 조회했습니다.", response));
    }

    /**
     * 특정 문제의 모든 제출 조회 (관리자용)
     */
    @GetMapping("/problems/{problemId}")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemSubmissionResponseDto>>> getProblemSubmissions(
            @PathVariable Long problemId,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemSubmissionResponseDto> submissions = submissionService.getProblemSubmissions(problemId, pageable);
        PageResponseDto<ProblemSubmissionResponseDto> response = new PageResponseDto<>(submissions);
        
        return ResponseEntity.ok(ApiResponse.success("문제의 모든 제출을 조회했습니다.", response));
    }

    /**
     * 사용자가 특정 문제를 풀었는지 확인
     */
    @GetMapping("/check/{problemId}")
    public ResponseEntity<ApiResponse<Boolean>> hasSolvedProblem(
            @PathVariable Long problemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        boolean hasSolved = submissionService.hasUserSolvedProblem(userId, problemId);
        
        return ResponseEntity.ok(ApiResponse.success("문제 해결 여부를 확인했습니다.", hasSolved));
    }

    /**
     * 사용자의 최근 제출 조회
     */
    @GetMapping("/my/problems/{problemId}/latest")
    public ResponseEntity<ApiResponse<ProblemSubmissionResponseDto>> getLatestSubmission(
            @PathVariable Long problemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        Optional<ProblemSubmissionResponseDto> submission = submissionService.getLatestSubmission(userId, problemId);
        
        if (submission.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("최근 제출을 조회했습니다.", submission.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.error("해당 문제에 대한 제출이 없습니다."));
        }
    }

    /**
     * 사용자의 오늘 제출 수 조회
     */
    @GetMapping("/my/today-count")
    public ResponseEntity<ApiResponse<Long>> getTodaySubmissionCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = userService.getUserByEmail(userDetails.getUsername()).getId();
        Long count = submissionService.getTodaySubmissionCount(userId);
        
        return ResponseEntity.ok(ApiResponse.success("오늘의 제출 수를 조회했습니다.", count));
    }

    /**
     * 제출 상태 목록 조회
     */
    @GetMapping("/statuses")
    public ResponseEntity<ApiResponse<SubmissionStatus[]>> getSubmissionStatuses() {
        return ResponseEntity.ok(ApiResponse.success("제출 상태 목록을 조회했습니다.", SubmissionStatus.values()));
    }
} 