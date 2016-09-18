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
    spawnWatch.processEventStream.subscribe((evt)=>{
        //react to process evts
        if(evt === 'stopped') statusStream.onNext(pmpEngineStatusEvts.stopped);
        if(evt === 'pending stop' || evt === 'pending start') statusStream.onNext(pmpEngineStatusEvts.pending);
        //do not react to started evt because this is handled below (at the hand of step 4)
    });
    spawnWatch.ipcStream.subscribe(IPCmsg => {
        switch(IPCmsg.type){ 
            //STEP 2                   
            case pmpEvts.init:
                //STEP 3 - send config to process
                spawnWatch.ipcInput(new PmpEvt(pmpEvts.configSend, pmpConfig));
            break;

            //STEP 4
            case pmpEvts.started:
                statusStream.onNext(pmpEngineStatusEvts.started);
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