CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`color` text,
	`icon` text,
	`is_archived` integer DEFAULT false,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`period` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`category_id` text,
	`color` text,
	`icon` text,
	`is_active` integer DEFAULT true,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`color` text,
	`type` text NOT NULL,
	`parent_id` text,
	`sort_order` integer DEFAULT 0,
	`is_system` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `categorization_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`keyword` text NOT NULL,
	`category_id` text,
	`is_user_defined` integer DEFAULT false,
	`priority` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` text,
	`icon` text,
	`color` text,
	`is_completed` integer DEFAULT false,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`merchant` text,
	`date` text NOT NULL,
	`notes` text,
	`is_recurring` integer DEFAULT false,
	`recurring_rule` text,
	`import_hash` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
