import { ViewPlugin, EditorView } from "@codemirror/view";
import {
  receiveUpdates,
  sendableUpdates,
  collab,
  getSyncedVersion
} from "@codemirror/collab";
import { ChangeSet } from "@codemirror/state";

function pushUpdates(connection, version, fullUpdates) {
  // Strip off transaction data
  const updates = fullUpdates.map((u) => ({
    clientID: u.clientID,
    changes: u.changes.toJSON()
  }));
  return connection.request({ type: "pushUpdates", version, updates });
}

function pullUpdates(connection, version) {
  return connection.request({ type: "pullUpdates", version }).then((updates) =>
    updates.map((u) => ({
      changes: ChangeSet.fromJSON(u.changes),
      clientID: u.clientID
    }))
  );
}

export const usePeerExtension = (startVersion, connection) => {
  let plugin = ViewPlugin.fromClass(
    class {
      pushing = false;
      done = false;

      constructor(view) {
        this.view = view;
        this.pull();
      }

      update(update) {
        if (update.docChanged) {
          this.push();
        }
      }

      async push() {
        const updates = sendableUpdates(this.view.state);
        if (this.pushing || !updates.length) {
          return;
        }
        this.pushing = true;
        const version = getSyncedVersion(this.view.state);
        await pushUpdates(connection, version, updates);
        this.pushing = false;
        // Regardless of whether the push failed or new updates came in
        // while it was running, try again if there's updates remaining
        if (sendableUpdates(this.view.state).length) {
          setTimeout(() => this.push(), 100);
        }
      }

      async pull() {
        while (!this.done) {
          const version = getSyncedVersion(this.view.state);
          const updates = await pullUpdates(connection, version);
          this.view.dispatch(receiveUpdates(this.view.state, updates));
        }
      }

      destroy() {
        this.done = true;
      }
    }
  );
  return [collab({ startVersion }), plugin];
};
