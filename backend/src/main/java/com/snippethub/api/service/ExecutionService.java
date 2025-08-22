package com.snippethub.api.service;

import com.snippethub.api.domain.CodeExecution;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ExecutionRequest;
import com.snippethub.api.dto.ExecutionResponse;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.CodeExecutionRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import com.snippethub.api.security.CodeExecutionSecurityFilter;
import com.snippethub.api.security.CodeExecutionSandbox;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ExecutionService {

    @Value("${code.execution.max-execution-time:10000}")
    private long maxExecutionTime;

    @Value("${code.execution.max-memory:512}")
    private int maxMemory;

    private final CodeExecutionRepository codeExecutionRepository;
    private final UserRepository userRepository;
    private final SnippetRepository snippetRepository;
    private final PointService pointService;
    private final CodeExecutionSecurityFilter codeExecutionSecurityFilter;
    private final CodeExecutionSandbox codeExecutionSandbox;

    public ExecutionResponse execute(ExecutionRequest request, String email) {
        // 보안 검증
        if (!codeExecutionSecurityFilter.validateCodeContent(request.getCode(), request.getLanguage())) {
            log.warn("Code execution blocked due to security validation - Language: {}, Code length: {}", 
                    request.getLanguage(), request.getCode().length());
            return ExecutionResponse.builder()
                    .status(CodeExecution.Status.ERROR.name())
                    .error("Code execution blocked due to security policy violation")
                    .build();
        }

        User user = null;
        if (email != null) {
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        }

        Snippet snippet = null;
        if (request.getSnippetId() != null) {
            snippet = snippetRepository.findById(request.getSnippetId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));
        }

        ExecutionResponse response;
        String language = request.getLanguage().toLowerCase();
        
        // 샌드박스 환경 생성
        CodeExecutionSandbox.SandboxEnvironment sandbox = null;
        try {
            sandbox = codeExecutionSandbox.createSandbox(language);
        } catch (IOException e) {
            log.error("Failed to create sandbox environment", e);
            return ExecutionResponse.builder()
                    .status(CodeExecution.Status.ERROR.name())
                    .error("Failed to create execution environment: " + e.getMessage())
                    .build();
        }
        
        try {
            
            switch (language) {
                case "java":
                    response = executeJavaInSandbox(request.getCode(), request.getInput(), sandbox);
                    break;
                case "python":
                    response = executePythonInSandbox(request.getCode(), request.getInput(), sandbox);
                    break;
                case "c":
                    response = executeCInSandbox(request.getCode(), request.getInput(), sandbox);
                    break;
                case "javascript":
                    response = executeJavaScriptInSandbox(request.getCode(), request.getInput(), sandbox);
                    break;
                case "html":
                    response = executeHtml(request.getCode());
                    break;
                case "css":
                    response = executeCss(request.getCode());
                    break;
                default:
                    response = ExecutionResponse.builder()
                            .status(CodeExecution.Status.ERROR.name())
                            .error("Unsupported language: " + language)
                            .build();
            }
        } finally {
            // 샌드박스 정리 (항상 실행)
            if (sandbox != null) {
                codeExecutionSandbox.cleanupSandbox(sandbox);
            }
        }

        // 코드 실행 기록 저장
        CodeExecution codeExecution = CodeExecution.builder()
                .user(user)
                .snippet(snippet)
                .language(language)
                .code(request.getCode())
                .input(request.getInput())
                .output(response.getOutput())
                .error(response.getError())
                .executionTime(response.getExecutionTime())
                .memoryUsed(response.getMemoryUsed())
                .status(CodeExecution.Status.valueOf(response.getStatus()))
                .build();

        codeExecutionRepository.save(codeExecution);

        // 포인트 지급 (로그인한 사용자인 경우에만)
        if (user != null) {
            try {
                pointService.awardPointsForCodeExecution(user.getId(), codeExecution.getId());
            } catch (Exception e) {
                // 포인트 시스템 오류가 코드 실행에 영향을 주지 않도록 처리
                System.err.println("포인트 지급 중 오류 발생: " + e.getMessage());
            }
        }

        return response;
    }

    private ExecutionResponse executeJava(String code, String input) {
        Path tempDir = null;
        long startTime = System.currentTimeMillis();
        long memoryUsed = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024; // KB
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            tempDir = Files.createTempDirectory("java-execution-");
            Path sourceFile = tempDir.resolve("Main.java");
            Files.write(sourceFile, code.getBytes());

            // Compile
            ProcessBuilder compileBuilder = new ProcessBuilder("javac", sourceFile.toString());
            compileBuilder.directory(tempDir.toFile());
            compileBuilder.environment().remove("JAVA_TOOL_OPTIONS");
            Process compileProcess = compileBuilder.start();
            if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                compileProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Compilation timed out.")
                        .build();
            }

            if (compileProcess.exitValue() != 0) {
                stderr = readStream(compileProcess.getErrorStream());
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.ERROR.name())
                        .error("Compilation failed: " + stderr)
                        .build();
            }

            // Execute
            ProcessBuilder executeBuilder = new ProcessBuilder("java", "Main");
            executeBuilder.directory(tempDir.toFile());
            executeBuilder.environment().remove("JAVA_TOOL_OPTIONS");
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(10, TimeUnit.SECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (IOException | InterruptedException e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        } finally {
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                         .sorted(Comparator.reverseOrder())
                         .map(Path::toFile)
                         .forEach(File::delete);
                } catch (IOException e) {
                    // Failed to delete temp directory
                }
            }
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed((int) memoryUsed) // Placeholder for actual memory usage
                .status(status.name())
                .build();
    }

    private ExecutionResponse executePython(String code, String input) {
        Path tempDir = null;
        long startTime = System.currentTimeMillis();
        long memoryUsed = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024; // KB
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            tempDir = Files.createTempDirectory("python-execution-");
            Path sourceFile = tempDir.resolve("script.py");
            Files.write(sourceFile, code.getBytes());

            ProcessBuilder processBuilder = new ProcessBuilder("python", sourceFile.toString());
            processBuilder.directory(tempDir.toFile());
            Process process = processBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!process.waitFor(10, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(process.getInputStream());
            stderr = readStream(process.getErrorStream());

            if (process.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            }
            else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (IOException | InterruptedException e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        } finally {
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                         .sorted(Comparator.reverseOrder())
                         .map(Path::toFile)
                         .forEach(File::delete);
                }
                catch (IOException e) {
                    // Failed to delete temp directory
                }
            }
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed((int) memoryUsed) // Placeholder for actual memory usage
                .status(status.name())
                .build();
    }

    private ExecutionResponse executeC(String code, String input) {
        Path tempDir = null;
        long startTime = System.currentTimeMillis();
        long memoryUsed = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024; // KB
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            tempDir = Files.createTempDirectory("c-execution-");
            Path sourceFile = tempDir.resolve("main.c");
            Path executableFile = tempDir.resolve("main");
            Files.write(sourceFile, code.getBytes());

            // Compile
            ProcessBuilder compileBuilder = new ProcessBuilder("gcc", sourceFile.toString(), "-o", executableFile.toString());
            compileBuilder.directory(tempDir.toFile());
            Process compileProcess = compileBuilder.start();
            if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                compileProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Compilation timed out.")
                        .build();
            }

            if (compileProcess.exitValue() != 0) {
                stderr = readStream(compileProcess.getErrorStream());
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.ERROR.name())
                        .error("Compilation failed: " + stderr)
                        .build();
            }

            // Execute
            ProcessBuilder executeBuilder = new ProcessBuilder(executableFile.toString());
            executeBuilder.directory(tempDir.toFile());
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(10, TimeUnit.SECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (IOException | InterruptedException e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        } finally {
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                         .sorted(Comparator.reverseOrder())
                         .map(Path::toFile)
                         .forEach(File::delete);
                } catch (IOException e) {
                    // Failed to delete temp directory
                }
            }
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed((int) memoryUsed) // Placeholder for actual memory usage
                .status(status.name())
                .build();
    }

    private ExecutionResponse executeHtml(String code) {
        // HTML/CSS는 서버에서 직접 실행하여 결과를 반환하는 것이 아니라, 코드를 그대로 반환하여 클라이언트에서 렌더링하도록 합니다.
        // 따라서 실행 시간, 메모리 사용량 등은 측정하지 않습니다.
        return ExecutionResponse.builder()
                .output(code)
                .status(CodeExecution.Status.SUCCESS.name())
                .build();
    }

    private ExecutionResponse executeCss(String code) {
        // HTML/CSS와 동일하게 코드를 그대로 반환합니다.
        return ExecutionResponse.builder()
                .output(code)
                .status(CodeExecution.Status.SUCCESS.name())
                .build();
    }

    private String readStream(InputStream inputStream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            String result = output.toString();
            return result.isEmpty() ? "" : result; // 빈 문자열이면 빈 문자열 반환
        }
    }

    // 샌드박스 환경에서 Java 실행
    private ExecutionResponse executeJavaInSandbox(String code, String input, CodeExecutionSandbox.SandboxEnvironment sandbox) {
        long startTime = System.currentTimeMillis();
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            // Java 파일 생성
            Path javaFile = Paths.get(sandbox.getExecutablePath());
            Files.write(javaFile, code.getBytes());

            // 컴파일
            ProcessBuilder compileBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "javac", new String[]{"Main.java"}, sandbox.getSandboxDir());
            Process compileProcess = compileBuilder.start();

            if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                compileProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Compilation timed out.")
                        .build();
            }

            if (compileProcess.exitValue() != 0) {
                stderr = readStream(compileProcess.getErrorStream());
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.ERROR.name())
                        .error("Compilation failed: " + stderr)
                        .build();
            }

            // 실행
            ProcessBuilder executeBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "java", new String[]{"Main"}, sandbox.getSandboxDir());
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(maxExecutionTime, TimeUnit.MILLISECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (Exception e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed(maxMemory)
                .status(status.name())
                .build();
    }

    // 샌드박스 환경에서 Python 실행
    private ExecutionResponse executePythonInSandbox(String code, String input, CodeExecutionSandbox.SandboxEnvironment sandbox) {
        long startTime = System.currentTimeMillis();
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            // Python 파일 생성
            Path pythonFile = Paths.get(sandbox.getExecutablePath());
            Files.write(pythonFile, code.getBytes());

            // 실행
            ProcessBuilder executeBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "python3", new String[]{pythonFile.getFileName().toString()}, sandbox.getSandboxDir());
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(maxExecutionTime, TimeUnit.MILLISECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (Exception e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed(maxMemory)
                .status(status.name())
                .build();
    }

    // 샌드박스 환경에서 C 실행
    private ExecutionResponse executeCInSandbox(String code, String input, CodeExecutionSandbox.SandboxEnvironment sandbox) {
        long startTime = System.currentTimeMillis();
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            // C 파일 생성
            Path cFile = Paths.get(sandbox.getExecutablePath());
            Files.write(cFile, code.getBytes());

            // 컴파일
            ProcessBuilder compileBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "gcc", new String[]{"-o", "main", "main.c"}, sandbox.getSandboxDir());
            Process compileProcess = compileBuilder.start();

            if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                compileProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Compilation timed out.")
                        .build();
            }

            if (compileProcess.exitValue() != 0) {
                stderr = readStream(compileProcess.getErrorStream());
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.ERROR.name())
                        .error("Compilation failed: " + stderr)
                        .build();
            }

            // 실행
            ProcessBuilder executeBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "./main", null, sandbox.getSandboxDir());
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(maxExecutionTime, TimeUnit.MILLISECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (Exception e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed(maxMemory)
                .status(status.name())
                .build();
    }

    // 샌드박스 환경에서 JavaScript 실행
    private ExecutionResponse executeJavaScriptInSandbox(String code, String input, CodeExecutionSandbox.SandboxEnvironment sandbox) {
        long startTime = System.currentTimeMillis();
        String stdout = "";
        String stderr = "";
        CodeExecution.Status status = CodeExecution.Status.ERROR;

        try {
            // JavaScript 파일 생성
            Path jsFile = Paths.get(sandbox.getExecutablePath());
            Files.write(jsFile, code.getBytes());

            // 실행
            ProcessBuilder executeBuilder = codeExecutionSandbox.createSecureProcessBuilder(
                "node", new String[]{jsFile.getFileName().toString()}, sandbox.getSandboxDir());
            Process executeProcess = executeBuilder.start();

            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(executeProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            if (!executeProcess.waitFor(maxExecutionTime, TimeUnit.MILLISECONDS)) {
                executeProcess.destroyForcibly();
                return ExecutionResponse.builder()
                        .status(CodeExecution.Status.TIMEOUT.name())
                        .error("Execution timed out.")
                        .build();
            }

            stdout = readStream(executeProcess.getInputStream());
            stderr = readStream(executeProcess.getErrorStream());

            if (executeProcess.exitValue() == 0) {
                status = CodeExecution.Status.SUCCESS;
            } else {
                status = CodeExecution.Status.ERROR;
            }

        } catch (Exception e) {
            stderr = "An unexpected error occurred: " + e.getMessage();
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        return ExecutionResponse.builder()
                .output(stdout)
                .error(stderr)
                .executionTime((int) executionTime)
                .memoryUsed(maxMemory)
                .status(status.name())
                .build();
    }
}