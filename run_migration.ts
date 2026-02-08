import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const connection = await mysql.createConnection(connectionString);
  
  const migrationPath = path.join(process.cwd(), "drizzle", "0002_add_youtube_link.sql");
  console.log(`Reading migration from ${migrationPath}...`);
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log("Executing migration...");
  // Split by semicolon if there are multiple statements, but here it's simple
  const statements = sql.split(";").filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.trim()}`);
    await connection.execute(statement);
  }

  console.log("Migration completed successfully!");
  await connection.end();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
