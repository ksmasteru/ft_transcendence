
DOCKER_COMPOSE=docker compose

DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yaml

build:
	@$(DOCKER_COMPOSE)  -f $(DOCKER_COMPOSE_FILE) up --build -d

kill:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) kill

down:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

clean:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down -v

fclean: clean
	rm -rf ./dbfolder
	docker system prune -a -f

restart: clean build

.PHONY: kill build down clean restart