import { promises as fs } from "node:fs";
import * as path from "node:path";
import z from "zod";
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

async function showHistory() {
	/**
	 * `migrator.getMigrations()` returns an array of all migration files.
	 *
	 * Each migration file is represented as an object with the following properties:
	 * - `name`: The name of the migration file (e.g., "YYYY-MM-DD-suffix.ts").
	 * - `migrator`: The migrator `up` and `down` functions defined.
	 * - `executedAt`: A Date object representing when the migration was executed, or undefined if it has not been executed yet.
	 */
	const migrationInfo = await migrator.getMigrations();
	let totalAvailableUpMigrations = 0;

	console.table(
		migrationInfo.map((migration) => {
			if (migration.executedAt === undefined) totalAvailableUpMigrations++;

			return {
				name: migration.name,
				status: migration.executedAt ? "Executed" : "Not executed",
				executedAt: migration.executedAt?.toISOString() ?? "-",
			};
		}),
	);

	if (totalAvailableUpMigrations > 0) {
		console.log(
			`Total available "up" migrations: ${totalAvailableUpMigrations}`,
		);
	} else {
		console.log('No available "up" migrations. Database is up to date!');
	}
}

async function migrateUp(action: "oneUp" | "toLatest") {
	const { results } =
		action === "toLatest"
			? await migrator.migrateToLatest()
			: await migrator.migrateUp();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`✅ migration "${it.migrationName}" applied`);
		} else if (it.status === "Error") {
			console.error(`❌ failed: "${it.migrationName}"`);
		}
	});
}

async function migrateDown() {
	const { results } = await migrator.migrateDown();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`↩️  migration "${it.migrationName}" rolled back`);
		} else if (it.status === "Error") {
			console.error(`❌ failed: "${it.migrationName}"`);
		}
	});
}

const argsSchema = z.enum(["history", "up", "upToLatest", "down"]);
type args = z.infer<typeof argsSchema>;

async function migrate(args: args) {
	switch (args) {
		case "history": {
			await showHistory();
			break;
		}
		case "up": {
			await migrateUp("oneUp");
			break;
		}
		case "upToLatest": {
			await migrateUp("toLatest");
			break;
		}
		case "down": {
			await migrateDown();
			break;
		}
	}

	await db.destroy();
	process.exit(0);
}

/**
 * This is a Node.js idiom that checks whether this file is being run directly or being imported as a module.
 * If the file is run directly (e.g., `tsx src/migrate.ts`), then `require.main === module` will be true, and we will execute the migration.
 */
if (require.main === module) {
	const direction = process.argv[2];
	const validatedArgs = argsSchema.safeParse(direction);

	if (!validatedArgs.success) {
		console.error(
			"Invalid argument. `tsx src/db-migrate.ts <history|up|upToLatest|down>`",
		);
		process.exit(1);
	}

	migrate(validatedArgs.data).catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	});
}
