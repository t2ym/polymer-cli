/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const logging = require("plylog");
let logger = logging.getLogger('cli.command.build');
class BuildCommand {
    constructor() {
        this.name = 'build';
        this.description = 'Builds an application-style project';
        this.args = [
            {
                name: 'js-compile',
                type: Boolean,
                description: 'compile ES2015 JavaScript features down to ES5 for ' +
                    'older browsers.'
            },
            {
                name: 'js-minify',
                type: Boolean,
                description: 'minify inlined and external JavaScript.'
            },
            {
                name: 'css-minify',
                type: Boolean,
                description: 'minify inlined and external CSS.'
            },
            {
                name: 'html-minify',
                type: Boolean,
                description: 'minify HTML by removing comments and whitespace.'
            },
            {
                name: 'bundle',
                type: Boolean,
                description: 'Combine build source and dependency files together into ' +
                    'a minimum set of bundles. Useful for reducing the number of ' +
                    'requests needed to serve your application.'
            },
            {
                name: 'add-service-worker',
                type: Boolean,
                description: 'Generate a service worker for your application to ' +
                    'cache all files and assets on the client.'
            },
            {
                name: 'sw-precache-config',
                type: String,
                description: 'Path to a file that exports configuration options for ' +
                    'the generated service worker. These options match those supported ' +
                    'by the sw-precache library. See ' +
                    'https://github.com/GoogleChrome/sw-precache#options-parameter ' +
                    'for a list of all supported options.'
            },
            {
                name: 'insert-prefetch-links',
                type: Boolean,
                description: 'Add dependency prefetching by inserting ' +
                    '`<link rel="prefetch">` tags into entrypoint and ' +
                    '`<link rel="import">` tags into fragments and shell for all ' +
                    'dependencies.'
            },
        ];
    }
    run(options, config) {
        return __awaiter(this, void 0, void 0, function* () {
            // Defer dependency loading until this specific command is run
            const del = require('del');
            const buildLib = require('../build/build');
            const path = require('path');
            let build = buildLib.build;
            const mainBuildDirectoryName = buildLib.mainBuildDirectoryName;
            // Validate our configuration and exit if a problem is found.
            // Neccessary for a clean build.
            config.validate();
            // Support passing a custom build function via options.env
            if (options['env'] && options['env'].build) {
                logger.debug('build function passed in options, using that for build');
                build = options['env'].build;
            }
            logger.info(`Clearing ${mainBuildDirectoryName}${path.sep} directory...`);
            yield del([mainBuildDirectoryName]);
            // If any the build command flags were passed as CLI arguments, generate
            // a single build based on those flags alone.
            const hasCliArgumentsPassed = this.args.some((arg) => typeof options[arg.name] !== 'undefined');
            if (hasCliArgumentsPassed) {
                return build({
                    addServiceWorker: !!options['add-service-worker'],
                    swPrecacheConfig: options['sw-precache-config'],
                    insertPrefetchLinks: !!options['insert-prefetch-links'],
                    bundle: !!options['bundle'],
                    html: {
                        minify: !!options['html-minify'],
                    },
                    css: {
                        minify: !!options['css-minify'],
                    },
                    js: {
                        minify: !!options['js-minify'],
                        compile: !!options['js-compile'],
                    },
                }, config);
            }
            // If no build configurations were passed via CLI flags or the polymer.json
            // file, generate a default build.
            if (!config.builds) {
                return build({}, config);
            }
            // If a single build was defined or configured via the project config,
            // generate a build for that configuration.
            if (config.builds.length === 1) {
                return build(config.builds[0], config);
            }
            // If multiple builds were defined or configured via the project config,
            // generate a build for each configuration.
            return Promise
                .all(config.builds.map((buildOptions) => {
                return build(buildOptions, config);
            }))
                .then(() => undefined);
        });
    }
}
exports.BuildCommand = BuildCommand;
