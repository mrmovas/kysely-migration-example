import { promises as fs } from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: It's important to use `any` here, migrations should never depend on the current code of your app because they need to work even when the app changes. Migrations need to be "frozen in time".
const db = new Kysely<any>({
	dialect: new SqliteDialect({
		database: new Database("test.db"),
	}),
});

const migrator = new Migrator({
	db,
	provider: new FileMigrationProvider({
		fs,
		path,
		migrationFolder: path.join(__dirname, "../migrations"), // folder with your migration files
	}),
});

async function main() {
	const direction = process.argv[2]; // "up" or "down"
	if (direction !== "up" && direction !== "down") {
		console.error('Please specify "up" or "down" as an argument');
		process.exit(1);
	}

	const { error, results } =
		direction === "down"
			? await migrator.migrateDown()
			: await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			if (direction === "down")
				console.log(`↩️  migration "${it.migrationName}" rolled back`);
			else console.log(`✅ migration "${it.migrationName}" applied`);
		} else if (it.status === "Error") {
			console.error(`❌ failed: "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error(error);
		process.exit(1);
	}

	await db.destroy();
	process.exit(0);
}

main();
