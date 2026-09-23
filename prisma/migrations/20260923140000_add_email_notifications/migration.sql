ALTER TABLE `User` ADD COLUMN `resetTokenHash` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `resetTokenExpiresAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD UNIQUE INDEX `User_resetTokenHash_key`(`resetTokenHash`);
ALTER TABLE `Task` ADD COLUMN `reminder24SentAt` DATETIME(3) NULL;
ALTER TABLE `Task` ADD COLUMN `reminder1SentAt` DATETIME(3) NULL;
