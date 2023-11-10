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
