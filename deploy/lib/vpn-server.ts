import * as cdk from "aws-cdk-lib";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

const elbv2 = cdk.aws_elasticloadbalancingv2;
const elasticloadbalancingv2_targets = cdk.aws_elasticloadbalancingv2_targets;

const adminSiteDomain = "vpnadmin.foxpoint.se";
const vpnDomain = "vpn.foxpoint.se";
const wgPassSecretName = "vpn-wg-password";
const wgJsonSecretName = "vpn-wg-json";
const wgConfSecretName = "vpn-wg-conf";

export class VpnThingsToKeep extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const zone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "VpnKeepHostedZone",
      {
        domainName: "foxpoint.se",
      }
    );

    const certificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "VpnKeepCertificate",
      {
        domainName: "vpnadmin.foxpoint.se",
        validation:
          cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
      }
    );

    const role = new cdk.aws_iam.Role(this, "VpnKeepEC2Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // WG Password
    const wgPasswordSecret = new cdk.aws_secretsmanager.Secret(
      this,
      "VpnKeepPass",
      {
        description: "Password to access Wireguard admin interface",
        secretName: wgPassSecretName,
      }
    );

    wgPasswordSecret.grantRead(role);

    new cdk.CfnOutput(this, "wg-password-secret-instruction", {
      value: `aws secretsmanager put-secret-value --region ${props.env?.region} --secret-id ${wgPasswordSecret.secretName} --secret-string REDACTED`,
    });

    new cdk.CfnOutput(this, "wg-password-secret-arn", {
      value: wgPasswordSecret.secretArn,
    });

    // WG Easy JSON
    const wgJsonSecret = new cdk.aws_secretsmanager.Secret(
      this,
      "VpnKeepJsonSecret",
      {
        description:
          "JSON for WG Easy docker service, to persist between rebuilds",
        secretName: wgJsonSecretName,
      }
    );

    wgJsonSecret.grantRead(role);
    wgJsonSecret.grantWrite(role);

    new cdk.CfnOutput(this, "wg-json-secret-instruction", {
      value: `aws secretsmanager put-secret-value --region ${props.env?.region} --secret-id ${wgJsonSecret.secretName} --secret-string REDACTED`,
    });

    new cdk.CfnOutput(this, "wg-json-secret-arn", {
      value: wgJsonSecret.secretArn,
    });

    // WG Easy JSON
    const wgConfSecret = new cdk.aws_secretsmanager.Secret(
      this,
      "VpnKeepConfSecret",
      {
        description:
          "Conf for WG Easy docker service, to persist between rebuilds",
        secretName: wgConfSecretName,
      }
    );

    wgConfSecret.grantRead(role);
    wgConfSecret.grantWrite(role);

    new cdk.CfnOutput(this, "wg-conf-secret-instruction", {
      value: `aws secretsmanager put-secret-value --region ${props.env?.region} --secret-id ${wgConfSecret.secretName} --secret-string REDACTED`,
    });

    new cdk.CfnOutput(this, "wg-conf-secret-arn", {
      value: wgConfSecret.secretArn,
    });

    // More useful prints
    new cdk.CfnOutput(this, "certificate-arn", {
      value: certificate.certificateArn,
    });

    new cdk.CfnOutput(this, "ec2-role-arn", {
      value: role.roleArn,
    });
  }
}

interface VpnDestroyablesProps extends cdk.StackProps {
  wgAdminPasswordSecretArn: string;
  wgJsonSecretArn: string;
  wgConfSecretArn: string;
  certificateArn: string;
  ec2RoleArn: string;
}

export class VpnDestroyables extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpnDestroyablesProps) {
    super(scope, id, props);

    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "DestDefaultVPC", {
      isDefault: true,
    });

    const instanceName = "vpn-wg-server";

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "DestSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
        securityGroupName: `${instanceName}-security-group`,
      }
    );

    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(80),
      "Allows access to admin site"
    );

    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.udp(51820),
      "Allows UDP access from Internet to Wireguard"
    );

    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(22),
      "Allows SSH access"
    );

    const wgEasyDir = "/home/ec2-user/.wg-easy";
    const userData = cdk.aws_ec2.UserData.forLinux();
    userData.addCommands(
      "sudo yum update -y",
      "sudo apt install awscli -y",
      "sudo amazon-linux-extras install docker -y",
      "sudo service docker start",
      "sudo usermod -a -G docker ec2-user", // Add ec2-user to the docker group, so that docker commands don't have to be run as sudo
      "sudo su $USER", // To refresh groups without having to log out
      `mkdir ${wgEasyDir}`,
      `aws secretsmanager get-secret-value --region ${props.env?.region} --secret-id ${wgJsonSecretName} --query SecretString --output text > ${wgEasyDir}/wg0.json`,
      `aws secretsmanager get-secret-value --region ${props.env?.region} --secret-id ${wgConfSecretName} --query SecretString --output text > ${wgEasyDir}/wg0.conf`,
      "docker pull ghcr.io/wg-easy/wg-easy",
      `docker run -d --name=wg-easy -e WG_HOST=${vpnDomain} -e PASSWORD=$(aws secretsmanager get-secret-value --region ${props.env?.region} --secret-id ${wgPassSecretName} --query SecretString --output text) -v ${wgEasyDir}:/etc/wireguard -p 51820:51820/udp -p 80:51821/tcp --cap-add=NET_ADMIN --cap-add=SYS_MODULE --sysctl="net.ipv4.conf.all.src_valid_mark=1" --sysctl="net.ipv4.ip_forward=1" --restart unless-stopped ghcr.io/wg-easy/wg-easy`
    );

    const keyPairName = "vpn-server-ec2-key-pair";

    const keyPair = new cdk.aws_ec2.CfnKeyPair(this, "DestKeyPair", {
      keyName: keyPairName,
    });

    const role = cdk.aws_iam.Role.fromRoleArn(
      this,
      "DestEc2Role",
      props.ec2RoleArn
    );

    const instance = new cdk.aws_ec2.Instance(this, "DestEc2Instance", {
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.BURSTABLE2,
        cdk.aws_ec2.InstanceSize.NANO
      ),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2(),
      instanceName,
      securityGroup,
      vpc,
      role,
      userData,
      keyName: keyPair.keyName,
    });

    instance.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
        ],
        resources: [
          props.wgAdminPasswordSecretArn,
          props.wgJsonSecretArn,
          props.wgConfSecretArn,
        ],
      })
    );

    instance.addSecurityGroup(securityGroup);

    const alb = new elbv2.ApplicationLoadBalancer(this, "DestApplicationLB", {
      vpc,
      internetFacing: true,
      securityGroup,
    });

    const instanceTarget = new elasticloadbalancingv2_targets.InstanceTarget(
      instance,
      80
    );

    const tg = new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(
      this,
      "DestApplicationTargetGroup",
      {
        port: 80,
        protocol: ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        vpc,
        targets: [instanceTarget],
        healthCheck: {
          healthyHttpCodes: "200",
        },
      }
    );

    // ==== UDP start
    const wgTarget = new elasticloadbalancingv2_targets.InstanceTarget(
      instance,
      51820
    );

    const networkLoadBalancer = new elbv2.NetworkLoadBalancer(
      this,
      "DestNetworkLoadBalancer",
      {
        vpc,
        internetFacing: true,
      }
    );

    // Configure listener for UDP on port 51820
    const listener2 = networkLoadBalancer.addListener("DestUdpListener", {
      port: 51820,
      protocol: elbv2.Protocol.UDP,
    });

    // Create a target group on the correct port (51820)
    const targetGroup = new elbv2.NetworkTargetGroup(
      this,
      "DestNetworkTargetGroup",
      {
        vpc,
        port: 51820,
        protocol: elbv2.Protocol.UDP,
        targets: [wgTarget],
        healthCheck: {
          protocol: elbv2.Protocol.TCP, // Health check uses TCP
          port: "80",
        },
      }
    );

    // Add target group to listener
    listener2.addTargetGroups("DestWgListenerTarget", targetGroup);
    // ==== UDP end

    alb.addRedirect({
      open: true,
      sourcePort: 80,
      sourceProtocol: ApplicationProtocol.HTTP,
      targetPort: 443,
      targetProtocol: ApplicationProtocol.HTTPS,
    });

    const zone = cdk.aws_route53.HostedZone.fromLookup(this, "DestHostedZone", {
      domainName: "foxpoint.se",
    });

    const certificate =
      cdk.aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        "DestCertificate",
        props.certificateArn
      );

    const httpsListener = alb.addListener("DestHttpsListener", {
      port: 443,
      open: true,
      certificates: [
        cdk.aws_elasticloadbalancingv2.ListenerCertificate.fromCertificateManager(
          certificate
        ),
      ],
    });
    httpsListener.addTargetGroups("DestHttpsListenerTarget", {
      targetGroups: [tg],
    });

    new cdk.aws_route53.ARecord(this, "DestAdminARecord", {
      zone: zone,
      recordName: adminSiteDomain,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(alb)
      ),
    });

    new cdk.aws_route53.ARecord(this, "DestWgARecord", {
      zone: zone,
      recordName: vpnDomain,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(networkLoadBalancer)
      ),
    });
  }
}
