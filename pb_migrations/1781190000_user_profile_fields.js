/// <reference path="../pb_data/types.d.ts" />

// Профиль пользователя: вес, рост, дата рождения.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("_pb_users_auth_");

		collection.fields.add(
			new Field({
				type: "number",
				name: "weight",
				min: 20,
				max: 300,
			}),
		);

		collection.fields.add(
			new Field({
				type: "number",
				name: "height",
				min: 100,
				max: 250,
			}),
		);

		collection.fields.add(
			new Field({
				type: "date",
				name: "birthdate",
			}),
		);

		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("_pb_users_auth_");
		collection.fields.removeByName("weight");
		collection.fields.removeByName("height");
		collection.fields.removeByName("birthdate");
		app.save(collection);
	},
);
