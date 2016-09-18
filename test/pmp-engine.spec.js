'use strict'

const sinon                 = require('sinon');
const PmpEngine             = require('../index');
const basePimpConfig        = require('./assets/test-configs').basePimpCommands;
const errPimpConfig         = require('./assets/test-configs').errPimpCommands;
const configs               = require('../engine/configs');
const hasAnsi               = require('has-ansi');

describe('PmpEngine API methods & properties existence', function() {
    let pmpEngine;

    beforeEach(function() {
        pmpEngine = new PmpEngine();
    });

    afterEach(function() {
        pmpEngine = null;
    });

    it('START method exists', function(){
        expect(pmpEngine.start).to.exist;
    });
    it('RESTART method exists', function(){
        expect(pmpEngine.restart).to.exist;
    });
    it('STOP method exists', function(){
        expect(pmpEngine.stop).to.exist;
    });
    it('pmpEngineStatus property exists', function(){
        expect(pmpEngine.pmpEngineStatus).to.exist;
    });
    it('pmpEngineStatusStream observable exists', function(){
        expect(pmpEngine.pmpEngineStatusStream).to.exist;
    });
    it('pmpEngineLogsStream observable exists', function(){
        expect(pmpEngine.pmpEngineLogsStream).to.exist;
    });
    it('pmpEngineErrorsStream observable exists', function(){
        expect(pmpEngine.pmpEngineErrorsStream).to.exist;
    });
});
describe('PmpEngine START method', function() {
    let pmpEngine;

    beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
        pmpEngine = new PmpEngine();
    });

    afterEach(function() {
        pmpEngine = pmpEngine.stop();
        pmpEngine = null;
        this.sandbox.restore();
    });

    it('START method called without config doesn\'t do anything', function(){
        expect(pmpEngine.start()).to.equal(false);
    });
    it('START method called with config instanciate pmpEngine', function(done){
        let ipcEvtGenerator = function * () {
            yield configs.pmpGulpEvts.init;
            yield configs.pmpGulpEvts.configOk;
            return configs.pmpGulpEvts.started;
        }
        let ipcEvtSequence = ipcEvtGenerator();
        pmpEngine._hellSpawn.ipcStream.subscribe(IPCmsg => {
            if(IPCmsg.type === configs.pmpGulpEvts.init || IPCmsg.type === configs.pmpGulpEvts.configOk || IPCmsg.type === configs.pmpGulpEvts.started) {
                let iteration = ipcEvtSequence.next();
                expect(IPCmsg.type).to.equal(iteration.value);
                if(iteration.done) { done(); }
            }
        });
        expect(pmpEngine.start(basePimpConfig)).to.equal(true);
    }).timeout(20000);
    it('START method does status change [stopped --> pending --> started]', function(done){
        let statusEvtGenerator = function * () {
            yield configs.pmpEngineStatusEvts.stopped;
            yield configs.pmpEngineStatusEvts.pending;
            return configs.pmpEngineStatusEvts.started;
        }
        let statusEvtSequence = statusEvtGenerator();
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            let iteration = statusEvtSequence.next();
            if(iteration.value) {
                expect(status).to.equal(iteration.value);
                if(iteration.done) { done(); }
            }
        });
        expect(pmpEngine.start(basePimpConfig)).to.equal(true);
    }).timeout(20000);
});
describe('PmpEngine STOP & RESTART methods', function() {
    let pmpEngine;

    beforeEach(function(done) {
        this.timeout(10000);
        this.sandbox = sinon.sandbox.create();
        let isDone = false;
        pmpEngine = new PmpEngine();
        pmpEngine.pmpEngineStatusStream.filter(status => { return (status === configs.pmpEngineStatusEvts.started) }).subscribe(status => {
             if(!isDone) {
                 isDone = true;
                 done();
             }
        });
        pmpEngine.start(basePimpConfig, ['--no-browser-tab']);
    });

    afterEach(function() {
        pmpEngine = pmpEngine.stop();
        pmpEngine = null;
        this.sandbox.restore();
    });

    it('STOP method', function(done){
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            if(status === configs.pmpEngineStatusEvts.stopped) done();
        });
        expect(pmpEngine.stop()).to.equal(true);
    });
    it('STOP method does status change [started --> pending --> stopped]', function(done){
        let statusEvtGenerator = function * () {
            yield configs.pmpEngineStatusEvts.started;
            yield configs.pmpEngineStatusEvts.pending;
            return configs.pmpEngineStatusEvts.stopped;
        }
        let statusEvtSequence = statusEvtGenerator();
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            let iteration = statusEvtSequence.next();
            if(iteration.value) {
                expect(status).to.equal(iteration.value);
                if(iteration.done) { done(); }
            }
        });
        expect(pmpEngine.stop()).to.equal(true);
    }).timeout(20000);
    it('RESTART method (no config)', function(done){
        let startedCount = 0;
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            if(status === configs.pmpEngineStatusEvts.started) {
                startedCount++;
                if(startedCount === 2) done();
            }
        });
        expect(pmpEngine.restart()).to.equal(true);
    }).timeout(20000);
    it('RESTART method (with config)', function(done){
        let startedCount = 0;
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            if(status === configs.pmpEngineStatusEvts.started) {
                startedCount++;
                if(startedCount === 2) done();
            }
        });
        expect(pmpEngine.restart(basePimpConfig)).to.equal(true);
    }).timeout(20000);
    it('RESTART method does status change [started --> pending --> stopped --> pending --> started]', function(done){
        let statusEvtGenerator = function * () {
            yield configs.pmpEngineStatusEvts.started;
            yield configs.pmpEngineStatusEvts.pending;
            yield configs.pmpEngineStatusEvts.stopped;
            yield configs.pmpEngineStatusEvts.pending;
            return configs.pmpEngineStatusEvts.started;
        }
        let statusEvtSequence = statusEvtGenerator();
        pmpEngine.pmpEngineStatusStream.subscribe(status => {
            let iteration = statusEvtSequence.next();
            if(iteration.value) {
                expect(status).to.equal(iteration.value);
                if(iteration.done) { done(); }
            }
        });
        expect(pmpEngine.restart()).to.equal(true);
    }).timeout(20000);
});
describe('PmpEngine pmpEngineLogsStream Observable', function() {
    let pmpEngine;

    beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
        pmpEngine = new PmpEngine();
    });

    afterEach(function() {
        pmpEngine = pmpEngine.stop();
        pmpEngine = null;
        this.sandbox.restore();
    });

    it('get ansi colored outputs from log stream', function(done){
        let logCount = 0;
        let hasOneAnsi = false;
        pmpEngine.pmpEngineLogsStream.subscribe(log => {
            logCount++;
            if(!hasOneAnsi && hasAnsi(log)) hasOneAnsi = true;
            if(logCount === 15) done();
        });
        pmpEngine.start(basePimpConfig, ['--no-browser-tab']);
    }).timeout(20000);
});
describe('PmpEngine pmpEngineErrorsStream Observable', function() {
    let pmpEngine;

    beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
        pmpEngine = new PmpEngine();
    });

    afterEach(function() {
        pmpEngine = pmpEngine.stop();
        pmpEngine = null;
        this.sandbox.restore();
    });

    it('get err outputs from error stream', function(done){
        pmpEngine.pmpEngineErrorsStream.subscribe(err => {
            done();
        });
        pmpEngine.start(errPimpConfig, ['--no-browser-tab']);
    }).timeout(20000);
});
