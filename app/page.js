"use client";
import {useEffect,useState} from "react";
import styles from "./page.module.css";
export default function Home(){
 const [status,setStatus]=useState("offline"),[terminal,setTerminal]=useState(""),[busy,setBusy]=useState(false);
 async function connect(){setBusy(true);try{const r=await fetch("/api/sandbox",{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Sandbox gagal");setTerminal(d.terminalUrl||"");setStatus("connected");}catch(e){setStatus("error");alert(e.message)}finally{setBusy(false)}}
 useEffect(()=>{fetch("/api/sandbox").then(r=>r.json()).then(d=>{if(d.ok){setStatus("ready");setTerminal(d.terminalUrl||"")}}).catch(()=>{});},[]);
 return <main className={styles.shell}>
  <header><div><b>⚡ Mobile Code</b><span>Cloud IDE</span></div><button onClick={connect} disabled={busy}>{busy?"Starting…":"⌁ Connect Terminal"}</button></header>
  <section className={styles.grid}>
   <aside><div className={styles.title}>PROJECT <small>☁ cloud workspace</small></div><div className={styles.path}>/vercel/sandbox/workspace</div><div className={styles.file}>📁 workspace</div><div className={styles.file}>📄 README.md</div><div className={styles.file}>📄 package.json</div><div className={styles.file}>📁 src</div></aside>
   <section className={styles.editor}><div className={styles.tabs}>WELCOME <span>×</span></div><div className={styles.empty}><h1>Mobile Code Cloud</h1><p>Workspace cloud + Linux terminal penuh.</p><button onClick={connect} disabled={busy}>Open Terminal</button>{terminal&&<a href={terminal} target="_blank" rel="noreferrer">Open current terminal ↗</a>}<p className={styles.state}>Status: {status}</p></div></section>
  </section>
  <footer>GitHub → Vercel → Vercel Sandbox · isolated Linux compute</footer>
 </main>
}
