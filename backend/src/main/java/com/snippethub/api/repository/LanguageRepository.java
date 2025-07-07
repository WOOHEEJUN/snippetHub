package com.snippethub.api.repository;

import com.snippethub.api.domain.Language;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, Integer> {
} 