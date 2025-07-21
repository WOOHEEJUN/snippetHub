package com.snippethub.api.controller;

import com.snippethub.api.domain.File;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<File>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "OTHER") String type,
            @AuthenticationPrincipal UserDetails userDetails) {

        File uploadedFile = fileService.uploadFile(file, type, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("파일이 성공적으로 업로드되었습니다.", uploadedFile));
    }
}
