import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";

export const accountBalance = pg.pgTable(
	"account_balances",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		balance: pg.numeric("balance", { precision: 12, scale: 4 }).notNull().default("0"),
		partnerId: pg.text("partner_id"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [pg.index().on(t.userId), pg.uniqueIndex("account_balances_user_id_unique_idx").on(t.userId)],
);

export const tokenTopUp = pg.pgTable(
	"token_top_ups",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		amount: pg.numeric("amount", { precision: 12, scale: 4 }).notNull(),
		costKes: pg.numeric("cost_kes", { precision: 10, scale: 2 }),
		currency: pg.text("currency").default("KES"),
		status: pg.text("status").notNull().default("unpaid"),
		transactionReference: pg.text("transaction_reference"),
		mpesaReceiptNumber: pg.text("mpesa_receipt_number"),
		checkoutRequestId: pg.text("checkout_request_id"),
		phoneNumber: pg.text("phone_number"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [
		pg.index().on(t.userId),
		pg.index().on(t.status),
		pg.index().on(t.checkoutRequestId),
		pg.index().on(t.userId, t.createdAt.desc()),
	],
);

export const usageRecord = pg.pgTable(
	"usage_records",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		topUpId: pg.text("top_up_id").references(() => tokenTopUp.id),
		itemId: pg.text("item_id"),
		itemType: pg.text("item_type"),
		previousBalance: pg.numeric("previous_balance", { precision: 12, scale: 4 }),
		tokenQuantity: pg.numeric("token_quantity", { precision: 12, scale: 4 }),
		newBalance: pg.numeric("new_balance", { precision: 12, scale: 4 }),
		usageType: pg.text("usage_type"),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		pg.index().on(t.userId),
		pg.index().on(t.topUpId),
		pg.index().on(t.itemId, t.itemType),
		pg.index().on(t.userId, t.createdAt.desc()),
	],
);
