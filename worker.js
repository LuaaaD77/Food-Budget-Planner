const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:cors});
const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function signPayload(payload, privateKeyB64) {
  const key = await crypto.subtle.importKey("pkcs8", fromB64(privateKeyB64), {name:"Ed25519"}, false, ["sign"]);
  const signature = await crypto.subtle.sign({name:"Ed25519"}, key, enc.encode(JSON.stringify(payload)));
  return {payload, signature:b64(signature)};
}
function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="FBP-";
  for(let i=0;i<bytes.length;i++) out+=alphabet[bytes[i]%alphabet.length]+((i%4===3&&i!==15)?"-":"");
  return out;
}
export default {
 async fetch(request, env) {
  if(request.method==="OPTIONS") return new Response(null,{headers:cors});
  const url=new URL(request.url);
  if(request.method!=="POST") return json({error:"Method not allowed"},405);
  let body={}; try{body=await request.json();}catch{return json({error:"Invalid JSON"},400);}
  if(url.pathname==="/activate"){
   const code=String(body.code||"").trim().toUpperCase();
   const installationId=String(body.installationId||"");
   if(!/^FBP-[A-HJ-NP-Z2-9-]{15,40}$/.test(code)||!/^[a-f0-9]{48}$/.test(installationId)) return json({error:"Invalid activation details."},400);
   const codeHash=await sha256(code);
   const row=await env.DB.prepare("SELECT id, status, installation_id FROM licenses WHERE activation_hash=?").bind(codeHash).first();
   if(!row) return json({error:"Activation code not recognized."},404);
   if(row.status!=="active") return json({error:"This license is not active. Contact the seller."},403);
   if(row.installation_id && row.installation_id!==installationId) return json({error:"This code has already been activated on another installation. Contact the seller for a transfer."},409);
   await env.DB.prepare("UPDATE licenses SET installation_id=COALESCE(installation_id,?), activated_at=COALESCE(activated_at,CURRENT_TIMESTAMP) WHERE id=?").bind(installationId,row.id).run();
   const payload={product:"food-budget-planner",licenseId:row.id,installationId,status:"active",plan:"lifetime",issuedAt:new Date().toISOString()};
   const license=await signPayload(payload,env.LICENSE_PRIVATE_KEY);
   return json({license});
  }
  if(url.pathname==="/admin/create"){
   const auth=request.headers.get("Authorization")||"";
   if(!env.ADMIN_TOKEN||auth!=="Bearer "+env.ADMIN_TOKEN) return json({error:"Unauthorized"},401);
   const code=randomCode(), hash=await sha256(code);
   const id=crypto.randomUUID();
   await env.DB.prepare("INSERT INTO licenses (id, activation_hash, status, customer_note) VALUES (?,?,'active',?)").bind(id,hash,String(body.customerNote||"").slice(0,120)).run();
   return json({licenseId:id,activationCode:code,status:"active"});
  }
  if(url.pathname==="/admin/revoke"){
   const auth=request.headers.get("Authorization")||"";
   if(!env.ADMIN_TOKEN||auth!=="Bearer "+env.ADMIN_TOKEN) return json({error:"Unauthorized"},401);
   const id=String(body.licenseId||"");
   const result=await env.DB.prepare("UPDATE licenses SET status='revoked' WHERE id=?").bind(id).run();
   return json({success:result.meta.changes>0});
  }
  return json({error:"Not found"},404);
 }
};