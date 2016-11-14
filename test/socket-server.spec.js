'use strict'

const sinon                 = require('sinon');
const PmpEngine             = require('../index');
const ioEvt                 = require('../socket-serving/ioEvts');
const SocketServer          = require('../socket-serving/io').SocketServer;
const basePimpConfig        = require('./assets/test-configs').basePimpCommands;
const errPimpConfig         = require('./assets/test-configs').errPimpCommands;
const Rx                    = require('rx');
const hasAnsi               = require('has-ansi');

class SocketTestClient {
    constructor(connectUrl, callback){
        this._ioClient = require('socket.io-client');
        this._socket = this._ioClient.connect(connectUrl);
        this._incomingEvtsStream = new Rx.Subject();
        this.isConnected = false;

        this._socket.on('connect', () => {
            this.isConnected = true;
            callback(this.isConnected);
        });

        this._socket.on('disconnect', () => {
            this.isConnected = false;
            callback(this.isConnected);
        });

        this._socket.on('output', (evt) => {
            this._incomingEvtsStream.onNext(evt);
        });
    }

    fireSampleCmds(cmd) {
        let cmdEvt;
        switch(cmd){
            case 'start': cmdEvt = ioEvt.inputs.startCmd(basePimpConfig); break;
            case 'start-error': cmdEvt = ioEvt.inputs.startCmd(errPimpConfig); break;
            case 'stop': cmdEvt = ioEvt.inputs.stopCmd(); break;
            case 'restart': cmdEvt = ioEvt.inputs.restartCmd(); break;
            case 'config': cmdEvt = ioEvt.inputs.getConfigCmd(); break;
            case 'links': cmdEvt = ioEvt.inputs.getUsefulLinks(); break;
            case 'plugins': cmdEvt = ioEvt.inputs.getAvailablePlugins(); break;
        }
        this._socket.emit('input', cmdEvt);
    }

    get incomingEvtsStream(){
        return this._incomingEvtsStream.asObservable();
    }

    disconnect() {
        this._socket.disconnect();
    }
}

describe('SocketServer testing', function() {
    let socketServer;
    let socketClient;
    let pmpEngine;

    beforeEach(function(done) {
        this.sandbox = sinon.sandbox.create();
        socketClient = new SocketTestClient('http://localhost:5000', function(connectionStatus) { 
            if(connectionStatus) {
                //console.log('connected client');
                done();
            } else {
                //console.log('disconnected client');
            }
        });
        pmpEngine = new PmpEngine({ ioEnabled:true, host: 'localhost', port: 5000 }); //option to socket events handling
        socketServer = pmpEngine._socketServer;
    });

    afterEach(function() {
        socketServer.destroy();
        socketClient.disconnect();
        pmpEngine.stop();
        this.sandbox.restore();
    });

    it('SocketServer receiving valid input commands [start, stop, restart, getConfig, links, plugins]', function(done){
        let inputGenerator = function * () {
            yield { fire:'start', receive:'start-command' };
            yield { fire:'stop', receive:'stop-command' };
            yield { fire:'restart', receive:'restart-command' };
            yield { fire:'config', receive:'config-command' };
            yield { fire:'links', receive:'links-command' };
            return { fire:'plugins', receive:'available-plugins-command' };
        }
        let inputSequence = inputGenerator();
        let iteration = inputSequence.next();
        let subscription = socketServer.inputStream.subscribe(input => {
            expect(input.subType).to.equal(iteration.value.receive);

            //test if test finished
            if(iteration.done) {
                done();
            } else {
                //launch subsequent inputs
                iteration = inputSequence.next();
                socketClient.fireSampleCmds(iteration.value.fire);
            }
        });

        //first input launch
        socketClient.fireSampleCmds(iteration.value.fire);
    });
    it('SocketClient receiving outputs [status, logs]', function(done){
        let logCount = 0;
        let statusCount = 0;
        let subscriptions = [];
        let endTestChecker = function(){
            if(logCount >= 15 && statusCount >= 3) return true;
            return false;
        }
        let endTest = function() {
            subscriptions.map(sub => { sub.dispose(); });
            done();
        }

        //status
        subscriptions.push(socketClient.incomingEvtsStream
            .filter(evt => { return (evt.subType === 'status'); })
            .map(evt => { return evt.payload; })
            .subscribe(status => {
                statusCount++;
                //console.log(status);
                if(endTestChecker()) endTest();
            })
        );
        //logs
        subscriptions.push(socketClient.incomingEvtsStream
            .filter(evt => { return (evt.subType === 'log'); })
            .map(evt => { return evt.payload; })
            .subscribe(log => {
                logCount++;
                //console.log(log);
                if(endTestChecker()) endTest();
            })
        );

        //start test (send start command via client)
        socketClient.fireSampleCmds('start');
    }).timeout(20000);
    it('SocketClient receiving outputs [error]', function(done){
        //error
        socketClient.incomingEvtsStream
            .filter(evt => { return (evt.subType === 'error'); })
            .map(evt => { return evt.payload; })
            .subscribe(err => {
                console.log(err);
                done();
            });

        //start test (send start command via client)
        socketClient.fireSampleCmds('start-error');
    }).timeout(20000);
    it('SocketClient asking/receiving pimp config', function(done){
        //config
        socketClient.incomingEvtsStream
            .filter(evt => { return (evt.subType === 'config'); })
            .map(evt => { return evt.payload; })
            .subscribe(config => {
                expect(config).to.deep.equal(basePimpConfig);
                done();
            });

        //start test (send start command via client)
        socketClient.fireSampleCmds('start');
        setTimeout(function(){
            socketClient.fireSampleCmds('config');  
        }, 5000);
    }).timeout(20000);
    it.skip('SocketClient receiving ansi/html colored logs', function(){});
});