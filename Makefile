
DOCKER_COMPOSE=docker compose

DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yaml
DOCKER_COMPOSE_PROD_FILE = ./srcs/docker-compose.prod.yaml

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

setupEnv:
	@sh ./env_setup.sh

restart: clean build

# Production: multi-stage builds, no hot-reload/dev servers, no source bind-mounts.
prod-build:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD_FILE) up --build -d

prod-down:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD_FILE) down

prod-clean:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD_FILE) down -v

prod-restart: prod-clean prod-build

.PHONY: kill build down clean restart prod-build prod-down prod-clean prod-restart