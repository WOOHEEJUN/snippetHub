package com.snippethub.api.repository;

import com.snippethub.api.domain.CodeExecution;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodeExecutionRepository extends JpaRepository<CodeExecution, String> {
}
