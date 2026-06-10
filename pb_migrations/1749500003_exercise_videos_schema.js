/// <reference path="../pb_data/types.d.ts" />

// Расширение схемы под импорт каталога: новые группы мышц,
// инвентарь "резина" и список видео у упражнения.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId("exercises");

		const muscleGroup = collection.fields.getByName("muscle_group");
		muscleGroup.values = [
			"chest",
			"back",
			"legs",
			"glutes",
			"calves",
			"shoulders",
			"biceps",
			"triceps",
			"forearms",
			"abs",
			"neck",
		];

		const equipment = collection.fields.getByName("equipment");
		equipment.values = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell", "band"];

		collection.fields.add(new Field({ type: "json", name: "videos", maxSize: 5000 }));

		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId("exercises");
		collection.fields.removeByName("videos");
		app.save(collection);
	},
);
