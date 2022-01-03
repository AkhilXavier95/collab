import React, { useEffect, useState } from "react";
import { basicSetup } from "@codemirror/basic-setup";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { Text } from "@codemirror/state";
import { useConnection } from "./useConnection";
import { usePeerExtension } from "./usePeerExtenstion";
import myWorker from "worker-loader!./authority.worker.js";
import "./styles.css";

const worker = new myWorker();

export default function App() {
  const initialConnection = useConnection(worker, 0);
  const peer1Connection = useConnection(worker, 100);
  const peer2Connection = useConnection(worker, 100);

  const [doc, setDoc] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const peerExtension1 = usePeerExtension(version, peer1Connection);
  const peerExtension2 = usePeerExtension(version, peer2Connection);

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
