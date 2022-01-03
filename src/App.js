import React, { useEffect, useRef, useState } from "react";
import { basicSetup } from "@codemirror/basic-setup";
import "./styles.css";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useConnection } from "./useConnection";
import { usePeerExtension } from "./usePeerExtenstion";
import worker_script from "./worker";

const worker = new Worker(worker_script);

export default function App() {
  const initialConnection = useConnection(worker, 0);
  const editorRef1 = useRef();
  const editorRef2 = useRef();
  const [editorView1, setEditorView1] = useState({ state: {} });
  const [editorView2, setEditorView2] = useState({ state: {} });
  const [doc, setDoc] = useState(null);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    getDocument(initialConnection);
  }, []);

  async function getDocument(connection) {
    await connection.request({ type: "getDocument" }).then((data) => {
      console.log({ data });
      setVersion(data.version);
      setDoc(Text.of(data.doc.split("\n")));
    });
  }

  useEffect(() => {
    if (editorRef1?.current?.view) {
      setEditorView1(editorRef1?.current?.view);
    }
  }, [editorRef1.current?.view]);

  useEffect(() => {
    if (editorRef2?.current.view) {
      setEditorView2(editorRef2?.current?.view);
    }
  }, [editorRef2.current?.view]);

  const peerExtension1 = usePeerExtension(
    version,
    useConnection(worker, 100),
    editorView1
  );
  const peerExtension2 = usePeerExtension(
    version,
    useConnection(worker, 100),
    editorView2
  );

  return (
    <>
      <CodeMirror
        value={doc}
        ref={editorRef1}
        height="200px"
        extensions={[basicSetup, javascript({ jsx: true }), peerExtension1]}
      />
      <CodeMirror
        value={doc}
        ref={editorRef2}
        height="200px"
        extensions={[basicSetup, javascript({ jsx: true }), peerExtension2]}
      />
    </>
  );
}
