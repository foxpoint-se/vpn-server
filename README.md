# VPN server

VPN server using Wireguard and WG Easy.

Consists of two stacks: one which is always deployed to hopefully make other deploys quicker and one which should be destroyed after each use, to save some dollars.

`make destroy` saves current WG configuration in Secrets Manager before the stack is tore down. When the stack is deployed the config files are again pulled from Secrets Manager, so we can continue where we left off.

## Get started

Run `make` to get all possible commands. At the moment of writing the available commands are:

```bash
deploy                         deploy everything
destroy-everything             destroy everything
destroy                        destroy part of the stack after saving state
diff                           cdk diff
setup-keypair-pem              get key pair for root ssh access
setup                          install and setup everything for development
ssh-to-server                  SSH to server using .pem file
```

One procedure could be as follows:

1. `git clone` this repo.
1. Run `make setup` to install dependencies locally.
1. If the server isn't currently running in AWS, run `make deploy`.
1. Wait for a few minutes.
1. Connect to the VPN if you feel like it.
1. To see what's going on inside the EC2, run `make setup-keypair-pem` and then `make ssh-to-server`.
1. When done, run `make destroy`.
1. Go home.

## TODO

- [x] An Ubuntu server deployed with CDK
- [x] An easy way to SSH into that server
- [x] Some local version of this server for easier development
- [ ] ~~Script that sets up Wireguard in the Docker container~~
- [ ] ~~Make that script work in EC2~~
- [x] An easy way to connect to that Wireguard server
- [x] CI/CD
  - [x] CDK diff on push to main
- [x] Domain instead of IP
