import cp from 'child_process';
import colors from 'colors/safe';
//import { serverConfig } from './webpack.config';

// Should match the text string used in `src/server.js/server.listen(...)`
const RUNNING_REGEXP = /Server listening at http:\/\/(.*?)\//;

const terminationSignal = 'SIGTERM';

let server;

//for running with node (unbunbled with babel stuff)
const serverPath = './server/devServerBabel.js';

//todo - run bundled server
//const { output } = serverConfig;
//const serverPath = path.join(output.path, output.filename);

// Launch or restart the Node.js server
function runServer(cb) {
  let lastTime = new Date();

  function defaultWriteOut(data) {
    const time = new Date();
    if (time.valueOf() > lastTime.valueOf() + 1000) {
      lastTime = time;
      process.stdout.write(time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '[$1]\n'));
    }
    process.stdout.write(data);
  }

  function onStdOut(data) {
    const match = data.toString('utf8').match(RUNNING_REGEXP);

    defaultWriteOut(data);

    if (match) {
      server.stdout.removeListener('data', onStdOut);
      server.stdout.on('data', defaultWriteOut);
      if (cb) {
        cb(null, match[1]);
      }
    }
  }

  if (server) {
    console.log(colors.blue('Restarting server...'));
    server.kill(terminationSignal);
  }

  //arguments to node
  const nodeArgs = ['--max_old_space_size=4096'];
  if (process.env.DEBUG) {
    nodeArgs.push('--inspect');
  }

  //arguments to script
  //--color so colors module will use colors even when piping to spawn
  const processArgs = ['--color'];

  //DEBUG_COLORS so debug module will use colors and not ugly timestamps
  const defaultEnv = {
    NODE_ENV: 'dev',
    DEBUG_COLORS: 'true',
  };

  //short timeout, start so dev tools etc. have time to detach and die
  const time = process.env.DEBUG ? 50 : 0;
  setTimeout(() => {
    //check if a server was spun up in the mean time
    if (server) {
      console.log(colors.blue('Restarting server...'));
      server.kill(terminationSignal);
    }

    server = cp.spawn('node', [...nodeArgs, serverPath, ...processArgs], {
      env: Object.assign(defaultEnv, process.env),
      silent: false,
    });

    server.stdout.on('data', onStdOut);
    server.stderr.on('data', defaultWriteOut);

    //if the server exits unhappily kill this process too
    //on certain errors not explicitly triggered we could start it up again
    server.on('exit', (code, signal) => {
      //if we explicitly terminated the server (e.g. rebuild)
      if (signal === terminationSignal) {
        return;
      }

      //if we didn't get a signal, try to restart
      if (!signal) {
        return;
      }

      //we trigger 87 on build failure in server.js
      if (code === 87) {
        process.exit(1);
        return; //in case not sync...
      }

      //otherwise something bad happened and we should we restart
      //restarting can be tricky, so kill to be save. you could probably recursively call runServer() if you wanted..
      console.log(colors.red(`Server exited with code ${code} and signal ${signal}`));
      process.exit(1);
    });
  }, time);
}

const terminationHandler = () => {
  if (server) {
    console.log('killing server');
    server.kill(terminationSignal);
  }
};

process.on('exit', terminationHandler);
process.on('SIGINT', terminationHandler);
process.on('SIGTERM', terminationHandler);

export default runServer;
