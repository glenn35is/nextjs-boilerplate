import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both Replit Auth and Local Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(), // for local auth
  password: varchar("password"), // for local auth, hashed
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  resetToken: varchar("reset_token"), // for password reset
  resetTokenExpiry: timestamp("reset_token_expiry"), // for password reset
  subscriptionEndTime: timestamp("subscription_end_time"),
  totalHoursPurchased: decimal("total_hours_purchased", { precision: 10, scale: 2 }).default("0"),
  mainWalletId: varchar("main_wallet_id"), // User's main production wallet
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;

export const tradingBots = pgTable("trading_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("stopped"), // stopped, running, paused
  mode: text("mode").notNull(), // volume, market-making, ranking
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(),
  publicKey: text("public_key").notNull().unique(),
  privateKey: text("private_key").notNull(), // encrypted
  balance: decimal("balance", { precision: 18, scale: 9 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(),
  walletId: varchar("wallet_id").notNull(),
  signature: text("signature").notNull().unique(),
  type: text("type").notNull(), // buy, sell
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  price: decimal("price", { precision: 18, scale: 9 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  blockTime: timestamp("block_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const statistics = pgTable("statistics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(),
  date: timestamp("date").notNull(),
  volume24h: decimal("volume_24h", { precision: 18, scale: 2 }).notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  activeWallets: integer("active_wallets").notNull().default(0),
});

// Subscription purchases table
export const subscriptionPurchases = pgTable("subscription_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  hours: decimal("hours", { precision: 10, scale: 2 }).notNull(),
  solAmount: decimal("sol_amount", { precision: 18, scale: 9 }).notNull(),
  transactionSignature: text("transaction_signature"),
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Replit Auth compatible types
export type UpsertUser = typeof users.$inferInsert;

export const insertTradingBotSchema = createInsertSchema(tradingBots).pick({
  name: true,
  mode: true,
  config: true,
}).extend({
  config: z.object({
    purchaseLimit: z.number().min(0.01),
    speed: z.enum(["ultra-light", "light", "normal", "fast"]),
    tokenAddress: z.string().optional(),
    slippage: z.number().min(0.1).max(10).default(1),
  }),
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  botId: true,
  publicKey: true,
  privateKey: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  botId: true,
  walletId: true,
  signature: true,
  type: true,
  amount: true,
  price: true,
});

// Types
export type InsertTradingBot = z.infer<typeof insertTradingBotSchema>;
export type TradingBot = typeof tradingBots.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type Statistics = typeof statistics.$inferSelect;
