-- 테스트용 사용자 추가 (비밀번호는 중요하지 않음)
INSERT INTO users (id, email, password, nickname, created_at, is_active, is_verified)
VALUES (1, 'test@example.com', 'password', 'testuser', NOW(), 1, 1);

-- 테스트용 게시글 추가
INSERT INTO posts (author_id, title, content, category, created_at, is_public, view_count, like_count, comment_count)
VALUES
(1, '첫 번째 테스트 게시글입니다', '이것은 SnippetHub의 첫 번째 게시글 내용입니다. 잘 보이나요?', 'GENERAL', NOW(), 1, 10, 2, 0),
(1, '리액트(React) 질문 있습니다!', 'React에서 상태 관리를 할 때 Redux 말고 다른 좋은 라이브러리가 있을까요? Context API는 어떻게 생각하시나요?', 'QNA', NOW(), 1, 25, 5, 0);

-- 테스트용 코드 스니펫 추가
INSERT INTO snippets (author_id, title, description, language, code, created_at, is_public, view_count, like_count, comment_count)
VALUES
(1, 'Python Hello World 예제', '파이썬으로 콘솔에 "Hello, World!"를 출력하는 가장 기본적인 코드입니다.', 'python', 'print("Hello, World!")', NOW(), 1, 30, 7, 0),
(1, 'JavaScript 배열 합계 구하기', 'JavaScript의 reduce 함수를 사용하여 배열의 모든 요소의 합계를 구하는 스니펫입니다.', 'javascript', 'const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, currentValue) => acc + currentValue, 0);
console.log(sum); // 15', NOW(), 1, 50, 12, 0);
