import { pgTable, uuid, text, date, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryEnum = pgEnum('category', ['Adult', 'Child', 'Student']);
export const healthTypeEnum = pgEnum('health_type', ['Permanent', 'Temporary']);
export const healthSeverityEnum = pgEnum('health_severity', ['Info', 'Warning', 'Critical']);
export const walletStatusEnum = pgEnum('wallet_status', ['Active', 'Empty', 'Cancelled']);
export const slotTypeEnum = pgEnum('slot_type', ['Group', 'Private', 'Outdoor']);

// Tables

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleContactResourceName: text('google_contact_resource_name'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  birthDate: date('birth_date').notNull(),
  category: categoryEnum('category').notNull(),
});

export const healthLogs = pgTable('health_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  conditionName: text('condition_name').notNull(),
  type: healthTypeEnum('type').notNull(),
  severity: healthSeverityEnum('severity').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
});

export const membershipProducts = pgTable('membership_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  defaultCredits: integer('default_credits').notNull(),
  basePrice: decimal('base_price').notNull(),
});

export const clientWallets = pgTable('client_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  physicalCardRef: text('physical_card_ref'),
  remainingCredits: integer('remaining_credits').notNull(),
  status: walletStatusEnum('status').notNull(),
});

export const attendanceLedger = pgTable('attendance_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').references(() => clientWallets.id).notNull(),
  googleEventId: text('google_event_id'),
  checkInTime: timestamp('check_in_time').defaultNow().notNull(),
  slotType: slotTypeEnum('slot_type').notNull(),
});

// Relationships

export const clientsRelations = relations(clients, ({ many }) => ({
  healthLogs: many(healthLogs),
  wallets: many(clientWallets),
}));

export const healthLogsRelations = relations(healthLogs, ({ one }) => ({
  client: one(clients, {
    fields: [healthLogs.clientId],
    references: [clients.id],
  }),
}));

export const clientWalletsRelations = relations(clientWallets, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientWallets.clientId],
    references: [clients.id],
  }),
  ledgerEntries: many(attendanceLedger),
}));

export const attendanceLedgerRelations = relations(attendanceLedger, ({ one }) => ({
  wallet: one(clientWallets, {
    fields: [attendanceLedger.walletId],
    references: [clientWallets.id],
  }),
}));
