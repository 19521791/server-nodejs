# Docker compose commands

defaults:
	up

up:
	docker-compose up --remove-orphans

detach:
	docker-compose up -d --remove-orphans

down:
	docker-compose down

stop:
	docker-compose stop

container:
	docker-compose up my-container

rabbit:
	docker-compose up rabbitmq

# Docker build command
image:
	docker build -t server .

# npm command
compare:
	npm run test:compare

extract:
	npm run test:extract

deleteEP:
	npm run test:deleteEP

deleteAF:
	npm run test:deleteAF