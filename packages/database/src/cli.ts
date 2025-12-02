#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';

const program = new Command();

const prismaSchema = `
model VigiloPosition {
  id     String @id @default(cuid())
  x      Int
  y      Int
}

model VigiloTodo {
  id          String    @id @default(cuid())
  content     String
  deadline    DateTime?
  createdAt   DateTime  @default(now())
  status      String
}

model VigiloOption {
    id      String @id @default(cuid())
    key     String @unique
    value   String
}
`;

const drizzleSchema = `
import { pgTable, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const vigiloPosition = pgTable('vigilo_position', {
  id: text('id').primaryKey(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
});

export const vigiloTodo = pgTable('vigilo_todo', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 255 }).notNull(),
});

export const vigiloOption = pgTable('vigilo_option', {
    id: text('id').primaryKey(),
    key: text('key').unique().notNull(),
    value: text('value').notNull(),
});
`;

const sqlSchema = `
CREATE TABLE vigilo_position (
    id VARCHAR(255) PRIMARY KEY,
    x INT NOT NULL,
    y INT NOT NULL
);

CREATE TABLE vigilo_todo (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(255) NOT NULL
);

CREATE TABLE vigilo_option (
    id VARCHAR(255) PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL
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
