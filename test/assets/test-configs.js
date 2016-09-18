'use strict'

let basePimpCommands = {
    bsOptions: {
        proxy: {
            target: 'http://www.syntaxsuccess.com/viewarticle/socket.io-with-rxjs-in-angular-2.0',
            cookies: { stripeDomain: false }
        },
        port:3000,
        serveStatic: ['./dist'],
        middleware: [],
        rewriteRules: []
    },
    pimpCmds:[
        { 
            url:'*/viewarticle*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-modifier-rules');
                $('.container').html('<p>replaced text</p>');
            `] 
        },
        { 
            url:'*/sample-url2*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-modifier-rules2');
            `] 
        }
    ]
};

let errPimpCommands = {
    bsOptions: {
        proxy: {
            target: 'http://not-existing-url',
            cookies: { stripeDomain: false }
        },
        port:-1,
        serveStatic: ['./not-existing-folder'],
        middleware: [],
        rewriteRules: []
    },
    pimpCmds:[
        { 
            url:'*/viewarticle*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-modifier-rules');
                $('.container').html('<p>replaced text</p>');
            `] 
        },
        { 
            url:'*/sample-url2*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-modifier-rules2');
            `] 
        }
    ]
};

module.exports = {
    basePimpCommands: basePimpCommands,
    errPimpCommands: errPimpCommands
}