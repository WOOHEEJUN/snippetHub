package com.snippethub.api.service;

import com.snippethub.api.domain.File;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.Tag;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.snippet.SnippetCreateRequestDto;
import com.snippethub.api.dto.snippet.SnippetUpdateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SnippetService {

    private final SnippetRepository snippetRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final TagService tagService;

    @Transactional
    public Snippet createSnippet(SnippetCreateRequestDto requestDto, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Snippet snippet = Snippet.builder()
                .title(requestDto.getTitle())
                .description(requestDto.getDescription())
                .language(requestDto.getLanguage())
                .code(requestDto.getCode())
                .isPublic(requestDto.isPublic())
                .author(author)
                .build();

        if (requestDto.getTags() != null && !requestDto.getTags().isEmpty()) {
            List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
            snippet.getTags().addAll(tags);
        }

        Snippet savedSnippet = snippetRepository.save(snippet);

        if (requestDto.getFiles() != null && !requestDto.getFiles().isEmpty()) {
            for (MultipartFile file : requestDto.getFiles()) {
                fileService.uploadFile(file, "SNIPPET_ATTACHMENT", author.getEmail(), savedSnippet);
            }
        }

        return savedSnippet;
    }

    @Transactional
    public Snippet getSnippet(Long snippetId) {
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));
        snippet.increaseViewCount();
        return snippet;
    }

    public Page<Snippet> getSnippets(Pageable pageable, String language, String search) {
        if (language != null && search != null) {
            return snippetRepository.findByLanguageAndTitleContainingIgnoreCaseOrLanguageAndDescriptionContainingIgnoreCaseOrLanguageAndCodeContainingIgnoreCase(
                    language, search, language, search, language, search, pageable);
        } else if (language != null) {
            return snippetRepository.findByLanguage(language, pageable);
        } else if (search != null) {
            return snippetRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCodeContainingIgnoreCase(
                    search, search, search, pageable);
        } else {
            return snippetRepository.findAll(pageable);
        }
    }

    @Transactional
    public Snippet updateSnippet(Long snippetId, SnippetUpdateRequestDto requestDto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        if (!snippet.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        snippet.updateSnippet(requestDto.getTitle(), requestDto.getDescription(), requestDto.getLanguage(), requestDto.getCode(), requestDto.isPublic());

        if (requestDto.getTags() != null) {
            snippet.getTags().clear();
            List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
            snippet.getTags().addAll(tags);
        }

        // TODO: Handle file updates (add/remove)

        return snippet;
    }

    @Transactional
    public void deleteSnippet(Long snippetId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        if (!snippet.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        snippetRepository.delete(snippet);
    }
}

