package com.snippethub.api.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Slf4j
public class SandboxMonitor {

    private static final String SANDBOX_BASE_DIR = "/tmp/snippethub_sandbox/";
    private static final String SECURE_TEMP_DIR = "/tmp/snippethub_secure/";
    
    private final Map<String, SandboxInfo> activeSandboxes = new ConcurrentHashMap<>();
    private final AtomicLong totalSandboxesCreated = new AtomicLong(0);
    private final AtomicLong totalSandboxesCleaned = new AtomicLong(0);
    private final AtomicLong failedCleanups = new AtomicLong(0);

    public void recordSandboxCreation(String sandboxId, String language, Path sandboxDir, Path secureDir) {
        SandboxInfo info = new SandboxInfo(sandboxId, language, sandboxDir, secureDir, LocalDateTime.now());
        activeSandboxes.put(sandboxId, info);
        totalSandboxesCreated.incrementAndGet();
        
        log.info("Sandbox created - ID: {}, Language: {}, Total created: {}", 
                sandboxId, language, totalSandboxesCreated.get());
    }

    public void recordSandboxCleanup(String sandboxId, boolean success) {
        SandboxInfo info = activeSandboxes.remove(sandboxId);
        if (success) {
            totalSandboxesCleaned.incrementAndGet();
            log.info("Sandbox cleaned up successfully - ID: {}, Total cleaned: {}", 
                    sandboxId, totalSandboxesCleaned.get());
        } else {
            failedCleanups.incrementAndGet();
            log.error("Sandbox cleanup failed - ID: {}, Total failed: {}", 
                    sandboxId, failedCleanups.get());
        }
    }

    public void recordCleanupError(String sandboxId, Exception error) {
        failedCleanups.incrementAndGet();
        log.error("Sandbox cleanup error - ID: {}, Error: {}", sandboxId, error.getMessage(), error);
    }

    public SandboxStatus getSandboxStatus() {
        return SandboxStatus.builder()
                .activeSandboxes(activeSandboxes.size())
                .totalCreated(totalSandboxesCreated.get())
                .totalCleaned(totalSandboxesCleaned.get())
                .failedCleanups(failedCleanups.get())
                .build();
    }

    public void checkForOrphanedSandboxes() {
        try {
            // Check sandbox base directory
            checkDirectoryForOrphans(SANDBOX_BASE_DIR, "sandbox");
            
            // Check secure temp directory
            checkDirectoryForOrphans(SECURE_TEMP_DIR, "secure");
            
        } catch (Exception e) {
            log.error("Error checking for orphaned sandboxes", e);
        }
    }

    private void checkDirectoryForOrphans(String directoryPath, String type) {
        Path dir = Paths.get(directoryPath);
        if (!Files.exists(dir)) {
            return;
        }

        try {
            Files.list(dir).forEach(path -> {
                String dirName = path.getFileName().toString();
                
                // Check if this is an active sandbox
                if (!activeSandboxes.containsKey(dirName)) {
                    log.warn("Found orphaned {} directory: {}", type, path);
                    
                    // Try to clean it up
                    try {
                        deleteDirectoryRecursively(path.toFile());
                        log.info("Cleaned up orphaned {} directory: {}", type, path);
                    } catch (Exception e) {
                        log.error("Failed to clean up orphaned {} directory: {}", type, path, e);
                    }
                }
            });
        } catch (IOException e) {
            log.error("Error listing {} directory: {}", type, directoryPath, e);
        }
    }

    private void deleteDirectoryRecursively(File directory) {
        if (directory == null || !directory.exists()) {
            return;
        }
        
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectoryRecursively(file);
                } else {
                    if (!file.canWrite()) {
                        file.setWritable(true);
                    }
                    if (!file.delete()) {
                        log.warn("Could not delete file: {}", file.getAbsolutePath());
                    }
                }
            }
        }
        
        if (!directory.canWrite()) {
            directory.setWritable(true);
        }
        if (!directory.delete()) {
            log.warn("Could not delete directory: {}", directory.getAbsolutePath());
        }
    }

    public void logSandboxStatistics() {
        SandboxStatus status = getSandboxStatus();
        log.info("=== Sandbox Statistics ===");
        log.info("Active sandboxes: {}", status.getActiveSandboxes());
        log.info("Total created: {}", status.getTotalCreated());
        log.info("Total cleaned: {}", status.getTotalCleaned());
        log.info("Failed cleanups: {}", status.getFailedCleanups());
        log.info("Cleanup success rate: {}%", 
                status.getTotalCleaned() > 0 ? 
                (double) status.getTotalCleaned() / (status.getTotalCleaned() + status.getFailedCleanups()) * 100 : 0);
        
        if (status.getActiveSandboxes() > 0) {
            log.warn("WARNING: {} active sandboxes detected!", status.getActiveSandboxes());
            activeSandboxes.values().forEach(info -> 
                log.warn("Active sandbox - ID: {}, Language: {}, Created: {}", 
                        info.getSandboxId(), info.getLanguage(), info.getCreatedAt()));
        }
    }

    // Inner classes for data structures
    public static class SandboxInfo {
        private final String sandboxId;
        private final String language;
        private final Path sandboxDir;
        private final Path secureDir;
        private final LocalDateTime createdAt;

        public SandboxInfo(String sandboxId, String language, Path sandboxDir, Path secureDir, LocalDateTime createdAt) {
            this.sandboxId = sandboxId;
            this.language = language;
            this.sandboxDir = sandboxDir;
            this.secureDir = secureDir;
            this.createdAt = createdAt;
        }

        public String getSandboxId() { return sandboxId; }
        public String getLanguage() { return language; }
        public Path getSandboxDir() { return sandboxDir; }
        public Path getSecureDir() { return secureDir; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class SandboxStatus {
        private final int activeSandboxes;
        private final long totalCreated;
        private final long totalCleaned;
        private final long failedCleanups;

        public SandboxStatus(int activeSandboxes, long totalCreated, long totalCleaned, long failedCleanups) {
            this.activeSandboxes = activeSandboxes;
            this.totalCreated = totalCreated;
            this.totalCleaned = totalCleaned;
            this.failedCleanups = failedCleanups;
        }

        public int getActiveSandboxes() { return activeSandboxes; }
        public long getTotalCreated() { return totalCreated; }
        public long getTotalCleaned() { return totalCleaned; }
        public long getFailedCleanups() { return failedCleanups; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private int activeSandboxes;
            private long totalCreated;
            private long totalCleaned;
            private long failedCleanups;

            public Builder activeSandboxes(int activeSandboxes) {
                this.activeSandboxes = activeSandboxes;
                return this;
            }

            public Builder totalCreated(long totalCreated) {
                this.totalCreated = totalCreated;
                return this;
            }

            public Builder totalCleaned(long totalCleaned) {
                this.totalCleaned = totalCleaned;
                return this;
            }

            public Builder failedCleanups(long failedCleanups) {
                this.failedCleanups = failedCleanups;
                return this;
            }

            public SandboxStatus build() {
                return new SandboxStatus(activeSandboxes, totalCreated, totalCleaned, failedCleanups);
            }
        }
    }
}
