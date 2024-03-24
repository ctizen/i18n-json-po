"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotEntry = exports.convert = exports.makePoHeader = exports.makeDate = exports.getTzOffset = void 0;
function getTzOffset(date) {
    var timezoneShift = date.getTimezoneOffset() / -60;
    var tz = 'Z';
    if (timezoneShift !== 0) {
        tz = (timezoneShift > 0 ? '+' : '-') +
            (timezoneShift > 9 ? '' : '0')
            + timezoneShift + '00';
    }
    return tz;
}
exports.getTzOffset = getTzOffset;
function makeDate(date) {
    return date.getFullYear() + '-' +
        ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-' +
        (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' +
        (date.getHours() > 9 ? '' : '0') + date.getHours() + ':' +
        (date.getMinutes() > 9 ? '' : '0') + date.getMinutes() +
        getTzOffset(date);
}
exports.makeDate = makeDate;
function makePoHeader(_a) {
    var meta = _a.meta, initialMeta = _a.initialMeta, genDate = _a.genDate, hasPluralForms = _a.hasPluralForms;
    if (!meta) {
        // make POT, use initial meta
        return "# Translations template for PROJECT.\n# Copyright (C) ".concat(initialMeta.year, " ").concat(initialMeta.copyrightSubject, "\n# This file is distributed under the same license as the PROJECT project.\n# FIRST AUTHOR <EMAIL@ADDRESS>, ").concat(initialMeta.year, ".\n# \n#, fuzzy\nmsgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: PROJECT VERSION\\n\"\n\"Report-Msgid-Bugs-To: ").concat(initialMeta.bugsEmail, "\\n\"\n\"POT-Creation-Date: ").concat(genDate, "\\n\"\n\"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n\"\n\"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n\"\n\"Language-Team: LANGUAGE <LL@li.org>\\n\"\n\"MIME-Version: 1.0\\n\"\n\"Content-Type: text/plain; charset=utf-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Generated-By: i18n-json2po\\n\"\n\n");
    }
    else {
        // have meta - make po!
        var headers_1 = {
            projectIdVersion: function (v) { return "Project-Id-Version: ".concat(v, "\n"); },
            reportMsgidBugsTo: function (v) { return "Report-Msgid-Bugs-To: ".concat(v, "\n"); },
            potCreationDate: function (v) { return "POT-Creation-Date: ".concat(v, "\n"); },
            poRevisionDate: function (v) { return "PO-Revision-Date: ".concat(v, "\n"); },
            lastTranslator: function (v) { return "Last-Translator: ".concat(v.name, " <").concat(v.email, ">\n"); },
            languageTeam: function (v) { return "Language-Team: ".concat(v, "\n"); },
            mimeVersion: function (v) { return "MIME-Version: ".concat(v, "\n"); },
            contentType: function (v) { return "Content-Type: ".concat(v, "\n"); },
            contentTransferEncoding: function (v) { return "Content-Transfer-Encoding: ".concat(v, "\n"); },
            generatedBy: function (v) { return "Generated-By: ".concat(v, "\n"); },
            language: function (v) { return "Language: ".concat(v, "\n"); },
            pluralForms: function (v) { return "Plural-Forms: ".concat(v, "\n"); },
        };
        var items_1 = [
            'msgid ""',
            'msgstr ""',
        ];
        var pluralFormsHeaderFound_1 = false;
        Object.keys(meta).forEach(function (key) {
            if (key === 'pluralForms') {
                pluralFormsHeaderFound_1 = true;
            }
            // @ts-expect-error
            items_1.push(JSON.stringify(headers_1[key](meta[key])));
        });
        if (hasPluralForms && !pluralFormsHeaderFound_1) {
            throw new Error('Translation has some plural forms, but Plural-Forms header was not found');
        }
        return items_1.join("\n") + "\n\n"; // additional CRLFs to separated header
    }
}
exports.makePoHeader = makePoHeader;
function convert(json, initialMeta, printOccurences) {
    var document = JSON.parse(json);
    var poEntries = [];
    var hasPluralForms = false;
    for (var _i = 0, _a = document.items; _i < _a.length; _i++) {
        var item = _a[_i];
        var potEntry = new PotEntry();
        if (item.type === 'single') {
            potEntry.parseSingleEntry(item, printOccurences, !!document.meta);
        }
        if (item.type === 'plural') {
            potEntry.parsePluralEntry(item, printOccurences, !!document.meta);
            hasPluralForms = true;
        }
        poEntries.push(potEntry);
    }
    return makePoHeader({
        meta: document.meta,
        initialMeta: initialMeta !== null && initialMeta !== void 0 ? initialMeta : {},
        genDate: makeDate(new Date()),
        hasPluralForms: hasPluralForms
    }) + poEntries.map(function (entry) { return entry.asString(); }).join("\n\n");
}
exports.convert = convert;
var PotEntry = /** @class */ (function () {
    function PotEntry() {
        var _this = this;
        this.addComment = function (comment) { return _this.items.push('#. ' + comment); };
        this.addOccurence = function (occ) { return _this.items.push('#: ' + occ); };
        this.addContext = function (context) { return _this.items.push('msgctxt ' + JSON.stringify(context)); };
        this.addMsgid = function (id) { return _this.items.push('msgid ' + JSON.stringify(id)); };
        this.addMsgidPlural = function (id) { return _this.items.push('msgid_plural ' + JSON.stringify(id)); };
        this.addMsgstr = function (translation) {
            if (translation === void 0) { translation = ''; }
            return _this.items.push('msgstr ' + JSON.stringify(translation));
        };
        this.addMsgstrPlural = function (translations) {
            if (!translations.length) { // 2 empty translations by default
                _this.items.push('msgstr[0] ""');
                _this.items.push('msgstr[1] ""');
            }
            else {
                translations.forEach(function (val, index) { return _this.items.push('msgstr[' + index + '] ' + JSON.stringify(val)); });
            }
        };
        this.asString = function () { return _this.items.join("\n"); };
    }
    PotEntry.prototype.parseSingleEntry = function (_a, printOccurences, includeTranslations) {
        var entry = _a.entry, comments = _a.comments, occurences = _a.occurences, context = _a.context, translation = _a.translation;
        this.items = [];
        if (comments) {
            comments.forEach(this.addComment);
        }
        if (occurences && printOccurences) {
            occurences.forEach(this.addOccurence);
        }
        if (context) {
            this.addContext(context);
        }
        this.addMsgid(entry);
        this.addMsgstr(includeTranslations ? translation : '');
        return this;
    };
    PotEntry.prototype.parsePluralEntry = function (_a, printOccurences, includeTranslations) {
        var entry = _a.entry, comments = _a.comments, occurences = _a.occurences, context = _a.context, translations = _a.translations;
        this.items = [];
        if (comments) {
            comments.forEach(this.addComment);
        }
        if (occurences && printOccurences) {
            occurences.forEach(this.addOccurence);
        }
        if (context) {
            this.addContext(context);
        }
        this.addMsgid(entry[0]);
        // extracted original entries contain only first and
        // last plurals forms, which identify the entry
        this.addMsgidPlural(entry[1]);
        this.addMsgstrPlural(includeTranslations ? translations : []);
        return this;
    };
    return PotEntry;
}());
exports.PotEntry = PotEntry;
//# sourceMappingURL=convert.js.map