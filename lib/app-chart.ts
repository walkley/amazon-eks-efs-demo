import * as constructs from 'constructs';
import * as cdk8s from 'cdk8s';
import * as kplus from 'cdk8s-plus'

const image = 'coderaiser/cloudcmd:14.3.10-alpine';
const args = ["--no-keys-panel", "--one-file-panel", "--port=80", "--root=/files"];

// Volume with PVC
class PVCVolume extends kplus.Volume {
  public static fromPVC(name: string, claimName: string): PVCVolume {
    return new PVCVolume(name, {
        persistentVolumeClaim: {
          claimName
        },
    });
  }
}

export class EFSAppChart extends cdk8s.Chart {
  constructor(scope: constructs.Construct, id: string) {
    super(scope, id);

    const container1 = new kplus.Container({ image, args, port: 80 });
    container1.mount('/files/common', PVCVolume.fromPVC('efs-volume-common', 'efs-calim-common'));
    container1.mount('/files/private', PVCVolume.fromPVC('efs-volume-svc1-private', 'efs-calim-svc1-private'));
    const app1 = new kplus.Deployment(this, 'efs-app1', {
      containers: [container1]
    })
    const svc1 = app1.expose(80, { serviceType: kplus.ServiceType.LOAD_BALANCER });
    svc1.metadata.addAnnotation('service.beta.kubernetes.io/aws-load-balancer-type', 'nlb-ip');

    const container2 = new kplus.Container({ image, args, port: 80 });
    container2.mount('/files/common', PVCVolume.fromPVC('efs-volume-common', 'efs-calim-common'));
    container2.mount('/files/private', PVCVolume.fromPVC('efs-volume-svc2-private', 'efs-calim-svc2-private'));
    const app2 = new kplus.Deployment(this, 'efs-app2', {
      containers: [container2]
    })
    const svc2 = app2.expose(80, { serviceType: kplus.ServiceType.LOAD_BALANCER });
    svc2.metadata.addAnnotation('service.beta.kubernetes.io/aws-load-balancer-type', 'nlb-ip');
  }
}