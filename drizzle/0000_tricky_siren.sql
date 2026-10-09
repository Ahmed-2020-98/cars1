CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`model` text NOT NULL,
	`service` text NOT NULL,
	`vehicle` text NOT NULL,
	`day` text NOT NULL,
	`hour` integer NOT NULL,
	`duration` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_reference_unique` ON `bookings` (`reference`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`day` text NOT NULL,
	`hour` integer NOT NULL,
	`booking_id` text NOT NULL,
	PRIMARY KEY(`day`, `hour`),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
