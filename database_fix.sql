-- 데이터베이스 컬럼 크기 수정 스크립트
-- 코드 실행 테이블 수정
ALTER TABLE code_executions 
MODIFY COLUMN code TEXT,
MODIFY COLUMN error_data TEXT,
MODIFY COLUMN input_data TEXT,
MODIFY COLUMN output_data TEXT;

-- 문제 제출 테이블 수정
ALTER TABLE problem_submissions 
MODIFY COLUMN error_message TEXT,
MODIFY COLUMN output TEXT,
MODIFY COLUMN submitted_code TEXT;

-- 스니펫 테이블도 확인 (필요시)
ALTER TABLE snippets 
MODIFY COLUMN code TEXT,
MODIFY COLUMN description TEXT;

-- 포스트 테이블도 확인 (필요시)
ALTER TABLE posts 
MODIFY COLUMN content TEXT;

-- 댓글 테이블도 확인 (필요시)
ALTER TABLE comments 
MODIFY COLUMN content TEXT;

-- 변경사항 확인
DESCRIBE code_executions;
DESCRIBE problem_submissions;
DESCRIBE snippets;
DESCRIBE posts;
DESCRIBE comments;
