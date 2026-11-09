export const ROOM_CAST_PENDING_KEY="roomscript.roomCast.pending";
/** A short-lived editor restart handoff, never a provider credential. */
export function pendingRoomCast():string {
 if(!global.deviceInfoSystem.isEditor())return "";
 const id=global.persistentStorageSystem.store.getString(ROOM_CAST_PENDING_KEY);
 return /^roomcast-\d+$/.test(id)&&Date.now()-Number(id.slice(9))<240000?id:"";
}
