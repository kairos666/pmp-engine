'use strict'

const pmpProcessConfig      = require('./configs').pmpProcessConfig;
const pmpEngineStatusEvts   = require('./configs').pmpEngineStatusEvts;
const pmpEvts               = require('./configs').pmpGulpEvts;
const PmpEvt                = require('./configs').PmpGulpEvt;
const isJsonString = function (str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

let starter = function(spawnWatch, pmpConfig, statusStream, additionalArguments) {
    /*************************************************************************
     *  four steps process:
     *  1 - first start child process itself
     *  2 - wait for gulp pimpCommands config prompt
     *  3 - pass gulp pimpCommands config to child process
     *  4 - receive pmpEngine started notification
     * ********************************************************************* */
    //STEP 1

    //status update - pending start / pending stop / stopped (started update is done at step 4)
    //all updates can happen once
    spawnWatch.processEventStream
        .filter(status => (status === 'pending start'))
        .first()
        .subscribe((evt)=>{ statusStream.onNext(pmpEngineStatusEvts.pending); });

    spawnWatch.processEventStream
        .filter(status => (status === 'pending stop'))
        .first()
        .subscribe((evt)=>{ statusStream.onNext(pmpEngineStatusEvts.pending); });

    spawnWatch.processEventStream
        .filter(status => (status === 'stopped'))
        .first()
        .subscribe((evt)=>{ statusStream.onNext(pmpEngineStatusEvts.stopped); });

    let ipsEvtSub = spawnWatch.ipcStream.subscribe(IPCmsg => {
        switch(IPCmsg.type){ 
            //STEP 2                   
            case pmpEvts.init:
                //STEP 3 - send config to process
                spawnWatch.ipcInput(new PmpEvt(pmpEvts.configSend, pmpConfig));
            break;

            //STEP 4 (! ipc started event means pmp-gulp, not the child process itself)
            case pmpEvts.started:
                statusStream.onNext(pmpEngineStatusEvts.started);
                ipsEvtSub.dispose();
            break;
        };
    });

    //setup process config with optional arguments
    let processConfig = Object.assign({}, pmpProcessConfig);
    if(additionalArguments) processConfig.args = processConfig.args.concat(additionalArguments);

    return spawnWatch.start(processConfig);
}

module.exports = {
    starter: starter
}