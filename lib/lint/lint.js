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
const chalk = require("chalk");
const logging = require("plylog");
const polymer_analyzer_1 = require("polymer-analyzer");
const fs_url_loader_1 = require("polymer-analyzer/lib/url-loader/fs-url-loader");
const package_url_resolver_1 = require("polymer-analyzer/lib/url-loader/package-url-resolver");
const warning_1 = require("polymer-analyzer/lib/warning/warning");
const warning_filter_1 = require("polymer-analyzer/lib/warning/warning-filter");
const warning_printer_1 = require("polymer-analyzer/lib/warning/warning-printer");
const lintLib = require("polymer-linter");
const command_1 = require("../commands/command");
const logger = logging.getLogger('cli.lint');
function lint(options, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const lintOptions = (config.lint || {});
        const ruleCodes = options.rules || lintOptions.rules;
        if (ruleCodes === undefined) {
            logger.warn(`You must state which lint rules to use. You can use --rules, ` +
                `but for a project it's best to use polymer.json. e.g.

{
  "lint": {
    "rules": ["polymer-2"]
  }
}`);
            return new command_1.CommandResult(1);
        }
        const rules = lintLib.registry.getRules(ruleCodes || lintOptions.rules);
        const filter = new warning_filter_1.WarningFilter({
            warningCodesToIgnore: new Set(lintOptions.ignoreWarnings || []),
            minimumSeverity: warning_1.Severity.WARNING
        });
        const analyzer = new polymer_analyzer_1.Analyzer({
            urlLoader: new fs_url_loader_1.FSUrlLoader(config.root),
            urlResolver: new package_url_resolver_1.PackageUrlResolver(),
        });
        const linter = new lintLib.Linter(rules, analyzer);
        let warnings;
        if (options.input) {
            warnings = yield linter.lint(options.input);
        }
        else {
            warnings = yield linter.lintPackage();
        }
        const filtered = warnings.filter((w) => !filter.shouldIgnore(w));
        const printer = new warning_printer_1.WarningPrinter(process.stdout, { analyzer: analyzer, verbosity: 'full', color: true });
        yield printer.printWarnings(filtered);
        if (filtered.length > 0) {
            let message = '';
            const errors = filtered.filter((w) => w.severity === warning_1.Severity.ERROR);
            const warnings = filtered.filter((w) => w.severity === warning_1.Severity.WARNING);
            const infos = filtered.filter((w) => w.severity === warning_1.Severity.INFO);
            if (errors.length > 0) {
                message += ` ${errors.length} ${chalk.red('errors')}`;
            }
            if (warnings.length > 0) {
                message += ` ${warnings.length} ${chalk.yellow('warnings')}`;
            }
            if (infos.length > 0) {
                message += ` ${infos.length} ${chalk.green('info')} messages`;
            }
            console.log(`\n\nFound ${message}.`);
            return new command_1.CommandResult(1);
        }
    });
}
exports.lint = lint;
