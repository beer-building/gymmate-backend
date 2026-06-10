/// <reference path="../pb_data/types.d.ts" />

// Поле created нужно для сортировки подходов в порядке добавления.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("workout_sets");
		collection.fields.add(new Field({ type: "autodate", name: "created", onCreate: true }));
		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("workout_sets");
		collection.fields.removeByName("created");
		app.save(collection);
	},
);
