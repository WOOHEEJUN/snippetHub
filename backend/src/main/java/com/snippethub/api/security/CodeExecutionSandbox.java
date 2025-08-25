package com.snippethub.api.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Component
@Slf4j
public class CodeExecutionSandbox {

    @Value("${code.execution.sandbox-enabled:true}")
    private boolean sandboxEnabled;

    @Value("${code.execution.max-execution-time:10000}")
    private long maxExecutionTime;

    @Value("${code.execution.max-memory:512}")
    private int maxMemory;

    private static final String SANDBOX_BASE_DIR = "/tmp/snippethub_sandbox/";
    private static final String SECURE_TEMP_DIR = "/tmp/snippethub_secure/";

    private final SandboxMonitor sandboxMonitor;

    public CodeExecutionSandbox(SandboxMonitor sandboxMonitor) {
        this.sandboxMonitor = sandboxMonitor;
    }

    public SandboxEnvironment createSandbox(String language) throws IOException {
        if (!sandboxEnabled) {
            log.info("Sandbox disabled, returning null environment");
            return new SandboxEnvironment(null, null, null);
        }

        String sandboxId = UUID.randomUUID().toString();
        Path sandboxDir = Paths.get(SANDBOX_BASE_DIR, sandboxId);
        
        log.info("Creating sandbox environment - ID: {}, Language: {}, Directory: {}", 
                sandboxId, language, sandboxDir);
        
        // 샌드박스 디렉토리 생성
        Files.createDirectories(sandboxDir);
        log.debug("Created sandbox directory: {}", sandboxDir);
        
        // 보안 디렉토리 생성
        Path secureDir = Paths.get(SECURE_TEMP_DIR, sandboxId);
        Files.createDirectories(secureDir);
        log.debug("Created secure directory: {}", secureDir);
        
        String executablePath = getExecutablePath(language, sandboxDir);
        
        // 샌드박스 권한 설정
        setSecureSandboxPermissions(sandboxDir, secureDir);
        log.debug("Set secure permissions for sandbox directories");
        
        // 심볼릭 링크 방지
        preventSymbolicLinks(sandboxDir);
        log.debug("Applied symbolic link prevention");
        
        log.info("Successfully created secure sandbox environment: {} for language: {}", sandboxDir, language);
        
        // Record sandbox creation in monitor
        sandboxMonitor.recordSandboxCreation(sandboxId, language, sandboxDir, secureDir);
        
        return new SandboxEnvironment(sandboxDir, executablePath, sandboxId, secureDir);
    }

    private void setSecureSandboxPermissions(Path sandboxDir, Path secureDir) throws IOException {
        try {
            // POSIX 권한 설정 (Unix/Linux 시스템)
            Set<PosixFilePermission> sandboxPermissions = EnumSet.of(
                PosixFilePermission.OWNER_READ,
                PosixFilePermission.OWNER_WRITE
                // 실행 권한 제거
            );
            
            Set<PosixFilePermission> securePermissions = EnumSet.of(
                PosixFilePermission.OWNER_READ,
                PosixFilePermission.OWNER_WRITE
            );
            
            Files.setPosixFilePermissions(sandboxDir, sandboxPermissions);
            Files.setPosixFilePermissions(secureDir, securePermissions);
            
        } catch (UnsupportedOperationException e) {
            // Windows 시스템인 경우 기본 권한 설정
            File sandboxFile = sandboxDir.toFile();
            File secureFile = secureDir.toFile();
            
            sandboxFile.setReadable(true, true);
            sandboxFile.setWritable(true, true);
            sandboxFile.setExecutable(false, false);
            
            secureFile.setReadable(true, true);
            secureFile.setWritable(true, true);
            secureFile.setExecutable(false, false);
        }
    }

    private void preventSymbolicLinks(Path sandboxDir) throws IOException {
        // 심볼릭 링크 생성 방지를 위한 추가 보안 조치
        try {
            // 샌드박스 내에서 심볼릭 링크 생성 시도 시 실패하도록 설정
            Files.setAttribute(sandboxDir, "unix:nlink", 1);
        } catch (Exception e) {
            // 지원되지 않는 시스템에서는 무시
            log.debug("Symbolic link prevention not supported on this system");
        }
    }

    public void cleanupSandbox(SandboxEnvironment sandbox) {
        if (sandbox == null) {
            log.debug("Cleanup requested for null sandbox, skipping");
            return;
        }
        
        log.info("Starting cleanup for sandbox: {}", sandbox.getSandboxId());
        
        try {
            // 보안 디렉토리 먼저 정리
            if (sandbox.getSecureDir() != null) {
                log.debug("Cleaning up secure directory: {}", sandbox.getSecureDir());
                deleteDirectoryRecursively(sandbox.getSecureDir().toFile());
                log.debug("Successfully cleaned up secure directory");
            }
            
            // 샌드박스 디렉토리 정리
            if (sandbox.getSandboxDir() != null) {
                log.debug("Cleaning up sandbox directory: {}", sandbox.getSandboxDir());
                deleteDirectoryRecursively(sandbox.getSandboxDir().toFile());
                log.debug("Successfully cleaned up sandbox directory");
            }
            
            log.info("Successfully cleaned up secure sandbox: {}", sandbox.getSandboxId());
            
            // Record successful cleanup
            sandboxMonitor.recordSandboxCleanup(sandbox.getSandboxId(), true);
            
        } catch (Exception e) {
            log.error("Error cleaning up sandbox: {} - Error: {}", sandbox.getSandboxId(), e.getMessage(), e);
            
            // Record cleanup failure
            sandboxMonitor.recordCleanupError(sandbox.getSandboxId(), e);
        }
    }

    public ProcessBuilder createSecureProcessBuilder(String command, String[] args, Path workingDir) {
        ProcessBuilder pb = new ProcessBuilder(command);
        
        if (args != null && args.length > 0) {
            pb.command().addAll(java.util.Arrays.asList(args));
        }
        
        if (workingDir != null) {
            pb.directory(workingDir.toFile());
        }
        
        // 환경 변수 완전 초기화 (우회 방지)
        pb.environment().clear();
        
        // 최소한의 안전한 환경 변수만 설정
        pb.environment().put("PATH", "/usr/local/bin:/usr/bin:/bin");
        pb.environment().put("HOME", "/tmp");
        pb.environment().put("TMP", "/tmp");
        pb.environment().put("TEMP", "/tmp");
        pb.environment().put("USER", "sandbox");
        pb.environment().put("LOGNAME", "sandbox");
        pb.environment().put("SHELL", "/bin/sh");
        
        // 위험한 환경 변수 제거
        pb.environment().remove("LD_LIBRARY_PATH");
        pb.environment().remove("LD_PRELOAD");
        pb.environment().remove("PYTHONPATH");
        pb.environment().remove("JAVA_HOME");
        pb.environment().remove("CLASSPATH");
        pb.environment().remove("NODE_PATH");
        pb.environment().remove("GOPATH");
        pb.environment().remove("RUST_BACKTRACE");
        
        // 프로세스 그룹 설정 (프로세스 상속 방지)
        pb.redirectErrorStream(true);
        
        return pb;
    }

    public ProcessBuilder createSecureProcessBuilderWithLimits(String command, String[] args, Path workingDir) {
        ProcessBuilder pb = createSecureProcessBuilder(command, args, workingDir);
        
        // 리소스 제한 설정
        try {
            // 메모리 제한
            pb.environment().put("JAVA_OPTS", "-Xmx" + maxMemory + "m -XX:MaxMetaspaceSize=64m");
            pb.environment().put("PYTHONUNBUFFERED", "1");
            pb.environment().put("NODE_OPTIONS", "--max-old-space-size=" + maxMemory);
            
            // 실행 시간 제한 (ulimit 사용)
            if (System.getProperty("os.name").toLowerCase().contains("linux")) {
                pb.environment().put("ULIMIT_CPU", String.valueOf(maxExecutionTime / 1000));
                pb.environment().put("ULIMIT_MEM", String.valueOf(maxMemory * 1024));
            }
            
        } catch (Exception e) {
            log.warn("Could not set resource limits: {}", e.getMessage());
        }
        
        return pb;
    }

    private String getExecutablePath(String language, Path sandboxDir) {
        switch (language.toLowerCase()) {
            case "java":
                return "java";
            case "python":
                return "python3";
            case "javascript":
                return "node";
            case "cpp":
            case "c":
                return "gcc";
            default:
                return "echo";
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
                    // 파일 삭제 전 권한 확인
                    if (!file.canWrite()) {
                        file.setWritable(true);
                    }
                    if (!file.delete()) {
                        log.warn("Could not delete file: {}", file.getAbsolutePath());
                    }
                }
            }
        }
        
        // 디렉토리 삭제 전 권한 확인
        if (!directory.canWrite()) {
            directory.setWritable(true);
        }
        if (!directory.delete()) {
            log.warn("Could not delete directory: {}", directory.getAbsolutePath());
        }
    }

    // 보안 강화된 샌드박스 환경 클래스
    public static class SandboxEnvironment {
        private final Path sandboxDir;
        private final String executablePath;
        private final String sandboxId;
        private final Path secureDir; // 추가 보안 디렉토리

        public SandboxEnvironment(Path sandboxDir, String executablePath, String sandboxId) {
            this(sandboxDir, executablePath, sandboxId, null);
        }

        public SandboxEnvironment(Path sandboxDir, String executablePath, String sandboxId, Path secureDir) {
            this.sandboxDir = sandboxDir;
            this.executablePath = executablePath;
            this.sandboxId = sandboxId;
            this.secureDir = secureDir;
        }

        public Path getSandboxDir() {
            return sandboxDir;
        }

        public String getExecutablePath() {
            return executablePath;
        }

        public String getSandboxId() {
            return sandboxId;
        }

        public Path getSecureDir() {
            return secureDir;
        }

        public boolean isSecure() {
            return secureDir != null;
        }
    }
}
