import { Database } from "bun:sqlite";

let dbInstance: Database | null = null;

/**
 * @description Get the database instance
 * @returns The database instance
 */
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = new Database(":memory:");
    dbInstance.exec(`
      CREATE TABLE users(id TEXT PRIMARY KEY, counsel_user_id UUID, name TEXT, email TEXT, info JSONB);
    `);
  }
  return dbInstance;
}
