/// <reference path="../pb_data/types.d.ts" />

// Программа «3D Glutes» — 3 тренировки с акцентом на ягодицы/ноги (+ верх и пресс),
// с суперсетами. Источник: local/program_3day_glutes.json (не версионируется).
// Упражнения связываются по slug из коллекции exercises.
migrate(
	(app) => {
		const PROGRAM = {
			name: "3D Glutes",
			goal: "mass",
			difficulty: 3,
			description: "Программа на 3 тренировки с акцентом на ягодицы, ноги и пресс плюс работа на верх (спина, плечи, руки). В тренировках 1 и 2 первые две позиции выполняются связками-суперсетами (упражнение → сразу следующее → отдых), это помечено в заметках. Указанные веса — текущие рабочие, отталкивайся от них и корректируй по самочувствию. В односторонних упражнениях (зашагивания, выпады, «ласточка», разгибание бедра) начинать со слабой ноги, сильная делает столько же повторов. Прогрессия: когда все подходы выполнены чисто по верхней границе повторов — добавляй вес (изоляция +1–2.5 кг, базовые ноги +5 кг). Перед тяжёлыми движениями (жим ногами, становая, приседания-зашагивания) 1–2 разминочных подхода. Кардио 15–20 мин в конце по желанию.",
		};

		const WORKOUTS = [
			{
				"name": "Тренировка 1 — ягодицы/ноги + верх",
				"exercises": [
					{
						"slug": "prisedaniya-s-vesom-mezhdu-nog",
						"sets": 4,
						"reps_min": 11,
						"reps_max": 11,
						"weight": 20,
						"rest": 0,
						"notes": "Суперсет: гиря 20 кг на платформе между ног → сразу разведение ног в тренажёре, затем отдых."
					},
					{
						"slug": "razvedenie-nog-v-trenazhere",
						"sets": 4,
						"reps_min": 15,
						"reps_max": 15,
						"weight": 45,
						"rest": 120,
						"notes": "Вторая часть суперсета с приседаниями."
					},
					{
						"slug": "zashagivaniya-na-podstavku-s-gantelyami",
						"sets": 4,
						"reps_min": 11,
						"reps_max": 11,
						"weight": 12,
						"rest": 0,
						"notes": "Суперсет (начало): гиря 12 кг → сразу сведение ног в тренажёре, затем отдых. По одной ноге, начинать со слабой."
					},
					{
						"slug": "svedenie-nog-v-trenazhere",
						"sets": 4,
						"reps_min": 15,
						"reps_max": 15,
						"weight": 30,
						"rest": 120,
						"notes": "Суперсет (конец): вторая часть связки с зашагиваниями."
					},
					{
						"slug": "tyaga-k-grudi-s-verhnego-bloka-shirokim-hvatom",
						"sets": 4,
						"reps_min": 12,
						"reps_max": 12,
						"weight": 25,
						"rest": 90,
						"notes": ""
					},
					{
						"slug": "zhim-ganteley-sidya",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 8,
						"weight": 15,
						"rest": 90,
						"notes": "В тренажёре (либо гантели — как удобнее)."
					},
					{
						"slug": "skruchivaniya-lezha-na-polu",
						"sets": 3,
						"reps_min": 20,
						"reps_max": 20,
						"weight": 0,
						"rest": 60,
						"notes": "С поднятыми ногами (согнуты под 90°)."
					},
					{
						"slug": "bokovaya-planka",
						"sets": 3,
						"reps_min": 0,
						"reps_max": 0,
						"weight": 0,
						"rest": 60,
						"notes": "Удержание ~20 секунд на каждую сторону, 3 подхода."
					}
				]
			},
			{
				"name": "Тренировка 2 — ноги/бицепс бедра + верх",
				"exercises": [
					{
						"slug": "zhim-nogami-v-trenazhere-pod-uglom",
						"sets": 4,
						"reps_min": 11,
						"reps_max": 11,
						"weight": 50,
						"rest": 0,
						"notes": "Суперсет: жим ногами 50 кг → сразу гиперэкстензия, затем отдых."
					},
					{
						"slug": "giperekstenziya-naklony-cherez-kozla",
						"sets": 4,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 12.5,
						"rest": 120,
						"notes": "Вторая часть суперсета. Гантель 12,5 кг у груди."
					},
					{
						"slug": "sgibanie-nog-v-trenazhere-lezha",
						"sets": 4,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 15,
						"rest": 0,
						"notes": "Суперсет (начало): 15 кг → сразу тяга одной гантели в наклоне, затем отдых."
					},
					{
						"slug": "tyaga-odnoy-ganteli-v-naklone",
						"sets": 4,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 10,
						"rest": 120,
						"notes": "Суперсет (конец): 10 кг, по каждой руке."
					},
					{
						"slug": "tyaga-k-grudi-s-verhnego-bloka-obratnym-hvatom",
						"sets": 4,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 30,
						"rest": 90,
						"notes": ""
					},
					{
						"slug": "frantsuzskiy-zhim-s-ganteley-stoya-i-sidya",
						"sets": 4,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 7.5,
						"rest": 90,
						"notes": "Одна гантель 7,5 кг двумя руками."
					},
					{
						"slug": "uprazhnenie-velosiped",
						"sets": 3,
						"reps_min": 30,
						"reps_max": 30,
						"weight": 0,
						"rest": 60,
						"notes": ""
					},
					{
						"slug": "vraschenie-korpusa-stoya-sidya",
						"sets": 3,
						"reps_min": 20,
						"reps_max": 20,
						"weight": 4,
						"rest": 60,
						"notes": "Russian twist: сидя, ноги на весу, повороты корпуса с гантелью 4 кг."
					}
				]
			},
			{
				"name": "Тренировка 3 — ягодицы/ноги + пресс",
				"exercises": [
					{
						"slug": "vypady-s-hodboy",
						"sets": 3,
						"reps_min": 30,
						"reps_max": 30,
						"weight": 7,
						"rest": 120,
						"notes": "Гантели по 7 кг. 30 шагов всего (≈15 на каждую ногу)."
					},
					{
						"slug": "podem-taza-lezha-na-polu-mostik",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 8,
						"weight": 20,
						"rest": 120,
						"notes": "Блин(ы) 20 кг на тазу."
					},
					{
						"slug": "stanovaya-tyaga-s-gantelyami",
						"sets": 3,
						"reps_min": 10,
						"reps_max": 10,
						"weight": 16,
						"rest": 120,
						"notes": "«Ласточка» — румынская тяга на одной ноге с гирей 16 кг, опорная нога на подставке. По 3 подхода на каждую ногу, начинать со слабой."
					},
					{
						"slug": "razgibanie-bedra-v-krossovere",
						"sets": 3,
						"reps_min": 12,
						"reps_max": 12,
						"weight": 25,
						"rest": 90,
						"notes": "По одной ноге, начинать со слабой."
					},
					{
						"slug": "tyaga-gorizontalnogo-bloka-k-poyasu",
						"sets": 3,
						"reps_min": 12,
						"reps_max": 12,
						"weight": 30,
						"rest": 90,
						"notes": ""
					},
					{
						"slug": "otzhimaniya-ot-pola-uzkim-hvatom",
						"sets": 3,
						"reps_min": 15,
						"reps_max": 15,
						"weight": 0,
						"rest": 90,
						"notes": "С колен, если 15 со своим весом тяжело."
					},
					{
						"slug": "uprazhnenie-planka",
						"sets": 3,
						"reps_min": 0,
						"reps_max": 0,
						"weight": 0,
						"rest": 60,
						"notes": "Удержание 1 минута, 3 подхода."
					},
					{
						"slug": "podem-nog-lezha-na-polu",
						"sets": 3,
						"reps_min": 20,
						"reps_max": 20,
						"weight": 0,
						"rest": 60,
						"notes": ""
					}
				]
			}
		];

		const program = new Record(app.findCollectionByNameOrId("programs"));
		program.set("name", PROGRAM.name);
		program.set("description", PROGRAM.description);
		program.set("goal", PROGRAM.goal);
		program.set("difficulty", PROGRAM.difficulty);
		program.set("is_public", true);
		app.save(program);

		const workoutsColl = app.findCollectionByNameOrId("program_workouts");
		const itemsColl = app.findCollectionByNameOrId("program_workout_exercises");

		WORKOUTS.forEach((w, wi) => {
			const workout = new Record(workoutsColl);
			workout.set("program", program.id);
			workout.set("name", w.name);
			workout.set("order_index", wi + 1);
			app.save(workout);

			w.exercises.forEach((ex, ei) => {
				const exercise = app.findFirstRecordByData("exercises", "slug", ex.slug);
				if (!exercise) {
					throw new Error("Unknown exercise slug: " + ex.slug);
				}
				const item = new Record(itemsColl);
				item.set("program_workout", workout.id);
				item.set("exercise", exercise.id);
				item.set("order_index", ei + 1);
				item.set("target_sets", ex.sets);
				item.set("target_reps_min", ex.reps_min);
				item.set("target_reps_max", ex.reps_max);
				item.set("target_weight", ex.weight);
				item.set("rest_seconds", ex.rest);
				item.set("notes", ex.notes);
				app.save(item);
			});
		});
	},
	(app) => {
		// Откат: удалить программу «3D Glutes» вместе с тренировками и их упражнениями.
		const programs = app.findRecordsByFilter("programs", "name = {:name}", "", 0, 0, { name: "3D Glutes" });
		for (const program of programs) {
			const workouts = app.findRecordsByFilter("program_workouts", "program = {:p}", "", 0, 0, { p: program.id });
			for (const workout of workouts) {
				const items = app.findRecordsByFilter("program_workout_exercises", "program_workout = {:w}", "", 0, 0, { w: workout.id });
				for (const item of items) {
					app.delete(item);
				}
				app.delete(workout);
			}
			app.delete(program);
		}
	},
);
