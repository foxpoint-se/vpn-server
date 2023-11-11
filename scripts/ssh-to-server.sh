serverName=vpn-server
pemFileName=root.pem
userName=ubuntu

getPublicDns() {
    name=$1
    filter=Name=tag:Name,Values=$name
    aws ec2 describe-instances --filters $filter --output text --query 'Reservations[*].Instances[*].PublicDnsName'
}

sshToServer() {
    fileName=$1
    user=$2
    dns=$3
    ssh -i $fileName $user@$dns
}

echo "Getting public DNS for server with name $serverName"
publicDns=$(getPublicDns "$serverName")

echo "SSH to $publicDns"
sshToServer $pemFileName $userName $publicDns
