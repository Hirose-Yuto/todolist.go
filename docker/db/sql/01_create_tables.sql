DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_tokens`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `users_have_tasks`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `tasks_have_tags`;
DROP TABLE IF EXISTS `comments`;

CREATE TABLE `users`
(
    `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
    `account_name`  varchar(255) NOT NULL UNIQUE,
    `password_hash` binary(32)   NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `user_token_uuids`
(
    `id`         bigint(20) NOT NULL AUTO_INCREMENT,
    `uuid`       longtext,
    `user_id`    bigint(20) NOT NULL,
    `expired_at` datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES users (`id`)
) DEFAULT CHARSET = utf8mb4;


CREATE TABLE `tasks`
(
    `id`         bigint(20)  NOT NULL AUTO_INCREMENT,
    `title`      varchar(50) NOT NULL,
    `memo`       longtext,
    `is_done`    boolean     NOT NULL DEFAULT b'0',
    `priority`   int(10)     NOT NULL DEFAULT '5',
    `deadline`   datetime    NOT NULL DEFAULT '1970-01-01 09:00:00',
    `created_at` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `users_have_tasks`
(
    `id`      bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) NOT NULL,
    `task_id` bigint(20) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES users (`id`),
    FOREIGN KEY (`task_id`) REFERENCES tasks (`id`)
) DEFAULT CHARSET = utf8mb4;


CREATE TABLE `tags`
(
    `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
    `description` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `tasks_have_tags`
(
    `id`      bigint(20) NOT NULL AUTO_INCREMENT,
    `task_id` bigint(20) NOT NULL,
    `tag_id`  bigint(20) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`task_id`) REFERENCES tasks (`id`),
    FOREIGN KEY (`tag_id`) REFERENCES tags (`id`)
) DEFAULT CHARSET = utf8mb4;


CREATE TABLE `comments`
(
    `id`         bigint(20) NOT NULL AUTO_INCREMENT,
    `content`    longtext,
    `user_id`    bigint(20) NOT NULL,
    `task_id`    bigint(20) NOT NULL,
    `created_at` datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES users (`id`),
    FOREIGN KEY (`task_id`) REFERENCES tasks (`id`)
) DEFAULT CHARSET = utf8mb4;
