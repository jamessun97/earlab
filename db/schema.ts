import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const progress = sqliteTable('listening_progress', {
 userId: text('user_id').primaryKey(),
 state: text('state').notNull(),
 revision: integer('revision').notNull().default(0),
 updatedAt: integer('updated_at').notNull(),
});
