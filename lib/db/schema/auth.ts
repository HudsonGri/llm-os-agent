import { pgTable, serial, varchar, timestamp, boolean, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  description: text("description"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  accessCodeId: integer("access_code_id").references(() => accessCodes.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

// Define relations between tables
export const accessCodesRelations = relations(accessCodes, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  accessCode: one(accessCodes, {
    fields: [sessions.accessCodeId],
    references: [accessCodes.id],
  }),
})); 