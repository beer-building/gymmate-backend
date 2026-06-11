/// <reference path="../pb_data/types.d.ts" />

// Пол пользователя — выбирает модель фигуры (м/ж) на карте мышц.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("users");
		collection.fields.add(
			new Field({
				type: "select",
				name: "gender",
				values: ["male", "female"],
				maxSelect: 1,
			}),
		);
		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("users");
		collection.fields.removeByName("gender");
		app.save(collection);
	},
);
