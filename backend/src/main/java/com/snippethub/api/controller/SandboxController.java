package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.security.SandboxMonitor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/sandbox")
@RequiredArgsConstructor
@Slf4j
public class SandboxController {

    private final SandboxMonitor sandboxMonitor;

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SandboxMonitor.SandboxStatus>> getSandboxStatus() {
        try {
            SandboxMonitor.SandboxStatus status = sandboxMonitor.getSandboxStatus();
            return ResponseEntity.ok(ApiResponse.success("Sandbox status retrieved successfully", status));
        } catch (Exception e) {
            log.error("Error retrieving sandbox status", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve sandbox status: " + e.getMessage()));
        }
    }

    @PostMapping("/check-orphans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> checkForOrphanedSandboxes() {
        try {
            sandboxMonitor.checkForOrphanedSandboxes();
            return ResponseEntity.ok(ApiResponse.success("Orphaned sandbox check completed successfully", "Orphaned sandbox check completed"));
        } catch (Exception e) {
            log.error("Error checking for orphaned sandboxes", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to check for orphaned sandboxes: " + e.getMessage()));
        }
    }

    @PostMapping("/log-statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> logSandboxStatistics() {
        try {
            sandboxMonitor.logSandboxStatistics();
            return ResponseEntity.ok(ApiResponse.success("Sandbox statistics logged successfully", "Statistics logged"));
        } catch (Exception e) {
            log.error("Error logging sandbox statistics", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to log sandbox statistics: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSandboxHealth() {
        try {
            SandboxMonitor.SandboxStatus status = sandboxMonitor.getSandboxStatus();
            
            Map<String, Object> health = Map.of(
                "activeSandboxes", status.getActiveSandboxes(),
                "totalCreated", status.getTotalCreated(),
                "totalCleaned", status.getTotalCleaned(),
                "failedCleanups", status.getFailedCleanups(),
                "cleanupSuccessRate", status.getTotalCleaned() > 0 ? 
                    (double) status.getTotalCleaned() / (status.getTotalCleaned() + status.getFailedCleanups()) * 100 : 0,
                "status", status.getActiveSandboxes() == 0 ? "HEALTHY" : "WARNING"
            );
            
            return ResponseEntity.ok(ApiResponse.success("Sandbox health check completed", health));
        } catch (Exception e) {
            log.error("Error checking sandbox health", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to check sandbox health: " + e.getMessage()));
        }
    }
}
