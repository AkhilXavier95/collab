import React, { useEffect, useState } from "react";

import { Text } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { basicSetup } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";

import { useConnection } from "./useConnection";
import { getPeerExtension } from "./peerExtenstion";
import myWorker from "worker-loader!./authority.worker.js";

import "./styles.css";

const worker = new myWorker();

export default function App() {
  const [doc, setDoc] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);

  const initialConnection = useConnection(worker, 0);
  const peer1Connection = useConnection(worker, 100);
  const peer2Connection = useConnection(worker, 100);

  useEffect(() => {
    getDocument(initialConnection);
  }, []);

  async function getDocument(connection) {
    setLoading(true);
    await connection.request({ type: "getDocument" }).then((data) => {
      setVersion(data.version);
      setDoc(Text.of(data.doc.split("\n")));
    });
    setLoading(false);
  }

  if (loading) {
    return null;
  }

  const peerExtension1 = getPeerExtension(version, peer1Connection);
  const peerExtension2 = getPeerExtension(version, peer2Connection);

  return (
    <>
      <CodeMirror
        value={doc}
        height="200px"
        extensions={[basicSetup, javascript({ jsx: true }), peerExtension1]}
        onChange={(value) => console.log(value)}
      />
      <br />
      <CodeMirror
        value={doc}
        height="200px"
        extensions={[basicSetup, javascript({ jsx: true }), peerExtension2]}
      />
    </>
  );
}
