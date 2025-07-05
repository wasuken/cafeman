-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL DEFAULT 'default-user',
    `date` DATE NOT NULL,
    `cups` INTEGER NOT NULL DEFAULT 1,
    `timestamp` DATETIME(3) NOT NULL,
    `coffeeType` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `coffee_records_userId_date_idx`(`userId`, `date`),
    INDEX `coffee_records_timestamp_idx`(`timestamp`),
    UNIQUE INDEX `coffee_records_userId_date_timestamp_key`(`userId`, `date`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `dailyLimit` INTEGER NOT NULL DEFAULT 4,
    `warningThreshold` INTEGER NOT NULL DEFAULT 3,
    `minInterval` INTEGER NOT NULL DEFAULT 240,
    `cutoffTime` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `enableNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableWarnings` BOOLEAN NOT NULL DEFAULT true,
    `defaultView` VARCHAR(191) NOT NULL DEFAULT 'calendar',
    `weekStartsOn` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coffee_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `caffeine` INTEGER NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coffee_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalCups` INTEGER NOT NULL DEFAULT 0,
    `avgCups` DOUBLE NOT NULL DEFAULT 0,
    `maxCups` INTEGER NOT NULL DEFAULT 0,
    `activeDays` INTEGER NOT NULL DEFAULT 0,
    `breakdown` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `coffee_stats_userId_period_idx`(`userId`, `period`),
    UNIQUE INDEX `coffee_stats_userId_period_date_key`(`userId`, `period`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_goals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `targetCups` INTEGER NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAchieved` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `coffee_goals_userId_isActive_idx`(`userId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coffee_records` ADD CONSTRAINT `coffee_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_settings` ADD CONSTRAINT `coffee_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
