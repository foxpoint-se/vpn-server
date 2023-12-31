# VPN server

VPN server using Wireguard and WG Easy.

Consists of two stacks: one which is always deployed to hopefully make other deploys quicker and one which should be destroyed after each use, to save some dollars.

`make destroy` saves current WG configuration in Secrets Manager before the stack is tore down. When the stack is deployed the config files are again pulled from Secrets Manager, so we can continue where we left off.

## Get started

Run `make` to get all possible commands. At the moment of writing the available commands are:

```bash
make deploy                         deploy everything
make diff                           cdk diff
make setup-keypair-pem              get key pair for root ssh access
make setup                          install and setup everything for development
make ssh-to-server                  SSH to server using .pem file
```

## TODO

- [x] An Ubuntu server deployed with CDK
- [x] An easy way to SSH into that server
- [x] Some local version of this server for easier development
- [ ] Script that sets up Wireguard in the Docker container
- [ ] Make that script work in EC2
- [ ] An easy way to connect to that Wireguard server
- [ ] CI/CD
- [ ] Domain instead of IP
