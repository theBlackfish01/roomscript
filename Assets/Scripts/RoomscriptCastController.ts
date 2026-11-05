import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {PanelUI,uiObject} from "./RoomscriptPanelUI";
import {refuterMarks} from "./Engine/game/CluePresentation";

/** Registers four persistent identities. Selecting one changes presentation, never engine truth. */
@component export class RoomscriptCastController extends BaseScriptComponent {
  @input @hint("Question and voice routing") flow:RoomscriptInterrogationController;
  @input @hint("Shared case floor frame") room:RoomscriptRoomBinding;
  @input @hint("Qadir actor") qadir:RoomscriptSuspectActor;
  @input @hint("Okafor actor") okafor:RoomscriptSuspectActor;
  @input @hint("Pike actor") pike:RoomscriptSuspectActor;
  private cast:RoomscriptSuspectActor[]=[];
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());}
  private build():void {
    this.flow.initialize();this.room.initialize();this.cast=[this.qadir,this.flow.actor,this.okafor,this.pike];
    const graph=this.flow.engine.graphRef(),marks=refuterMarks(graph);
    for(const actor of this.cast){this.flow.registerActor(actor);if(actor.suspect!=="S2")actor.getTransform().setWorldPosition(this.room.toWorld(marks[actor.suspect]));
      const person=graph.cast.suspects.find(p=>p.id===actor.suspect)!,card=uiObject(actor.getSceneObject(),"RoomscriptSelect_"+actor.suspect);card.getTransform().setLocalPosition(new vec3(0,182,8));
      const ui=new PanelUI(card,46,12,1.8,new vec4(1,.94,.84,1),false,true);ui.buttons([{id:"Question "+actor.suspect,label:person.name.split(" ").slice(-1)[0]}],()=>this.flow.selectSuspect(actor.suspect),8);
    }
    const ui=new PanelUI(this.getSceneObject(),60,12,1.7,new vec4(1,.94,.84,1));
    ui.buttons(graph.cast.suspects.map(p=>({id:"Select "+p.id,label:p.name.split(" ").slice(-1)[0]})),id=>this.flow.selectSuspect(id.slice(7)),8);
  }
  actors():RoomscriptSuspectActor[] {return this.cast.slice();}
}
