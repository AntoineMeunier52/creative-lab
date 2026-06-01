import { Pane } from "tweakpane";
import type { Bindable, BindingApi, BindingParams } from "@tweakpane/core";

type Bound = { target: Record<string, unknown>; key: string };
type Disposable = { dispose(): void };

/**
 * Pane qui garde toujours des boutons "Copy JSON" / "Paste JSON" en bas.
 *
 * Chaque appel à `addBinding` est tracké automatiquement : Copy sérialise
 * toutes les valeurs liées, Paste les réinjecte depuis le presse-papier.
 */
class CustomPane extends Pane {
  private tracked: Bound[] = [];
  private actions: Disposable[] = [];

  constructor(options?: ConstructorParameters<typeof Pane>[0]) {
    super(options);
    this.renderActions();
  }

  override addBinding<O extends Bindable, Key extends keyof O>(
    object: O,
    key: Key,
    opt_params?: BindingParams,
  ): BindingApi<unknown, O[Key]> {
    const api = super.addBinding(object, key, opt_params);
    this.tracked.push({
      target: object as Record<string, unknown>,
      key: String(key),
    });
    this.renderActions();
    return api;
  }

  private renderActions() {
    // On retire les anciens boutons puis on les re-ajoute pour qu'ils
    // restent toujours en dernier, sous les nouvelles bindings.
    for (const blade of this.actions) blade.dispose();

    const separator = this.addBlade({ view: "separator" });
    const copy = this.addButton({ title: "Copy JSON" }).on("click", () =>
      this.copyJSON(),
    );
    const paste = this.addButton({ title: "Paste JSON" }).on("click", () =>
      this.pasteJSON(),
    );

    this.actions = [separator, copy, paste];
  }

  private serialize(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const { target, key } of this.tracked) out[key] = target[key];
    return out;
  }

  async copyJSON() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(this.serialize(), null, 2),
      );
      console.log("CustomPane: values copied", this.serialize());
    } catch (err) {
      console.error("CustomPane: failed to copy JSON", err);
    }
  }

  async pasteJSON() {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      for (const { target, key } of this.tracked) {
        const incoming = parsed[key];
        // On ne réinjecte que si la clé existe et garde le même type.
        if (incoming !== undefined && typeof incoming === typeof target[key]) {
          target[key] = incoming;
        }
      }
      this.refresh();
      console.log("CustomPane: values pasted", this.serialize());
    } catch (err) {
      console.error("CustomPane: failed to paste JSON", err);
    }
  }
}

export default CustomPane;
