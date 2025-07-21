package com.snippethub.api.controller;

import com.snippethub.api.domain.Post;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.post.PostCreateRequestDto;
import com.snippethub.api.dto.post.PostResponseDto;
import com.snippethub.api.dto.post.PostUpdateRequestDto;
import com.snippethub.api.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponseDto>> createPost(
            @Valid @RequestBody PostCreateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post newPost = postService.createPost(requestDto, userDetails.getUsername());
        PostResponseDto responseDto = new PostResponseDto(newPost);

        return new ResponseEntity<>(ApiResponse.success("게시글이 성공적으로 작성되었습니다.", responseDto), HttpStatus.CREATED);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> getPost(@PathVariable Long postId) {
        Post post = postService.getPost(postId);
        PostResponseDto responseDto = new PostResponseDto(post);
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponseDto<PostResponseDto>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "LATEST") String sort) {

        Sort.Direction direction = Sort.Direction.DESC;
        String sortProperty = "createdAt";

        if ("POPULAR".equals(sort)) {
            sortProperty = "likeCount";
        } else if ("VIEWS".equals(sort)) {
            sortProperty = "viewCount";
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));
        Page<Post> postsPage = postService.getPosts(pageable, category, search);

        PageResponseDto<PostResponseDto> responseDto = new PageResponseDto<>(
                postsPage.map(PostResponseDto::new)
        );

        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post updatedPost = postService.updatePost(postId, requestDto, userDetails.getUsername());
        PostResponseDto responseDto = new PostResponseDto(updatedPost);
        return ResponseEntity.ok(ApiResponse.success("게시글이 성공적으로 수정되었습니다.", responseDto));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<String>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        postService.deletePost(postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("게시글이 성공적으로 삭제되었습니다."));
    }
}
