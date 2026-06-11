/// <reference path="../pb_data/types.d.ts" />

// Возврат поля goal у программ: бейдж цели нужен в UI.
// Значения восстанавливаются из мета-строки "(цель: ..., ...)",
// дописанной в description миграцией 1749500007; строка убирается.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("programs");
		collection.fields.add(
			new Field({
				type: "select",
				name: "goal",
				maxSelect: 1,
				values: ["mass", "weight_loss", "relief", "strength"],
			}),
		);
		app.save(collection);

		for (const record of app.findRecordsByFilter("programs", "id != ''", "", 0, 0)) {
			const description = record.getString("description");
			const match = /\n\n\(цель: (\w+)[^)]*\)$/.exec(description);
			if (match) {
				record.set("goal", match[1]);
				record.set("description", description.slice(0, match.index));
				app.save(record);
			}
		}
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("programs");
		collection.fields.removeByName("goal");
		app.save(collection);
	},
);
