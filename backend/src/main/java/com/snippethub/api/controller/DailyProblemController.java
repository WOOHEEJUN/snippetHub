package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.service.DailyProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/daily-problems")
@RequiredArgsConstructor
@Slf4j
public class DailyProblemController {

    private final DailyProblemService dailyProblemService;

    /**
     * 오늘의 일일 문제 조회
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> getTodayProblem() {
        Optional<ProblemResponseDto> problem = dailyProblemService.getTodayProblem();
        
        if (problem.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("오늘의 일일 문제를 조회했습니다.", problem.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.error("오늘의 일일 문제가 없습니다."));
        }
    }

    /**
     * 특정 날짜의 일일 문제 조회
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> getProblemByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        Optional<ProblemResponseDto> problem = dailyProblemService.getProblemByDate(date);
        
        if (problem.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(date + " 날짜의 일일 문제를 조회했습니다.", problem.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.error(date + " 날짜의 일일 문제가 없습니다."));
        }
    }

    /**
     * 이번 주 일일 문제들 조회
     */
    @GetMapping("/this-week")
    public ResponseEntity<ApiResponse<List<ProblemResponseDto>>> getThisWeekProblems() {
        List<ProblemResponseDto> problems = dailyProblemService.getThisWeekProblems();
        return ResponseEntity.ok(ApiResponse.success("이번 주 일일 문제들을 조회했습니다.", problems));
    }

    /**
     * 이번 달 일일 문제들 조회
     */
    @GetMapping("/this-month")
    public ResponseEntity<ApiResponse<List<ProblemResponseDto>>> getThisMonthProblems() {
        List<ProblemResponseDto> problems = dailyProblemService.getThisMonthProblems();
        return ResponseEntity.ok(ApiResponse.success("이번 달 일일 문제들을 조회했습니다.", problems));
    }

    /**
     * 일일 문제 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<DailyProblemService.DailyProblemStatistics>> getDailyProblemStatistics() {
        DailyProblemService.DailyProblemStatistics statistics = dailyProblemService.getDailyProblemStatistics();
        return ResponseEntity.ok(ApiResponse.success("일일 문제 통계를 조회했습니다.", statistics));
    }

    /**
     * 일일 문제 생성 (관리자용)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createDailyProblem(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate problemDate,
            @RequestParam Long problemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("일일 문제 생성 요청 - 날짜: {}, 문제ID: {}, 현재 날짜: {}", problemDate, problemId, LocalDate.now());
        
        try {
            dailyProblemService.createDailyProblem(problemDate, problemId);
            return ResponseEntity.ok(ApiResponse.success(problemDate + " 날짜의 일일 문제가 생성되었습니다.", null));
        } catch (Exception e) {
            log.error("일일 문제 생성 실패", e);
            return ResponseEntity.ok(ApiResponse.error("일일 문제 생성에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 랜덤 문제로 일일 문제 생성 (관리자용)
     */
    @PostMapping("/random")
    public ResponseEntity<ApiResponse<String>> createDailyProblemWithRandomProblem(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate problemDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            dailyProblemService.createDailyProblemWithRandomProblem(problemDate);
            return ResponseEntity.ok(ApiResponse.success(problemDate + " 날짜의 랜덤 일일 문제가 생성되었습니다.", null));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("일일 문제 생성에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 일일 문제 비활성화 (관리자용)
     */
    @DeleteMapping("/{date}")
    public ResponseEntity<ApiResponse<String>> deactivateDailyProblem(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        dailyProblemService.deactivateDailyProblem(date);
        return ResponseEntity.ok(ApiResponse.success(date + " 날짜의 일일 문제가 비활성화되었습니다.", null));
    }
} 