'use strict'

const exec              = require('child_process').exec;
const Q                 = require('q');

/* ===========================================================================
  PLUGIN LIST PROMISER
=========================================================================== */
let getAvailablePmpPluginsPromise = (pluginNamePattern) => {
  let deferredPluginList = Q.defer();
  exec('npm ls --json', function(err, stdout, stderr) {
    deferredPluginList.resolve(JSON.parse(stdout));
  });

  return deferredPluginList.promise.then(packageJson => {
    // list all packages
    let packageArray = Object.keys(packageJson.dependencies);

    //filter out pmp plugins
    return packageArray.filter(pack => (pack.indexOf(pluginNamePattern) === 0));
  });
};

module.exports = {
    getAvailablePmpPluginsPromise: getAvailablePmpPluginsPromise
};
