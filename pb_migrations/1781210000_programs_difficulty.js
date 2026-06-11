/// <reference path="../pb_data/types.d.ts" />

// Сложность программы: целое 1..5, в UI — полоска с градиентом на 5 делений.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("programs");
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

		// оценки посевных программ
		const seed = {
			"База на массу (3 дня)": 3,
			"Похудение: круговая full-body (3 дня)": 2,
			"Сила 5×5 (3 дня)": 4,
		};
		for (const record of app.findRecordsByFilter("programs", "id != ''", "", 0, 0)) {
			const value = seed[record.getString("name")];
			if (value) {
				record.set("difficulty", value);
				app.save(record);
			}
		}
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("programs");
		collection.fields.removeByName("difficulty");
		app.save(collection);
	},
);
