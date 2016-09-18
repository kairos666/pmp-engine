'use strict'

const ioEvts          = require('./ioEvts');
const ctx             = require('chalk');
const Rx              = require('rx');
const chalk           = new ctx.constructor({enabled: true});

class SocketServer {
    constructor(pmpEngineInstance, ioConfig) {
        this._pmpEngine                 = pmpEngineInstance;
        this._config                    = ioConfig;
        this._superviseSocket           = require('express')();
        this._httpSocket                = require('http').Server(this._superviseSocket);
        this._io                        = require('socket.io')(this._httpSocket);
        this._inputStream               = null;
        this._subscriptions             = [];

        //setup
        this._setupInput();
        this._setupOutput();
        this._setupServer();
    }

    //setup server and listeners
    _setupServer() {
        //connect/disconnect behavior
        this._io.on(ioEvts.utils.connect, socket => {
            console.log(chalk.green(`Socket service CONNECTED`));

            //handle disconnects
            socket.once(ioEvts.utils.disconnect, () => {
                //clean subscriptions
                if(this._subscriptions.length > 0) {
                    this._subscriptions.map(subscription => { subscription.unsubscribe(); });
                    this._subscriptions = [];
                }
                if(this._inputStream) this._inputStream = null;
                console.log(chalk.yellow(`Socket service DISCONNECTED`));
            });
        });

        //socket server listening
        this._httpSocket.listen(this._config.port, this._config.host, () => {
            console.log(chalk.blue(`Socket service listening to port ${this._config.port}`)); 
        });
    }

    _setupInput() {
        this._io.on(ioEvts.utils.connect, socket => {
            this._inputStream = Rx.Observable.fromEvent(socket, 'input');

            //INPUTS SUBSCRIPTION
            this._subscriptions.push(this._inputStream.subscribe(inputCmd => {
                console.log('received input', inputCmd);
            }));
        });
    }

    _setupOutput() {
        this._io.on(ioEvts.utils.connect, socket => {
            //status streaming
            this._subscriptions.push(this._pmpEngine.pmpEngineStatusStream.subscribe(status => {
                let evt = ioEvts.outputs.engineStatusLog(status);
                socket.broadcast.emit(evt);
            }));
            //log streaming
            this._subscriptions.push(this._pmpEngine.pmpEngineLogsStream.subscribe(log => {
                let evt = ioEvts.outputs.log(log);
                socket.broadcast.emit(evt);
            }));
            //errors streaming
            this._subscriptions.push(this._pmpEngine.pmpEngineErrorsStream.subscribe(err => {
                let evt = ioEvts.outputs.error(err);
                socket.broadcast.emit(evt);
            }));
        });
    }
}

module.exports = {
    SocketServer: SocketServer
}