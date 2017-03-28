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
const dom5 = require("dom5");
const parse5 = require("parse5");
const stream = require("stream");
const url = require("url");
const attrValueMatches = (attrName, regex) => {
    return (node) => {
        const attrValue = dom5.getAttribute(node, attrName);
        return attrValue != null && regex.test(attrValue);
    };
};
const p = dom5.predicates;
const scriptIncludeWebcomponentsLoader = p.AND(p.hasTagName('script'), attrValueMatches('src', /\bwebcomponents-loader\.js$/));
/**
 * When compiling ES6 classes down to ES5 we need to include a special form of
 * the webcomponents loader to be compatible with native custom elements.
 *
 * TODO(rictic): test this.
 */
class UseES5WebcomponentsLoader extends stream.Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(file, _encoding, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let contents;
            if (file.contents === null || file.extname !== '.html') {
                callback(null, file);
                return;
            }
            if (file.isBuffer()) {
                contents = file.contents.toString('utf-8');
            }
            else {
                const stream = file.contents;
                stream.setEncoding('utf-8');
                contents = '';
                stream.on('data', (chunk) => contents += chunk);
                yield new Promise((resolve, reject) => {
                    stream.on('end', resolve);
                    stream.on('error', reject);
                });
            }
            if (!/webcomponents-loader\.js/.test(contents)) {
                callback(null, file);
                return;
            }
            const parsed = parse5.parse(contents);
            const script = dom5.nodeWalk(parsed, scriptIncludeWebcomponentsLoader);
            if (!script) {
                callback(null, file);
                return;
            }
            const scriptPath = dom5.getAttribute(script, 'src');
            const scriptUrl = url.resolve(scriptPath, 'custom-elements-es5-adapter.js');
            const es5AdapterScript = parse5.parseFragment(`<script src="${scriptUrl}"></script>`);
            dom5.insertBefore(script.parentNode, script, es5AdapterScript);
            const correctedFile = file.clone();
            correctedFile.contents = new Buffer(parse5.serialize(parsed), 'utf-8');
            callback(null, correctedFile);
        });
    }
}
exports.UseES5WebcomponentsLoader = UseES5WebcomponentsLoader;
