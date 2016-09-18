'use strict'

let superviseSocket     = require('express')();
let httpSocket          = require('http').Server(superviseSocket);
let io                  = require('socket.io')(httpSocket);

class SocketServer {
    constructor(pmpEngineInstance, ioConfig) {
        this._pmpEngine = pmpEngineInstance;
        this._config = ioConfig;
    }
}

module.exports = {
    SocketServer: SocketServer
}