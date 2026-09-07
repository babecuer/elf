import{createHash as Y}from"node:crypto";import y from"node:fs";import C from"node:path";import{DatabaseSync as I}from"node:sqlite";var P=Object.freeze(["role","title","alt","placeholder","aria-label","name","type","id","context","text","row","class"]);function F(e,t=500){return String(e||"").replace(/\s+/g," ").trim().slice(0,t)}function X(e){return!e||typeof e!="object"||Array.isArray(e)||!F(e.tag,80)?!1:P.some(t=>F(e[t],t==="row"?500:240))}var O=1,H=new Set(["page-family","navigation-node","fact","procedure","rule","glossary","skill","site-map"]),K=new Set(["draft","verified","published","deprecated"]);function s(e,t=2e4){return String(e??"").normalize("NFKC").trim().slice(0,t)}function w(e){return s(e,2e4).toLowerCase().replace(/[\u0000-\u001f\u007f]/g," ").replace(/[^\p{L}\p{N}_]+/gu," ").replace(/\s+/g," ").trim()}function j(e){let t=w(e),r=new Set(t.split(" ").filter(Boolean)),o=t.replace(/\s+/g,"");for(let i=0;i<o.length-1&&r.size<48;i+=1)r.add(o.slice(i,i+2));return[...r]}function g(e,t=80){return[...new Set((Array.isArray(e)?e:[]).map(r=>s(r,300)).filter(Boolean))].slice(0,t)}function _(e){return JSON.stringify(e??null)}function R(e,t){try{let r=JSON.parse(String(e||""));return r??t}catch{return t}}function b(e,t=""){return s(e,180).toLowerCase().replace(/[^a-z0-9._:-]+/g,"-").replace(/^-+|-+$/g,"")||t}function G(e){let t=s(e,2e3);if(!t)return"";let r=new URL(t);if(r.protocol!=="https:")throw new TypeError("Wiki navigation URLs must use HTTPS");return r.toString()}function x(e){let t=s(e,2e3);if(!t)return"";let r=new URL(t);if(r.protocol!=="https:")throw new TypeError("Wiki skill page routes must use HTTPS");let o=(r.pathname||"/").replace(/\/{2,}/g,"/").replace(/\/$/,"")||"/";return`${r.origin}${o}`}function B(e){return Y("sha256").update(e).digest("hex")}function q(e){return(Array.isArray(e)?e:[]).slice(0,100).map(t=>({type:b(t?.type||t?.relation),target:b(t?.target||t?.to||t?.targetId)})).filter(t=>t.type&&t.target)}function J(e,t){if(!Array.isArray(e))return[];let r=e.slice(0,100).map(o=>{let i=o?.action;if(!i||typeof i!="object"||Array.isArray(i))return null;if(Object.hasOwn(i,"selector")||/(?:^|[^a-z])xpath(?:[^a-z]|$)/i.test(JSON.stringify(i)))throw new TypeError(`Wiki skill ${t} cannot contain private selectors or XPath`);let c=s(i.method||i.action,40).toLowerCase();if(!c)return null;if(["navigate","scrollto","nextchunk","prevchunk","nexthorizontalchunk","prevhorizontalchunk"].includes(c))c==="navigate"&&x(Array.isArray(i.arguments)?i.arguments[0]:"");else if(!X(i.semanticTarget))throw new TypeError(`Wiki skill ${t} requires model-visible semantic targets`);return JSON.parse(JSON.stringify({action:{...i,method:c}}))}).filter(Boolean);if(r.length&&r.length<2)throw new TypeError(`Wiki skill ${t} requires at least two executable steps`);if(JSON.stringify(r).length>4e4)throw new TypeError(`Wiki skill ${t} executable steps are too large`);return r}function Q(e,t,r){let o=b(e?.id,`wiki-${t+1}`),i=H.has(e?.kind)?e.kind:"fact",c=s(e?.title,300),L=s(e?.summary,2e3),d=s(e?.content,4e4);if(!d)throw new TypeError(`Wiki entry ${o} requires content`);let T=G(e?.url||e?.canonicalUrl),f=g(e?.aliases),m=g(e?.keywords),N=g([...f,...m]),a=g(e?.origins,32).map(W=>{let D=new URL(W);if(D.protocol!=="https:")throw new TypeError(`Wiki entry ${o} has an unsafe origin`);return D.origin}),l=g(e?.pageTypes,40).map(w),u=g(e?.intents,40).map(w),p=g(e?.tags,80),S=q(e?.relations),h=x(e?.pageRoute),A=g(e?.procedure,24),k=i==="skill"?J(e?.steps,o):[],n=g(e?.contextFingerprints,24),E=g(e?.failureSignatures,20),V={...e?.metadata&&typeof e.metadata=="object"&&!Array.isArray(e.metadata)?e.metadata:{},...h?{pageRoute:h}:{},...A.length?{procedure:A}:{},...s(e?.skillVersion,100)?{skillVersion:s(e.skillVersion,100)}:{},...s(e?.risk,40)?{risk:s(e.risk,40)}:{},...s(e?.authoredBy,40)?{authoredBy:s(e.authoredBy,40)}:{},...s(e?.intent||e?.intents?.[0],240)?{intent:s(e.intent||e.intents[0],240)}:{},...s(e?.origin,2e3)?{origin:x(e.origin)}:{},...s(e?.pageType,240)?{pageType:s(e.pageType,240)}:{},...s(e?.skillStatus,40)?{skillStatus:s(e.skillStatus,40)}:{},...k.length?{steps:k}:{},...f.length?{aliases:f}:{},...m.length?{keywords:m}:{},confidence:Math.max(0,Math.min(1,Number(e?.confidence)||0)),invocationCount:Math.max(0,Number(e?.invocationCount)||0),successCount:Math.max(0,Number(e?.successCount)||0),failureCount:Math.max(0,Number(e?.failureCount)||0),totalSuccessRate:Math.max(0,Math.min(1,Number(e?.totalSuccessRate)||0)),recentInvocationCount:Math.max(0,Number(e?.recentInvocationCount)||0),recentSuccessRate:Math.max(0,Math.min(1,Number(e?.recentSuccessRate)||0)),consecutiveFailures:Math.max(0,Number(e?.consecutiveFailures)||0),contextFingerprints:n,failureSignatures:E,createdAt:s(e?.createdAt,100),updatedAt:s(e?.updatedAt,100),lastSuccessAt:s(e?.lastSuccessAt,100),lastFailureAt:s(e?.lastFailureAt,100)},$=K.has(e?.status)?e.status:"published",z=[c,L,d,T,h,...A,...N,...p,...u].filter(Boolean).join(" "),M={id:o,namespace:r,kind:i,title:c,summary:L,content:d,url:T,aliases:N,origins:a,pageTypes:l,intents:u,tags:p,relations:S,metadata:V,status:$,sourceType:s(e?.sourceType||"host-static",80),sourceRef:s(e?.sourceRef,1e3),priority:Math.max(0,Math.min(100,Number(e?.priority)||50)),confidence:Math.max(0,Math.min(1,Number(e?.confidence??1))),alwaysApply:e?.alwaysApply===!0,enabled:e?.enabled!==!1,revision:Math.max(1,Math.round(Number(e?.revision)||1))};return{...M,searchText:z,contentHash:B(_(M))}}function Z(e){if(!y.existsSync(e))return null;let t;try{t=new I(e,{readOnly:!0});let r=t.prepare("SELECT key, value FROM wiki_manifest").all();return Object.fromEntries(r.map(o=>[o.key,o.value]))}catch{return null}finally{t?.close()}}function v(e,t){let r=`${t}.previous`;y.rmSync(r,{force:!0}),y.existsSync(t)&&y.renameSync(t,r);try{y.renameSync(e,t),y.rmSync(r,{force:!0})}catch(o){throw!y.existsSync(t)&&y.existsSync(r)&&y.renameSync(r,t),o}}function ee(e={}){let t=s(e.databasePath||e.path,4e3);if(!t)throw new TypeError("buildSqliteWikiBundle requires databasePath");let r=C.resolve(t),o=b(e.namespace,"default"),i=b(e.bundleId,o),c=s(e.knowledgeVersion||e.version||"1",100),L=Array.isArray(e.entries)?e.entries:[];if(!L.length)throw new TypeError("buildSqliteWikiBundle requires entries");if(L.length>2e4)throw new RangeError("A Wiki bundle may contain at most 20000 entries");let d=L.map((l,u)=>Q(l,u,o)),T=new Set;for(let l of d){if(T.has(l.id))throw new TypeError(`Duplicate Wiki entry id: ${l.id}`);T.add(l.id)}for(let l of d)for(let u of l.relations)if(!T.has(u.target))throw new TypeError(`Wiki entry ${l.id} references missing relation target: ${u.target}`);let f=B(_(d)),m=Z(r);if(m?.schemaVersion===String(O)&&m?.sourceHash===f)return{databasePath:r,bundleId:i,schemaVersion:O,knowledgeVersion:m.knowledgeVersion||c,entryCount:Number(m.entryCount||d.length),sourceHash:f,reused:!0};y.mkdirSync(C.dirname(r),{recursive:!0});let N=`${r}.new-${process.pid}`;y.rmSync(N,{force:!0});let a=new I(N);try{a.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA foreign_keys = ON;
      CREATE TABLE wiki_manifest (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE wiki_entries (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        url TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'published',
        source_type TEXT NOT NULL DEFAULT 'host-static',
        source_ref TEXT NOT NULL DEFAULT '',
        priority INTEGER NOT NULL DEFAULT 50,
        confidence REAL NOT NULL DEFAULT 1,
        always_apply INTEGER NOT NULL DEFAULT 0,
        enabled INTEGER NOT NULL DEFAULT 1,
        aliases_json TEXT NOT NULL DEFAULT '[]',
        origins_json TEXT NOT NULL DEFAULT '[]',
        page_types_json TEXT NOT NULL DEFAULT '[]',
        intents_json TEXT NOT NULL DEFAULT '[]',
        tags_json TEXT NOT NULL DEFAULT '[]',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        search_text TEXT NOT NULL DEFAULT '',
        content_hash TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX wiki_entries_scope_idx ON wiki_entries(namespace, status, enabled, priority DESC);
      CREATE TABLE wiki_aliases (
        entry_id TEXT NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT '',
        normalized TEXT NOT NULL,
        PRIMARY KEY (entry_id, normalized)
      );
      CREATE TABLE wiki_relations (
        from_entry_id TEXT NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
        relation TEXT NOT NULL,
        to_entry_id TEXT NOT NULL,
        PRIMARY KEY (from_entry_id, relation, to_entry_id)
      );
      CREATE TABLE wiki_scopes (
        entry_id TEXT NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
        scope_type TEXT NOT NULL,
        scope_value TEXT NOT NULL,
        PRIMARY KEY (entry_id, scope_type, scope_value)
      );
      CREATE TABLE wiki_chunks (
        id TEXT PRIMARY KEY,
        entry_id TEXT NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        content_hash TEXT NOT NULL,
        UNIQUE (entry_id, chunk_index)
      );
      CREATE TABLE wiki_embeddings (
        chunk_id TEXT NOT NULL REFERENCES wiki_chunks(id) ON DELETE CASCADE,
        model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        vector_blob BLOB NOT NULL,
        PRIMARY KEY (chunk_id, model)
      );
      CREATE VIRTUAL TABLE wiki_fts USING fts5(
        entry_id UNINDEXED,
        content,
        tokenize='unicode61 remove_diacritics 2'
      );
    `);let l=a.prepare("INSERT INTO wiki_manifest(key, value) VALUES (?, ?)"),u=a.prepare(`INSERT INTO wiki_entries(
      id, namespace, kind, title, summary, content, url, status, source_type, source_ref,
      priority, confidence, always_apply, enabled, aliases_json, origins_json, page_types_json,
      intents_json, tags_json, metadata_json, search_text, content_hash, revision
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),p=a.prepare("INSERT INTO wiki_aliases(entry_id, alias, language, normalized) VALUES (?, ?, ?, ?)"),S=a.prepare("INSERT INTO wiki_relations(from_entry_id, relation, to_entry_id) VALUES (?, ?, ?)"),h=a.prepare("INSERT INTO wiki_scopes(entry_id, scope_type, scope_value) VALUES (?, ?, ?)"),A=a.prepare("INSERT INTO wiki_fts(entry_id, content) VALUES (?, ?)"),k=new Date().toISOString();a.exec("BEGIN IMMEDIATE");try{for(let[n,E]of Object.entries({bundleId:i,schemaVersion:String(O),knowledgeVersion:c,entryCount:String(d.length),sourceHash:f,generatedAt:k}))l.run(n,E);for(let n of d){u.run(n.id,n.namespace,n.kind,n.title,n.summary,n.content,n.url,n.status,n.sourceType,n.sourceRef,n.priority,n.confidence,n.alwaysApply?1:0,n.enabled?1:0,_(n.aliases),_(n.origins),_(n.pageTypes),_(n.intents),_(n.tags),_(n.metadata),n.searchText,n.contentHash,n.revision);for(let E of n.aliases)p.run(n.id,E,"",w(E));for(let E of n.origins)h.run(n.id,"origin",E);for(let E of n.pageTypes)h.run(n.id,"page-type",E);for(let E of n.intents)h.run(n.id,"intent",E);A.run(n.id,n.searchText)}for(let n of d)for(let E of n.relations)S.run(n.id,E.type,E.target);a.exec("COMMIT")}catch(n){throw a.exec("ROLLBACK"),n}}finally{a.close()}return v(N,r),{databasePath:r,bundleId:i,schemaVersion:O,knowledgeVersion:c,entryCount:d.length,sourceHash:f,reused:!1}}function U(e){let t=R(e.metadata_json,{});return{id:e.id,kind:e.kind==="page-family"||e.kind==="navigation-node"?"site-map":e.kind,title:e.title,summary:e.summary,content:e.content,...e.url?{url:e.url}:{},...t.pageRoute?{pageRoute:t.pageRoute}:{},...Array.isArray(t.procedure)?{procedure:t.procedure}:{},...t.skillVersion?{skillVersion:t.skillVersion}:{},...t.risk?{risk:t.risk}:{},...t.authoredBy?{authoredBy:t.authoredBy}:{},...t.intent?{intent:t.intent}:{},...t.origin?{origin:t.origin}:{},...t.pageType?{pageType:t.pageType}:{},...t.skillStatus?{skillStatus:t.skillStatus}:{},...Array.isArray(t.steps)?{steps:t.steps}:{},confidence:Number(t.confidence||0),invocationCount:Number(t.invocationCount||0),successCount:Number(t.successCount||0),failureCount:Number(t.failureCount||0),totalSuccessRate:Number(t.totalSuccessRate||0),recentInvocationCount:Number(t.recentInvocationCount||0),recentSuccessRate:Number(t.recentSuccessRate||0),consecutiveFailures:Number(t.consecutiveFailures||0),contextFingerprints:Array.isArray(t.contextFingerprints)?t.contextFingerprints:[],failureSignatures:Array.isArray(t.failureSignatures)?t.failureSignatures:[],createdAt:t.createdAt||"",updatedAt:t.updatedAt||"",lastSuccessAt:t.lastSuccessAt||"",lastFailureAt:t.lastFailureAt||"",origins:R(e.origins_json,[]),pageTypes:R(e.page_types_json,[]),intents:R(e.intents_json,[]),tags:R(e.tags_json,[]),aliases:Array.isArray(t.aliases)?t.aliases:[],keywords:Array.isArray(t.keywords)?t.keywords:R(e.aliases_json,[]),priority:Number(e.priority||0),alwaysApply:e.always_apply===1,enabled:e.enabled===1&&e.status!=="deprecated",wiki:{status:e.status,sourceType:e.source_type,sourceRef:e.source_ref,confidence:Number(e.confidence||0),metadata:t,contentHash:e.content_hash,revision:Number(e.revision||1)}}}function te(e,t={},r={}){if(!e.enabled)return!1;let o=s(t.origin,500),i=w(t.pageType),c=w(r.intent);return!(e.origins.length&&!e.origins.includes(o)||e.pageTypes.length&&!e.pageTypes.includes(i)||e.intents.length&&c&&!e.intents.includes(c))}function ne(e={}){let t=s(e.databasePath||e.path,4e3);if(!t)throw new TypeError("openSqliteWikiBundle requires databasePath");let r=C.resolve(t),o=new I(r,{readOnly:!0}),i=Object.fromEntries(o.prepare("SELECT key, value FROM wiki_manifest").all().map(T=>[T.key,T.value]));if(Number(i.schemaVersion)!==O)throw o.close(),new Error(`Unsupported Wiki schema version: ${i.schemaVersion||"unknown"}`);let c=o.prepare(`SELECT * FROM wiki_entries
    WHERE enabled = 1 AND status != 'deprecated' AND always_apply = 1
    ORDER BY priority DESC LIMIT 40`),L=o.prepare(`SELECT * FROM wiki_entries
    WHERE enabled = 1 AND status != 'deprecated'
    ORDER BY priority DESC LIMIT 500`),d=({query:T="",includeDisabled:f=!1,offset:m=0,limit:N=30}={})=>{let a=Math.max(0,Math.min(1e7,Math.trunc(Number(m)||0))),l=Math.max(1,Math.min(50,Math.trunc(Number(N)||30))),u=j(T).slice(0,12),p=[],S=[];f||p.push("enabled = 1","status != 'deprecated'"),u.length&&(p.push(`(${u.map(()=>"search_text LIKE ?").join(" OR ")})`),S.push(...u.map(n=>`%${n}%`)));let h=p.length?`WHERE ${p.join(" AND ")}`:"",A=Number(o.prepare(`SELECT COUNT(*) AS total FROM wiki_entries ${h}`).get(...S)?.total||0),k=o.prepare(`SELECT * FROM wiki_entries ${h}
      ORDER BY priority DESC, id ASC LIMIT ? OFFSET ?`).all(...S,l,a);return{items:k.map(U),total:A,offset:a,limit:l,hasMore:a+k.length<A}};return{manifest:{bundleId:i.bundleId,schemaVersion:Number(i.schemaVersion),knowledgeVersion:i.knowledgeVersion,entryCount:Number(i.entryCount),sourceHash:i.sourceHash,generatedAt:i.generatedAt},search({query:T="",context:f={},task:m={},limit:N=5}={}){let a=j(T).slice(0,16),l=a.length?o.prepare(`SELECT * FROM wiki_entries
            WHERE enabled = 1 AND status != 'deprecated'
              AND (always_apply = 1 OR ${a.map(()=>"search_text LIKE ?").join(" OR ")})
            ORDER BY always_apply DESC, priority DESC
            LIMIT 250`).all(...a.map(p=>`%${p}%`)):c.all(),u=new Map;for(let p of[...l,...c.all()])u.set(p.id,p);return[...u.values()].map(U).filter(p=>te(p,f,m)).slice(0,Math.max(20,Math.min(250,Number(N||5)*20)))},list({includeDisabled:T=!1,limit:f=500}={}){return(T?o.prepare("SELECT * FROM wiki_entries ORDER BY priority DESC LIMIT ?").all(Math.max(1,Math.min(2e4,Number(f)||500))):L.all()).map(U)},browse:d,close(){o.close()}}}function le(e={}){let t=ee(e);return{...ne({databasePath:t.databasePath}),manifest:t}}export{O as SQLITE_WIKI_SCHEMA_VERSION,ee as buildSqliteWikiBundle,le as createSqliteWikiBundle,ne as openSqliteWikiBundle};
