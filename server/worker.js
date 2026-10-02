import '../public/sync-core.js';
const core=globalThis.EarSyncCore;
const SITE_ORIGIN='https://earlab-daily-listening.dkoeo.chatgpt.site';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
function identity(request){const id=request.headers.get('oai-authenticated-user-id');if(!id)return null;return {id,email:request.headers.get('oai-authenticated-user-email')||''}}
function db(env){if(!env.DB)throw new Error('Missing progress database');return env.DB}
async function current(env,userId){const row=await db(env).prepare('SELECT state, revision FROM listening_progress WHERE user_id = ?').bind(userId).first();return {revision:row?.revision||0,journal:row?JSON.parse(row.state):core.empty()}}
export default {
 async fetch(request,env){const url=new URL(request.url);
  if(url.pathname==='/api/sync'){
   const user=identity(request);if(!user)return json({error:'sign_in_required'},401);
   try{
    if(request.method==='GET')return json({user,...await current(env,user.id)});
    if(request.method!=='POST')return json({error:'method_not_allowed'},405);
    const origin=request.headers.get('Origin');if(origin!==SITE_ORIGIN&&origin!==url.origin)return json({error:'invalid_origin'},403);
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'invalid_content_type'},415);
    const text=await request.text();if(text.length>2*1024*1024)return json({error:'payload_too_large'},413);
    let payload;try{payload=JSON.parse(text)}catch{return json({error:'invalid_json'},400)}
    if(!Number.isSafeInteger(payload.revision)||payload.revision<0||!core.validate(payload.journal))return json({error:'invalid_progress'},400);
    // Compare-and-swap prevents simultaneous devices from overwriting each other.
    const serialized=JSON.stringify(payload.journal),now=Date.now();let saved;
    if(payload.revision===0){saved=await db(env).prepare('INSERT OR IGNORE INTO listening_progress (user_id, state, revision, updated_at) VALUES (?, ?, 1, ?) RETURNING revision').bind(user.id,serialized,now).first()}
    else{saved=await db(env).prepare('UPDATE listening_progress SET state = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ? RETURNING revision').bind(serialized,now,user.id,payload.revision).first()}
    if(!saved)return json({user,...await current(env,user.id),error:'revision_conflict'},409);
    return json({user,revision:saved.revision,journal:payload.journal,savedAt:now});
   }catch(error){console.error('Progress persistence unavailable:',error.message);return json({error:'storage_unavailable'},503)}
  }
  if(url.pathname.startsWith('/api/'))return json({error:'not_found'},404);
  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');
  if(url.pathname==='/'||url.pathname==='/index.html'||url.pathname.endsWith('.js')||url.pathname.endsWith('.css'))headers.set('Cache-Control','no-cache');
  return new Response(response.body,{status:response.status,headers});
 }
};
