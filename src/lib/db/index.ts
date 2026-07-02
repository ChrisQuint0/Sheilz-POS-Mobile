import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';

const DB_NAME = 'sheilz.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

// Single-flight guard so concurrent callers during app boot
// don't trigger the migration run twice — same pattern the plan
// uses for runSync().
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = init().then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}