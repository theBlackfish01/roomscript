import {boardArtTexture} from "./RoomscriptBoardArt";
import {paperTexture} from "./RoomscriptPaper";
export function itemLabel(id:string):string{return ({O1:"Cable",O2:"Candlestick",O3:"Letter knife",O4:"Medicine",O5:"Bookend",O11:"Kettle",O12:"Recorder",O13:"Letter",O14:"Debt note",O15:"Certificate"} as Record<string,string>)[id]||id;}
/** Small views of the actual props, not evidence cards. */
export function itemPicture(id:string):Texture{
 const weapon:Record<string,any>={O1:"Cable",O2:"Candlestick",O3:"LetterKnife",O4:"Bottle",O5:"Bookend"};if(weapon[id])return boardArtTexture(weapon[id])!;
 if(id==="O11")return requireAsset("../Art/ItemPictures/Kettle.jpg") as Texture;
 if(id==="O12")return requireAsset("../Art/ItemPictures/Recorder.jpg") as Texture;
 if(id==="O13")return requireAsset("../Art/ItemPictures/Letter_384x384.png") as Texture;
 if(id==="O14")return requireAsset("../Art/ItemPictures/DebtNote_384x384.png") as Texture;
 if(id==="O15")return requireAsset("../Art/ItemPictures/Certificate_384x384.png") as Texture;
 return paperTexture("PhotoPaper");
}
