serverName=vpn-wg-server
pemFileName=root.pem
userName=ec2-user

getPublicDns() {
    name=$1
    filter=Name=tag:Name,Values=$name
    aws ec2 describe-instances --filters $filter --output text --query 'Reservations[*].Instances[*].PublicDnsName'
}

saveState() {
    fileName=$1
    user=$2
    dns=$3
    ssh -i $fileName $user@$dns 'aws secretsmanager put-secret-value --region eu-west-1 --secret-id vpn-wg-json --secret-string "$(cat /home/ec2-user/.wg-easy/wg0.json)"'
    ssh -i $fileName $user@$dns 'aws secretsmanager put-secret-value --region eu-west-1 --secret-id vpn-wg-conf --secret-string "$(cat /home/ec2-user/.wg-easy/wg0.conf)"'
}

echo "Getting public DNS for server with name $serverName"
publicDns=$(getPublicDns "$serverName")

echo "Saving state to secrets manager"
saveState $pemFileName $userName $publicDns
echo "Done!"
