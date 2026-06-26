import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";
import { resume } from "./resume";

export const whatsappUser = pg.pgTable(
	"whatsapp_users",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		whatsappName: pg.text("whatsapp_name"),
		whatsappNumber: pg.text("whatsapp_number").notNull().unique(),
		phoneNumber: pg.text("phone_number"),
		emailAddress: pg.text("email_address"),
		userId: pg.text("user_id").references(() => user.id, { onDelete: "set null" }),
		partnerId: pg.text("partner_id"),
		loyaltyPoints: pg.integer("loyalty_points").default(0),
		dndEnabled: pg.boolean("dnd_enabled").default(false),
		loginToken: pg.text("login_token"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [pg.index().on(t.userId), pg.index().on(t.whatsappNumber), pg.index().on(t.emailAddress)],
);

export const cvResumeOrder = pg.pgTable(
	"cv_resume_orders",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		resumeId: pg
			.text("resume_id")
			.notNull()
			.references(() => resume.id, { onDelete: "cascade" }),
		whatsappUserId: pg.text("whatsapp_user_id").references(() => whatsappUser.id, { onDelete: "set null" }),
		userId: pg.text("user_id").references(() => user.id, { onDelete: "cascade" }),
		paymentStatus: pg.text("payment_status").notNull().default("unpaid"),
		hasImage: pg.boolean("has_image").default(false),
		priceKes: pg.numeric("price_kes", { precision: 8, scale: 2 }).notNull().default("100"),
		revisionCount: pg.integer("revision_count").default(0),
		maxRevisions: pg.integer("max_revisions").default(5),
		expiresAt: pg.timestamp("expires_at", { withTimezone: true }),
		processingType: pg.text("processing_type").default("bot"),
		mpesaCheckoutId: pg.text("mpesa_checkout_id"),
		paidAt: pg.timestamp("paid_at", { withTimezone: true }),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [
		pg.index().on(t.resumeId),
		pg.index().on(t.userId),
		pg.index().on(t.whatsappUserId),
		pg.index().on(t.paymentStatus),
		pg.index().on(t.mpesaCheckoutId),
		pg.index().on(t.userId, t.createdAt.desc()),
	],
);
