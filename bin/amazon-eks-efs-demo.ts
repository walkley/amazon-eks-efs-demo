#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AmazonEksEfsDemoStack } from '../lib/amazon-eks-efs-demo-stack';

const app = new cdk.App();
new AmazonEksEfsDemoStack(app, 'AmazonEksEfsDemoStack');
