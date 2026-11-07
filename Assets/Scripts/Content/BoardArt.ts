/** Run 9 (Wadood's review): small cast-style pictures for the case board's room and weapon cards. Pure mapping
 * from a room's clue name or a weapon's object type to a picture key; no Lens APIs. Unknown names get no picture. */
export type BoardArtKey="Study"|"Lounge"|"Hall"|"Kitchen"|"Conservatory"|"Cable"|"Candlestick"|"LetterKnife"|"Bottle"|"Bookend";
const ROOMS:Record<string,BoardArtKey>={study:"Study",lounge:"Lounge",hall:"Hall",kitchen:"Kitchen",conservatory:"Conservatory"};
const WEAPONS:Record<string,BoardArtKey>={cord:"Cable",blunt:"Candlestick",sharp:"LetterKnife",poison:"Bottle",heavy:"Bookend"};
export function roomArtKey(clueName:string):BoardArtKey|null {return ROOMS[(clueName||"").trim().toLowerCase()]||null;}
export function weaponArtKey(objectType:string):BoardArtKey|null {return WEAPONS[(objectType||"").trim().toLowerCase()]||null;}
