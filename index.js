'use strict'

const SpawnWatch                    = require('spawn-watch');
const starter                       = require('./engine/process-utils').starter;
const Rx                            = require('rx');
const statusEvts                    = require('./engine/configs').pmpEngineStatusEvts;
const noBrowserTabArg               = require('./engine/configs').additionalArguments.noBrowserTabArg;
const defaultIoConfig               = require('./engine/configs').defaultIoConfig;
const ioEvts                        = require('./socket-serving/ioEvts');
const url                           = require('url');
const pluginsFinder                 = require('./engine/plugins-finder');

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
        let oldConfig       = Object.assign({}, this._pimpCommandsConfig);
        let nextStartConfig = (pmpConfig) ? pmpConfig : oldConfig;
        let sameTargetURL   = () => {
            let oldTargetURL = oldConfig.bsOptions.proxy.target;
            let newTargetURL = pmpConfig.bsOptions.proxy.target;

            return (oldTargetURL === newTargetURL) 
        }
        let samePort        = () => {
            let oldPort = oldConfig.bsOptions.port;
            let newPort = pmpConfig.bsOptions.port;

            return (oldPort === newPort)
        }

        this.pmpEngineStatusStream
            .filter(engineStatus => { return (engineStatus === statusEvts.stopped) })
            .first()
            .subscribe(processStatus => {
                // no need for new tab unless targetURL &/or port has changed
                let additionalArgs = [];
                if(pmpConfig && sameTargetURL() && samePort()) additionalArgs.push(noBrowserTabArg);
                // apply new start
                this.start(nextStartConfig, additionalArgs);
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

    //get pmpEngine currentConfig
    get currentPimpConfig() {
        return Object.assign({}, this._pimpCommandsConfig);
    }

    //get pmpEngine useful URLs
    get usefulLinks() {
        let usefulLinks = {};
        if(this._pimpCommandsConfig && this.pmpEngineStatus === statusEvts.started) {
            let confTargetURL   = url.parse(this._pimpCommandsConfig.bsOptions.proxy.target);
            let confPort        = this._pimpCommandsConfig.bsOptions.port;

            usefulLinks.originURL = confTargetURL.href;
            usefulLinks.proxiedURL = confTargetURL.protocol + '//localhost:' + confPort + confTargetURL.pathname;
            usefulLinks.bsUIURL = confTargetURL.protocol + '//localhost:3001';
            usefulLinks.pimpSrcFilesPath = require.resolve('pmp-gulp').replace('gulpfile.js', 'src');
        }

        return usefulLinks
    }

    //get available plugins as promise
    get availablePluginsPromise() {
        return pluginsFinder.getAvailablePmpPluginsPromise('pmp-plugin');
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
        case 'links-command': this._socketServer.emit(ioEvts.outputs.usefulLinks(this.usefulLinks)); break;
        case 'available-plugins-command': 
            pluginsFinder.getAvailablePmpPluginsPromise('pmp-plugin').then(availablePlugins => {
                // emit available plugins
                this._socketServer.emit(ioEvts.outputs.availablePlugins(availablePlugins)); 
            });       
        break;

        default:
            console.log('pmpEngine received unknown command ' + input);
    }
}

/* ===========================================================================
  LAUNCH IN STANDALONE MODE
=========================================================================== */
let isStandAlone = false;
let isDebug = false;
process.argv.map(function(arg){
  if(arg === '--standalone'){
    console.log('PMP-ENGINE - STANDALONE MODE');
    isStandAlone    = true;
    isDebug         = false;
  } else if(arg === '--standalone-debug') {
    console.log('PMP-ENGINE - STANDALONE MODE & DEBUG');
    isStandAlone = isDebug = true;
  }
});

if(isStandAlone) {
    // create pmp engine instance with socket connection
    let pmpEngine = new PmpEngine({ ioEnabled:true });

    // debug
    if(isDebug) {
        pmpEngine._hellSpawn._status.subscribe(status => {
            console.log('status changes --> ' + status);
            if(status === 'started') console.dir(pmpEngine._pimpCommandsConfig, { depth: null });
        });

        pmpEngine.availablePluginsPromise.then(availablePlugins => {
            console.log('available plugins: ', availablePlugins);
        }).catch(err => {
            console.log(err);
        });
    }
};

module.exports = PmpEngine;