/// <reference path="../pb_data/types.d.ts" />

// Базовая схема GymMate:
// exercises -> справочник упражнений (публичное чтение)
// programs / program_days / program_exercises -> готовые программы тренировок (публичное чтение)
// workouts / workout_sets -> дневник тренировок пользователя (доступ только владельцу)
migrate(
	(app) => {
		const usersCollection = app.findCollectionByNameOrId("users");

		const exercises = new Collection({
			type: "base",
			name: "exercises",
			listRule: "",
			viewRule: "",
			fields: [
				{ type: "text", name: "name", required: true, max: 200 },
				{
					type: "select",
					name: "muscle_group",
					required: true,
					maxSelect: 1,
					values: [
						"chest",
						"back",
						"legs",
						"glutes",
						"calves",
						"shoulders",
						"biceps",
						"triceps",
						"abs",
					],
				},
				{
					type: "select",
					name: "equipment",
					maxSelect: 1,
					values: ["barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell"],
				},
				{
					type: "select",
					name: "difficulty",
					maxSelect: 1,
					values: ["beginner", "intermediate", "advanced"],
				},
				{ type: "text", name: "description", max: 2000 },
				{ type: "text", name: "technique", max: 5000 },
				{ type: "autodate", name: "created", onCreate: true },
				{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
			],
			indexes: ["CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group)"],
		});
		app.save(exercises);

		const programs = new Collection({
			type: "base",
			name: "programs",
			listRule: "",
			viewRule: "",
			fields: [
				{ type: "text", name: "name", required: true, max: 200 },
				{
					type: "select",
					name: "goal",
					required: true,
					maxSelect: 1,
					values: ["mass", "weight_loss", "relief", "strength"],
				},
				{
					type: "select",
					name: "level",
					required: true,
					maxSelect: 1,
					values: ["beginner", "intermediate", "advanced"],
				},
				{ type: "number", name: "days_per_week", required: true, min: 1, max: 7 },
				{ type: "text", name: "description", max: 5000 },
				{ type: "autodate", name: "created", onCreate: true },
				{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
			],
		});
		app.save(programs);

		const programDays = new Collection({
			type: "base",
			name: "program_days",
			listRule: "",
			viewRule: "",
			fields: [
				{
					type: "relation",
					name: "program",
					required: true,
					maxSelect: 1,
					collectionId: programs.id,
					cascadeDelete: true,
				},
				{ type: "text", name: "name", required: true, max: 200 },
				{ type: "number", name: "day_order", required: true, min: 1 },
			],
			indexes: ["CREATE INDEX idx_program_days_program ON program_days (program)"],
		});
		app.save(programDays);

		const programExercises = new Collection({
			type: "base",
			name: "program_exercises",
			listRule: "",
			viewRule: "",
			fields: [
				{
					type: "relation",
					name: "day",
					required: true,
					maxSelect: 1,
					collectionId: programDays.id,
					cascadeDelete: true,
				},
				{
					type: "relation",
					name: "exercise",
					required: true,
					maxSelect: 1,
					collectionId: exercises.id,
					cascadeDelete: true,
				},
				{ type: "number", name: "sets", required: true, min: 1 },
				{ type: "text", name: "reps", required: true, max: 50 },
				{ type: "number", name: "rest_seconds", min: 0 },
				{ type: "number", name: "sort", required: true, min: 1 },
			],
			indexes: ["CREATE INDEX idx_program_exercises_day ON program_exercises (day)"],
		});
		app.save(programExercises);

		const workouts = new Collection({
			type: "base",
			name: "workouts",
			listRule: "user = @request.auth.id",
			viewRule: "user = @request.auth.id",
			createRule: "@request.auth.id != '' && user = @request.auth.id",
			updateRule: "user = @request.auth.id",
			deleteRule: "user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "user",
					required: true,
					maxSelect: 1,
					collectionId: usersCollection.id,
					cascadeDelete: true,
				},
				{ type: "date", name: "date", required: true },
				{ type: "text", name: "name", max: 200 },
				{
					type: "relation",
					name: "program_day",
					maxSelect: 1,
					collectionId: programDays.id,
				},
				{ type: "text", name: "notes", max: 2000 },
				{ type: "number", name: "duration_minutes", min: 0 },
				{ type: "autodate", name: "created", onCreate: true },
				{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
			],
			indexes: ["CREATE INDEX idx_workouts_user ON workouts (user)"],
		});
		app.save(workouts);

		const workoutSets = new Collection({
			type: "base",
			name: "workout_sets",
			listRule: "workout.user = @request.auth.id",
			viewRule: "workout.user = @request.auth.id",
			createRule: "@request.auth.id != '' && workout.user = @request.auth.id",
			updateRule: "workout.user = @request.auth.id",
			deleteRule: "workout.user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "workout",
					required: true,
					maxSelect: 1,
					collectionId: workouts.id,
					cascadeDelete: true,
				},
				{
					type: "relation",
					name: "exercise",
					required: true,
					maxSelect: 1,
					collectionId: exercises.id,
					cascadeDelete: true,
				},
				{ type: "number", name: "set_number", required: true, min: 1 },
				{ type: "number", name: "reps", required: true, min: 0 },
				{ type: "number", name: "weight", min: 0 },
			],
			indexes: ["CREATE INDEX idx_workout_sets_workout ON workout_sets (workout)"],
		});
		app.save(workoutSets);
	},
	(app) => {
		for (const name of [
			"workout_sets",
			"workouts",
			"program_exercises",
			"program_days",
			"programs",
			"exercises",
		]) {
			const collection = app.findCollectionByNameOrId(name);
			app.delete(collection);
		}
	},
);
