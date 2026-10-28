/** Preview-only stand-in gate; device room remains the player's physical space. */
@component export class RoomscriptPreviewRoom extends BaseScriptComponent {
  onAwake():void {this.getSceneObject().enabled=global.deviceInfoSystem.isEditor();}
}
