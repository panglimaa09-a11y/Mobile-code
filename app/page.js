"use client";
import {useEffect,useState} from "react";
import styles from "./page.module.css";

export default function Home(){
 const [status,setStatus]=useState("connecting"),[terminal,setTerminal]=useState(""),[files,setFiles]=useState([]),[active,setActive]=useState("README.md"),[code,setCode]=useState(""),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[menu,setMenu]=useState(false),[mobilePanel,setMobilePanel]=useState("editor");

 async function loadFiles(){
  try{const r=await fetch("/api/workspace");const d=await r.json();if(r.ok)setFiles(d.files||[])}catch{}
 }
 async function openFile(path){
  setActive(path);setDirty(false);
  try{const r=await fetch("/api/workspace?path="+encodeURIComponent(path));const d=await r.json();if(r.ok)setCode(d.content||"");else alert(d.error||"Gagal membaca file")}catch(e){alert(e.message)}
 }
 async function save(){
  setBusy(true);
  try{const r=await fetch("/api/workspace",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({path:active,content:code})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan");setDirty(false);await loadFiles()}catch(e){alert(e.message)}finally{setBusy(false)}
 }
 async function connect(){
  setBusy(true);
  try{const r=await fetch("/api/sandbox",{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Sandbox gagal");setTerminal(d.terminalUrl||"");setStatus("connected")}catch(e){setStatus("error");alert(e.message)}finally{setBusy(false)}
 }
 useEffect(()=>{loadFiles();connect()},[]);
 useEffect(()=>{if(active)openFile(active)},[]);

 return <main className={styles.shell}>
  <header className={styles.topbar}>
   <button className={styles.icon} onClick={()=>setMenu(!menu)}>☰</button>
   <div className={styles.brand}><b>⚡ Mobile Code</b><span>{active||"No file"}</span></div>
   <div className={styles.actions}><button onClick={()=>setMobilePanel("terminal")}>⌁ Terminal</button><button className={styles.save} onClick={save} disabled={!dirty||busy}>Save</button></div>
  </header>

  <section className={styles.workspace}>
   <aside className={menu?styles.sidebar+" "+styles.open:styles.sidebar}>
    <div className={styles.projectHead}><b>PROJECT</b><button className={styles.icon} onClick={loadFiles}>↻</button></div>
    <div className={styles.path}>/vercel/sandbox/workspace</div>
    <div className={styles.tree}>
     {files.length?files.map(f=><button key={f.path} className={active===f.path?styles.treeItem+" "+styles.selected:styles.treeItem} onClick={()=>{openFile(f.path);setMobilePanel("editor")}}>{f.type==="dir"?"📁":"📄"} {f.path}</button>):<div className={styles.loading}>Loading workspace…</div>}
    </div>
    <div className={styles.sideBottom}><span className={status==="connected"?"dot":styles.dotOff}></span>{status}</div>
   </aside>

   <section className={styles.main}>
    <div className={styles.tabs}><span>📄 {active}</span>{dirty&&<em>●</em>}</div>
    <div className={mobilePanel==="editor"?styles.editor:styles.editor+" "+styles.hiddenMobile}>
     <textarea value={code} onChange={e=>{setCode(e.target.value);setDirty(true)}} spellCheck={false} autoCapitalize="off" autoCorrect="off"/>
    </div>
    <div className={mobilePanel==="terminal"?styles.terminal:styles.terminal+" "+styles.hiddenMobile}>
      <div className={styles.termHead}><b>TERMINAL</b><button onClick={()=>terminal&&window.open(terminal,"_blank","noopener,noreferrer")}>Open full terminal ↗</button></div>
      {terminal?<iframe src={terminal} title="Cloud Linux Terminal"/>:<div className={styles.termEmpty}>Connecting to cloud Linux…</div>}
    </div>
   </section>
  </section>

  <nav className={styles.bottomNav}>
   <button className={mobilePanel==="editor"?styles.navActive:""} onClick={()=>setMobilePanel("editor")}>⌘ Editor</button>
   <button onClick={()=>setMenu(!menu)}>☰ Files</button>
   <button className={mobilePanel==="terminal"?styles.navActive:""} onClick={()=>setMobilePanel("terminal")}>▣ Terminal</button>
  </nav>
 </main>
}