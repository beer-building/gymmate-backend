dev:
	docker compose --progress=plain up pocketbase --build

run:
	docker compose up --build -d
