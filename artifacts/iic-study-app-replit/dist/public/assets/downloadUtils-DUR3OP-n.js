import{a1 as R,a2 as S}from"./vendor-libs-CpwQ9nrK.js";const z=(d,a,o)=>{const t=o?.appName||"NSTA",c=o?.pageTitle||a||"Notes",y=o?.subtitle||"",g=o?.brandColor||"#4f46e5",h=new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});let p="";try{for(const n of Array.from(document.styleSheets))try{for(const s of Array.from(n.cssRules||[]))p+=s.cssText+`
`}catch{}}catch{}const w=(a||"notes").replace(/[^a-zA-Z0-9_\-. ]/g,"_"),i=`<!DOCTYPE html>
<html lang="hi-IN">
<head>
  <meta charset="UTF-8">
  <!-- Keep saved reports in desktop layout even when opened on a phone. -->
  <meta name="viewport" content="width=1024, initial-scale=1.0">
  <title>${c} — ${t}</title>
  <style>
    * { box-sizing: border-box; }
     html, body { width: 1024px !important; min-width: 1024px !important; }
     body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; width: 1024px !important; min-width: 1024px !important; max-width: none !important; margin: 0; background: #f8fafc; color: #1e293b; overflow-x: visible; }
    .iic-header { background: ${g}; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; }
    .iic-header strong { font-size: 15px; display: block; }
    .iic-header small { font-size: 11px; opacity: 0.85; margin-top: 3px; display: block; }
    .iic-content { background: white; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none; min-height: 200px; }
    .iic-footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 12px; padding: 8px; }
     ${p}
     /* Re-apply these after the app stylesheet so mobile media queries cannot
        collapse a downloaded report back into the phone layout. */
     html.desktop-export, body.desktop-export { width: 1024px !important; min-width: 1024px !important; max-width: none !important; }
     body.desktop-export { margin: 0 !important; padding: 24px !important; overflow-x: visible !important; }
     body.desktop-export .iic-content { width: 976px !important; min-width: 976px !important; max-width: none !important; }
  </style>
</head>
<body class="desktop-export">
  <div class="iic-header">
    <strong>${t} — ${c}</strong>
    <small>${y?y+" · ":""}Downloaded: ${h}</small>
  </div>
  <div class="iic-content">
    ${d}
  </div>
  <div class="iic-footer">${t} · ${c} · ${h}</div>
</body>
</html>`;try{const n=new Blob([i],{type:"text/html;charset=utf-8"}),s=URL.createObjectURL(n),l=document.createElement("a");l.href=s,l.download=`${w}.html`,document.body.appendChild(l),l.click(),setTimeout(()=>{try{URL.revokeObjectURL(s),document.body.removeChild(l)}catch{}},1e3)}catch(n){console.error("[download] HTML generation failed:",n),alert("Download fail hua. Please try again.")}},N=async(d,a,o)=>{await D(d,a,o)},D=async(d,a,o)=>{const t=document.getElementById(d);if(!t){console.error(`[download] Element #${d} not found`),alert("Download content not found. Please try again.");return}const c=o?.appName||"NSTA",y=o?.pageTitle||a||"Notes",g=o?.subtitle||"",h=o?.brandColor||"#4f46e5",p=window.getComputedStyle(t),w=p.opacity==="0"||p.visibility==="hidden"||t.getBoundingClientRect().width===0,i={position:t.style.position,top:t.style.top,left:t.style.left,opacity:t.style.opacity,visibility:t.style.visibility,pointerEvents:t.style.pointerEvents,zIndex:t.style.zIndex,width:t.style.width,overflow:t.style.overflow,maxHeight:t.style.maxHeight};try{w&&(t.style.position="fixed",t.style.top="0",t.style.left="-100000px",t.style.opacity="1",t.style.visibility="visible",t.style.pointerEvents="none",t.style.zIndex="-1"),t.style.width="1024px",t.style.overflow="visible",t.style.maxHeight="none",await new Promise(v=>{requestAnimationFrame(()=>requestAnimationFrame(()=>v()))});const n=Math.max(t.scrollWidth,t.offsetWidth,1),s=Math.max(t.scrollHeight,t.offsetHeight,1),l=16e3,$=Math.max(.5,Math.min(2.5,window.devicePixelRatio||1,l/n,l/s)),u=await R(t,{scale:$,useCORS:!0,allowTaint:!1,backgroundColor:"#ffffff",logging:!1,windowWidth:1024,scrollX:0,scrollY:-window.scrollY,imageTimeout:15e3,onclone:v=>{v.querySelectorAll("img").forEach(C=>{C.setAttribute("crossorigin","anonymous")})}}),m=595.28,k=841.89,r=20,T=m-r*2,E=u.height/u.width,H=T*E,f=36,x=18,L=k-f-x-r*2,F=u.toDataURL("image/jpeg",.95),b=H+f+x+r*2,e=new S({orientation:"portrait",unit:"pt",format:[m,b]});e.setFillColor(h),e.rect(0,0,m,f,"F"),e.setTextColor("#ffffff"),e.setFontSize(9),e.setFont("helvetica","bold"),e.text(c,r,15),e.setFontSize(11),e.text(y.slice(0,60),r,28),e.setFillColor("#f1f5f9"),e.rect(0,b-x,m,x,"F"),e.setTextColor("#64748b"),e.setFontSize(7),e.setFont("helvetica","normal");const A=new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});e.text(`${g}  ·  Saved ${A}  ·  ${c}`,m/2,b-5,{align:"center"}),e.addImage(F,"JPEG",r,f+r,T,H),e.save(`${a}.pdf`)}catch(n){console.error("[download] PDF generation failed:",n);try{z(t.innerHTML,a,o),alert("Report MHTML/Webpage format mein successfully download ho gayi.")}catch(s){console.error("[download] HTML fallback failed:",s),alert("Download fail hua. Please try again.")}}finally{t.style.position=i.position,t.style.top=i.top,t.style.left=i.left,t.style.opacity=i.opacity,t.style.visibility=i.visibility,t.style.pointerEvents=i.pointerEvents,t.style.zIndex=i.zIndex,t.style.width=i.width,t.style.overflow=i.overflow,t.style.maxHeight=i.maxHeight}};export{N as a,D as d};
