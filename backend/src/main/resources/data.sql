-- 뱃지 데이터 초기화
-- 창작 뱃지
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('FIRST_POST', '첫 번째 게시글을 작성했습니다!', '📝', '#4CAF50', 'CREATION', 1, 10, false),
('FIRST_SNIPPET', '첫 번째 코드 스니펫을 작성했습니다!', '💻', '#2196F3', 'CREATION', 1, 15, false),
('POST_WRITER_5', '5개의 게시글을 작성했습니다!', '📚', '#FF9800', 'CREATION', 5, 20, false),
('POST_WRITER_10', '10개의 게시글을 작성했습니다!', '📖', '#9C27B0', 'CREATION', 10, 30, false),
('POST_WRITER_25', '25개의 게시글을 작성했습니다!', '📚', '#E91E63', 'CREATION', 25, 50, false),
('POST_WRITER_50', '50개의 게시글을 작성했습니다!', '📚', '#673AB7', 'CREATION', 50, 100, false),
('POST_WRITER_100', '100개의 게시글을 작성했습니다!', '📚', '#3F51B5', 'CREATION', 100, 200, false),
('SNIPPET_CREATOR_5', '5개의 코드 스니펫을 작성했습니다!', '💻', '#00BCD4', 'CREATION', 5, 25, false),
('SNIPPET_CREATOR_10', '10개의 코드 스니펫을 작성했습니다!', '💻', '#009688', 'CREATION', 10, 40, false),
('SNIPPET_CREATOR_25', '25개의 코드 스니펫을 작성했습니다!', '💻', '#795548', 'CREATION', 25, 75, false),
('SNIPPET_CREATOR_50', '50개의 코드 스니펫을 작성했습니다!', '💻', '#607D8B', 'CREATION', 50, 150, false),
('SNIPPET_CREATOR_100', '100개의 코드 스니펫을 작성했습니다!', '💻', '#FF5722', 'CREATION', 100, 300, false);

-- 참여 뱃지
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('FIRST_COMMENT', '첫 번째 댓글을 작성했습니다!', '💬', '#4CAF50', 'ENGAGEMENT', 1, 5, false),
('COMMENTATOR_10', '10개의 댓글을 작성했습니다!', '💬', '#8BC34A', 'ENGAGEMENT', 10, 15, false),
('COMMENTATOR_25', '25개의 댓글을 작성했습니다!', '💬', '#CDDC39', 'ENGAGEMENT', 25, 25, false),
('COMMENTATOR_50', '50개의 댓글을 작성했습니다!', '💬', '#FFEB3B', 'ENGAGEMENT', 50, 40, false),
('COMMENTATOR_100', '100개의 댓글을 작성했습니다!', '💬', '#FFC107', 'ENGAGEMENT', 100, 60, false),
('COMMENTATOR_250', '250개의 댓글을 작성했습니다!', '💬', '#FF9800', 'ENGAGEMENT', 250, 100, false),
('POPULAR_10', '10개의 좋아요를 받았습니다!', '❤️', '#F44336', 'ENGAGEMENT', 10, 20, false),
('POPULAR_25', '25개의 좋아요를 받았습니다!', '❤️', '#E91E63', 'ENGAGEMENT', 25, 35, false),
('POPULAR_50', '50개의 좋아요를 받았습니다!', '❤️', '#9C27B0', 'ENGAGEMENT', 50, 50, false),
('POPULAR_100', '100개의 좋아요를 받았습니다!', '❤️', '#673AB7', 'ENGAGEMENT', 100, 80, false),
('POPULAR_500', '500개의 좋아요를 받았습니다!', '❤️', '#3F51B5', 'ENGAGEMENT', 500, 200, false);

-- 성취 뱃지
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('CODE_RUNNER_10', '10번의 코드를 실행했습니다!', '▶️', '#4CAF50', 'ACHIEVEMENT', 10, 15, false),
('CODE_RUNNER_25', '25번의 코드를 실행했습니다!', '▶️', '#8BC34A', 'ACHIEVEMENT', 25, 25, false),
('CODE_RUNNER_50', '50번의 코드를 실행했습니다!', '▶️', '#CDDC39', 'ACHIEVEMENT', 50, 40, false),
('CODE_RUNNER_100', '100번의 코드를 실행했습니다!', '▶️', '#FFEB3B', 'ACHIEVEMENT', 100, 60, false),
('CODE_RUNNER_500', '500번의 코드를 실행했습니다!', '▶️', '#FFC107', 'ACHIEVEMENT', 500, 150, false),
('LOGIN_STREAK_7', '7일 연속으로 로그인했습니다!', '🔥', '#FF5722', 'ACHIEVEMENT', 7, 30, false),
('LOGIN_STREAK_30', '30일 연속으로 로그인했습니다!', '🔥', '#E91E63', 'ACHIEVEMENT', 30, 100, false),
('LOGIN_STREAK_100', '100일 연속으로 로그인했습니다!', '🔥', '#9C27B0', 'ACHIEVEMENT', 100, 300, false),
('LOGIN_STREAK_365', '365일 연속으로 로그인했습니다!', '🔥', '#673AB7', 'ACHIEVEMENT', 365, 1000, false),
('POINT_COLLECTOR_100', '100포인트를 획득했습니다!', '💰', '#FFD700', 'ACHIEVEMENT', 100, 0, false),
('POINT_COLLECTOR_500', '500포인트를 획득했습니다!', '💰', '#FFA500', 'ACHIEVEMENT', 500, 0, false),
('POINT_COLLECTOR_1000', '1000포인트를 획득했습니다!', '💰', '#FF6347', 'ACHIEVEMENT', 1000, 0, false),
('POINT_COLLECTOR_2500', '2500포인트를 획득했습니다!', '💰', '#FF4500', 'ACHIEVEMENT', 2500, 0, false),
('POINT_COLLECTOR_5000', '5000포인트를 획득했습니다!', '💰', '#DC143C', 'ACHIEVEMENT', 5000, 0, false),
('POINT_COLLECTOR_10000', '10000포인트를 획득했습니다!', '💰', '#8B0000', 'ACHIEVEMENT', 10000, 0, false);

-- 이정표 뱃지
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('SILVER_ACHIEVER', '실버 등급에 도달했습니다!', '🥈', '#C0C0C0', 'MILESTONE', 0, 50, false),
('GOLD_ACHIEVER', '골드 등급에 도달했습니다!', '🥇', '#FFD700', 'MILESTONE', 0, 100, false),
('PLATINUM_ACHIEVER', '플래티넘 등급에 도달했습니다!', '💎', '#E5E4E2', 'MILESTONE', 0, 200, false),
('DIAMOND_ACHIEVER', '다이아몬드 등급에 도달했습니다!', '💎', '#B9F2FF', 'MILESTONE', 0, 500, false),
('MASTER_ACHIEVER', '마스터 등급에 도달했습니다!', '👑', '#FF6B6B', 'MILESTONE', 0, 1000, false),
('GRANDMASTER_ACHIEVER', '그랜드마스터 등급에 도달했습니다!', '🏆', '#FFD93D', 'MILESTONE', 0, 2000, false),
('LEGEND_ACHIEVER', '레전드 등급에 도달했습니다!', '⭐', '#FF6B9D', 'MILESTONE', 0, 5000, false);

-- 커뮤니티 뱃지
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('WEEK_MEMBER', '1주일 동안 함께해주셨습니다!', '📅', '#4CAF50', 'COMMUNITY', 0, 20, false),
('MONTH_MEMBER', '1개월 동안 함께해주셨습니다!', '📅', '#2196F3', 'COMMUNITY', 0, 50, false),
('ONE_YEAR_MEMBER', '1년 동안 함께해주셨습니다!', '📅', '#FF9800', 'COMMUNITY', 0, 200, false);

-- 숨겨진 특별 뱃지 (놀라움 요소)
INSERT INTO badges (name, description, icon, color, category, required_count, points_reward, is_hidden) VALUES
('NIGHT_OWL', '새벽 3시에 활동하셨습니다!', '🦉', '#2C3E50', 'SPECIAL', 0, 100, true),
('EARLY_BIRD', '아침 6시에 활동하셨습니다!', '🐦', '#F39C12', 'SPECIAL', 0, 100, true),
('WEEKEND_WARRIOR', '주말에 10개 이상의 콘텐츠를 작성하셨습니다!', '⚔️', '#E74C3C', 'SPECIAL', 0, 150, true),
('LANGUAGE_MASTER', '5개 이상의 프로그래밍 언어로 스니펫을 작성하셨습니다!', '🌍', '#9B59B6', 'SPECIAL', 0, 200, true),
('HELPING_HAND', '다른 사용자의 질문에 50개 이상 답변하셨습니다!', '🤝', '#3498DB', 'SPECIAL', 0, 300, true); 