import en from './en';
import zh from './zh';

export type Translation = typeof en;

const translations: { [key: string]: Translation } = {
    en,
    zh
};

export class I18n {
    private static instance: I18n;
    private currentLanguage: string = 'en';

    private constructor() {}

    public static getInstance(): I18n {
        if (!I18n.instance) {
            I18n.instance = new I18n();
        }
        return I18n.instance;
    }

    public setLanguage(lang: string): void {
        if (translations[lang]) {
            this.currentLanguage = lang;
        }
    }

    public t(key: string, placeholders?: { [key: string]: string }): string {
        const keys = key.split('.');
        let value: any = translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Fallback to English if translation is missing
                value = translations['en'];
                for (const fallbackKey of keys) {
                    if (value && value[fallbackKey]) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return the key if translation is missing
                    }
                }
            }
        }

        let result = typeof value === 'string' ? value : key;
        
        // Replace placeholders if provided
        if (placeholders) {
            for (const [placeholder, replacement] of Object.entries(placeholders)) {
                result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement);
            }
        }

        return result;
    }
}
