# Amazon EFS integration with AWS Fargate for Amazon EKS

This repository provides example of Amazon EFS integrations with AWS Fargate for Amazon EKS.
There are 2 services to use shared and private volumes in EFS, the services are 2 web applications using [Cloud Commander](https://github.com/coderaiser/cloudcmd) to manage files in EFS.

## Usage
1. Install configure environment for [Amazon Cloud Development Kit](https://aws.amazon.com/cdk/) (CDK).
2. Install [kubectl](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html#eksctl-kubectl)
3. Clone this repository and `cd` into it.
4. Execute the following:
    * `npm install`
    * `npm run cdk bootstrap`
    * `npm run cdk deploy`
5. It may take 15 minutes to deploy all components in the stack, you may get message similar as following if everything going well:
    ```
    Outputs:
    AmazonEksEfsDemoStack.ClusterConfigCommand43AAE40F = aws eks update-kubeconfig --name Cluster9EE0221C-0fab78b147c247e3b615fd64fe2dfb33 --region us-west-2 --role-arn arn:aws:iam::269621987045:role/AmazonEksEfsDemoStack-ClusterMastersRole9AA35625-1N1OVETFFC0EN
    AmazonEksEfsDemoStack.ClusterGetTokenCommand06AE992E = aws eks get-token --cluster-name Cluster9EE0221C-0fab78b147c247e3b615fd64fe2dfb33 --region us-west-2 --role-arn arn:aws:iam::269621987045:role/AmazonEksEfsDemoStack-ClusterMastersRole9AA35625-1N1OVETFFC0EN
    ```
6. Run the ClusterConfigCommand(aws eks update-kubeconfig ...) in above output to setup kubeconfig file.
7. Get the URL of NLBs for the two demo apps.
    ```
    kubectl get svc
    ```
5. Visit the load balancer URLs and to upload and visit file in common and private directories.

## Cleanup

Execute `npm run cdk destroy` to delete resources pertaining to this example.

You will also need to delete the following *manually*:
   * The [CDKToolkit CloudFormation Stack](https://console.aws.amazon.com/cloudformation/home#/stacks?filteringText=CDKToolkit) created by `npm run cdk bootstrap`.
   * The `cdktoolkit-stagingbucket-<...>` bucket.
