import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  salt: text("salt").notNull(),
  password: text("password").notNull(),
  recovery: text("recovery").notNull(),
  created: integer("created").notNull(),
});
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expires: integer("expires").notNull(),
});
export const states = sqliteTable("states", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(0),
});
export const attempts = sqliteTable("attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  reset: integer("reset").notNull(),
});
