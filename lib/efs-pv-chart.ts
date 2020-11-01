import * as constructs from 'constructs';
import * as cdk8s from 'cdk8s';

export interface EFSPVChartProps {
  readonly fileSystemID: string;
  readonly commonAP: string;
  readonly svc1PrivateAP: string;
  readonly svc2PrivateAP: string;
}

interface PVProps {
  readonly name: string;
  readonly claimRefNs: string;
  readonly claimRefName: string;
  readonly fileSystemID: string;
  readonly accessPoint: string;
}

export class EFSPVChart extends cdk8s.Chart {
  constructor(scope: constructs.Construct, id: string, props: EFSPVChartProps) {
    super(scope, id);

    new cdk8s.ApiObject(this, 'efs-sc', {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: {
        name: 'efs-sc'
      },
      provisioner: 'efs.csi.aws.com'
    });

    this.newEFSPV('efs-pv-common', {
      name: 'efs-pv-common',
      claimRefNs: 'default',
      claimRefName: 'efs-calim-common',
      fileSystemID: props.fileSystemID,
      accessPoint: props.commonAP
    });

    this.newEFSPV('efs-pv-svc1-private', {
      name: 'efs-pv-svc1-private',
      claimRefNs: 'default',
      claimRefName: 'efs-calim-svc1-private',
      fileSystemID: props.fileSystemID,
      accessPoint: props.svc1PrivateAP
    });

    this.newEFSPV('efs-pv-svc2-private', {
      name: 'efs-pv-svc2-private',
      claimRefNs: 'default',
      claimRefName: 'efs-calim-svc2-private',
      fileSystemID: props.fileSystemID,
      accessPoint: props.svc2PrivateAP
    });

    this.newEFSPVC('efs-calim-svc1-private');
    this.newEFSPVC('efs-calim-svc2-private');

    this.newEFSPVC('efs-calim-common');
  }

  newEFSPV(ns: string, pvProps: PVProps): cdk8s.ApiObject {
    return new cdk8s.ApiObject(this, ns, {
      apiVersion: 'v1',
      kind: 'PersistentVolume',
      metadata: {
        name: pvProps.name
      },
      spec: {
        capacity: {
          storage: '5Gi'
        },
        volumeMode: 'Filesystem',
        accessModes: ['ReadWriteMany'],
        persistentVolumeReclaimPolicy: 'Retain',
        claimRef: {
          namespace: pvProps.claimRefNs,
          name: pvProps.claimRefName
        },
        storageClassName: 'efs-sc',
        csi: {
          driver: 'efs.csi.aws.com',
          volumeHandle: `${pvProps.fileSystemID}::${pvProps.accessPoint}`
        }
      }
    })
  }

  newEFSPVC(name: string): cdk8s.ApiObject {
    return new cdk8s.ApiObject(this, name, {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name
      },
      spec: {
        accessModes: ['ReadWriteMany'],
        storageClassName: 'efs-sc',
        resources: {
          requests: {
            storage: '5Gi'
          }
        }
      }
    })
  }
}