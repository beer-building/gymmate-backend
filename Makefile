dev:
	docker compose --progress=plain -f ./docker-compose.yml up pocketbase --build

run:
	docker compose -f ./docker-compose.yml up pocketbase nginx --build

make-ssl:
	docker compose up certbot --build
