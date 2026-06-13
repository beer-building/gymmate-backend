/// <reference path="../pb_data/types.d.ts" />

// Программа «Фулбоди (3 дня)» — фулбоди 3 дня (сила/тяга/объём), с суперсетами.
// Источник: local/program_3day_fullbody.json (не версионируется).
// Упражнения связываются по slug из коллекции exercises.
migrate(
	(app) => {
		const PROGRAM = {
			name: "Фулбоди (3 дня)",
			goal: "mass",
			difficulty: 4,
			description: "Фулбоди на 3 дня в неделю (пн/ср/пт): ноги, грудь и спина работают на каждой тренировке. Правила: 1) В односторонних упражнениях (болгарские, выпады, икры) начинать со слабой ноги; сильная делает ровно столько же повторов, сколько осилила слабая. 2) На икрах слабой ноге 4 подхода, сильной 3 — это заложено в плане, икры 3 раза в неделю (разница в обхвате 2 см). 3) Прогрессия: все подходы по верхней границе повторов с хорошей техникой — на следующей тренировке +2.5 кг (жимы/тяги верха) или +5 кг (присед, румынка, жим ногами). 4) Перед рабочими подходами в приседе, жиме лёжа и румынке 2–3 разминочных подхода с лёгким весом. Ориентиры на старте: жим лёжа 80×10 (1ПМ ~100), присед 80×10. Кардио 20–25 мин после силовой — по желанию.",
		};

		const WORKOUTS = [
			{
				"name": "День 1 — сила и жим",
				"exercises": [
					{
						"slug": "zhim-shtangi-lezha-klassicheskiy",
						"sets": 4,
						"reps_min": 5,
						"reps_max": 6,
						"weight": 85,
						"rest": 180,
						"notes": "Первым, пока свежий — приоритетное движение. 80 — твой вес на 10 повторов, на 5–6 стартуй с 85. Разминка: гриф×15, 60×6, 75×3."
					},
					{
						"slug": "prisedaniya-so-shtangoy-na-plechah",
						"sets": 4,
						"reps_min": 5,
						"reps_max": 8,
						"weight": 85,
						"rest": 180,
						"notes": "Текущий рабочий 80×10, на 5–8 повторов бери 85. Разминка: гриф×10, 60×6."
					},
					{
						"slug": "podtyagivaniya-shirokim-hvatom-k-grudi",
						"sets": 4,
						"reps_min": 6,
						"reps_max": 10,
						"weight": 0,
						"rest": 120,
						"notes": "Если меньше 6 — в гравитроне или с резиной."
					},
					{
						"slug": "bolgarskie-prisedaniya",
						"sets": 3,
						"reps_min": 8,
						"reps_max": 10,
						"weight": 0,
						"rest": 90,
						"notes": "С гантелями, 3 подхода на каждую ногу. Начинать строго со слабой, сильной — столько же повторов."
					},
					{
						"slug": "mahi-gantelyami-v-storony",
						"sets": 3,
						"reps_min": 12,
						"reps_max": 15,
						"weight": 0,
						"rest": 60,
						"notes": "Средняя дельта."
					},
					{
						"slug": "podem-na-noski-stoya",
						"sets": 4,
						"reps_min": 12,
						"reps_max": 15,
						"weight": 0,
						"rest": 60,
						"notes": "По одной ноге, начинать со слабой. Слабой ноге 4 подхода, сильной 3."
					},
					{
						"slug": "skruchivaniya-lezha-na-polu",
						"sets": 3,
						"reps_min": 0,
						"reps_max": 0,
						"weight": 0,
						"rest": 60,
						"notes": "До сильного жжения."
					}
				]
			},
			{
				"name": "День 2 — тяга и наклонный жим",
				"exercises": [
					{
						"slug": "stanovaya-tyaga-na-pryamyh-nogah",
						"sets": 4,
						"reps_min": 6,
						"reps_max": 8,
						"weight": 0,
						"rest": 180,
						"notes": "Румынская: со штангой, лёгкий сгиб в коленях, акцент на бицепс бедра. 2–3 разминочных подхода."
					},
					{
						"slug": "zhim-gantelyami-lezha-pod-uglom-vverh",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 10,
						"weight": 0,
						"rest": 120,
						"notes": ""
					},
					{
						"slug": "tyaga-shtangi-v-naklone",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 10,
						"weight": 0,
						"rest": 120,
						"notes": ""
					},
					{
						"slug": "zhim-ganteley-sidya",
						"sets": 3,
						"reps_min": 8,
						"reps_max": 10,
						"weight": 0,
						"rest": 120,
						"notes": "Можно стоя, как удобнее."
					},
					{
						"slug": "sgibanie-nog-v-trenazhere-lezha",
						"sets": 3,
						"reps_min": 10,
						"reps_max": 12,
						"weight": 0,
						"rest": 90,
						"notes": ""
					},
					{
						"slug": "sgibanie-ruk-so-shtangoy-stoya",
						"sets": 3,
						"reps_min": 10,
						"reps_max": 12,
						"weight": 0,
						"rest": 0,
						"notes": "Суперсет с разгибаниями на трицепс: подход бицепса → сразу трицепс → отдых 60–90 сек."
					},
					{
						"slug": "razgibanie-ruk-s-verhnego-bloka",
						"sets": 3,
						"reps_min": 10,
						"reps_max": 12,
						"weight": 0,
						"rest": 90,
						"notes": "Вторая часть суперсета с бицепсом."
					},
					{
						"slug": "podem-na-noski-stoya",
						"sets": 4,
						"reps_min": 12,
						"reps_max": 15,
						"weight": 0,
						"rest": 60,
						"notes": "Добавлено к исходному плану: икры 3 раза в неделю. По одной ноге, начинать со слабой. Слабой 4 подхода, сильной 3."
					}
				]
			},
			{
				"name": "День 3 — объём",
				"exercises": [
					{
						"slug": "zhim-nogami-v-trenazhere-pod-uglom",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 10,
						"weight": 0,
						"rest": 150,
						"notes": ""
					},
					{
						"slug": "zhim-shtangi-lezha-uzkim-hvatom",
						"sets": 4,
						"reps_min": 6,
						"reps_max": 8,
						"weight": 0,
						"rest": 120,
						"notes": "Ориентир ~60–65% от жима лёжа."
					},
					{
						"slug": "tyaga-k-grudi-s-verhnego-bloka-shirokim-hvatom",
						"sets": 4,
						"reps_min": 8,
						"reps_max": 12,
						"weight": 0,
						"rest": 120,
						"notes": ""
					},
					{
						"slug": "vypady-s-gantelyami",
						"sets": 3,
						"reps_min": 10,
						"reps_max": 12,
						"weight": 0,
						"rest": 90,
						"notes": "Назад или болгарские — на выбор. 3 подхода на каждую ногу, начинать со слабой, сильной — столько же повторов."
					},
					{
						"slug": "mahi-gantelyami-v-naklone",
						"sets": 3,
						"reps_min": 12,
						"reps_max": 15,
						"weight": 0,
						"rest": 60,
						"notes": "Задняя дельта."
					},
					{
						"slug": "podem-na-noski-v-trenazhere-sidya",
						"sets": 4,
						"reps_min": 12,
						"reps_max": 15,
						"weight": 0,
						"rest": 60,
						"notes": "По одной ноге, начинать со слабой. Слабой 4 подхода, сильной 3."
					},
					{
						"slug": "podem-nog-v-vise",
						"sets": 3,
						"reps_min": 0,
						"reps_max": 0,
						"weight": 0,
						"rest": 60,
						"notes": "Близко к отказу в каждом подходе."
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
		// Откат: удалить программу вместе с тренировками и их упражнениями.
		const programs = app.findRecordsByFilter("programs", "name = {:name}", "", 0, 0, { name: "Фулбоди (3 дня)" });
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
