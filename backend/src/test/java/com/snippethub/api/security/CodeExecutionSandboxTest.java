package com.snippethub.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "code.execution.sandbox-enabled=true",
    "code.execution.max-execution-time=10000",
    "code.execution.max-memory=512"
})
class CodeExecutionSandboxTest {

    private CodeExecutionSandbox sandbox;
    
    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        sandbox = new CodeExecutionSandbox();
    }

    @Test
    void testSandboxCreation() throws IOException {
        // Given
        String language = "java";
        
        // When
        CodeExecutionSandbox.SandboxEnvironment environment = sandbox.createSandbox(language);
        
        // Then
        assertNotNull(environment);
        assertNotNull(environment.getSandboxId());
        assertNotNull(environment.getSandboxDir());
        assertNotNull(environment.getSecureDir());
        assertTrue(environment.isSecure());
        
        // Verify directories exist
        assertTrue(Files.exists(environment.getSandboxDir()));
        assertTrue(Files.exists(environment.getSecureDir()));
        
        // Verify unique sandbox ID
        assertNotEquals("", environment.getSandboxId());
        assertTrue(environment.getSandboxId().length() > 0);
    }

    @Test
    void testSandboxCleanup() throws IOException {
        // Given
        String language = "python";
        CodeExecutionSandbox.SandboxEnvironment environment = sandbox.createSandbox(language);
        
        // Create some test files in sandbox
        Path testFile = environment.getSandboxDir().resolve("test.txt");
        Files.write(testFile, "test content".getBytes());
        
        Path secureTestFile = environment.getSecureDir().resolve("secure_test.txt");
        Files.write(secureTestFile, "secure content".getBytes());
        
        // Verify files exist before cleanup
        assertTrue(Files.exists(testFile));
        assertTrue(Files.exists(secureTestFile));
        
        // When
        sandbox.cleanupSandbox(environment);
        
        // Then
        assertFalse(Files.exists(environment.getSandboxDir()));
        assertFalse(Files.exists(environment.getSecureDir()));
        assertFalse(Files.exists(testFile));
        assertFalse(Files.exists(secureTestFile));
    }

    @Test
    void testMultipleSandboxCreation() throws IOException {
        // Given
        String language = "javascript";
        
        // When
        CodeExecutionSandbox.SandboxEnvironment env1 = sandbox.createSandbox(language);
        CodeExecutionSandbox.SandboxEnvironment env2 = sandbox.createSandbox(language);
        CodeExecutionSandbox.SandboxEnvironment env3 = sandbox.createSandbox(language);
        
        // Then
        assertNotNull(env1);
        assertNotNull(env2);
        assertNotNull(env3);
        
        // Verify unique IDs
        assertNotEquals(env1.getSandboxId(), env2.getSandboxId());
        assertNotEquals(env2.getSandboxId(), env3.getSandboxId());
        assertNotEquals(env1.getSandboxId(), env3.getSandboxId());
        
        // Verify unique directories
        assertNotEquals(env1.getSandboxDir(), env2.getSandboxDir());
        assertNotEquals(env2.getSandboxDir(), env3.getSandboxDir());
        assertNotEquals(env1.getSandboxDir(), env3.getSandboxDir());
        
        // Cleanup
        sandbox.cleanupSandbox(env1);
        sandbox.cleanupSandbox(env2);
        sandbox.cleanupSandbox(env3);
    }

    @Test
    void testSandboxCleanupWithNullEnvironment() {
        // When & Then - Should not throw exception
        assertDoesNotThrow(() -> sandbox.cleanupSandbox(null));
    }

    @Test
    void testSandboxCleanupWithNonExistentDirectories() throws IOException {
        // Given
        String language = "cpp";
        CodeExecutionSandbox.SandboxEnvironment environment = sandbox.createSandbox(language);
        
        // Manually delete directories to simulate non-existent state
        Files.deleteIfExists(environment.getSandboxDir());
        Files.deleteIfExists(environment.getSecureDir());
        
        // When & Then - Should not throw exception
        assertDoesNotThrow(() -> sandbox.cleanupSandbox(environment));
    }

    @Test
    void testSandboxPermissions() throws IOException {
        // Given
        String language = "c";
        
        // When
        CodeExecutionSandbox.SandboxEnvironment environment = sandbox.createSandbox(language);
        
        // Then
        File sandboxDir = environment.getSandboxDir().toFile();
        File secureDir = environment.getSecureDir().toFile();
        
        // Verify read/write permissions
        assertTrue(sandboxDir.canRead());
        assertTrue(sandboxDir.canWrite());
        assertTrue(secureDir.canRead());
        assertTrue(secureDir.canWrite());
        
        // Cleanup
        sandbox.cleanupSandbox(environment);
    }

    @Test
    void testExecutablePathForDifferentLanguages() throws IOException {
        // Test different languages
        String[] languages = {"java", "python", "javascript", "cpp", "c"};
        
        for (String language : languages) {
            CodeExecutionSandbox.SandboxEnvironment environment = sandbox.createSandbox(language);
            
            assertNotNull(environment.getExecutablePath());
            assertFalse(environment.getExecutablePath().isEmpty());
            
            sandbox.cleanupSandbox(environment);
        }
    }

    @Test
    void testSandboxIsolation() throws IOException {
        // Given
        String language = "java";
        CodeExecutionSandbox.SandboxEnvironment env1 = sandbox.createSandbox(language);
        CodeExecutionSandbox.SandboxEnvironment env2 = sandbox.createSandbox(language);
        
        // When - Create files in different sandboxes
        Path file1 = env1.getSandboxDir().resolve("file1.txt");
        Path file2 = env2.getSandboxDir().resolve("file2.txt");
        
        Files.write(file1, "content1".getBytes());
        Files.write(file2, "content2".getBytes());
        
        // Then - Verify isolation
        assertTrue(Files.exists(file1));
        assertTrue(Files.exists(file2));
        assertFalse(Files.exists(env1.getSandboxDir().resolve("file2.txt")));
        assertFalse(Files.exists(env2.getSandboxDir().resolve("file1.txt")));
        
        // Cleanup
        sandbox.cleanupSandbox(env1);
        sandbox.cleanupSandbox(env2);
    }
}
