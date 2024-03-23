import {
  SingleI18NEntry,
  PluralI18NEntry,
  TranslationJson,
  TranslationMeta
} from 'i18n-proto';

export type InitialMeta = {
  copyrightSubject?: string;
  bugsEmail?: string;
  year?: number;
};

export function getTzOffset(date: Date) {
  const timezoneShift = date.getTimezoneOffset() / -60;
  let tz = 'Z';
  if (timezoneShift !== 0) {
    tz = (timezoneShift > 0 ? '+' : '-') +
      (timezoneShift > 9 ? '' : '0')
      + timezoneShift + '00';
  }

  return tz;
}

export function makeDate(date: Date) {
  return date.getFullYear() + '-' +
    ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-' +
    (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' +
    (date.getHours() > 9 ? '' : '0') + date.getHours() + ':' +
    (date.getMinutes() > 9 ? '' : '0') + date.getMinutes() +
    getTzOffset(date);
}

export function makePoHeader({ meta, initialMeta, genDate, hasPluralForms }: {
  meta?: TranslationMeta;
  initialMeta: InitialMeta;
  genDate: string;
  hasPluralForms: boolean;
}): string {
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
  } else {
    // have meta - make po!
    const headers = {
      projectIdVersion: (v: string) => `Project-Id-Version: ${v}\n`,
      reportMsgidBugsTo: (v: string) => `Report-Msgid-Bugs-To: ${v}\n`,
      potCreationDate: (v: string) => `POT-Creation-Date: ${v}\n`,
      poRevisionDate: (v: string) => `PO-Revision-Date: ${v}\n`,
      lastTranslator: (v: { name: string; email: string }) => `Last-Translator: ${v.name} <${v.email}>\n`,
      languageTeam: (v: string) => `Language-Team: ${v}\n`,
      mimeVersion: (v: string) => `MIME-Version: ${v}\n`,
      contentType: (v: string) => `Content-Type: ${v}\n`,
      contentTransferEncoding: (v: string) => `Content-Transfer-Encoding: ${v}\n`,
      generatedBy: (v: string) => `Generated-By: ${v}\n`,
      language: (v: string) => `Language: ${v}\n`,
      pluralForms: (v: string) => `Plural-Forms: ${v}\n`,
    };
    const items = [
      'msgid ""',
      'msgstr ""',
    ];
    let pluralFormsHeaderFound = false;
    Object.keys(meta).forEach((key: keyof typeof meta) => {
      if (key === 'pluralForms') {
        pluralFormsHeaderFound = true;
      }
      // @ts-expect-error
      items.push(JSON.stringify(headers[key](meta[key])));
    })

    if (hasPluralForms && !pluralFormsHeaderFound) {
      throw new Error('Translation has some plural forms, but Plural-Forms header was not found');
    }

    return items.join("\n") + "\n\n"; // additional CRLFs to separated header
  }
}

export function convert(json: string, initialMeta: InitialMeta | undefined, printOccurences: boolean): string {
  const document: TranslationJson = JSON.parse(json);
  const poEntries: PotEntry[] = [];
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
  private items: string[];

  protected addComment = (comment: string) => this.items.push('#. ' + comment);
  protected addOccurence = (occ: string) => this.items.push('#: ' + occ);
  protected addContext = (context: string) => this.items.push('msgctxt ' + JSON.stringify(context));
  protected addMsgid = (id: string) => this.items.push('msgid ' + JSON.stringify(id));
  protected addMsgidPlural = (id: string) => this.items.push('msgid_plural ' + JSON.stringify(id));
  protected addMsgstr = (translation = '') => this.items.push('msgstr ' + JSON.stringify(translation));
  protected addMsgstrPlural = (translations: string[]) => {
    if (!translations.length) { // 2 empty translations by default
      this.items.push('msgstr[0] ""');
      this.items.push('msgstr[1] ""');
    } else {
      translations.forEach((val, index) => this.items.push('msgstr[' + index + '] ' + JSON.stringify(val)));
    }
  };

  public asString = () => this.items.join("\n");

  public parseSingleEntry(
    { entry, comments, occurences, context, translation }: SingleI18NEntry,
    printOccurences: boolean,
    includeTranslations: boolean
  ): PotEntry {
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

  public parsePluralEntry(
    { entry, comments, occurences, context, translations }: PluralI18NEntry,
    printOccurences: boolean,
    includeTranslations: boolean
  ): PotEntry {
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
