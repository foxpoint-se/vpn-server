keyName=vpn-server-ec2-key-pair
pemFileName=root.pem
awsRegion=eu-west-1

getKeyPairId() {
    name=$1
    jqSelect=$(printf '.KeyPairs[] | select( .KeyName == "%s") .KeyPairId' "$name")
    keyPairId=$(aws ec2 describe-key-pairs | jq -c -r "$jqSelect")
    echo $keyPairId
}

createPemFile() {
    id=$1
    fileName=$2
    region=$3
    parameterName=$(printf '/ec2/keypair/%s' "$id")
    aws --region=$region ssm get-parameters --names "$parameterName" --with-decryption --query "Parameters[*].{Value:Value}" --output text > "$fileName"
}

setReadRights() {
    fileName=$1
    chmod 400 $fileName
}

removeFile() {
    fileName=$1
    rm $fileName -f
}

echo "Removing $pemFileName"
removeFile $pemFileName

echo "Getting key pair ID with name $keyName"
keyPairId=$(getKeyPairId "$keyName")

echo "Creating pem file $pemFileName for $keyPairId in region $awsRegion"
createPemFile $keyPairId $pemFileName $awsRegion

echo "Setting read rights to $pemFileName"
setReadRights $pemFileName

echo "Done!"
