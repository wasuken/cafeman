-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coffee_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "date" DATETIME NOT NULL,
    "cups" INTEGER NOT NULL DEFAULT 1,
    "timestamp" DATETIME NOT NULL,
    "coffeeType" TEXT,
    "size" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coffee_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "coffee_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 4,
    "warningThreshold" INTEGER NOT NULL DEFAULT 3,
    "minInterval" INTEGER NOT NULL DEFAULT 240,
    "cutoffTime" TEXT NOT NULL DEFAULT '18:00',
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableWarnings" BOOLEAN NOT NULL DEFAULT true,
    "defaultView" TEXT NOT NULL DEFAULT 'calendar',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coffee_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "coffee_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "caffeine" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coffee_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalCups" INTEGER NOT NULL DEFAULT 0,
    "avgCups" REAL NOT NULL DEFAULT 0,
    "maxCups" INTEGER NOT NULL DEFAULT 0,
    "activeDays" INTEGER NOT NULL DEFAULT 0,
    "breakdown" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coffee_goals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetCups" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAchieved" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "coffee_records_timestamp_idx" ON "coffee_records"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "coffee_records_userId_date_timestamp_key" ON "coffee_records"("userId", "date", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "coffee_settings_userId_key" ON "coffee_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coffee_types_name_key" ON "coffee_types"("name");

-- CreateIndex
CREATE INDEX "coffee_stats_userId_period_idx" ON "coffee_stats"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "coffee_stats_userId_period_date_key" ON "coffee_stats"("userId", "period", "date");

-- CreateIndex
CREATE INDEX "coffee_goals_userId_isActive_idx" ON "coffee_goals"("userId", "isActive");
