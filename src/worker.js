import { ChangeSet, Text } from "@codemirror/state";

const workercode = () => {
  // The updates received so far (updates.length gives the current
  // version)
  let updates = [];
  // The current document
  let doc = Text.of(["Start document"]);
  //!authorityMessage
  let pending = [];

  self.onmessage = (event) => {
    console.log({ pending });
    function resp(value) {
      event.ports[0].postMessage(JSON.stringify(value));
    }
    let data = JSON.parse(event.data);
    if (data.type === "pullUpdates") {
      if (data.version < updates.length) resp(updates.slice(data.version));
      else pending.push(resp);
    } else if (data.type === "pushUpdates") {
      if (data.version !== updates.length) {
        resp(false);
      } else {
        for (let update of data.updates) {
          // Convert the JSON representation to an actual ChangeSet
          // instance
          let changes = ChangeSet.fromJSON(update.changes);
          updates.push({ changes, clientID: update.clientID });
          doc = changes.apply(doc);
        }
        resp(true);
        // Notify pending requests
        while (pending.length) pending.pop()(data.updates);
      }
    } else if (data.type === "getDocument") {
      resp({ version: updates.length, doc: doc.toString() });
    }
  };
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
const blob = new Blob([code], { type: "application/javascript" });

export const worker_script = URL.createObjectURL(blob);
