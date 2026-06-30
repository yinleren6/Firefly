
ALTER TABLE pageviews ADD COLUMN post_uid TEXT;


CREATE INDEX IF NOT EXISTS idx_pageviews_date ON pageviews(is_crawler, created_at);


CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(is_crawler, path, post_uid);


CREATE INDEX IF NOT EXISTS idx_pageviews_referrer ON pageviews(is_crawler, referrer);


UPDATE pageviews SET post_uid = '31cac002-5ac9-49e7-936e-4f2aa1c0f805' WHERE path = '/posts/系统配置与服务优化指南/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '0276e369-9d0c-4670-bb7b-c4e82102af29' WHERE path = '/posts/用户账户控制/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'fa90bc32-1a93-4253-bc17-67afff95f695' WHERE path = '/posts/泰拉瑞亚服务器搭建教程/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '59d15564-0b43-45d6-842d-a727eefe5052' WHERE path = '/posts/注册表优化/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '6ac8004d-54ad-4a34-a6c1-abb054c8304f' WHERE path = '/posts/文件资源管理器/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'ab2dbbe8-95ee-41af-b340-435073f4a4cd' WHERE path = '/posts/文件类型关联机制详解/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '81642af6-ec62-4582-86ca-3c3b03ab3fa9' WHERE path = '/posts/开机自启动的多种方式/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '8908800a-2901-4409-891b-6d9d95198ed4' WHERE path = '/posts/实用工具脚本合集/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'cfd22800-62c7-41e9-a96a-49deeac22900' WHERE path = '/posts/好想玩原神/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '200b2729-26a1-4297-afe4-6ec8ea5b88ce' WHERE path = '/posts/命令行/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '57c24092-ac41-4556-825b-0f613279f262' WHERE path = '/posts/右键菜单清理与定制/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '2a9ecc56-37f4-471b-8333-06993ff52af1' WHERE path = '/posts/video/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '45afe9b9-afe2-4b1d-9fa3-ee979a81a72b' WHERE path = '/posts/tools/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'b1a7f91e-c47c-4499-94e3-deaea0601509' WHERE path = '/posts/Terraria/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '5b0f4837-bde6-4e80-b882-601e024327ee' WHERE path = '/posts/mdx-example/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '4b9ddd4b-4e0f-4c7b-a868-8f80aef65c36' WHERE path = '/posts/markdown-tutorial/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'e92104eb-0149-43b8-87a4-be9f90d71a44' WHERE path = '/posts/markdown-plantuml/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'c6179c02-1776-4f26-a0c4-af95ec56ad1e' WHERE path = '/posts/markdown-mermaid/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '8298d53b-b67a-42f3-a4a7-f6eca0429219' WHERE path = '/posts/markdown-extended/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'a5603309-0287-4ede-bd4e-da87ac59d267' WHERE path = '/posts/Linux搭建iSCSI服务器流程/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '78a882b1-3d7a-408b-9986-f77cb9a72962' WHERE path = '/posts/katex-math-example/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '03a660b2-749b-492a-8173-6deb158846bd' WHERE path = '/posts/game/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '28547fa7-ad85-48fe-b54e-f1cda01b1f7a' WHERE path = '/posts/firefly/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'a3e558c9-b260-40dc-a861-3b6997824379' WHERE path = '/posts/firefly-layout-system/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '795ff439-69af-4ec0-9dd8-db60091fb0cc' WHERE path = '/posts/Factorio/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'cb6684a8-de9a-4a70-94d6-80c5640c3c85' WHERE path = '/posts/encrypted-demo/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'b5e38bc6-64ae-4dfb-88a8-4b87d13991d9' WHERE path = '/posts/draft/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '7081bd3f-7a94-444f-bc33-54dec7a8338c' WHERE path = '/posts/code-examples/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '9f22de82-530e-4be5-8752-171d5be54a71' WHERE path = '/posts/(目录集合)Windows-自定义设置指南/' AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'd29fb880-9af7-4caa-89a6-57a732342617' WHERE path = '/posts/guide/index/' AND (post_uid IS NULL OR post_uid = '');

UPDATE pageviews SET post_uid = '795ff439-69af-4ec0-9dd8-db60091fb0cc' WHERE LOWER(path) = LOWER('/posts/Factorio/') AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = '795ff439-69af-4ec0-9dd8-db60091fb0cc' WHERE LOWER(path) = LOWER('/Factorio/') AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'b1a7f91e-c47c-4499-94e3-deaea0601509' WHERE LOWER(path) = LOWER('/posts/Terraria/') AND (post_uid IS NULL OR post_uid = '');
UPDATE pageviews SET post_uid = 'b1a7f91e-c47c-4499-94e3-deaea0601509' WHERE LOWER(path) = LOWER('/Terraria/') AND (post_uid IS NULL OR post_uid = '');
