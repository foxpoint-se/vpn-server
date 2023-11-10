SHELL = /bin/bash

.PHONY: help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

get-lightsail-pk:		## get lightsail default private key
	@export MY_VAR=$$(aws lightsail download-default-key-pair | jq ".privateKeyBase64"); \
	echo "$${MY_VAR}"; \
	echo "${MY_VAR}" | ssh -q -i /dev/stdin ubuntu@34.253.172.237 'hostnamectl'; \
	exit 0;

ssh-ish:		## SSH to EC2 using .pem file
	ssh -i "TestRemoveThis.pem" ubuntu@ec2-3-254-176-146.eu-west-1.compute.amazonaws.com
