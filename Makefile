# Docker compose commands

defaults:
	up

up:
	docker-compose up

container:
	docker-compose up my-container

rabbit:
	docker-compose up rabbitmq

# Docker build command
image:
	docker build -t server .
