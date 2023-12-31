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

cdk-diff-server:
	cd deploy && yarn cdk diff

diff: setup cdk-diff-server		## cdk diff

deploy: setup cdk-deploy-server		## deploy everything

destroy-everything: setup		## destroy everything
	cd deploy && yarn cdk destroy

destroy-server: setup
	cd deploy && yarn cdk destroy VpnDestroyablesStack

save-state:
	./scripts/save-state.sh

destroy: setup-keypair-pem save-state destroy-server		## destroy part of the stack after saving state
