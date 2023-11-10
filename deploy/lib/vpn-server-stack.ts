import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lightsail from "aws-cdk-lib/aws-lightsail";

export interface VpnServerStackProps extends cdk.StackProps {
  // instanceName: string;
  // availabilityZone: string;
  // blueprintId: string;
  // bundleId: string;
}

const basicStuff = `
sudo apt update
sudo apt upgrade -y
`;

const wireguardInstall = `
sudo apt install wireguard -y
`;

const setupScript = `
${basicStuff}
${wireguardInstall}
`;

const setupScript2 = `
#!/bin/bash
/bin/echo "Hello World." >> /home/ubuntu/test.txt
`;
const setupScript3 = `
echo "Hello World." >> /home/ubuntu/test.txt
`;

export class VpnServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpnServerStackProps) {
    super(scope, id, props);

    const lightsailInstance = new lightsail.CfnInstance(
      this,
      "LightsailInstance",
      {
        instanceName: "cdk-test",
        availabilityZone: "eu-west-1a",
        // NOTE: find available blueprints with `aws lightsail get-blueprints --region <MY_REGION>`
        blueprintId: "ubuntu_22_04",
        // NOTE: find available bundles with `aws lightsail get-bundles`
        bundleId: "nano_3_0",
        userData: setupScript3,
        networking: {
          ports: [
            // wireguard
            {
              protocol: "UDP",
              toPort: 11811,
              fromPort: 11811,
            },
            // SSH
            {
              protocol: "TCP",
              toPort: 22,
              fromPort: 22,
            },
          ],
        },
      }
    );
  }
}

// export class VpnServerStack extends Construct {
//   constructor(scope: Construct, id: string, props: LightsailInstanceProps) {
//     super(scope, id);

//     const lightsailInstance = new lightsail.CfnInstance(this, 'LightsailInstance', {
//       instanceName: props.instanceName,
//       availabilityZone?: props.availabilityZone,
//       blueprintId: props.blueprintId,
//       bundleId: props.bundleId,
//     });
//   }
// }
