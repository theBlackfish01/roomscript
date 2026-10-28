// Layout helpers adapted from CLAD (Specs Inc. 2026), Apache-2.0. See NOTICE.
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexDirection, FlexAlign, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";

/** Dev-only UIKit surface; controller owns requests and results. */
@component
export class RoomscriptProbeLabUI extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("ImageMaterial preset cloned for camera and generated texture display") imageMaterial: Material;
  @ui.group_end
  @ui.group_start("Layout")
  @input @hint("Panel width in centimeters") width: number = 46;
  @input @hint("Panel height in centimeters") height: number = 62;
  @input @hint("Typography scale for the diagnostic panel") fontSizeScale: number = 1.8;
  @ui.group_end
  private statusText: Text;
  private previewImage: Image;
  private built = false;

  build(onProbe: (key: string) => void): void {
    if (this.built) return;
    this.built = true;
    const root = this.getSceneObject();
    root.createComponent("Component.Canvas");
    const backing = this.obj(root, "Probe backing");
    const plate = backing.createComponent(BackPlate.getTypeName()) as BackPlate;
    plate.size = new vec2(this.width, this.height);
    plate.style = "dark";
    const column = this.obj(backing, "Probe column", new vec3(0, 0, 0.6));
    const layout = column.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    layout.autoDiscoverItemsOnStart = false;
    layout.onInitialized.add(() => {
      layout.width = this.width - 4; layout.height = this.height - 4;
      layout.direction = FlexDirection.Column; layout.rowGap = 0.7;
      layout.alignItems = FlexAlign.Stretch; layout.justifyContent = FlexJustify.Start;
    });
    this.row(column, 4, child => this.label(child, "ROOMSCRIPT / PROBE LAB", "Headline"));
    this.row(column, 4, child => {this.statusText = this.label(child, "Choose a probe · 20 samples", "Body"); this.statusText.getSceneObject().name = "Probe status";});
    const labels = [
      ["a", "A · OpenAI strict JSON (2 models)"],
      ["b", "B · Gemini schema (2 models)"],
      ["c", "C · OpenAI speech playback"],
      ["d", "D · Built-in speech capability"],
      ["e", "E · Imagen texture"],
      ["f", "F · Four concurrent answers"],
      ["g", "G · Preview camera frames"]
    ];
    labels.forEach(([key, title]) => this.row(column, 4.3, child => {
      child.name = "Probe " + key.toUpperCase();
      const button = child.createComponent(RectangleButton.getTypeName()) as RectangleButton;
      button.onInitialized.add(() => {button.size = new vec3(this.width - 4, 4.3, 1);});
      button.onTriggerUp.add(() => onProbe(key));
      this.label(child, title, "Body");
    }));
    this.row(column, 12, child => {
      child.name = "Probe media";
      const media = this.obj(child, "Generated image or camera", new vec3(0, 0, 0.6));
      const st = media.createComponent("Component.ScreenTransform") as ScreenTransform;
      st.anchors = Rect.create(0, 0, 0, 0);
      st.offsets = Rect.create(-10, 10, -5.6, 5.6);
      this.previewImage = media.createComponent("Component.Image") as Image;
      const material = this.imageMaterial.clone();
      material.mainPass.depthTest = true;
      material.mainPass.depthWrite = false;
      this.previewImage.clearMaterials();
      this.previewImage.addMaterial(material);
      this.previewImage.enabled = false;
    });
  }
  status(value: string): void { if (this.statusText) this.statusText.text = value; }
  showTexture(texture: Texture): void {
    this.previewImage.mainPass.baseTex = texture;
    this.previewImage.mainPass.baseColor = new vec4(1, 1, 1, 1);
    this.previewImage.enabled = true;
  }
  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const object = global.scene.createSceneObject(name); object.setParent(parent);
    if (position) object.getTransform().setLocalPosition(position);
    return object;
  }
  private row(parent: SceneObject, height: number, build: (child: SceneObject) => void): void {
    const child = this.obj(parent, "Row", new vec3(0, 0, 0.6));
    const item = child.createComponent(FlexItem.getTypeName()) as FlexItem;
    item.overrideWidth = this.width - 4; item.overrideHeight = height;
    item.flexGrow = 0; item.flexShrink = 0;
    build(child);
    (parent.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems([item]);
  }
  private label(parent: SceneObject, value: string, role: "Headline" | "Body"): Text {
    const child = this.obj(parent, "Label", new vec3(0, 0, 0.6));
    const text = child.createComponent("Component.Text") as Text;
    text.text = value;
    const roles = {Headline: {size: 48, weight: 700}, Body: {size: 39, weight: 500}};
    text.size = roles[role].size * this.fontSizeScale;
    (text as Text & {weight?: number}).weight = roles[role].weight;
    text.depthTest = true;
    text.horizontalAlignment = HorizontalAlignment.Center;
    text.verticalAlignment = VerticalAlignment.Center;
    text.horizontalOverflow = HorizontalOverflow.Overflow;
    text.verticalOverflow = VerticalOverflow.Overflow;
    text.textFill.color = new vec4(0.93, 0.89, 0.78, 1);
    return text;
  }
}
