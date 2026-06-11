/// <reference path="../pb_data/types.d.ts" />

// Сложность форка: snapshot difficulty из программы-источника.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("user_programs");
		collection.fields.add(
			new Field({
				type: "number",
				name: "difficulty",
				min: 1,
				max: 5,
				onlyInt: true,
			}),
		);
		app.save(collection);

		// бэкфилл существующих форков из источника
		for (const record of app.findRecordsByFilter(
			"user_programs",
			"source_program != ''",
			"",
			0,
			0,
		)) {
			try {
				const source = app.findRecordById("programs", record.getString("source_program"));
				const value = source.get("difficulty");
				if (value) {
					record.set("difficulty", value);
					app.save(record);
				}
			} catch (_) {
				// источник удалён — форк остаётся без сложности
			}
		}
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("user_programs");
		collection.fields.removeByName("difficulty");
		app.save(collection);
	},
);
