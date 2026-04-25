#!/usr/bin/env node

/**
 * Standalone script to (re)seed the database with example data.
 * Run via: npm run seed --workspace=@workspace/api-server
 */

import { initSchema, query } from "./lib/db.js";
import { seedDatabase } from "./lib/seed.js";
import { logger } from "./lib/logger.js";

async function main() {
  try {
    console.log("\n========================================");
    console.log("  SEEDING EXAMPLE PROJECTS DATABASE");
    console.log("========================================\n");

    const db = await initSchema();
    if (!db) {
      throw new Error("Failed to initialize database");
    }

    await seedDatabase(db);

    console.log("\n========================================");
    console.log("  SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================\n");

    // Summary
    const summary = await Promise.all([
      query("SELECT COUNT(*) as count FROM projet"),
      query("SELECT COUNT(*) as count FROM lot"),
      query("SELECT COUNT(*) as count FROM phase"),
      query("SELECT COUNT(*) as count FROM document"),
      query("SELECT COUNT(*) as count FROM utilisateur"),
      query("SELECT COUNT(*) as count FROM departement"),
      query("SELECT COUNT(*) as count FROM bet"),
    ]);

    console.log("📊 Database Summary:");
    console.log(`   Projects:           ${summary[0].rows[0].count}`);
    console.log(`   Lots:               ${summary[1].rows[0].count}`);
    console.log(`   Phases:             ${summary[2].rows[0].count}`);
    console.log(`   Documents:          ${summary[3].rows[0].count}`);
    console.log(`   Users:              ${summary[4].rows[0].count}`);
    console.log(`   Departments:        ${summary[5].rows[0].count}`);
    console.log(`   Bureaux d'Études:   ${summary[6].rows[0].count}`);

    console.log("\n🔑 Default login:");
    console.log("   Username: admin");
    console.log("   Password: admin123\n");

  } catch (error) {
    logger.error({ error }, "Failed to seed database");
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
