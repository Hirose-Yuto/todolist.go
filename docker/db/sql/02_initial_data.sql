# INSERT INTO `users` (`id`, `account_name`, `password_hash`) VALUES (1, 'web', '___');
# INSERT INTO `users` (`id`, `account_name`, `password_hash`) VALUES (2,
#                                                         'pro', '___');
#
# INSERT INTO `tasks` (`id`, `title`) VALUES (1, 'sample-task-01');
# INSERT INTO `tasks` (`id`, `title`) VALUES (2, 'sample-task-02');
# INSERT INTO `tasks` (`id`, `title`, `memo`) VALUES (3, 'sample-task-03', '3つ目のタスク');
# INSERT INTO `tasks` (`id`, `title`, `deadline`) VALUES (4, 'sample-task-04', '2022-12-23 00:00:00');
# INSERT INTO `tasks` (`id`, `title`, `is_done`) VALUES (5, 'sample-task-05', true);
# INSERT INTO `tasks` (`id`, `title`, `memo`, `priority`) VALUES (6, 'sample-task-06', '超重要タスク', 9);
# INSERT INTO `tasks` (`id`, `title`, `memo`, `deadline`, `priority`) VALUES (7, 'sample-task-07', 'まあまあ超重要タスク', '2022-11-27 00:00:00', 9);
#
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (1, 1);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (1, 3);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (1, 4);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (1, 5);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (2, 2);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (2, 4);
# INSERT INTO `users_have_tasks` (`user_id`, `task_id`) VALUES (2, 5);
#
# INSERT INTO `tags` (`id`, `description`) VALUES (1, 'サンプル');
# INSERT INTO `tags` (`id`, `description`) VALUES (2, '共通');
#
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (1, 1);
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (2, 1);
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (3, 1);
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (4, 1);
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (4, 2);
# INSERT INTO `tasks_have_tags` (`task_id`, `tag_id`) VALUES (5, 2);
#
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('最初のタスク&コメント', 1, 1);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('追加でコメント', 1, 1);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('さらに追加でコメント', 2, 1);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('これは後回し', 1, 1);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('これは後回し', 2, 2);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('proくん、頑張って', 1, 6);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('webさんがやってくださいよ', 2, 6);
# INSERT INTO `comments` (`content`, `user_id`, `task_id`) VALUES ('やだよ', 1,  6);