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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional
public class ExecutionService {

    private final CodeExecutionRepository codeExecutionRepository;
    private final UserRepository userRepository;
    private final SnippetRepository snippetRepository;

    public ExecutionResponse execute(ExecutionRequest request, String email) {
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
        switch (language) {
            case "java":
                response = executeJava(request.getCode(), request.getInput());
                break;
            case "python":
                response = executePython(request.getCode(), request.getInput());
                break;
            case "c":
                response = executeC(request.getCode(), request.getInput());
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

        CodeExecution codeExecution = CodeExecution.builder()
                .user(user)
                .snippet(snippet)
                .language(request.getLanguage())
                .code(request.getCode())
                .input(request.getInput())
                .output(response.getOutput())
                .error(response.getError())
                .executionTime(response.getExecutionTime())
                .memoryUsed(response.getMemoryUsed())
                .status(CodeExecution.Status.valueOf(response.getStatus()))
                .build();
        codeExecutionRepository.save(codeExecution);

        return ExecutionResponse.from(codeExecution);
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
            return output.toString();
        }
    }
}