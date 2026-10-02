// @aufbau/elements2/data/locales.js
// a working set of language and region pairs as bcp 47 tags. Intl cannot list
// the locales it knows, so this is picked by hand: the widely used ones

export const LOCALES = `
  ar-EG ar-SA bg-BG bn-BD cs-CZ da-DK de-AT de-CH de-DE el-GR en-AU en-CA en-GB
  en-IE en-IN en-NZ en-US en-ZA es-AR es-ES es-MX es-US et-EE fa-IR fi-FI fr-BE
  fr-CA fr-CH fr-FR he-IL hi-IN hr-HR hu-HU id-ID it-CH it-IT ja-JP ko-KR lt-LT
  lv-LV ms-MY nb-NO nl-BE nl-NL pl-PL pt-BR pt-PT ro-RO ru-RU sk-SK sl-SI sr-RS
  sv-SE th-TH tr-TR uk-UA vi-VN zh-CN zh-HK zh-TW
`.trim().split(/\s+/);

export default LOCALES;
