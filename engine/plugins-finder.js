'use strict'

const exec              = require('child_process').exec;
const Q                 = require('q');

class PmpPluginDescriptor {
  constructor(packageName) {
    const readFileSync           = require('fs').readFileSync;
    const path                   = require('path');
    const packageEntryPoint      = 'index.js';
    const packageDescriptorFile  = 'package.json';
    const packageReadmeFile      = 'README.md';

    this.packageName             = packageName;

    // get package files path
    let packagePath              = require.resolve(this.packageName);
    let packageJsonPath          = path.resolve(packagePath.replace(packageEntryPoint, ''), '..', packageDescriptorFile);
    let packageReadmePath        = path.resolve(packagePath.replace(packageEntryPoint, ''), '..', packageReadmeFile);

    // get package description
    let packageJsonObject        = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    this.packageDescription      = packageJsonObject.description;

    // get package readme (markdown)
    this.packageReadme           = readFileSync(packageReadmePath, 'utf8');
  }
}

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
    let filteredPackageArray = packageArray.filter(pack => (pack.indexOf(pluginNamePattern) === 0));

    // create pmpPluginDescriptors
    let result = [];

    filteredPackageArray.forEach(packageName => {
      result.push(new PmpPluginDescriptor(packageName));
    });

    return result;
  });
};

module.exports = {
    getAvailablePmpPluginsPromise: getAvailablePmpPluginsPromise
};
