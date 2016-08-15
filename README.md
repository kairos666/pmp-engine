# pmp-engine
Ever wanted to experiment on and customize a webpage ? The **Pimp my page engine** let's you do just that.
The engine leverage the mighty [BrowserSync](https://www.browsersync.io/) to allow full HTML, CSS or JS modifications on any webpage. 

* write SASS, it's automatically compiled to CSS and injected in the page (no refresh needed)
* write JS, the browser's refresh with your custom JS injected
* write some HTML and jQuery like operations to swap/modify the page content

## How it works
The trick is quite simple, some URL (ex: http://www.thetimes.co.uk/) is being proxyfied with BrowserSync, it is then available through something along the lines of *localhost:3000*.
Nothing special, but now we have the opportunity to add some middleware. This middleware is the corner stone of all **"pimping"** we gonna apply to the Times website pages.

Basically what it does is detect all HTML responses matching with a whitelist of URL patterns (ex:"\*/magazine/\*"). When one such URL request is identified for pimping, the middleware will change the response according to a set of jQuery instructions: add some HTML there, remove this style tag, append a new stylesheet...

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
            url:'*/magazine/*',
            modifs:[`
                $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
                $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
                $('body').addClass('sample-pimping');
                $('.Article-content p').html('my crazy lorem replacement');
            `] 
        },
        { 
            url:'*/edition/*',
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

**important** Please notice that all commands samples are multiline strings. Multiline strings are the most practical to use (check the example below).

```javascript
//mutliline case
modifs:[`
    $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
    $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
    $('body').addClass('sample-pimping');
`]

//normal quotes, all inline case
modifs:["$('head').append('<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/main.min.css\">'); $('body').append('<script type=\"text/javascript\" src=\"/js/main.min.js\"></script>'); $('body').addClass('sample-pimping');"]

//normal quotes, one action per array item
modifs:[
    "$('head').append('<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/main.min.css\">');",
    "$('body').append('<script type=\"text/javascript\" src=\"/js/main.min.js\"></script>');",
    "$('body').addClass('sample-pimping');"
]
```

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
In the pimpCmd Object there is a set of operations that will allow you to perform some actions on the request's HTML payload.
You are free to do whatever DOM transformation you see fit. [Cheerio's jQuery light](https://github.com/cheeriojs/cheerio) library is provided to ease the process. And don't worry this helper jQuery only exists in the context of the middleware, it will not pollute the resulting pimped page.
### add styles
append a new external stylesheet from your local files. The href path root correspond to the *dist* folder in your project.
```javascript
modifs:[`
    $('head').append('<link rel="stylesheet" type="text/css" href="/css/main.min.css">');
`] 
```
alternatively you could add a style tag directly
```javascript
modifs:[`
    $('head').append('<style>body { background-color:limegreen; color:goldenrod; }</style>');
`] 
```
### add JS
same principle to add some external javascript files for execution. Works also with inline `<script>` tags.
```javascript
modifs:[`
    $('body').append('<script type="text/javascript" src="/js/main.min.js"></script>');
`] 
```
```javascript
modifs:[`
    $('head').append('<script>alert('hello world!');</script>');
`] 
```
### add/modify/remove the page's HTML
just regular javascript/jQuery manipulations. 
```javascript
modifs:[`
    //remove all paragraphs
    $('body p').remove();

    //deactivate links and replace links texts
    $('body a').attr('href', '#').html('hello i\'m a link');

    //add an image (from publicly available CDN) to the fifth paragraph in article content
    $('.Article-content p:eq(5)').prepend('<img width="100%" src="http://i223.photobucket.com/albums/dd245/2ndsite/The%20Holding%20Pen/6f158ba2.jpg" />');
`] 
```
define your own helper functions to manage HTML partials injections
```javascript
modifs:[`
    var injectHTMLFile = function(url){
        try {
            return fs.readFileSync(path.join('./dist/html', url), 'utf8');
        } catch (err) {
            // If the type is not missing file, then just throw the error again.
            if (err.code !== 'ENOENT') throw err;

            // Handle a file-not-found error
            return '<p class="alert alert-warning">HTML inject file not found: ' + url + '</p>';
        }
    }

    //inject HTML partial to the DOM from 'dist/html'
    $('.Article-content').prepend(injectHTMLFile('my-article-summary-to-be-injected.html'));
`]
```
### remove stylesheets
```javascript
modifs:[`
    //find and remove the external stylesheet for bootstrap minified css
    $('link[href$="bootstrap.min.css"]').remove();
`]
```
### remove scripts
```javascript
modifs:[`
    //find and remove the external script for bootstrap minified js
    $('script[src$="bootstrap.min.js"]').remove();
`]
```

## Limitations
* need some tests certainly some weird behaviors now and then :hear_no_evil:
* cross domains problems when dealing with https sites. This is baked in security for any browser, may be bypassed by extensions such has [this one](https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-app-launcher-info-dialog) ... beware this is dangerous :bangbang:
* because the modifications are applied on the fly in the HTML page request, it will work only with good ol' full server rendered pages. Pimping SPAs or ajax content need some reverse engineering at best, or is plain impossible.

## future features
- [ ] test coverage
- [ ] plugin system to import DOM manipulation helper functions to power-up the pimpCmds (ex:injectHTML function)
- [ ] GUI to make pmp-engine usage a breeze