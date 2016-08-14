# pmp-engine
Ever wanted to experiment on and customize a webpage ? The **Pimp my page engine** let's you do just that.
The engine leverage the mighty [BrowserSync](https://www.browsersync.io/) to allow full HTML, CSS or JS modifications on any webpage. 

* write SASS, it's automatically compiled to CSS and injected in the page (no refresh needed)
* write JS, the browser's refresh with your custom JS injected
* write some HTML and jQuery like operations to swap/modify the page content

## How it works
The trick is quite simple, some URL (ex: http://www.thetimes.co.uk/) is being proxyfied with BrowserSync, it is then available through something along the lines of *localhost:3000*.
Nothing special, but now we have the opportunity to add some middleware. This middleware is the corner stone of all **"pimping"** we gonna apply to the Times website pages.

Basically what it does is detect all HTML responses matching with a whitelist of URL patterns (ex:"\*magazine/style/\*"). When one such URL request is identified for pimping, the middleware will change the response according to a set of jQuery instructions: add some HTML there, remove this style tag, append a new stylesheet...

This core behavior is then bundled with some [gulp](http://gulpjs.com/) automated build tasks goodness to provide external page assets (e.g. stylesheets, js, HTML partials, images).

Finally the browser behavior is tied to gulp watch tasks to react according to real-time assets modifications: inject in the page, reload page with new assets or restart the whole thing with new instructions.

To you this mean live pimping of the Times style magazine pages in your local environment. Useful for:
* trying bug fixing production code
* quick prototyping features
* proto-theming without the need for a local environment
* just for fun of defacing a site in your own sandboxed world (no legal risks :innocent:)

## Install
```console
npm install pmp-engine
```

## Setup
given that you already installed the dependency, here is how to get started with it
### Init
```javascript
const PmpEngine             = require('pmp-engine');

//create engine instance
let pmpEngine               = new PmpEngine();

//define your config
let config = {
    bsOptions: {
        proxy: {
            target: 'http://www.thetimes.co.uk/',
            cookies: { stripeDomain: false }
        },
        port:3000,
        serveStatic: ['./dist'],
        middleware: [],
        rewriteRules: []
    },
    pimpCmds:[
        { 
            url:'*magazine/style/*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-pimping');
                $('.Article-content p').html('my crazy lorem replacement');
            `] 
        },
        { 
            url:'*edition/style/*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-pimping');
                $('.Article-content').prepend('<img width="100%" src="http://i223.photobucket.com/albums/dd245/2ndsite/The%20Holding%20Pen/6f158ba2.jpg" />');
            `] 
        }
    ]
};

//start engine with config
pmpEngine.start(config);
```
### Config bsOptions
BrowserSync configuration options. Beware that some of these are mandatory (ex:proxy mode or at least an empty middleware array). Check the [browserSync documentation](https://www.browsersync.io/docs/options) for more.

property | values
------------ | -------------
target | the proxied URL or host [String]
port | the output port number [Number]
### Config pimpCmds 
Set of rules to be applied when the page's URL match a specific pattern. This is an array that contains pimp commands.

property | values
------------ | -------------
url | the exact URL or trigger [pattern](https://github.com/bjoerge/route-pattern) that will activate the following operations [String]
modifs | Array of [jQuery operations](https://github.com/cheeriojs/cheerio) to manipulate the HTML request response [Array[String]]

## Usage
After init, the engine can be started, stopped or restarted.
```javascript
//start engine with config
pmpEngine.start(config);

//restart engine with same config
pmpEngine.restart();

//restart engine and apply another config
pmpEngine.restart(updatedConfig);

//stop engine
pmpEngine.stop();
```

## Examples
### add styles
soon
### add JS
soon
### add/modify/remove the page's HTML
soon
### remove stylesheets
soon
### remove scripts
soon

## Limitations
soon