ALTER TABLE "user" ADD COLUMN "cvpap_partner_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_cvpap_partner_id_key" UNIQUE("cvpap_partner_id");
