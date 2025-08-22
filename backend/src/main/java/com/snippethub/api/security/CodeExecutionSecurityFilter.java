package com.snippethub.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@Slf4j
public class CodeExecutionSecurityFilter extends OncePerRequestFilter {

    @Value("${code.execution.enabled:true}")
    private boolean codeExecutionEnabled;

    @Value("${code.execution.allowed-languages:java,python,javascript,cpp,c}")
    private String allowedLanguages;

    @Value("${code.execution.blocked-keywords:system,exec,runtime,process,file,network,http,https,url,connection,socket}")
    private String blockedKeywords;

    @Value("${code.execution.sandbox-enabled:true}")
    private boolean sandboxEnabled;

    private Set<String> allowedLanguageSet;
    private Set<String> blockedKeywordSet;

    // 강화된 위험 패턴들 (정규식 기반)
    private static final List<Pattern> DANGEROUS_PATTERNS = Arrays.asList(
        // 시스템 명령어 실행
        Pattern.compile("(?i)\\b(rm|sudo|su|chmod|chown|kill|killall|pkill)\\b.*\\b(-rf?|--recursive|--force|-r)\\b"),
        Pattern.compile("(?i)\\b(wget|curl|nc|netcat|ssh|scp|rsync|dd|format|mkfs|fdisk|mount|umount)\\b"),
        Pattern.compile("(?i)\\b(shutdown|reboot|halt|poweroff|init|crontab|at|batch|systemctl|service)\\b"),
        Pattern.compile("(?i)\\b(iptables|ufw|firewall|passwd|useradd|userdel|groupadd|groupdel)\\b"),
        Pattern.compile("(?i)\\b(tar|zip|unzip|gzip|bzip2|7z|cat|less|more|head|tail|grep|sed|awk)\\b"),
        
        // Windows 명령어
        Pattern.compile("(?i)\\b(del|rd|rmdir)\\b.*\\b(/s|/q)\\b"),
        Pattern.compile("(?i)\\b(format|chkdsk|sfc|dism|bcdedit|net)\\b.*\\b(user|group|localgroup)\\b"),
        Pattern.compile("(?i)\\b(taskkill|tasklist|schtasks|netsh|ipconfig|route|arp)\\b"),
        Pattern.compile("(?i)\\b(reg|sc)\\b.*\\b(add|delete|query|create|start|stop)\\b"),
        
        // 함수 실행
        Pattern.compile("(?i)\\b(eval|exec|system|os\\.system|os\\.popen|subprocess)\\s*\\("),
        Pattern.compile("(?i)\\b(Runtime\\.getRuntime|ProcessBuilder|shell_exec|child_process)\\b"),
        Pattern.compile("(?i)\\b(spawn|fork|exec|popen|system|backtick)\\b"),
        Pattern.compile("(?i)\\b(Function|setTimeout|setInterval)\\s*\\("),
        
        // 브라우저 API
        Pattern.compile("(?i)\\b(document\\.write|document\\.writeln|window\\.open|window\\.location)\\b"),
        Pattern.compile("(?i)\\b(localStorage|sessionStorage|navigator|screen|history)\\b"),
        Pattern.compile("(?i)\\b(WebSocket|EventSource|Worker|SharedWorker|require|import)\\b"),
        
        // 파일 시스템 접근
        Pattern.compile("(?i)(/etc/|/var/|/tmp/|/home/|/root/|/usr/|/bin/|/sbin/)"),
        Pattern.compile("(?i)(/proc/|/sys/|/dev/|/boot/|/mnt/|/media/)"),
        Pattern.compile("(?i)(C:\\\\|D:\\\\|E:\\\\|F:\\\\|G:\\\\|H:\\\\|I:\\\\|J:\\\\|K:\\\\|L:\\\\|M:\\\\|N:\\\\|O:\\\\|P:\\\\|Q:\\\\|R:\\\\|S:\\\\|T:\\\\|U:\\\\|V:\\\\|W:\\\\|X:\\\\|Y:\\\\|Z:\\\\\\)"),
        Pattern.compile("(?i)(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e%5c)"),
        Pattern.compile("(?i)(Windows|System32|Program Files|ProgramData)"),
        Pattern.compile("(?i)(/etc/passwd|/etc/shadow|/etc/hosts|/etc/fstab)"),
        
        // 네트워크 접근
        Pattern.compile("(?i)(http://|https://|ftp://|sftp://|tcp://|udp://)"),
        Pattern.compile("(?i)(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|::1)"),
        Pattern.compile("(?i)\\b(socket|connect|bind|listen|accept|URL|HttpURLConnection|HttpClient)\\b"),
        Pattern.compile("(?i)\\b(requests|urllib|httplib|fetch|XMLHttpRequest|axios)\\b"),
        Pattern.compile("(?i)\\b(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})\\b"), // IP 주소
        Pattern.compile("(?i)\\b([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}\\b"), // 도메인
        
        // 무한 루프
        Pattern.compile("(?i)\\bwhile\\s*\\(\\s*(true|1|!0)\\s*\\)"),
        Pattern.compile("(?i)\\bfor\\s*\\(\\s*;\\s*;\\s*\\)"),
        Pattern.compile("(?i)\\bloop\\s*:"),
        Pattern.compile("(?i)\\bgoto\\s+\\w+\\s*;"),
        
        // 명령어 치환
        Pattern.compile("(?i)\\$\\{[^}]*\\}"), // ${command}
        Pattern.compile("(?i)\\$\\([^)]*\\)"), // $(command)
        Pattern.compile("(?i)`[^`]*`"), // backticks
        
        // 변수 할당 후 실행
        Pattern.compile("(?i)\\b(var|let|const|String|int|cmd|command)\\s+\\w+\\s*=\\s*['\"`][^'\"]*(rm|sudo|kill|exec|system)"),
        Pattern.compile("(?i)\\b(exec|eval|system)\\s*\\(\\s*\\w+\\s*\\)"), // exec(variable)
        
        // 인코딩 우회 패턴
        Pattern.compile("(?i)(%[0-9A-Fa-f]{2})+"), // URL 인코딩
        Pattern.compile("(?i)(&#[0-9]+;)+"), // HTML 엔티티
        Pattern.compile("(?i)(\\\\u[0-9A-Fa-f]{4})+"), // 유니코드 이스케이프
        Pattern.compile("(?i)(\\\\x[0-9A-Fa-f]{2})+"), // 16진수 이스케이프
        Pattern.compile("(?i)(\\\\[0-7]{3})+"), // 8진수 이스케이프
        
        // 추가 위험 패턴들
        Pattern.compile("(?i)\\b(Class\\.forName|ClassLoader|getClass|getDeclaredMethod|getMethod)\\b"),
        Pattern.compile("(?i)\\b(invoke|newInstance|getConstructor|defineClass|loadClass|findClass)\\b"),
        Pattern.compile("(?i)\\b(JNI|native|JNA|ProcessBuilder|SecurityManager|AccessController)\\b"),
        Pattern.compile("(?i)\\b(File|Files|Path|Paths|FileSystem|FileChannel|ByteBuffer)\\b"),
        Pattern.compile("(?i)\\b(Socket|ServerSocket|DatagramSocket|SocketChannel)\\b"),
        Pattern.compile("(?i)\\b(Process|ProcessBuilder|Runtime|System\\.exit|System\\.gc)\\b"),
        Pattern.compile("(?i)\\b(System\\.setProperty|System\\.getProperty|System\\.getenv|Runtime\\.getRuntime)\\b"),
        Pattern.compile("(?i)\\b(Thread\\.sleep|Thread\\.yield|Thread\\.start|Thread\\.interrupt)\\b"),
        Pattern.compile("(?i)\\b(File\\.delete|File\\.deleteOnExit|File\\.createTempFile)\\b"),
        Pattern.compile("(?i)\\b(malloc|calloc|realloc|free|signal|raise|alarm|kill|killpg)\\b"),
        Pattern.compile("(?i)\\b(chmod|chown|umask|fopen|open|creat|unlink|fork|vfork|clone)\\b"),
        Pattern.compile("(?i)\\b(socket|connect|bind|listen|accept|send|recv|mmap|mprotect)\\b"),
        Pattern.compile("(?i)\\b(exec|execl|execv|execvp|execvpe|popen|system)\\b"),
        Pattern.compile("(?i)\\b(__import__|getattr|setattr|hasattr|delattr|open|file)\\b"),
        Pattern.compile("(?i)\\b(subprocess\\.call|subprocess\\.Popen|subprocess\\.run|subprocess\\.check_call)\\b"),
        Pattern.compile("(?i)\\b(threading|multiprocessing|concurrent\\.futures|ctypes|sys\\.modules)\\b"),
        Pattern.compile("(?i)\\b(pickle|marshal|shelve|dill|platform|os\\.environ|os\\.getenv)\\b"),
        Pattern.compile("(?i)\\b(shutil|glob|fnmatch|pathlib|tempfile|mktemp|mkstemp|mkdtemp)\\b"),
        Pattern.compile("(?i)\\b(signal\\.signal|signal\\.alarm|time\\.sleep|time\\.time|time\\.clock)\\b"),
        Pattern.compile("(?i)\\b(random|secrets|hashlib|hmac|zipfile|tarfile|gzip|bz2|lzma)\\b"),
        Pattern.compile("(?i)\\b(sqlite3|mysql|psycopg2|pymongo|ftplib|telnetlib|smtplib|poplib|imaplib)\\b"),
        Pattern.compile("(?i)\\b(process|Buffer|global|__dirname|__filename|fs|path|os|child_process|cluster)\\b"),
        Pattern.compile("(?i)\\b(http|https|net|tls|dgram|crypto|zlib|stream|util|vm|repl|readline|tty)\\b"),
        Pattern.compile("(?i)\\b(querystring|url|punycode|string_decoder|timers|events|domain|assert)\\b"),
        Pattern.compile("(?i)\\b(console|debugger|Error|RangeError|ReferenceError|Proxy|Reflect|Symbol|WeakMap|WeakSet)\\b")
    );

    @Override
    protected void initFilterBean() throws ServletException {
        super.initFilterBean();
        allowedLanguageSet = Set.of(allowedLanguages.split(","));
        blockedKeywordSet = Set.of(blockedKeywords.split(","));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!codeExecutionEnabled) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.getWriter().write("{\"error\":\"Code execution is currently disabled.\"}");
            return;
        }

        String requestPath = request.getRequestURI();
        
        // 코드 실행 관련 엔드포인트 체크
        if (isCodeExecutionEndpoint(requestPath)) {
            if (!validateCodeExecutionRequest(request, response)) {
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isCodeExecutionEndpoint(String requestPath) {
        return requestPath.startsWith("/api/v1/execute") || 
               requestPath.startsWith("/api/execute") ||
               requestPath.startsWith("/api/ai/evaluate-code");
    }

    private boolean validateCodeExecutionRequest(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        
        try {
            // Content-Type 체크
            String contentType = request.getContentType();
            if (contentType == null || !contentType.contains("application/json")) {
                log.warn("Invalid content type for code execution: {}", contentType);
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"Invalid content type. Expected application/json.\"}");
                return false;
            }

            // Content-Length 체크 (너무 큰 요청 방지)
            String contentLength = request.getHeader("Content-Length");
            if (contentLength != null) {
                int length = Integer.parseInt(contentLength);
                if (length > 1024 * 1024) { // 1MB 제한
                    log.warn("Request too large for code execution: {} bytes", length);
                    response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                    response.getWriter().write("{\"error\":\"Request too large. Maximum 1MB allowed.\"}");
                    return false;
                }
            }

            // User-Agent 체크 (기본적인 봇 방지)
            String userAgent = request.getHeader("User-Agent");
            if (userAgent == null || userAgent.trim().isEmpty()) {
                log.warn("Missing User-Agent header");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"User-Agent header is required.\"}");
                return false;
            }

            // Referer 체크 (CSRF 방지)
            String referer = request.getHeader("Referer");
            if (referer == null || !isValidReferer(referer)) {
                log.warn("Invalid or missing Referer: {}", referer);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("{\"error\":\"Invalid request origin.\"}");
                return false;
            }

            return true;

        } catch (Exception e) {
            log.error("Error validating code execution request", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Internal server error during validation.\"}");
            return false;
        }
    }

    private boolean isValidReferer(String referer) {
        if (referer == null) return false;
        
        List<String> allowedDomains = Arrays.asList(
            "https://snippethub.co.kr",
            "https://snippethub-frontend.s3-website.ap-northeast-2.amazonaws.com",
            "http://localhost:3000"
        );
        
        return allowedDomains.stream().anyMatch(referer::startsWith);
    }

    public boolean validateCodeContent(String code, String language) {
        if (code == null || code.trim().isEmpty()) {
            return false;
        }

        // 언어 검증
        if (!allowedLanguageSet.contains(language.toLowerCase())) {
            log.warn("Blocked language: {}", language);
            return false;
        }

        // 코드 정규화 (인코딩 우회 방지)
        String normalizedCode = normalizeCode(code);
        
        // 위험 패턴 체크
        if (containsAnyPattern(normalizedCode, DANGEROUS_PATTERNS)) {
            log.warn("Dangerous pattern detected in code");
            return false;
        }

        // 금지된 키워드 체크 (정규화된 코드로)
        String lowerCode = normalizedCode.toLowerCase();
        for (String keyword : blockedKeywordSet) {
            if (lowerCode.contains(keyword.toLowerCase())) {
                log.warn("Blocked keyword detected: {} in code", keyword);
                return false;
            }
        }

        // 코드 길이 체크
        if (code.length() > 10000) { // 10KB 제한
            log.warn("Code too long: {} characters", code.length());
            return false;
        }

        return true;
    }

    /**
     * 코드 정규화 - 인코딩 우회 방지
     */
    private String normalizeCode(String code) {
        if (code == null) return "";
        
        // 1. 유니코드 정규화
        String normalized = Normalizer.normalize(code, Normalizer.Form.NFC);
        
        // 2. URL 디코딩
        normalized = decodeUrl(normalized);
        
        // 3. HTML 엔티티 디코딩
        normalized = decodeHtmlEntities(normalized);
        
        // 4. 이스케이프 시퀀스 디코딩
        normalized = decodeEscapes(normalized);
        
        // 5. 공백 문자 정규화
        normalized = normalizeWhitespace(normalized);
        
        return normalized;
    }

    private String decodeUrl(String input) {
        try {
            return java.net.URLDecoder.decode(input, "UTF-8");
        } catch (Exception e) {
            return input;
        }
    }

    private String decodeHtmlEntities(String input) {
        return input.replaceAll("&amp;", "&")
                   .replaceAll("&lt;", "<")
                   .replaceAll("&gt;", ">")
                   .replaceAll("&quot;", "\"")
                   .replaceAll("&#([0-9]+);", matchResult -> {
                       try {
                           return String.valueOf((char) Integer.parseInt(matchResult.group(1)));
                       } catch (Exception e) {
                           return matchResult.group();
                       }
                   });
    }

    private String decodeEscapes(String input) {
        // 유니코드 이스케이프 시퀀스 디코딩
        input = input.replaceAll("\\\\u([0-9A-Fa-f]{4})", matchResult -> {
            try {
                return String.valueOf((char) Integer.parseInt(matchResult.group(1), 16));
            } catch (Exception e) {
                return matchResult.group();
            }
        });
        
        // 16진수 이스케이프 시퀀스 디코딩
        input = input.replaceAll("\\\\x([0-9A-Fa-f]{2})", matchResult -> {
            try {
                return String.valueOf((char) Integer.parseInt(matchResult.group(1), 16));
            } catch (Exception e) {
                return matchResult.group();
            }
        });
        
        // 8진수 이스케이프 시퀀스 디코딩
        input = input.replaceAll("\\\\([0-7]{3})", matchResult -> {
            try {
                return String.valueOf((char) Integer.parseInt(matchResult.group(1), 8));
            } catch (Exception e) {
                return matchResult.group();
            }
        });
        
        return input;
    }

    private String normalizeWhitespace(String input) {
        return input.replaceAll("[\\s\\t\\n\\r]+", " ")
                   .replaceAll("\\u00A0", " ") // non-breaking space
                   .replaceAll("\\u2000", " ") // en quad
                   .replaceAll("\\u2001", " ") // em quad
                   .replaceAll("\\u2002", " ") // en space
                   .replaceAll("\\u2003", " ") // em space
                   .replaceAll("\\u2004", " ") // three-per-em space
                   .replaceAll("\\u2005", " ") // four-per-em space
                   .replaceAll("\\u2006", " ") // six-per-em space
                   .replaceAll("\\u2007", " ") // figure space
                   .replaceAll("\\u2008", " ") // punctuation space
                   .replaceAll("\\u2009", " ") // thin space
                   .replaceAll("\\u200A", " ") // hair space
                   .replaceAll("\\u202F", " ") // narrow no-break space
                   .replaceAll("\\u205F", " ") // medium mathematical space
                   .replaceAll("\\u3000", " "); // ideographic space
    }

    private boolean containsAnyPattern(String code, List<Pattern> patterns) {
        if (code == null) return false;
        
        return patterns.stream().anyMatch(pattern -> pattern.matcher(code).find());
    }
}
