package com.snippethub.api.service;

import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Tag;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.post.PostCreateRequestDto;
import com.snippethub.api.dto.post.PostUpdateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final TagService tagService;
    private final PointService pointService;
    private final BadgeService badgeService;

    @Transactional
    public Post createPost(PostCreateRequestDto requestDto, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Post post = Post.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
                .isPublic(requestDto.isPublic())
                .author(author)
                .build();

        if (requestDto.getTags() != null && !requestDto.getTags().isEmpty()) {
            List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
            post.getTags().addAll(tags);
        }

        Post savedPost = postRepository.save(post);
        
        // 포인트 지급 및 뱃지 체크
        try {
            pointService.awardPointsForPost(author.getId(), savedPost.getId());
            badgeService.checkAndAwardBadges(author.getId());
        } catch (Exception e) {
            // 포인트/뱃지 시스템 오류가 게시글 작성에 영향을 주지 않도록 처리
            System.err.println("포인트/뱃지 시스템 오류: " + e.getMessage());
        }

        return savedPost;
    }

    @Transactional
    public Post getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        return post;
    }

    public Page<Post> getPosts(Pageable pageable, String category, String search) {
        if (search != null && search.trim().isEmpty()) {
            search = null;
        }
        if (category != null && search != null) {
            return postRepository.findByCategoryAndTitleContainingIgnoreCase(category, search, pageable);
        } else if (category != null) {
            return postRepository.findByCategory(category, pageable);
        } else if (search != null) {
            return postRepository.findByTitleContainingIgnoreCase(search, pageable);
        } else {
            return postRepository.findAll(pageable);
        }
    }

    @Transactional
    public Post updatePost(Long postId, PostUpdateRequestDto requestDto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        post.updatePost(requestDto.getTitle(), requestDto.getContent(), requestDto.getCategory(), requestDto.isPublic());

        if (requestDto.getTags() != null) {
            post.getTags().clear();
            List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
            post.getTags().addAll(tags);
        }

        return post;
    }

    @Transactional
    public void deletePost(Long postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        postRepository.delete(post);
    }
}
