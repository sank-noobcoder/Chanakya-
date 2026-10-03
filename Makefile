.PHONY: help dev up down test test-security lint build build-solver clean

help:
	@echo "Chanakya — Sovereign Mathematical Optimization Solver"
	@echo "Available commands:"
	@echo "  make dev           Start all services in development mode"
	@echo "  make up            Run docker-compose up --build"
	@echo "  make down          Stop docker-compose containers"
	@echo "  make test          Run server and solver unit tests"
	@echo "  make test-security Run the 7-layer security test matrix"
	@echo "  make lint          Lint server, client, and solver"
	@echo "  make build-solver  Compile the Rust solver core in release mode"
	@echo "  make benchmark     Execute Netlib / MIPLIB benchmark suite"

dev:
	docker compose up --build

up:
	docker compose -f docker-compose.prod.yml up -d --build

down:
	docker compose down

build-solver:
	cd solver-core && cargo build --release

test:
	cd server && pytest -v
	cd solver-core && cargo test --workspace

test-security:
	cd server && pytest -v tests/test_security_matrix.py

lint:
	cd server && ruff check .
	cd solver-core && cargo clippy --workspace --all-targets -- -D warnings
	cd client && npm run lint

benchmark:
	python scripts/run_benchmarks.py --suite netlib

clean:
	docker compose down -v
	rm -rf solver-core/target server/__pycache__ client/.next
