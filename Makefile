.PHONY: dev build test docker-up docker-down db-migrate db-studio security-check

dev:
	npm run dev

build:
	npm run build

test:
	npx playwright test

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

db-migrate:
	npx prisma migrate dev

db-studio:
	npx prisma studio

security-check:
	bash scripts/security-check.sh
