#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { VpnDestroyables, VpnThingsToKeep } from "../lib/vpn-server";

const app = new cdk.App();

new VpnThingsToKeep(app, "VpnThingsToKeepStack", {
  env: { account: "485563272586", region: "eu-west-1" },
});

new VpnDestroyables(app, "VpnDestroyablesStack", {
  env: { account: "485563272586", region: "eu-west-1" },
  certificateArn:
    "arn:aws:acm:eu-west-1:485563272586:certificate/9d026567-40e7-4aa0-a115-aae4073d033b",
  ec2RoleArn:
    "arn:aws:iam::485563272586:role/VpnThingsToKeepStack-VpnKeepEC2Role52A56314-qG256PlTEv0M",
  wgConfSecretArn:
    "arn:aws:secretsmanager:eu-west-1:485563272586:secret:vpn-wg-conf-ysLv95",
  wgJsonSecretArn:
    "arn:aws:secretsmanager:eu-west-1:485563272586:secret:vpn-wg-json-MSOWgO",
  wgAdminPasswordSecretArn:
    "arn:aws:secretsmanager:eu-west-1:485563272586:secret:vpn-wg-password-K0Dfcb",
});
