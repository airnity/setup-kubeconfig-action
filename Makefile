HAS_NCC := $(shell command -v ncc;)

install:
	npm install

build-main: deps install
	ncc build main.js --license licenses.txt --out dist_main

build-cleanup: deps install
	ncc build cleanup.js --license licenses.txt --out dist_cleanup

build: build-main build-cleanup

clean:
	rm -rf dist_main dist_cleanup

deps:
ifndef HAS_NCC
	npm i -g @vercel/ncc
endif