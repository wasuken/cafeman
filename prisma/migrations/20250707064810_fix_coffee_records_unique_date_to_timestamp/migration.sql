/*
  Warnings:

  - A unique constraint covering the columns `[userId,timestamp]` on the table `coffee_records` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `coffee_records` DROP FOREIGN KEY `coffee_records_userId_fkey`;

-- DropIndex
DROP INDEX `coffee_records_userId_date_key` ON `coffee_records`;

-- CreateIndex
CREATE UNIQUE INDEX `coffee_records_userId_timestamp_key` ON `coffee_records`(`userId`, `timestamp`);

-- AddForeignKey
ALTER TABLE `coffee_records` ADD CONSTRAINT `coffee_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
