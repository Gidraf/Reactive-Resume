CREATE TABLE IF NOT EXISTS "account_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(12, 4) NOT NULL DEFAULT '0',
	"partner_id" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_top_ups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"cost_kes" numeric(10, 2),
	"currency" text DEFAULT 'KES',
	"status" text NOT NULL DEFAULT 'unpaid',
	"transaction_reference" text,
	"mpesa_receipt_number" text,
	"checkout_request_id" text,
	"phone_number" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"top_up_id" text,
	"item_id" text,
	"item_type" text,
	"previous_balance" numeric(12, 4),
	"token_quantity" numeric(12, 4),
	"new_balance" numeric(12, 4),
	"usage_type" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_users" (
	"id" text PRIMARY KEY NOT NULL,
	"whatsapp_name" text,
	"whatsapp_number" text NOT NULL,
	"phone_number" text,
	"email_address" text,
	"user_id" text,
	"partner_id" text,
	"loyalty_points" integer DEFAULT 0,
	"dnd_enabled" boolean DEFAULT false,
	"login_token" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT "whatsapp_users_whatsapp_number_unique" UNIQUE("whatsapp_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cv_resume_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"whatsapp_user_id" text,
	"user_id" text,
	"payment_status" text NOT NULL DEFAULT 'unpaid',
	"has_image" boolean DEFAULT false,
	"price_kes" numeric(8, 2) NOT NULL DEFAULT '100',
	"revision_count" integer DEFAULT 0,
	"max_revisions" integer DEFAULT 5,
	"expires_at" timestamp with time zone,
	"processing_type" text DEFAULT 'bot',
	"mpesa_checkout_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_balances_user_id_unique_idx" ON "account_balances" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_balances_user_id_idx" ON "account_balances" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_top_ups_user_id_idx" ON "token_top_ups" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_top_ups_status_idx" ON "token_top_ups" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_top_ups_checkout_request_id_idx" ON "token_top_ups" USING btree ("checkout_request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_top_ups_user_id_created_at_idx" ON "token_top_ups" USING btree ("user_id","created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_records_user_id_idx" ON "usage_records" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_records_top_up_id_idx" ON "usage_records" USING btree ("top_up_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_records_item_id_item_type_idx" ON "usage_records" USING btree ("item_id","item_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_records_user_id_created_at_idx" ON "usage_records" USING btree ("user_id","created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_users_user_id_idx" ON "whatsapp_users" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_users_whatsapp_number_idx" ON "whatsapp_users" USING btree ("whatsapp_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_users_email_address_idx" ON "whatsapp_users" USING btree ("email_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_resume_id_idx" ON "cv_resume_orders" USING btree ("resume_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_user_id_idx" ON "cv_resume_orders" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_whatsapp_user_id_idx" ON "cv_resume_orders" USING btree ("whatsapp_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_payment_status_idx" ON "cv_resume_orders" USING btree ("payment_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_mpesa_checkout_id_idx" ON "cv_resume_orders" USING btree ("mpesa_checkout_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_resume_orders_user_id_created_at_idx" ON "cv_resume_orders" USING btree ("user_id","created_at" DESC);
