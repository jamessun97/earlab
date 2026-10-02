import { build } from 'esbuild';
import { rm,mkdir,cp,writeFile } from 'node:fs/promises';
await rm('dist/client',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await cp('public','dist/client',{recursive:true});
await build({entryPoints:['server/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022'});
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'earlab',main:'index.js',compatibility_date:'2026-01-01',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*']},d1_databases:[{binding:'DB',database_name:'earlab-progress',database_id:'local-earlab-progress',migrations_dir:'../../drizzle'}]},null,2));
