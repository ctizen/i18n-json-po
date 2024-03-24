"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var convert_1 = require("../convert");
function diffArray(one, two) {
    if (!Array.isArray(two)) {
        return one.slice();
    }
    var tlen = two.length;
    var olen = one.length;
    var idx = -1;
    var arr = [];
    while (++idx < olen) {
        var ele = one[idx];
        var hasElem = false;
        for (var i = 0; i < tlen; i++) {
            var val = two[i];
            if (ele === val) {
                hasElem = true;
                break;
            }
        }
        if (!hasElem) {
            arr.push(ele);
        }
    }
    return arr;
}
function xor() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var res;
    for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
        var arr = args_1[_a];
        if (Array.isArray(arr)) {
            if (res) {
                res = diffArray(res, arr).concat(diffArray(arr, res));
            }
            else {
                res = arr;
            }
        }
    }
    // Tests are expected to run on node >= 18
    // @ts-expect-error
    return res ? tslib_1.__spreadArray([], new Set(res), true) : [];
}
describe('JSON to PO converter', function () {
    it('Makes valid POT creation date', function () {
        var date1 = new Date('Fri Apr 01 2016 05:03:00');
        var date2 = new Date('Mon Nov 14 2016 15:13:00');
        // Here we depend on local timezone, as of js's dates are not that pure things :(
        assert_1.default.strictEqual((0, convert_1.makeDate)(date1), '2016-04-01 05:03' + (0, convert_1.getTzOffset)(date1));
        assert_1.default.strictEqual((0, convert_1.makeDate)(date2), '2016-11-14 15:13' + (0, convert_1.getTzOffset)(date2));
    });
    it('Makes valid POT header', function () {
        var m = {
            copyrightSubject: 'cool team',
            bugsEmail: 'bugs@team.com',
            year: 2044
        };
        var expected = "# Translations template for PROJECT.\n# Copyright (C) 2044 cool team\n# This file is distributed under the same license as the PROJECT project.\n# FIRST AUTHOR <EMAIL@ADDRESS>, 2044.\n# \n#, fuzzy\nmsgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: PROJECT VERSION\\n\"\n\"Report-Msgid-Bugs-To: bugs@team.com\\n\"\n\"POT-Creation-Date: SOMEDATE\\n\"\n\"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n\"\n\"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n\"\n\"Language-Team: LANGUAGE <LL@li.org>\\n\"\n\"MIME-Version: 1.0\\n\"\n\"Content-Type: text/plain; charset=utf-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Generated-By: i18n-json2po\\n\"\n";
        assert_1.default.deepStrictEqual(xor((0, convert_1.makePoHeader)({
            initialMeta: m,
            genDate: 'SOMEDATE',
            hasPluralForms: false
        }).split("\n"), expected.split("\n")), []);
    });
    it('Makes valid PO header from existing meta', function () {
        var input = {
            projectIdVersion: '2gis-online',
            reportMsgidBugsTo: 'online4@2gis.ru',
            potCreationDate: '2017-07-14 11:29+0700',
            poRevisionDate: '2017-06-30 15:30+0700',
            lastTranslator: {
                name: '2GIS',
                email: 'crowdin@2gis.ru'
            },
            language: 'cs_CZ',
            languageTeam: 'Czech',
            pluralForms: 'nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2',
            mimeVersion: '1.0',
            contentType: 'text/plain; charset=utf-8',
            contentTransferEncoding: '8bit',
            generatedBy: 'Babel 2.1.1'
        };
        var expected = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: 2gis-online\\n\"\n\"Report-Msgid-Bugs-To: online4@2gis.ru\\n\"\n\"POT-Creation-Date: 2017-07-14 11:29+0700\\n\"\n\"PO-Revision-Date: 2017-06-30 15:30+0700\\n\"\n\"Last-Translator: 2GIS <crowdin@2gis.ru>\\n\"\n\"Language: cs_CZ\\n\"\n\"Language-Team: Czech\\n\"\n\"Plural-Forms: nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2\\n\"\n\"MIME-Version: 1.0\\n\"\n\"Content-Type: text/plain; charset=utf-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Generated-By: Babel 2.1.1\\n\"\n\n";
        assert_1.default.deepStrictEqual(xor((0, convert_1.makePoHeader)({ meta: input, initialMeta: {}, genDate: 'SOMEDATE', hasPluralForms: true }).split("\n"), expected.split("\n")), []);
    });
    it('Properly handles absence of Plural-Forms header', function () {
        var input = {
            projectIdVersion: '2gis-online',
            reportMsgidBugsTo: 'online4@2gis.ru',
            potCreationDate: '2017-07-14 11:29+0700',
            poRevisionDate: '2017-06-30 15:30+0700',
            lastTranslator: {
                name: '2GIS',
                email: 'crowdin@2gis.ru'
            },
            language: 'cs_CZ',
            languageTeam: 'Czech',
            mimeVersion: '1.0',
            contentType: 'text/plain; charset=utf-8',
            contentTransferEncoding: '8bit',
            generatedBy: 'Babel 2.1.1'
        }; // Explicit casting to emulate bad JSON
        var catched = [];
        try {
            (0, convert_1.makePoHeader)({ meta: input, initialMeta: {}, genDate: 'SOMEDATE', hasPluralForms: true });
        }
        catch (e) {
            catched.push(e);
        }
        assert_1.default.strictEqual(catched.length, 1);
        assert_1.default.strictEqual(catched[0].message, 'Translation has some plural forms, but Plural-Forms header was not found');
        // Should not throw exceptions without hasPluralForms
        assert_1.default.notStrictEqual((0, convert_1.makePoHeader)({ meta: input, initialMeta: {}, genDate: 'SOMEDATE', hasPluralForms: false }), undefined);
    });
    it('Parses single i18n entry', function () {
        var entry = new convert_1.PotEntry();
        var i18nEntry = {
            type: 'single',
            entry: 'entry "quoted" text',
            context: 'entry "quoted" context',
            occurences: ['occ1', 'occ2'],
            comments: ['cmt1', 'cmt2']
        };
        var expected = "#. cmt1\n#. cmt2\n#: occ1\n#: occ2\nmsgctxt \"entry \\\"quoted\\\" context\"\nmsgid \"entry \\\"quoted\\\" text\"\nmsgstr \"\"";
        var expectedWithoutOccurences = "#. cmt1\n#. cmt2\nmsgctxt \"entry \\\"quoted\\\" context\"\nmsgid \"entry \\\"quoted\\\" text\"\nmsgstr \"\"";
        var xor1 = xor(entry.parseSingleEntry(i18nEntry, true, true).asString().split("\n"), expected.split("\n"));
        assert_1.default.deepStrictEqual(xor1, [], "Parsing with occurences failed. Xordiff: " + JSON.stringify(xor1));
        var xor2 = xor(entry.parseSingleEntry(i18nEntry, false, true).asString().split("\n"), expectedWithoutOccurences.split("\n"));
        assert_1.default.deepStrictEqual(xor2, [], "Parsing without occurences failed. Xordiff: " + JSON.stringify(xor2));
    });
    it('Parses plural i18n entry', function () {
        var entry = new convert_1.PotEntry();
        var i18nEntry = {
            type: 'plural',
            entry: ['entry "quoted" text', 'entry "quoted" plural'],
            context: 'entry "quoted" context',
            occurences: ['occ1', 'occ2'],
            comments: ['cmt1', 'cmt2'],
            translations: []
        };
        var expected = "#. cmt1\n#. cmt2\n#: occ1\n#: occ2\nmsgctxt \"entry \\\"quoted\\\" context\"\nmsgid \"entry \\\"quoted\\\" text\"\nmsgid_plural \"entry \\\"quoted\\\" plural\"\nmsgstr[0] \"\"\nmsgstr[1] \"\"";
        var expectedWithoutOccurences = "#. cmt1\n#. cmt2\nmsgctxt \"entry \\\"quoted\\\" context\"\nmsgid \"entry \\\"quoted\\\" text\"\nmsgid_plural \"entry \\\"quoted\\\" plural\"\nmsgstr[0] \"\"\nmsgstr[1] \"\"";
        var xor1 = xor(entry.parsePluralEntry(i18nEntry, true, true).asString().split("\n"), expected.split("\n"));
        assert_1.default.deepStrictEqual(xor1, [], "Parsing with occurences failed. Xordiff: " + JSON.stringify(xor1));
        var xor2 = xor(entry.parsePluralEntry(i18nEntry, false, true).asString().split("\n"), expectedWithoutOccurences.split("\n"));
        assert_1.default.deepStrictEqual(xor2, [], "Parsing without occurences failed. Xordiff: " + JSON.stringify(xor2));
    });
});
//# sourceMappingURL=convert.spec.js.map