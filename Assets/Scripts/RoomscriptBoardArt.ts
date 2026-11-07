import {BoardArtKey} from "./Content/BoardArt";
/** Run 9 case board card pictures (gpt-image-2, cast style; see NOTICE), as literal requireAsset calls so the lens bundles them. */
export function boardArtTexture(key:BoardArtKey|null):Texture|null {
  switch(key){
    case "Study":return requireAsset("../Art/Board/Study.jpg") as Texture;
    case "Lounge":return requireAsset("../Art/Board/Lounge.jpg") as Texture;
    case "Hall":return requireAsset("../Art/Board/Hall.jpg") as Texture;
    case "Kitchen":return requireAsset("../Art/Board/Kitchen.jpg") as Texture;
    case "Conservatory":return requireAsset("../Art/Board/Conservatory.jpg") as Texture;
    case "Cable":return requireAsset("../Art/Board/Cable.jpg") as Texture;
    case "Candlestick":return requireAsset("../Art/Board/Candlestick.jpg") as Texture;
    case "LetterKnife":return requireAsset("../Art/Board/LetterKnife.jpg") as Texture;
    case "Bottle":return requireAsset("../Art/Board/Bottle.jpg") as Texture;
    case "Bookend":return requireAsset("../Art/Board/Bookend.jpg") as Texture;
    default:return null;
  }
}
