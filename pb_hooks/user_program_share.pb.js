/// <reference path="../pb_data/types.d.ts" />

// Импорт/экспорт пользовательских программ (user_programs) в переносимом JSON,
// чтобы делиться тренировками с друзьями.
//
// GET  /api/gymmate/user-programs/{id}/export — выгрузить свою программу в JSON
// POST /api/gymmate/user-programs/import      — создать программу из такого JSON
//
// Упражнения в файле ссылаются на каталог по `slug` (стабилен между инстансами),
// с фолбэком по точному имени. Локальные id в файл не попадают.
// Формат конверта: { format: "gymmate.user-program", version: 1, program: {...} }.

routerAdd(
	"GET",
	"/api/gymmate/user-programs/{id}/export",
	(e) => {
		let program;
		try {
			program = $app.findRecordById("user_programs", e.request.pathValue("id"));
		} catch (_) {
			throw new NotFoundError("Программа не найдена.");
		}
		// чужие программы не раскрываем (тот же 404, что и для несуществующих)
		if (program.getString("user") !== e.auth.id) {
			throw new NotFoundError("Программа не найдена.");
		}

		const workouts = [];
		const workoutRecords = $app.findRecordsByFilter(
			"user_program_workouts",
			"user_program = {:id}",
			"order_index",
			0,
			0,
			{ id: program.id },
		);
		for (const workout of workoutRecords) {
			const exercises = [];
			const exerciseRecords = $app.findRecordsByFilter(
				"user_program_workout_exercises",
				"user_program_workout = {:id}",
				"order_index",
				0,
				0,
				{ id: workout.id },
			);
			for (const item of exerciseRecords) {
				let exercise;
				try {
					exercise = $app.findRecordById("exercises", item.getString("exercise"));
				} catch (_) {
					continue; // упражнение удалено из каталога — без slug/имени оно непереносимо
				}
				exercises.push({
					slug: exercise.getString("slug"),
					exercise_name: exercise.getString("name"),
					order_index: item.get("order_index") || 0,
					target_sets: item.get("target_sets") || 0,
					target_reps_min: item.get("target_reps_min") || 0,
					target_reps_max: item.get("target_reps_max") || 0,
					target_weight: item.get("target_weight") || 0,
					rest_seconds: item.get("rest_seconds") || 0,
					notes: item.getString("notes"),
				});
			}

			workouts.push({
				name: workout.getString("name"),
				order_index: workout.get("order_index") || 0,
				exercises: exercises,
			});
		}

		return e.json(200, {
			format: "gymmate.user-program",
			version: 1,
			exported_at: new Date().toISOString(),
			program: {
				name: program.getString("name"),
				description: program.getString("description"),
				workouts: workouts,
			},
		});
	},
	$apis.requireAuth("users"),
);

routerAdd(
	"POST",
	"/api/gymmate/user-programs/import",
	(e) => {
		const MAX_WORKOUTS = 100;
		const MAX_EXERCISES = 1000;

		const asText = (value, max) =>
			value === undefined || value === null ? "" : String(value).slice(0, max);
		const asNum = (value) => {
			const n = Number(value);
			return Number.isFinite(n) && n >= 0 ? n : 0;
		};

		const body = e.requestInfo().body || {};
		if (body.format && body.format !== "gymmate.user-program") {
			throw new BadRequestError("Неизвестный формат файла: " + body.format);
		}
		if (body.version && body.version !== 1) {
			throw new BadRequestError("Неподдерживаемая версия формата: " + body.version);
		}
		// конверт {program: {...}} либо «голая» программа (как local/program_3day.json)
		const data = body.program || body;

		const programName = asText(data.name, 200).trim();
		if (!programName) {
			throw new BadRequestError("В файле не указано название программы (program.name).");
		}
		const workouts = Array.isArray(data.workouts) ? data.workouts : [];
		if (workouts.length > MAX_WORKOUTS) {
			throw new BadRequestError("Слишком много тренировок в программе (максимум " + MAX_WORKOUTS + ").");
		}

		let totalExercises = 0;
		workouts.forEach((workout, w) => {
			if (typeof workout !== "object" || workout === null) {
				throw new BadRequestError("workouts[" + w + "]: ожидался объект тренировки.");
			}
			if (!asText(workout.name, 200).trim()) {
				throw new BadRequestError("workouts[" + w + "]: не указано название тренировки.");
			}
			const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
			totalExercises += exercises.length;
			exercises.forEach((item, x) => {
				const where = "workouts[" + w + "].exercises[" + x + "]";
				if (typeof item !== "object" || item === null) {
					throw new BadRequestError(where + ": ожидался объект упражнения.");
				}
				if (!asText(item.slug, 250) && !asText(item.exercise_name, 200)) {
					throw new BadRequestError(where + ": нужен slug или exercise_name упражнения.");
				}
				const sets = Number(item.target_sets);
				if (!Number.isFinite(sets) || sets < 1) {
					throw new BadRequestError(where + ": target_sets должен быть числом не меньше 1.");
				}
			});
		});
		if (totalExercises > MAX_EXERCISES) {
			throw new BadRequestError("Слишком много упражнений в программе (максимум " + MAX_EXERCISES + ").");
		}

		// каталог различается между инстансами: ищем по slug, потом по точному имени
		const findCatalogExercise = (slug, name) => {
			if (slug) {
				try {
					return $app.findFirstRecordByFilter("exercises", "slug = {:slug}", { slug: slug });
				} catch (_) {}
			}
			if (name) {
				try {
					return $app.findFirstRecordByFilter("exercises", "name = {:name}", { name: name });
				} catch (_) {}
			}
			return null;
		};

		const skipped = [];
		let createdProgramId = "";
		let createdWorkouts = 0;
		let createdExercises = 0;

		$app.runInTransaction((tx) => {
			const programsCollection = tx.findCollectionByNameOrId("user_programs");
			const workoutsCollection = tx.findCollectionByNameOrId("user_program_workouts");
			const exercisesCollection = tx.findCollectionByNameOrId("user_program_workout_exercises");

			const program = new Record(programsCollection);
			program.set("user", e.auth.id);
			program.set("name", programName);
			program.set("description", asText(data.description, 5000));
			tx.save(program);
			createdProgramId = program.id;

			workouts.forEach((workout, w) => {
				const workoutRecord = new Record(workoutsCollection);
				workoutRecord.set("user_program", program.id);
				workoutRecord.set("name", asText(workout.name, 200).trim());
				workoutRecord.set("order_index", asNum(workout.order_index) || w + 1);
				tx.save(workoutRecord);
				createdWorkouts++;

				const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
				exercises.forEach((item, x) => {
					const slug = asText(item.slug, 250).trim();
					const exerciseName = asText(item.exercise_name, 200).trim();
					const exercise = findCatalogExercise(slug, exerciseName);
					if (!exercise) {
						skipped.push({
							workout: workoutRecord.getString("name"),
							slug: slug,
							exercise_name: exerciseName,
						});
						return;
					}
					const itemRecord = new Record(exercisesCollection);
					itemRecord.set("user_program_workout", workoutRecord.id);
					itemRecord.set("exercise", exercise.id);
					itemRecord.set("order_index", asNum(item.order_index) || x + 1);
					itemRecord.set("target_sets", Math.round(Number(item.target_sets)));
					itemRecord.set("target_reps_min", asNum(item.target_reps_min));
					itemRecord.set("target_reps_max", asNum(item.target_reps_max));
					itemRecord.set("target_weight", asNum(item.target_weight));
					itemRecord.set("rest_seconds", asNum(item.rest_seconds));
					itemRecord.set("notes", asText(item.notes, 2000));
					tx.save(itemRecord);
					createdExercises++;
				});
			});
		});

		return e.json(200, {
			id: createdProgramId,
			name: programName,
			workouts: createdWorkouts,
			exercises: createdExercises,
			skipped_exercises: skipped,
		});
	},
	$apis.requireAuth("users"),
);
