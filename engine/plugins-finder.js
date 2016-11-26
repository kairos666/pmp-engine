'use strict'

const exec                   = require('child_process').exec;
const Q                      = require('q');
const readFile               = require('fs').readFile;
const path                   = require('path');
const packageEntryPoint      = 'index.js';
const packageDescriptorFile  = 'package.json';
const packageReadmeFile      = 'README.md';

// description / js helpers / html helpers PROMISER
let descObjPromiser = packageName => {
  let descObjPromise         = Q.defer();
  let packagePath;

  // try requiring the plugin
  try {
    packagePath = require.resolve(packageName);
  } catch(e) {
    descObjPromise.reject(`can't require ${packageName}`);
    return descObjPromise.promise;
  }

  let packageJsonPath        = path.resolve(packagePath.replace(packageEntryPoint, ''), '..', packageDescriptorFile);

  readFile(packageJsonPath, 'utf8', (err, data) => {
    if(err) {
      // in case of a fail - resolve anyway
      descObjPromise.resolve({});
    } else {
      let descObj = JSON.parse(data);
      descObjPromise.resolve(descObj);
    }
  });

  return descObjPromise.promise;
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
  constructor(packageName, packageDescription, packageReadme, jsHelpers, htmlHelpers) {
    this.packageName             = packageName;
    this.packageDescription      = packageDescription;
    this.packageReadme           = packageReadme;
    this.packageJsHelpers        = jsHelpers;
    this.packageHtmlHelpers      = htmlHelpers;
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
      let descObjPromise        = descObjPromiser(packageName);
      let readmePromise         = readmePromiser(packageName);

      PluginPromisesArray.push(Q.all([
          descObjPromise,
          readmePromise
        ]).spread((descObj, readme) => {
          let desc = (descObj.description) ? descObj.description : '';
          let jsHelp = (descObj.documentation && descObj.documentation.jsHelpers) ? descObj.documentation.jsHelpers : [];
          let htmlHelp = (descObj.documentation && descObj.documentation.htmlHelpers) ? descObj.documentation.htmlHelpers : [];
          return new PmpPluginDescriptor(packageName, desc, readme, jsHelp, htmlHelp);
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
