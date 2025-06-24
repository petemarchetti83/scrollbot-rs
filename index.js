const { Storage } = require('@google-cloud/storage');
const functions = require('@google-cloud/functions-framework');

function generate997(ackType = 'interchange', fileName) {
  const ackLevels = {
    interchange: `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *230101*1200*U*00401*000000905*0*T*>~GS*FA*SENDER*RECEIVER*20230101*1200*1*X*004010~`,
    group: `ST*997*0001~AK1*PO*0001~AK9*A*1*1*1~SE*4*0001~`,
    message: `AK2*850*0001~AK5*A~`
  };
  return `${ackLevels.interchange}${ackLevels.group}${ackLevels.message}IEA*1*000000905~`;
}

functions.cloudEvent('router', async (event) => {
  const bucketName = event.data.bucket;
  const fileName = event.data.name;
  if (!fileName.endsWith('.edi')) return;

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  const [contents] = await file.download();

  console.log(`Processing ${fileName}`);
  const ack = generate997('interchange', fileName);
  await bucket.file(`ack/997_${fileName}`).save(ack);
  console.log(`Generated 997 acknowledgment for ${fileName}`);
});
