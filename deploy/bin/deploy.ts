#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VpnServerStack } from "../lib/vpn-server-stack";
import {
  EC2VpnServerStack,
  VpnEc2UbuntuStack,
} from "../lib/ec2-vpn-server-stack";

const app = new cdk.App();
// new VpnServerStack(app, "VpnServerStack", {
//   env: { account: "485563272586", region: "eu-west-1" },
// });

// new EC2VpnServerStack(app, "VpnServerStack", {
//   env: { account: "485563272586", region: "eu-west-1" },
// });

new VpnEc2UbuntuStack(app, "TestVpnStack", {
  env: { account: "485563272586", region: "eu-west-1" },
});
