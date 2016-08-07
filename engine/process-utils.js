'use strict'

const path              = require('path');
const fork              = require('child_process').fork;
const chalk             = require('chalk');
const kill              = require('tree-kill');
const childEnv          = Object.assign({ FORCE_COLOR: true }, process.env);
const childProcessCfg   = {
    module: '../gulp/bin/gulp',
    tabArgs: [],
    noTabArgs: ['--no-browser-tab'],
    options: {
        cwd: path.join(process.cwd(), 'node_modules/pmp-engine/'),
        silent: false,
        env: childEnv
    }
};

let starter = function(engineCfg, noTabs) {
    let additionalArgs = (noTabs) ? childProcessCfg.noTabArgs : childProcessCfg.tabArgs;
    let child = fork(childProcessCfg.module, additionalArgs, childProcessCfg.options);
    
    //setup log enhancement  
    child.on('message', (data) => {
        switch(data.type){        
            case 'ERROR':
                console.log(chalk.blue('PMP engine') + ' ' + chalk.red('ERROR')  + ' ' + chalk.white(data.msg.toString()));
            break;
            
            case 'INITIATED':
                console.log(chalk.blue('PMP engine') + ' ' + chalk.yellow('INITIATED')  + ' ' + chalk.white(data.msg));
                //send config to process
                child.send({ type:'CONFIG', payload:engineCfg });
            break;
            
            case 'CONFIG READY':
                console.log(chalk.blue('PMP engine') + ' ' + chalk.green(data.type)  + ' ' + chalk.white(data.msg));
            break;
            
            case 'STARTED':
                console.log(chalk.blue('PMP engine') + ' ' + chalk.green(data.type)  + ' ' + chalk.white(data.msg));
            break;

            default:
                console.log(chalk.blue(data.type)  + ' ' + chalk.white(data.msg));
        };
    });
    
    //setup exit log
    child.on('exit', (code) => {
        console.log(chalk.blue('PMP engine')  + ' ' + chalk.red('STOPPED') + chalk.white(` child process exited with code ${code}`));
    });

    return child;
}

let restarter = function(previousChild, engineCfg) {
    let newChild;

    //kill previous process & start again
    previousChild.removeAllListeners();
    kill(previousChild.pid, 'SIGKILL', (err) => {
        newChild = starter(engineCfg, true);
    });

    return newChild;
}

let stopper = function(previousChild) {
    //kill process
    previousChild.removeAllListeners();
    kill(previousChild.pid, 'SIGKILL', (err) => {});
}

module.exports = {
    starter: starter,
    restarter: restarter,
    stopper: stopper
}