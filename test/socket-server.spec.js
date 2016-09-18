'use strict'

const sinon                 = require('sinon');
const PmpEngine             = require('../index');
const SocketServer          = require('../socket-serving/io').SocketServer;

describe('SocketServer testing', function() {
    let socketServer;

    beforeEach(function() {
        socketServer = new SocketServer(
            new PmpEngine(),
            {
                host: 'localhost',
                port: 5000
            }
        );
    });

    afterEach(function() {
        socketServer = null;
    });

    it('SocketServer works', function(){

    });
});