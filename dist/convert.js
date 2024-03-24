export function getTzOffset(date) {
    const timezoneShift = date.getTimezoneOffset() / -60;
    let tz = 'Z';
    if (timezoneShift !== 0) {
        tz = (timezoneShift > 0 ? '+' : '-') +
            (timezoneShift > 9 ? '' : '0')
            + timezoneShift + '00';
    }
    return tz;
}
export function makeDate(date) {
    return date.getFullYear() + '-' +
        ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-' +
        (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' +
        (date.getHours() > 9 ? '' : '0') + date.getHours() + ':' +
        (date.getMinutes() > 9 ? '' : '0') + date.getMinutes() +
        getTzOffset(date);
}
export function makePoHeader({ meta, initialMeta, genDate, hasPluralForms }) {
    if (!meta) {
        // make POT, use initial meta
        return `# Translations template for PROJECT.
# Copyright (C) ${initialMeta.year} ${initialMeta.copyrightSubject}
# This file is distributed under the same license as the PROJECT project.
# FIRST AUTHOR <EMAIL@ADDRESS>, ${initialMeta.year}.
# 
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PROJECT VERSION\\n"
"Report-Msgid-Bugs-To: ${initialMeta.bugsEmail}\\n"
"POT-Creation-Date: ${genDate}\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Generated-By: i18n-json2po\\n"

`;
    }
    else {
        // have meta - make po!
        const headers = {
            projectIdVersion: (v) => `Project-Id-Version: ${v}\n`,
            reportMsgidBugsTo: (v) => `Report-Msgid-Bugs-To: ${v}\n`,
            potCreationDate: (v) => `POT-Creation-Date: ${v}\n`,
            poRevisionDate: (v) => `PO-Revision-Date: ${v}\n`,
            lastTranslator: (v) => `Last-Translator: ${v.name} <${v.email}>\n`,
            languageTeam: (v) => `Language-Team: ${v}\n`,
            mimeVersion: (v) => `MIME-Version: ${v}\n`,
            contentType: (v) => `Content-Type: ${v}\n`,
            contentTransferEncoding: (v) => `Content-Transfer-Encoding: ${v}\n`,
            generatedBy: (v) => `Generated-By: ${v}\n`,
            language: (v) => `Language: ${v}\n`,
            pluralForms: (v) => `Plural-Forms: ${v}\n`,
        };
        const items = [
            'msgid ""',
            'msgstr ""',
        ];
        let pluralFormsHeaderFound = false;
        Object.keys(meta).forEach((key) => {
            if (key === 'pluralForms') {
                pluralFormsHeaderFound = true;
            }
            // @ts-expect-error
            items.push(JSON.stringify(headers[key](meta[key])));
        });
        if (hasPluralForms && !pluralFormsHeaderFound) {
            throw new Error('Translation has some plural forms, but Plural-Forms header was not found');
        }
        return items.join("\n") + "\n\n"; // additional CRLFs to separated header
    }
}
export function convert(json, initialMeta, printOccurences) {
    const document = JSON.parse(json);
    const poEntries = [];
    let hasPluralForms = false;
    for (const item of document.items) {
        const potEntry = new PotEntry();
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
        initialMeta: initialMeta ?? {},
        genDate: makeDate(new Date()),
        hasPluralForms
    }) + poEntries.map((entry) => entry.asString()).join("\n\n");
}
export class PotEntry {
    constructor() {
        this.addComment = (comment) => this.items.push('#. ' + comment);
        this.addOccurence = (occ) => this.items.push('#: ' + occ);
        this.addContext = (context) => this.items.push('msgctxt ' + JSON.stringify(context));
        this.addMsgid = (id) => this.items.push('msgid ' + JSON.stringify(id));
        this.addMsgidPlural = (id) => this.items.push('msgid_plural ' + JSON.stringify(id));
        this.addMsgstr = (translation = '') => this.items.push('msgstr ' + JSON.stringify(translation));
        this.addMsgstrPlural = (translations) => {
            if (!translations.length) { // 2 empty translations by default
                this.items.push('msgstr[0] ""');
                this.items.push('msgstr[1] ""');
            }
            else {
                translations.forEach((val, index) => this.items.push('msgstr[' + index + '] ' + JSON.stringify(val)));
            }
        };
        this.asString = () => this.items.join("\n");
    }
    parseSingleEntry({ entry, comments, occurences, context, translation }, printOccurences, includeTranslations) {
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
    }
    parsePluralEntry({ entry, comments, occurences, context, translations }, printOccurences, includeTranslations) {
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
    }
}
//# sourceMappingURL=convert.js.map