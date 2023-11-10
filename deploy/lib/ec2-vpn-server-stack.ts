import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface EC2VpnServerStackProps extends cdk.StackProps {}

export class EC2VpnServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EC2VpnServerStackProps) {
    super(scope, id, props);

    // Create a VPC (Virtual Private Cloud) for your EC2 instance
    const vpc = new cdk.aws_ec2.Vpc(this, "TestVpcFromCdk", {
      maxAzs: 2, // Specify the desired number of Availability Zones
    });

    // Define the user data script to run on instance launch
    const userData = cdk.aws_ec2.UserData.forLinux();
    userData.addCommands(
      "#!/bin/bash",
      'echo "This is my setup script" >> /var/log/setup.log'
      // Add any additional commands you want to run on launch
    );

    // Create an EC2 instance
    const ec2Instance = new cdk.aws_ec2.Instance(this, "TestEC2FromCdk", {
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.BURSTABLE2,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux(), // Use the latest Amazon Linux 2 AMI
      vpc,
      userData, // Attach the user data script
    });
  }
}

export class SimpleEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // its important to add our env config here otherwise CDK won't know our AWS account number
    super(scope, id, props);

    // Get the default VPC. This is the network where your instance will be provisioned
    // All activated regions in AWS have a default vpc.
    // You can create your own of course as well. https://aws.amazon.com/vpc/
    const defaultVpc = cdk.aws_ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true,
    });

    // Lets create a role for the instance
    // You can attach permissions to a role and determine what your
    // instance can or can not do
    const role = new cdk.aws_iam.Role(
      this,
      "simple-instance-1-role", // this is a unique id that will represent this resource in a Cloudformation template
      { assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com") }
    );

    // lets create a security group for our instance
    // A security group acts as a virtual firewall for your instance to control inbound and outbound traffic.
    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "simple-instance-1-sg",
      {
        vpc: defaultVpc,
        allowAllOutbound: true, // will let your instance send outboud traffic
        securityGroupName: "simple-instance-1-sg",
      }
    );

    // lets use the security group to allow inbound traffic on specific ports
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(22),
      "Allows SSH access from Internet"
    );

    // securityGroup.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(80),
    //   'Allows HTTP access from Internet'
    // )
    // securityGroup.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(443),
    //   'Allows HTTPS access from Internet'
    // )

    // TODO: use this
    // securityGroup.addIngressRule(
    //   cdk.aws_ec2.Peer.anyIpv4(),
    //   cdk.aws_ec2.Port.udp(51820),
    //   'Allows UDP access from Internet to Wireguard'
    // )

    const ubuntuDistro: "focal" | "jammy" = "jammy";

    // Finally lets provision our ec2 instance
    const instance = new cdk.aws_ec2.Instance(this, "simple-instance-1", {
      vpc: defaultVpc,
      role: role,
      securityGroup: securityGroup,
      instanceName: "simple-instance-1",
      instanceType: cdk.aws_ec2.InstanceType.of(
        // t2.micro has free tier usage in aws
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      machineImage: cdk.aws_ec2.MachineImage.fromSsmParameter(
        `/aws/service/canonical/ubuntu/server/${ubuntuDistro}/stable/current/amd64/hvm/ebs-gp2/ami-id`,
        {}
      ),
      // TODO: another key?
      keyName: "TestRemoveThis", // we will create this in the console before we deploy
    });

    // cdk lets us output prperties of the resources we create after they are created
    // we want the ip address of this new instance so we can ssh into it later
    new cdk.CfnOutput(this, "simple-instance-1-output", {
      value: instance.instancePublicIp,
    });

    // SSH Command to connect to the EC2 Instance
    new cdk.CfnOutput(this, "sshCommand", {
      value: `ssh -i "TestRemoveThis.pem" ubuntu@${instance.instancePublicDnsName}`,
    });
  }
}
