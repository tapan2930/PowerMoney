-- Add to_account_id column to transactions for transfer support
ALTER TABLE `transactions` ADD `to_account_id` text;
--> statement-breakpoint
-- Add recurring_transaction_id column to link generated transactions to their recurring parent
ALTER TABLE `transactions` ADD `recurring_transaction_id` text;
--> statement-breakpoint
-- Create recurring_transactions table
CREATE TABLE `recurring_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`account_id` text NOT NULL,
	`to_account_id` text,
	`category_id` text,
	`description` text,
	`merchant` text,
	`frequency` text NOT NULL,
	`interval` integer DEFAULT 1 NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`max_occurrences` integer,
	`completed_occurrences` integer DEFAULT 0 NOT NULL,
	`next_run_date` text NOT NULL,
	`last_run_date` text,
	`is_active` integer DEFAULT true,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
