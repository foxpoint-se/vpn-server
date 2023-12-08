SHELL = /bin/bash

.PHONY: help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

ssh-to-server:		## SSH to server using .pem file
	./scripts/ssh-to-server.sh

setup-keypair-pem:		## get key pair for root ssh access
	./scripts/setup-keypair-pem.sh

setup-deploy:
	cd deploy && yarn

setup: setup-deploy		## install and setup everything for development

cdk-deploy-server:
	cd deploy && yarn cdk deploy --all --require-approval never

cdk-destroy-server:
	cd deploy && yarn cdk destroy

cdk-diff-server:
	cd deploy && yarn cdk diff

diff: setup cdk-diff-server		## cdk diff

deploy: setup cdk-deploy-server		## deploy everything

destroy: setup cdk-destroy-server		## take the server down
