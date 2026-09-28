const fs=require('node:fs'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
fs.mkdirSync('.private',{recursive:true});
if(!fs.existsSync('.private/admin.json')){
 const password=crypto.randomBytes(18).toString('base64url');
 const values={ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update(password).digest('hex'),SESSION_SECRET:crypto.randomBytes(48).toString('hex'),CRON_SECRET:crypto.randomBytes(32).toString('hex')};
 fs.writeFileSync('.private/admin.json',JSON.stringify({password,values}));
 fs.writeFileSync('.private/관리자-접속안내.txt',`노가정 예약 관리\nhttps://nogajeng.vercel.app/admin.html\n\n관리자 비밀번호: ${password}\n\n이 파일을 공개하거나 GitHub에 올리지 마세요. 관리자 화면을 매일 확인해 신규 예약을 처리해 주세요. 자동 문자 알림은 발송되지 않습니다.\n`);
}
const data=JSON.parse(fs.readFileSync('.private/admin.json'));
for(const [key,value]of Object.entries(data.values)){
 const r=spawnSync('C:/Users/Samsung/AppData/Roaming/npm/vercel.cmd',['env','add',key,'production','--sensitive','--yes','--scope','luo13'],{input:value,encoding:'utf8',shell:true});
 if(r.status!==0){console.error('Failed to configure',key);process.exit(1)}
 console.log('Configured',key);
}
