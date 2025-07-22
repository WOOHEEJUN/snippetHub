drop database snippethub_db;
create database  snippethub_db;
use  snippethub_db;

-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema snippethub_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema snippethub_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `snippethub_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `snippethub_db` ;

-- -----------------------------------------------------
-- Table `snippethub_db`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`users` (
  `is_active` BIT(1) NULL DEFAULT NULL,
  `is_verified` BIT(1) NULL DEFAULT NULL,
  `points` INT NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `last_login_at` DATETIME(6) NULL DEFAULT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `level` VARCHAR(20) NULL DEFAULT NULL,
  `nickname` VARCHAR(50) NOT NULL,
  `profile_image` VARCHAR(500) NULL DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `bio` TINYTEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UK2ty1xmrrgtn89xt7kyxx6ta7h` (`nickname` ASC) VISIBLE,
  UNIQUE INDEX `UK6dotkott2kjsp8vw4d0m25fb7` (`email` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE users
ADD COLUMN provider VARCHAR(20) NULL,         -- 'kakao', 'google', 'naver', 'local' 등
ADD COLUMN provider_id VARCHAR(100) NULL;     -- 소셜 서비스에서 받은 고유 ID



-- -----------------------------------------------------
-- Table `snippethub_db`.`snippets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`snippets` (
  `comment_count` INT NULL DEFAULT NULL,
  `is_public` BIT(1) NULL DEFAULT NULL,
  `like_count` INT NULL DEFAULT NULL,
  `run_count` INT NULL DEFAULT NULL,
  `view_count` INT NULL DEFAULT NULL,
  `author_id` BIGINT NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `language` VARCHAR(20) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `code` TINYTEXT NOT NULL,
  `description` TINYTEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKq2ifp97y5w14r26kowsww75bj` (`author_id` ASC) VISIBLE,
  CONSTRAINT `FKq2ifp97y5w14r26kowsww75bj`
    FOREIGN KEY (`author_id`)
    REFERENCES `snippethub_db`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`code_executions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`code_executions` (
  `execution_time` INT NULL DEFAULT NULL,
  `memory_used` INT NULL DEFAULT NULL,
  `executed_at` DATETIME(6) NULL DEFAULT NULL,
  `snippet_id` BIGINT NULL DEFAULT NULL,
  `user_id` BIGINT NULL DEFAULT NULL,
  `language` VARCHAR(20) NOT NULL,
  `id` VARCHAR(255) NOT NULL,
  `code` TINYTEXT NOT NULL,
  `error_data` TINYTEXT NULL DEFAULT NULL,
  `input_data` TINYTEXT NULL DEFAULT NULL,
  `output_data` TINYTEXT NULL DEFAULT NULL,
  `status` ENUM('ERROR', 'MEMORY_LIMIT', 'SUCCESS', 'TIMEOUT') NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKebxb4adxfhgcrfoetdudd9sf4` (`snippet_id` ASC) VISIBLE,
  INDEX `FKbdgrlh1r0mbiji29cn15wln92` (`user_id` ASC) VISIBLE,
  CONSTRAINT `FKbdgrlh1r0mbiji29cn15wln92`
    FOREIGN KEY (`user_id`)
    REFERENCES `snippethub_db`.`users` (`id`),
  CONSTRAINT `FKebxb4adxfhgcrfoetdudd9sf4`
    FOREIGN KEY (`snippet_id`)
    REFERENCES `snippethub_db`.`snippets` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`posts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`posts` (
  `comment_count` INT NULL DEFAULT NULL,
  `is_public` BIT(1) NULL DEFAULT NULL,
  `like_count` INT NULL DEFAULT NULL,
  `view_count` INT NULL DEFAULT NULL,
  `author_id` BIGINT NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `category` VARCHAR(20) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `content` TINYTEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FK6xvn0811tkyo3nfjk2xvqx6ns` (`author_id` ASC) VISIBLE,
  CONSTRAINT `FK6xvn0811tkyo3nfjk2xvqx6ns`
    FOREIGN KEY (`author_id`)
    REFERENCES `snippethub_db`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`comments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`comments` (
  `author_id` BIGINT NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NULL DEFAULT NULL,
  `post_id` BIGINT NULL DEFAULT NULL,
  `snippet_id` BIGINT NULL DEFAULT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `content` TINYTEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKn2na60ukhs76ibtpt9burkm27` (`author_id` ASC) VISIBLE,
  INDEX `FKlri30okf66phtcgbe5pok7cc0` (`parent_id` ASC) VISIBLE,
  INDEX `FKh4c7lvsc298whoyd4w9ta25cr` (`post_id` ASC) VISIBLE,
  INDEX `FKlb7kv35k18hcb08sar685cd5k` (`snippet_id` ASC) VISIBLE,
  CONSTRAINT `FKh4c7lvsc298whoyd4w9ta25cr`
    FOREIGN KEY (`post_id`)
    REFERENCES `snippethub_db`.`posts` (`id`),
  CONSTRAINT `FKlb7kv35k18hcb08sar685cd5k`
    FOREIGN KEY (`snippet_id`)
    REFERENCES `snippethub_db`.`snippets` (`id`),
  CONSTRAINT `FKlri30okf66phtcgbe5pok7cc0`
    FOREIGN KEY (`parent_id`)
    REFERENCES `snippethub_db`.`comments` (`id`),
  CONSTRAINT `FKn2na60ukhs76ibtpt9burkm27`
    FOREIGN KEY (`author_id`)
    REFERENCES `snippethub_db`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`files`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`files` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `file_size` BIGINT NOT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `snippet_id` BIGINT NULL DEFAULT NULL,
  `user_id` BIGINT NULL DEFAULT NULL,
  `file_type` VARCHAR(50) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKkdin1pme8kcbi8eaatsygdpum` (`snippet_id` ASC) VISIBLE,
  INDEX `FKdgr5hx49828s5vhjo1s8q3wdp` (`user_id` ASC) VISIBLE,
  CONSTRAINT `FKdgr5hx49828s5vhjo1s8q3wdp`
    FOREIGN KEY (`user_id`)
    REFERENCES `snippethub_db`.`users` (`id`),
  CONSTRAINT `FKkdin1pme8kcbi8eaatsygdpum`
    FOREIGN KEY (`snippet_id`)
    REFERENCES `snippethub_db`.`snippets` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`languages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`languages` (
  `language_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`language_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`likes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`likes` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NULL DEFAULT NULL,
  `snippet_id` BIGINT NULL DEFAULT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKry8tnr4x2vwemv2bb0h5hyl0x` (`post_id` ASC) VISIBLE,
  INDEX `FK5gc70xu3jvlhmsqcuddcbp9xk` (`snippet_id` ASC) VISIBLE,
  INDEX `FKnvx9seeqqyy71bij291pwiwrg` (`user_id` ASC) VISIBLE,
  CONSTRAINT `FK5gc70xu3jvlhmsqcuddcbp9xk`
    FOREIGN KEY (`snippet_id`)
    REFERENCES `snippethub_db`.`snippets` (`id`),
  CONSTRAINT `FKnvx9seeqqyy71bij291pwiwrg`
    FOREIGN KEY (`user_id`)
    REFERENCES `snippethub_db`.`users` (`id`),
  CONSTRAINT `FKry8tnr4x2vwemv2bb0h5hyl0x`
    FOREIGN KEY (`post_id`)
    REFERENCES `snippethub_db`.`posts` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`notifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`notifications` (
  `is_read` BIT(1) NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TINYTEXT NOT NULL,
  `type` ENUM('COMMENT', 'FOLLOW', 'LIKE', 'SYSTEM') NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FK9y21adhxn0ayjhfocscqox7bh` (`user_id` ASC) VISIBLE,
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh`
    FOREIGN KEY (`user_id`)
    REFERENCES `snippethub_db`.`users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`refresh_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`refresh_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiry_date` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX (`user_id`),
  CONSTRAINT fk_refresh_user FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`password_reset_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`password_reset_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiry_date` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX (`user_id`),
  UNIQUE INDEX (`token`),
  CONSTRAINT fk_passwordreset_user FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`tags` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UKt48xdq560gs3gap9g7jg36kgc` (`name` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`post_tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`post_tags` (
  `post_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  INDEX `FKm6cfovkyqvu5rlm6ahdx3eavj` (`tag_id` ASC) VISIBLE,
  INDEX `FKkifam22p4s1nm3bkmp1igcn5w` (`post_id` ASC) VISIBLE,
  CONSTRAINT `FKkifam22p4s1nm3bkmp1igcn5w`
    FOREIGN KEY (`post_id`)
    REFERENCES `snippethub_db`.`posts` (`id`),
  CONSTRAINT `FKm6cfovkyqvu5rlm6ahdx3eavj`
    FOREIGN KEY (`tag_id`)
    REFERENCES `snippethub_db`.`tags` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `snippethub_db`.`verification_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `snippethub_db`.`verification_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiry_date` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX (`user_id`),
  UNIQUE INDEX (`token`),
  CONSTRAINT fk_verification_user FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
