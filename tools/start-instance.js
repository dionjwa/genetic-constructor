import run from './run';
import runServer from './runServer';
import setup from './setup';
import checks from './checks';
import bundle from './bundle';
import clean from './clean';
import startDb from './startDb';
import copy from './copy';

//This is a short term file which is used to build the client, and run the server once. Meant for short-term production use, getting rid of webpack middleware etc., but still running the server in babel-node.
const NO_DOCKER = process.env.NO_DOCKER || false;

async function startInstance() {
  await run(checks);
  await run(clean);
  await run(setup);
  if (! NO_DOCKER) {
    await run(startDb);
  }
  await run(copy.bind(undefined, { watch: true }));
  await run(bundle);

  console.log('client built, starting server');
  await new Promise(resolve => {
    runServer(() => resolve);
  });
}

export default startInstance;
