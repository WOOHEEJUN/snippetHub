package com.snippethub.api.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${rate.limiting.default-limit:100}")
    private int defaultLimit;

    @Value("${rate.limiting.default-window:60}")
    private int defaultWindow;

    @Value("${rate.limiting.ai-api-limit:10}")
    private int aiApiLimit;

    @Value("${rate.limiting.ai-api-window:60}")
    private int aiApiWindow;

    @Value("${rate.limiting.code-execution-limit:5}")
    private int codeExecutionLimit;

    @Value("${rate.limiting.code-execution-window:60}")
    private int codeExecutionWindow;

    @Value("${rate.limiting.auth-limit:5}")
    private int authLimit;

    @Value("${rate.limiting.auth-window:300}")
    private int authWindow;

    @Bean
    public Bucket defaultBucket() {
        Bandwidth limit = Bandwidth.classic(defaultLimit, Refill.greedy(defaultLimit, Duration.ofSeconds(defaultWindow)));
        return Bucket.builder().addLimit(limit).build();
    }

    @Bean
    public Bucket aiApiBucket() {
        Bandwidth limit = Bandwidth.classic(aiApiLimit, Refill.greedy(aiApiLimit, Duration.ofSeconds(aiApiWindow)));
        return Bucket.builder().addLimit(limit).build();
    }

    @Bean
    public Bucket codeExecutionBucket() {
        Bandwidth limit = Bandwidth.classic(codeExecutionLimit, Refill.greedy(codeExecutionLimit, Duration.ofSeconds(codeExecutionWindow)));
        return Bucket.builder().addLimit(limit).build();
    }

    @Bean
    public Bucket authBucket() {
        Bandwidth limit = Bandwidth.classic(authLimit, Refill.greedy(authLimit, Duration.ofSeconds(authWindow)));
        return Bucket.builder().addLimit(limit).build();
    }
}
