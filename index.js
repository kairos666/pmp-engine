'use strict'

const EventEmitter      = require('events');
const chalk             = require('chalk');
const starter           = require('./engine/process-utils').starter;
const restarter         = require('./engine/process-utils').restarter;
const stopper           = require('./engine/process-utils').stopper;

class PmpEngine extends EventEmitter {
    constructor() {
        super();
        this._isStarted      = false;
        this._childProcess   = undefined;
        this._currentConfig  = undefined;
    }

    //launch pmp engine with some config
    start(engineCfg) {
        if(!this.childProcess && engineCfg) {
            //normal start
            console.log(chalk.blue('PMP engine')  + ' ' + chalk.yellow('INIT'));
            this._currentConfig = engineCfg;
            this._childProcess = starter(engineCfg);
        } else if(!this._childProcess && !engineCfg){
            console.log(chalk.red('PMP engine error')  + ' ' + chalk.yellow('Can\'t start PMP engine without a config'));
        } else if(this._childProcess){
            console.log(chalk.red('PMP engine error')  + ' ' + chalk.yellow('Can\'t start PMP engine, if it is already started'));
        }
    };

    restart(engineCfg) {
        if(this._childProcess && engineCfg) {
            //restart with new config
            console.log(chalk.blue('PMP engine')  + ' ' + chalk.yellow('RESTART with new config'));
            this._currentConfig = engineCfg;
            this._childProcess = restarter(this._childProcess, engineCfg);
        } else if(this._childProcess && !engineCfg) {
            //restart with same config
            console.log(chalk.blue('PMP engine')  + ' ' + chalk.yellow('RESTART with same config'));
            this._childProcess = restarter(this._childProcess, this._currentConfig);
        } else {
            console.log(chalk.red('PMP engine error')  + ' ' + chalk.yellow('Can\'t restart PMP engine because it isn\'t started yet'));
        }
    };

    //stop pmp engine instance if it exists (child process instance)
    stop() {
        if(this._childProcess) {
            //stop
            console.log(chalk.blue('PMP engine')  + ' ' + chalk.yellow('STOP'));
            this._childProcess = stopper(this._childProcess);
            this._currentConfig = undefined;
        } else {
            console.log(chalk.red('PMP engine error')  + ' ' + chalk.yellow('Can\'t stop PMP engine because it isn\'t started yet'));
        }
    };

    get isStarted() { return this._isStarted; };

    get currentConfig() { return Object.assign({}, this._currentConfig); };

    get logStream() { return process.stdout; };
} 

module.exports = PmpEngine;