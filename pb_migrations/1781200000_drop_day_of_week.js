/// <reference path="../pb_data/types.d.ts" />

// Удаление легаси-поля day_of_week: нигде не использовалось,
// расписание по дням недели в приложении так и не появилось.
migrate(
	(app) => {
		for (const name of ["program_workouts", "user_program_workouts"]) {
			const collection = app.findCollectionByNameOrId(name);
			collection.fields.removeByName("day_of_week");
			app.save(collection);
		}
	},
	(app) => {
		for (const name of ["program_workouts", "user_program_workouts"]) {
			const collection = app.findCollectionByNameOrId(name);
			collection.fields.add(
				new Field({
					type: "select",
					name: "day_of_week",
					maxSelect: 1,
					values: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
				}),
			);
			app.save(collection);
		}
	},
);
