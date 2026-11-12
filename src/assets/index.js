// Static assets imported as URLs so the single-file build can inline them.
import logoUrl from "./development-savvy-logo.png?url";
import dictionaryUrl from "./wordle-dictionary.txt?url";
// PNG renders of the SVGs (3×): the SVGs' blur filters are slow to repaint dozens of times.
import textChainLogoUrl from "./textchain-logo.png?url";
import subTextLogoUrl from "./subtext-logo.png?url";
import hostPictureUrl from "./host-scott.png?url";
import streamHeroUrl from "./stream-hero.png?url";
import wendysLogoUrl from "./sponsor-wendys.svg?url";

export const LOGO_URL = logoUrl;
export const DICTIONARY_URL = dictionaryUrl;
// The game modes' logos (Savvy TextChain, Savvy SubText).
export const MODE_LOGOS = { TextChain: textChainLogoUrl, SubText: subTextLogoUrl };
// The host's picture (square: avatar and hero card) and the default 900 × 1200 stream image.
export const HOST_PICTURE_URL = hostPictureUrl;
export const STREAM_HERO_URL = streamHeroUrl;
// Sample sponsor logo.
export const WENDYS_LOGO_URL = wendysLogoUrl;
