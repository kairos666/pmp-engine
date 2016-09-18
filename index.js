'use strict'

const SpawnWatch                    = require('spawn-watch');
const starter                       = require('./engine/process-utils').starter;
const Rx                            = require('rx');
const statusEvts                    = require('./engine/configs').pmpEngineStatusEvts;
const noBrowserTabArg               = require('./engine/configs').additionalArguments.noBrowserTabArg;
const defaultIoConfig               = require('./engine/configs').defaultIoConfig;
const ioEvts                        = require('./socket-serving/ioEvts');

class PmpEngine {
    constructor(options) {
        this._status                = new Rx.BehaviorSubject(statusEvts.stopped);
        this._hellSpawn             = new SpawnWatch({ ipc:true });
        this._socketServer          = null;
        this._pimpCommandsConfig    = null;
        this._options               = {
            ioEnabled:false,
            ioServerConfig:defaultIoConfig 
        };

        //options settings (io socket serving)
        if(options) {
            this._options = Object.assign(this._options, options);
        }

        //handle socket server enabled PmpEngine
        if(this._options.ioEnabled) {

            //init socket server
            const SocketServer = require('./socket-serving/io').SocketServer;
            this._socketServer = new SocketServer(this, this._options.ioServerConfig);

            //react to external inputs (outputs are already piped)
            this._socketServer.inputStream.subscribe(socketInputActions.bind(this));
        }
    }

    //launch pmpEngine
    start(pmpConfig, additionalArgs) {
        if(!pmpConfig || !this.pmpEngineStatus === statusEvts.stopped) return false;
        this._pimpCommandsConfig = pmpConfig;
        return starter(this._hellSpawn, pmpConfig, this._status, additionalArgs);
    }

    //restart pmpEngine
    restart(pmpConfig) {
        let nextStartConfig = (pmpConfig) ? pmpConfig : Object.assign({}, this._pimpCommandsConfig);
        let restartSubscription = this.pmpEngineStatusStream
            .filter(engineStatus => { return (engineStatus === statusEvts.stopped) })
            .subscribe(processStatus => {
                this.start(nextStartConfig, [noBrowserTabArg]);
                if(restartSubscription.dispose) restartSubscription.dispose();
            });
        
        return this.stop();
    }

    //stop pmpEngine
    stop() {
        return this._hellSpawn.stop();
    };

    //get pmpEngine current status
    get pmpEngineStatus() {
        return this._status.value;
    }

    get currentPimpConfig() {
        return Object.assign({}, this._pimpCommandsConfig);
    }

    /* observables */
    //status
    get pmpEngineStatusStream() {
        return this._status.asObservable().distinctUntilChanged();
    }
    //logs
    get pmpEngineLogsStream() {
        return this._hellSpawn.outEventStream;
    }
    //errors
    get pmpEngineErrorsStream() {
        return this._hellSpawn.errorStream;
    }
}

const socketInputActions = function(input) {
    switch(input.subType) {
        case 'start-command': this.start(input.payload); break;
        case 'stop-command': this.stop(); break;
        case 'restart-command': this.restart(input.payload); break;
        case 'config-command': this._socketServer.emit(ioEvts.outputs.config(this.currentPimpConfig)); break;

        default:
            console.log('pmpEngine received unknown command ' + input);
    }
}

module.exports = PmpEngine;