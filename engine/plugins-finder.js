'use strict'

const exec                   = require('child_process').exec;
const Q                      = require('q');
const readFile               = require('fs').readFile;
const path                   = require('path');
const packageEntryPoint      = 'index.js';
const packageDescriptorFile  = 'package.json';
const packageReadmeFile      = 'README.md';

// description PROMISER
let descPromiser = packageName => {
  let descPromise            = Q.defer();
  let packagePath;

  // try requiring the plugin
  try {
    packagePath = require.resolve(packageName);
  } catch(e) {
    descPromise.reject(`can't require ${packageName}`);
    return descPromise.promise;
  }

  let packageJsonPath        = path.resolve(packagePath.replace(packageEntryPoint, ''), '..', packageDescriptorFile);

  readFile(packageJsonPath, 'utf8', (err, data) => {
    if(err) {
      // in case of a fail - resolve anyway
      descPromise.resolve('');
    } else {
      let descObj = JSON.parse(data);
      descPromise.resolve(descObj.description);
    }
  });

  return descPromise.promise;
}

// readme PROMISER
let readmePromiser = packageName => {
  let readmePromise          = Q.defer();
  let packagePath;

  // try requiring the plugin
  try {
    packagePath = require.resolve(packageName);
  } catch(e) {
    readmePromise.reject(`can't require ${packageName}`);
    return descPromise.promise;
  }
  let packageReadmePath      = path.resolve(packagePath.replace(packageEntryPoint, ''), '..', packageReadmeFile);

  readFile(packageReadmePath, 'utf8', (err, data) => {
    if(err) {
      // in case of a fail - resolve anyway
      readmePromise.resolve('');
    } else {
      readmePromise.resolve(data);
    }
  });

  return readmePromise.promise;
}

class PmpPluginDescriptor {
  constructor(packageName, packageDescription, packageReadme) {
    this.packageName             = packageName;
    this.packageDescription      = packageDescription;
    this.packageReadme           = packageReadme;
  }
}

/* ===========================================================================
  PLUGIN LIST PROMISER
=========================================================================== */
let getAvailablePmpPluginsPromise = (pluginNamePattern) => {
  let deferredPluginList = Q.defer();

  // CHAIN 1 - filter packages
  let filteredPluginsPromise = deferredPluginList.promise.then(packageJson => {
    // list all packages
    let packageArray = Object.keys(packageJson.dependencies);

    // filter out pmp plugins
    let filteredPackageArray = packageArray.filter(pack => (pack.indexOf(pluginNamePattern) === 0));

    return filteredPackageArray;
  });

  // CHAIN 2 - resolve description/readme
  let resolvedPluginsPromisesArray = filteredPluginsPromise.then(filteredPackageArray => {
    let PluginPromisesArray = [];

    filteredPackageArray.forEach(packageName => {
      let descPromise           = descPromiser(packageName);
      let readmePromise         = readmePromiser(packageName);

      PluginPromisesArray.push(Q.all([
          descPromise,
          readmePromise
        ]).spread((desc, readme) => {
          return new PmpPluginDescriptor(packageName, desc, readme);
      }));
    });

    return PluginPromisesArray;
  });

  // execute promise start
  exec('npm ls --json', function(err, stdout, stderr) {
    deferredPluginList.resolve(JSON.parse(stdout));
  });

  return Q.allSettled(resolvedPluginsPromisesArray).then(results => {
    return results.filter(result => (result.state !== 'rejected')).map(result => result.value);
  });
};

module.exports = {
    getAvailablePmpPluginsPromise: getAvailablePmpPluginsPromise
};
