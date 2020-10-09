SRC_FILES := $(shell find src -name '*.ts')

all: lib lib/bundle.js lib/index.es5.js

lib: $(SRC_FILES) node_modules tsconfig.json
	./node_modules/.bin/tsc -p tsconfig.json --outDir lib
	touch lib

lib/bundle.js: $(SRC_FILES) node_modules tsconfig.json rollup.config.js
	UNPKG_BUNDLE=1 ./node_modules/.bin/rollup -c

lib/index.es5.js: $(SRC_FILES) node_modules tsconfig.json rollup.config.js
	./node_modules/.bin/rollup -c

.PHONY: lint
lint: node_modules
	NODE_ENV=test ./node_modules/.bin/tslint -p tsconfig.json -c tslint.json -t stylish --fix

node_modules:
	yarn install --non-interactive --frozen-lockfile

.PHONY: clean
clean:
	rm -rf lib/

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
