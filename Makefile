install:
	npm install

publish:
	npm publish --dry-run

start:
	npm start

lint:
	npx eslint . --ext js,jsx

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

.PHONY: test
