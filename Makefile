install:
	npm install

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npm test

test-watch:
	npm run test:watch

.PHONY: test
