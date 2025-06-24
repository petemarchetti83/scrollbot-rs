const { Storage } = require('@google-cloud/storage');
const functions = require('@google-cloud/functions-framework');

function generate997({ ackType = 'interchange', fileName = 'file.edi', controlNumber = '000000002' }) {
  const isa = `ISA*00*          *00*          *ZZ*RECEIVERID     *ZZ*SENDERID       *240623*1230*U*00401*${controlNumber}*0*T*>~`;
  const gs = `GS*FA*RECEIVERID*SENDERID*20240623*1230*1*X*004010~`;
  const st = `ST*997*0001~`;
  const ak1 = `AK1*PO*1~`;
  const ak2 = `AK2*850*0001~`;

  const ackLevels = {
    element: `AK3*BEG*1*8*8~AK4*1*00*NE*7~`,
    segment: `AK5*A~`,
    message: `AK9*A*1*1*1~`
  };

  const se = `SE*7*0001~`;
  const ge = `GE*1*1~`;
  const iea = `IEA*1*${controlNumber}~`;

  let detail = '';
  if (ackType === 'element') {
    detail = ackLevels.element + ackLevels.segment + ackLevels.message;
  } else if (ackType === 'segment') {
    detail = ackLevels.segment + ackLevels.message;
  } else {
    detail = ackLevels.message;
  }

  return [isa, gs, st, ak1, ak2, detail, se, ge, iea].join('');
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
  const ackContent = generate997({
    ackType: 'element',
    fileName,
    controlNumber: '000000002'
  });

  await bucket.file(`ack/997_${fileName}`).save(ackContent, {
    contentType: 'application/EDI-X12'
  });

  console.log(`Generated detailed 997 for ${fileName}`);
});
