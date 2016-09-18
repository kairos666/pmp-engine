'use strict'

module.exports = {
    inputs: {
        startCmd: function(config) { return { type:'input', subType:'start-command', payload:config }},
        stopCmd: function() { return { type:'input', subType:'stop-command' }},
        restartCmd: function(config) { return { type:'input', subType:'restart-command', payload:config }},
        getConfigCmd: function() { return { type:'input', subType:'config-command' }}
    },
    outputs: {
        engineStatusLog: function(status) { return { type:'output', subType:'status', payload:status }},
        log: function(log) { return { type:'output', subType:'log', payload:log }},
        error: function(error) { return { type:'output', subType:'error', payload:error }},
        config: function(config) { return { type:'output', subType:'config', payload:config } }
    },
    utils: {
        disconnect: 'disconnect',
        connect: 'connection'
    }
}