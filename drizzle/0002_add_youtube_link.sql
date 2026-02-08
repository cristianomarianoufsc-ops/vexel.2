-- Custom migration to add Vexel YouTube link
-- We assume the first user (id=1) is the owner/main user for this context
INSERT INTO `socialMediaLinks` (`userId`, `platform`, `url`, `username`, `createdAt`, `updatedAt`)
VALUES (1, 'YouTube', 'https://www.youtube.com/@bandavexel', 'bandavexel', NOW(), NOW());
