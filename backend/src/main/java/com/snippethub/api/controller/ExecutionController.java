package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.ExecutionRequest;
import com.snippethub.api.dto.ExecutionResponse;
import com.snippethub.api.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<ExecutionResponse>> executeCode(
            @Valid @RequestBody ExecutionRequest request,
            @AuthenticationPrincipal(expression = "#this == 'anonymousUser' ? null : username") String email) {

        ExecutionResponse response = executionService.execute(request, email);
        return ResponseEntity.ok(ApiResponse.success("코드 실행 결과", response));
    }
}

