#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';

const program = new Command();

const prismaSchema = `
model VigiloInstance {
  id          String   @id @default(cuid())
  instanceKey String   @unique
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  positions   VigiloPosition[]
  connections VigiloConnection[]
  settings    VigiloSettings[]
  statuses    VigiloStatus[]
}

model VigiloPosition {
  id         String   @id @default(cuid())
  instanceId String
  x          Int
  y          Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  instance   VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId])
}

model VigiloConnection {
  id              String   @id @default(cuid())
  instanceId      String
  todoIndex       Int
  targetSelector  String?
  targetLabel     String?
  targetPositionX Int?
  targetPositionY Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  instance        VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId, todoIndex])
}

model VigiloSettings {
  id                String   @id @default(cuid())
  instanceId        String
  displayMode       String   @default("full")
  isHidden          Boolean  @default(false)
  showLines         Boolean  @default(true)
  showBadges        Boolean  @default(true)
  lineColor         String   @default("#3b82f6")
  lineOpacity       Float    @default(0.5)
  componentOpacity  Float    @default(1.0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  instance          VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId])
}

model VigiloStatus {
  id         String   @id @default(cuid())
  instanceId String
  todoIndex  Int
  status     String   @default("todo")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  instance   VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId, todoIndex])
}
`;

const drizzleSchema = `
import { pgTable, text, integer, timestamp, varchar, boolean, real, unique, index } from 'drizzle-orm/pg-core';

export const vigiloInstance = pgTable('vigilo_instance', {
  id: text('id').primaryKey(),
  instanceKey: text('instance_key').unique().notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vigiloPosition = pgTable('vigilo_position', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: unique().on(table.instanceId),
}));

export const vigiloConnection = pgTable('vigilo_connection', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  todoIndex: integer('todo_index').notNull(),
  targetSelector: text('target_selector'),
  targetLabel: text('target_label'),
  targetPositionX: integer('target_position_x'),
  targetPositionY: integer('target_position_y'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceTodoIdx: unique().on(table.instanceId, table.todoIndex),
}));

export const vigiloSettings = pgTable('vigilo_settings', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  displayMode: varchar('display_mode', { length: 50 }).default('full').notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  showLines: boolean('show_lines').default(true).notNull(),
  showBadges: boolean('show_badges').default(true).notNull(),
  lineColor: varchar('line_color', { length: 20 }).default('#3b82f6').notNull(),
  lineOpacity: real('line_opacity').default(0.5).notNull(),
  componentOpacity: real('component_opacity').default(1.0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: unique().on(table.instanceId),
}));

export const vigiloStatus = pgTable('vigilo_status', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  todoIndex: integer('todo_index').notNull(),
  status: varchar('status', { length: 20 }).default('todo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceTodoIdx: unique().on(table.instanceId, table.todoIndex),
}));
`;

const sqlSchema = `
CREATE TABLE vigilo_instance (
    id VARCHAR(255) PRIMARY KEY,
    instance_key VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vigilo_position (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id)
);

CREATE TABLE vigilo_connection (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    todo_index INT NOT NULL,
    target_selector VARCHAR(255),
    target_label VARCHAR(255),
    target_position_x INT,
    target_position_y INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id, todo_index)
);

CREATE TABLE vigilo_settings (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    display_mode VARCHAR(50) DEFAULT 'full' NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
    show_lines BOOLEAN DEFAULT TRUE NOT NULL,
    show_badges BOOLEAN DEFAULT TRUE NOT NULL,
    line_color VARCHAR(20) DEFAULT '#3b82f6' NOT NULL,
    line_opacity REAL DEFAULT 0.5 NOT NULL,
    component_opacity REAL DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id)
);

CREATE TABLE vigilo_status (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    todo_index INT NOT NULL,
    status VARCHAR(20) DEFAULT 'todo' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id, todo_index)
);
`;


program
  .name('vigilo-db')
  .description('CLI to generate database schemas for Vigilo')
  .option('--prisma', 'Generate schema for Prisma')
  .option('--drizzle', 'Generate schema for Drizzle')
  .option('--sql', 'Generate schema for plain SQL')
  .option('--out <path>', 'Output file path')
  .action(async (options) => {
    const { prisma, drizzle, sql, out } = options;
    const selectedOrmCount = [prisma, drizzle, sql].filter(Boolean).length;

    if (selectedOrmCount !== 1) {
      console.error('Error: Please specify exactly one ORM: --prisma, --drizzle, or --sql');
      program.outputHelp();
      process.exit(1);
    }

    let schema: string = '';
    let orm: 'prisma' | 'drizzle' | 'sql' | undefined = undefined;

    if (prisma) {
        schema = prismaSchema;
        orm = 'prisma';
    }
    if (drizzle) {
        schema = drizzleSchema;
        orm = 'drizzle';
    }
    if (sql) {
        schema = sqlSchema;
        orm = 'sql'
    }

    if (out) {
        try {
            await fs.writeFile(out, schema.trim());
            console.log(`Schema for ${orm} written to ${out}`);
        } catch (error) {
            console.error(`Error writing file to ${out}:`, error);
            process.exit(1);
        }
    } else {
        console.log(schema.trim());
    }
  });

program.parse(process.argv);

export { program }
