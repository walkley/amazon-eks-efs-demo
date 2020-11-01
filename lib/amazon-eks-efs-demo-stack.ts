import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as efs from '@aws-cdk/aws-efs';
import * as iam from '@aws-cdk/aws-iam'
import * as cdk8s from 'cdk8s';
import { EFSPVChart } from './efs-pv-chart'
import { EFSAppChart } from './app-chart'

const request = require('sync-request');
const lbcManifestUrl = 'https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json';

export class AmazonEksEfsDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'Vpc', { natGateways: 1 });

    // EKS Cluster
    const cluster = new eks.FargateCluster(this, 'Cluster', {
      vpc,
      version: eks.KubernetesVersion.V1_18,
    });

    // EFS file system
    const fileSystem = new efs.FileSystem(this, 'FileSystem', {
      vpc,
      fileSystemName: 'eks-efs-demo-fs',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    fileSystem.connections.allowDefaultPortFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock), 'allow access efs from inside vpc');

    // EFS access points
    const commonAP = fileSystem.addAccessPoint('Common', {
      createAcl: {
        ownerGid: '6000',
        ownerUid: '6000',
        permissions: '750',
      },
      path: '/common',
      posixUser: {
        gid: '6000',
        uid: '6000',
      },
    });

    const svc1PrivateAP = fileSystem.addAccessPoint('svc1Private', {
      createAcl: {
        ownerGid: '3000',
        ownerUid: '3000',
        permissions: '750',
      },
      path: '/private/svc1',
      posixUser: {
        gid: '3000',
        uid: '3000',
      },
    });

    const svc2PrivateAP = fileSystem.addAccessPoint('svc2Private', {
      createAcl: {
        ownerGid: '3000',
        ownerUid: '3000',
        permissions: '750',
      },
      path: '/private/scv2',
      posixUser: {
        gid: '3000',
        uid: '3000',
      },
    });

    // AWS Load Balancer Controller
    const saLBC = cluster.addServiceAccount('LoadBalancerControllerSA', {
      namespace: 'kube-system',
      name: 'aws-load-balancer-controller'
    });

    saLBC.role.addManagedPolicy(new iam.ManagedPolicy(this, 'AWSLoadBalancerControllerIAMPolicy', {
      document: iam.PolicyDocument.fromJson(JSON.parse(request('GET', lbcManifestUrl).getBody())),
    }));

    const lbcChart = cluster.addHelmChart('LoadBalancerController', {
      repository: 'https://aws.github.io/eks-charts',
      chart: 'aws-load-balancer-controller',
      namespace: 'kube-system',
      values: {
        clusterName: cluster.clusterName,
        region: this.region,
        vpcId: vpc.vpcId,
        serviceAccount: {
          create: false,
          name: saLBC.serviceAccountName
        }
      }
    });

    // Persistent Volume and Persistent Volume Claim
    const app = new cdk8s.App();
    const pvChart = cluster.addCdk8sChart('pvChart', new EFSPVChart(app, 'pvChart', {
      fileSystemID: fileSystem.fileSystemId,
      commonAP: commonAP.accessPointId,
      svc1PrivateAP: svc1PrivateAP.accessPointId,
      svc2PrivateAP: svc2PrivateAP.accessPointId
    }));

    // App
    const appChart = cluster.addCdk8sChart('appChart', new EFSAppChart(app, 'appChart'));
    pvChart.node.addDependency(fileSystem);
    appChart.node.addDependency(pvChart);
    appChart.node.addDependency(lbcChart);
  }
}
