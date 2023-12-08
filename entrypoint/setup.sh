#!/bin/bash

workdir=/entrypoint
logfile=setup.log
logpath=$workdir/$logfile

# set working directory to this directory, where script is
cd "$(dirname "$0")"

rm -f $logpath

echo "File created at $(date)" > $logpath

echo "Starting setup script" >>$logpath 2>&1

wget -O wireguard.sh https://get.vpnsetup.net/wg
echo "Downloaded wireguard.sh" >>$logpath 2>&1

bash wireguard.sh --auto >>$logpath 2>&1


echo "Done with setup script" >>$logpath 2>&1
