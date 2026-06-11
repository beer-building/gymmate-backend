/// <reference path="../pb_data/types.d.ts" />

// Схема v2: шаблоны программ / пользовательские форки / immutable-логи выполнения.
//
// exercises  -> каталог: + slug, muscle_group -> primary_muscle, technique -> instructions
// programs   -> шаблоны: + creator, is_public; без goal/level/days_per_week
// program_workouts / program_workout_exercises -> тренировки шаблона (бывшие program_days/program_exercises)
// user_programs / user_program_workouts / user_program_workout_exercises -> независимый форк программы
// workout_logs / workout_log_exercises / workout_log_sets -> история выполнения со snapshot-полями
//
// Данные переносятся: каталог и программы на месте, дневник (workouts/workout_sets)
// конвертируется в workout_logs/...; старые коллекции удаляются.

const DAY_VALUES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TRANSLIT = {
	а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
	и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
	с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
	щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(name) {
	let out = "";
	for (const ch of String(name).toLowerCase()) {
		if (ch in TRANSLIT) out += TRANSLIT[ch];
		else if (/[a-z0-9]/.test(ch)) out += ch;
		else out += "-";
	}
	return out.replace(/-+/g, "-").replace(/^-|-$/g, "") || "exercise";
}

// "8-10" -> {min: 8, max: 10}; "5" -> {min: 5, max: 5}; иначе null (оригинал уходит в notes)
function parseReps(reps) {
	const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(String(reps));
	if (!m) return null;
	return { min: parseInt(m[1], 10), max: parseInt(m[2] || m[1], 10) };
}

function targetFields(exercisesCollectionId) {
	return [
		{
			type: "relation",
			name: "exercise",
			required: true,
			maxSelect: 1,
			collectionId: exercisesCollectionId,
		},
		{ type: "number", name: "order_index", min: 0 },
		{ type: "number", name: "target_sets", required: true, min: 1 },
		{ type: "number", name: "target_reps_min", min: 0 },
		{ type: "number", name: "target_reps_max", min: 0 },
		{ type: "number", name: "target_weight", min: 0 },
		{ type: "number", name: "rest_seconds", min: 0 },
		{ type: "text", name: "notes", max: 2000 },
	];
}

migrate(
	(app) => {
		const usersCollection = app.findCollectionByNameOrId("users");

		// --- 1. exercises: переименования + slug ---------------------------------
		const exercises = app.findCollectionByNameOrId("exercises");
		exercises.fields.getByName("muscle_group").name = "primary_muscle";
		exercises.fields.getByName("technique").name = "instructions";
		exercises.fields.add(new Field({ type: "text", name: "slug", max: 250 }));
		exercises.indexes = [
			"CREATE INDEX idx_exercises_primary_muscle ON exercises (primary_muscle)",
		];
		app.save(exercises);

		const usedSlugs = {};
		for (const record of app.findRecordsByFilter("exercises", "id != ''", "name", 0, 0)) {
			const description = record.getString("description");
			if (description) {
				const instructions = record.getString("instructions");
				record.set("instructions", instructions ? description + "\n\n" + instructions : description);
			}
			let slug = slugify(record.getString("name"));
			if (usedSlugs[slug]) {
				usedSlugs[slug] += 1;
				slug = slug + "-" + usedSlugs[slug];
			} else {
				usedSlugs[slug] = 1;
			}
			record.set("slug", slug);
			app.save(record);
		}

		exercises.fields.removeByName("description");
		exercises.fields.getByName("slug").required = true;
		exercises.indexes = [
			"CREATE INDEX idx_exercises_primary_muscle ON exercises (primary_muscle)",
			"CREATE UNIQUE INDEX idx_exercises_slug ON exercises (slug)",
		];
		app.save(exercises);

		// --- 2. programs: creator + is_public, без goal/level/days_per_week ------
		const programs = app.findCollectionByNameOrId("programs");
		programs.fields.add(
			new Field({
				type: "relation",
				name: "creator",
				maxSelect: 1,
				collectionId: usersCollection.id,
			}),
			new Field({ type: "bool", name: "is_public" }),
		);
		app.save(programs);

		for (const record of app.findRecordsByFilter("programs", "id != ''", "", 0, 0)) {
			record.set("is_public", true);
			const meta = [];
			const goal = record.getString("goal");
			const level = record.getString("level");
			const daysPerWeek = record.get("days_per_week");
			if (goal) meta.push("цель: " + goal);
			if (level) meta.push("уровень: " + level);
			if (daysPerWeek) meta.push("дней в неделю: " + daysPerWeek);
			if (meta.length) {
				record.set("description", record.getString("description") + "\n\n(" + meta.join(", ") + ")");
			}
			app.save(record);
		}

		programs.fields.removeByName("goal");
		programs.fields.removeByName("level");
		programs.fields.removeByName("days_per_week");
		programs.listRule = "is_public = true || creator = @request.auth.id";
		programs.viewRule = "is_public = true || creator = @request.auth.id";
		programs.createRule = "@request.auth.id != '' && creator = @request.auth.id";
		programs.updateRule = "creator = @request.auth.id";
		programs.deleteRule = "creator = @request.auth.id";
		app.save(programs);

		// --- 3. program_workouts / program_workout_exercises ---------------------
		const programWorkouts = new Collection({
			type: "base",
			name: "program_workouts",
			listRule: "program.is_public = true || program.creator = @request.auth.id",
			viewRule: "program.is_public = true || program.creator = @request.auth.id",
			createRule: "@request.auth.id != '' && program.creator = @request.auth.id",
			updateRule: "program.creator = @request.auth.id",
			deleteRule: "program.creator = @request.auth.id",
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
				{ type: "text", name: "description", max: 5000 },
				{ type: "select", name: "day_of_week", maxSelect: 1, values: DAY_VALUES },
				{ type: "number", name: "order_index", min: 0 },
				{ type: "autodate", name: "created", onCreate: true },
			],
			indexes: ["CREATE INDEX idx_program_workouts_program ON program_workouts (program)"],
		});
		app.save(programWorkouts);

		const programWorkoutExercises = new Collection({
			type: "base",
			name: "program_workout_exercises",
			listRule:
				"program_workout.program.is_public = true || program_workout.program.creator = @request.auth.id",
			viewRule:
				"program_workout.program.is_public = true || program_workout.program.creator = @request.auth.id",
			createRule: "@request.auth.id != '' && program_workout.program.creator = @request.auth.id",
			updateRule: "program_workout.program.creator = @request.auth.id",
			deleteRule: "program_workout.program.creator = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "program_workout",
					required: true,
					maxSelect: 1,
					collectionId: programWorkouts.id,
					cascadeDelete: true,
				},
				...targetFields(exercises.id),
			],
			indexes: [
				"CREATE INDEX idx_program_workout_exercises_workout ON program_workout_exercises (program_workout)",
				"CREATE INDEX idx_program_workout_exercises_exercise ON program_workout_exercises (exercise)",
			],
		});
		app.save(programWorkoutExercises);

		// перенос program_days -> program_workouts
		const dayToWorkout = {};
		for (const day of app.findRecordsByFilter("program_days", "id != ''", "day_order", 0, 0)) {
			const workout = new Record(programWorkouts);
			workout.set("program", day.get("program"));
			workout.set("name", day.getString("name"));
			workout.set("order_index", day.get("day_order"));
			app.save(workout);
			dayToWorkout[day.id] = workout.id;
		}

		// перенос program_exercises -> program_workout_exercises
		for (const item of app.findRecordsByFilter("program_exercises", "id != ''", "sort", 0, 0)) {
			const target = new Record(programWorkoutExercises);
			target.set("program_workout", dayToWorkout[item.get("day")]);
			target.set("exercise", item.get("exercise"));
			target.set("order_index", item.get("sort"));
			target.set("target_sets", item.get("sets"));
			const reps = parseReps(item.getString("reps"));
			if (reps) {
				target.set("target_reps_min", reps.min);
				target.set("target_reps_max", reps.max);
			} else {
				target.set("notes", "Повторы: " + item.getString("reps"));
			}
			const rest = item.get("rest_seconds");
			if (rest) target.set("rest_seconds", rest);
			app.save(target);
		}

		// --- 4. user_programs (форк программы) -----------------------------------
		const userPrograms = new Collection({
			type: "base",
			name: "user_programs",
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
				{
					type: "relation",
					name: "source_program",
					maxSelect: 1,
					collectionId: programs.id,
				},
				{ type: "text", name: "name", required: true, max: 200 },
				{ type: "text", name: "description", max: 5000 },
				{ type: "date", name: "started_at" },
				{ type: "date", name: "archived_at" },
				{ type: "autodate", name: "created", onCreate: true },
			],
			indexes: ["CREATE INDEX idx_user_programs_user ON user_programs (user)"],
		});
		app.save(userPrograms);

		const userProgramWorkouts = new Collection({
			type: "base",
			name: "user_program_workouts",
			listRule: "user_program.user = @request.auth.id",
			viewRule: "user_program.user = @request.auth.id",
			createRule: "@request.auth.id != '' && user_program.user = @request.auth.id",
			updateRule: "user_program.user = @request.auth.id",
			deleteRule: "user_program.user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "user_program",
					required: true,
					maxSelect: 1,
					collectionId: userPrograms.id,
					cascadeDelete: true,
				},
				{ type: "text", name: "name", required: true, max: 200 },
				{ type: "select", name: "day_of_week", maxSelect: 1, values: DAY_VALUES },
				{ type: "number", name: "order_index", min: 0 },
			],
			indexes: [
				"CREATE INDEX idx_user_program_workouts_program ON user_program_workouts (user_program)",
			],
		});
		app.save(userProgramWorkouts);

		const userProgramWorkoutExercises = new Collection({
			type: "base",
			name: "user_program_workout_exercises",
			listRule: "user_program_workout.user_program.user = @request.auth.id",
			viewRule: "user_program_workout.user_program.user = @request.auth.id",
			createRule:
				"@request.auth.id != '' && user_program_workout.user_program.user = @request.auth.id",
			updateRule: "user_program_workout.user_program.user = @request.auth.id",
			deleteRule: "user_program_workout.user_program.user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "user_program_workout",
					required: true,
					maxSelect: 1,
					collectionId: userProgramWorkouts.id,
					cascadeDelete: true,
				},
				...targetFields(exercises.id),
			],
			indexes: [
				"CREATE INDEX idx_user_program_workout_exercises_workout ON user_program_workout_exercises (user_program_workout)",
				"CREATE INDEX idx_user_program_workout_exercises_exercise ON user_program_workout_exercises (exercise)",
			],
		});
		app.save(userProgramWorkoutExercises);

		// --- 5. workout_logs (история выполнения, snapshot-поля) -----------------
		const workoutLogs = new Collection({
			type: "base",
			name: "workout_logs",
			listRule: "user = @request.auth.id",
			viewRule: "user = @request.auth.id",
			createRule: "@request.auth.id != '' && user = @request.auth.id",
			// update нужен только чтобы завершить тренировку; история не редактируется задним числом —
			// устойчивость к изменению программ/упражнений обеспечивают snapshot-поля
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
				{
					type: "relation",
					name: "user_program",
					maxSelect: 1,
					collectionId: userPrograms.id,
				},
				{
					type: "relation",
					name: "user_program_workout",
					maxSelect: 1,
					collectionId: userProgramWorkouts.id,
				},
				{ type: "text", name: "name_snapshot", required: true, max: 200 },
				{ type: "date", name: "started_at", required: true },
				{ type: "date", name: "completed_at" },
				{ type: "number", name: "duration_seconds", min: 0 },
				{ type: "text", name: "notes", max: 2000 },
				{ type: "autodate", name: "created", onCreate: true },
			],
			indexes: [
				"CREATE INDEX idx_workout_logs_user ON workout_logs (user)",
				"CREATE INDEX idx_workout_logs_user_program ON workout_logs (user_program)",
			],
		});
		app.save(workoutLogs);

		const workoutLogExercises = new Collection({
			type: "base",
			name: "workout_log_exercises",
			listRule: "workout_log.user = @request.auth.id",
			viewRule: "workout_log.user = @request.auth.id",
			createRule: "@request.auth.id != '' && workout_log.user = @request.auth.id",
			updateRule: "workout_log.user = @request.auth.id",
			deleteRule: "workout_log.user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "workout_log",
					required: true,
					maxSelect: 1,
					collectionId: workoutLogs.id,
					cascadeDelete: true,
				},
				// без cascadeDelete: удаление упражнения из каталога не должно стирать историю
				{
					type: "relation",
					name: "exercise",
					maxSelect: 1,
					collectionId: exercises.id,
				},
				{ type: "text", name: "exercise_name_snapshot", required: true, max: 200 },
				{ type: "number", name: "order_index", min: 0 },
				{ type: "text", name: "notes", max: 2000 },
			],
			indexes: [
				"CREATE INDEX idx_workout_log_exercises_log ON workout_log_exercises (workout_log)",
			],
		});
		app.save(workoutLogExercises);

		const workoutLogSets = new Collection({
			type: "base",
			name: "workout_log_sets",
			listRule: "workout_log_exercise.workout_log.user = @request.auth.id",
			viewRule: "workout_log_exercise.workout_log.user = @request.auth.id",
			createRule:
				"@request.auth.id != '' && workout_log_exercise.workout_log.user = @request.auth.id",
			updateRule: "workout_log_exercise.workout_log.user = @request.auth.id",
			deleteRule: "workout_log_exercise.workout_log.user = @request.auth.id",
			fields: [
				{
					type: "relation",
					name: "workout_log_exercise",
					required: true,
					maxSelect: 1,
					collectionId: workoutLogExercises.id,
					cascadeDelete: true,
				},
				{ type: "number", name: "set_index", required: true, min: 1 },
				{ type: "number", name: "reps", min: 0 },
				{ type: "number", name: "weight", min: 0 },
				{ type: "number", name: "duration_seconds", min: 0 },
				{ type: "number", name: "distance_meters", min: 0 },
				{ type: "number", name: "rir", min: 0, max: 10 },
				{ type: "number", name: "rpe", min: 0, max: 10 },
				{ type: "bool", name: "is_warmup" },
				{ type: "bool", name: "completed" },
				{ type: "autodate", name: "created", onCreate: true },
			],
			indexes: [
				"CREATE INDEX idx_workout_log_sets_exercise ON workout_log_sets (workout_log_exercise)",
			],
		});
		app.save(workoutLogSets);

		// --- 6. перенос дневника workouts/workout_sets -> workout_logs/... -------
		const exerciseNames = {};
		for (const record of app.findRecordsByFilter("exercises", "id != ''", "", 0, 0)) {
			exerciseNames[record.id] = record.getString("name");
		}
		const programDayNames = {};
		for (const record of app.findRecordsByFilter("program_days", "id != ''", "", 0, 0)) {
			programDayNames[record.id] = record.getString("name");
		}

		const setsByWorkout = {};
		for (const set of app.findRecordsByFilter("workout_sets", "id != ''", "created", 0, 0)) {
			const workoutId = set.get("workout");
			(setsByWorkout[workoutId] = setsByWorkout[workoutId] || []).push(set);
		}

		for (const workout of app.findRecordsByFilter("workouts", "id != ''", "created", 0, 0)) {
			const log = new Record(workoutLogs);
			log.set("user", workout.get("user"));
			log.set(
				"name_snapshot",
				workout.getString("name") ||
					programDayNames[workout.get("program_day")] ||
					"Тренировка",
			);
			log.set("started_at", workout.getString("date"));
			log.set("completed_at", workout.getString("date"));
			const durationMinutes = workout.get("duration_minutes");
			if (durationMinutes) log.set("duration_seconds", durationMinutes * 60);
			const notes = workout.getString("notes");
			if (notes) log.set("notes", notes);
			app.save(log);

			// подходы группируются в упражнения по порядку первого появления
			const logExerciseIds = {};
			let orderIndex = 0;
			for (const set of setsByWorkout[workout.id] || []) {
				const exerciseId = set.get("exercise");
				if (!logExerciseIds[exerciseId]) {
					const logExercise = new Record(workoutLogExercises);
					logExercise.set("workout_log", log.id);
					logExercise.set("exercise", exerciseId);
					logExercise.set("exercise_name_snapshot", exerciseNames[exerciseId] || "Упражнение");
					logExercise.set("order_index", orderIndex);
					orderIndex += 1;
					app.save(logExercise);
					logExerciseIds[exerciseId] = logExercise.id;
				}

				const logSet = new Record(workoutLogSets);
				logSet.set("workout_log_exercise", logExerciseIds[exerciseId]);
				logSet.set("set_index", set.get("set_number"));
				logSet.set("reps", set.get("reps"));
				const weight = set.get("weight");
				if (weight) logSet.set("weight", weight);
				logSet.set("completed", true);
				app.save(logSet);
			}
		}

		// --- 7. удаление старых коллекций ----------------------------------------
		for (const name of ["workout_sets", "workouts", "program_exercises", "program_days"]) {
			app.delete(app.findCollectionByNameOrId(name));
		}
	},
	(app) => {
		// Откат структурный: данные дневника и форков не восстанавливаются.
		for (const name of [
			"workout_log_sets",
			"workout_log_exercises",
			"workout_logs",
			"user_program_workout_exercises",
			"user_program_workouts",
			"user_programs",
			"program_workout_exercises",
			"program_workouts",
		]) {
			app.delete(app.findCollectionByNameOrId(name));
		}

		const exercises = app.findCollectionByNameOrId("exercises");
		exercises.fields.getByName("primary_muscle").name = "muscle_group";
		exercises.fields.getByName("instructions").name = "technique";
		exercises.fields.removeByName("slug");
		exercises.fields.add(new Field({ type: "text", name: "description", max: 2000 }));
		exercises.indexes = [
			"CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group)",
		];
		app.save(exercises);

		const programs = app.findCollectionByNameOrId("programs");
		programs.fields.removeByName("creator");
		programs.fields.removeByName("is_public");
		programs.fields.add(
			new Field({
				type: "select",
				name: "goal",
				maxSelect: 1,
				values: ["mass", "weight_loss", "relief", "strength"],
			}),
			new Field({
				type: "select",
				name: "level",
				maxSelect: 1,
				values: ["beginner", "intermediate", "advanced"],
			}),
			new Field({ type: "number", name: "days_per_week", min: 1, max: 7 }),
		);
		programs.listRule = "";
		programs.viewRule = "";
		programs.createRule = null;
		programs.updateRule = null;
		programs.deleteRule = null;
		app.save(programs);

		const usersCollection = app.findCollectionByNameOrId("users");

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
				{ type: "autodate", name: "created", onCreate: true },
			],
			indexes: ["CREATE INDEX idx_workout_sets_workout ON workout_sets (workout)"],
		});
		app.save(workoutSets);
	},
);
