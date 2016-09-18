'use strict'

const path              = require('path');
const gulpPath          = path.join(require.resolve('gulp').replace('index.js', ''), 'bin/gulp.js');
const pmpGulpPath       = require.resolve('pmp-gulp').replace('gulpfile.js', '');

/* ****************************************************************************************
 *  --no-browser-tab = prevent browserSync from poping a new browser window when starting
 *  --standalone = pmp start directly using the defaut config inside pmp-gulp module (mostly for testing purposes)
 * ************************************************************************************** */
const additionalArguments = {
    noBrowserTabArg: '--no-browser-tab',
    standalone: '--standalone'
}

const pmpProcessConfig = {
    command: 'node',
    args: [gulpPath],
    options: {
        FORCE_COLOR:true,
        cwd: pmpGulpPath
    }
};

const pmpEngineStatusEvts = {
    started: 'started',
    stopped: 'stopped',
    pending: 'pending'
};

const pmpGulpEvts = {
    init: 'INITIATED',
    configSend: 'CONFIG',
    configOk: 'CONFIG READY',
    started: 'STARTED'
};

class PmpGulpEvt {
    constructor(type, payload){
        this.type = type;
        this.payload = payload
    }
};

const defaultIoConfig = {
    host: 'localhost',
    port: 5000
};

module.exports = {
    pmpProcessConfig: pmpProcessConfig,
    additionalArguments: additionalArguments,
    pmpEngineStatusEvts: pmpEngineStatusEvts,
    pmpGulpEvts: pmpGulpEvts,
    PmpGulpEvt: PmpGulpEvt,
    defaultIoConfig: defaultIoConfig
}