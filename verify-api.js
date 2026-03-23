const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Verifying API...\n');
    
    // 测试 API 根路径
    conn.exec('docker exec evolution-whatsapp-backend-1 node -e "const http=require(\"http\");http.get(\"http://evolution-api:8080\",res=>{let d=\"\";res.on(\"data\",c=>d+=c);res.on(\"end\",()=>console.log(\"API:\",res.statusCode,d.substring(0,100)));}).on(\"error\",e=>console.log(e.message));setTimeout(()=>process.exit(0),5000);"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\nCheck instances:');
            conn.exec('docker exec evolution-whatsapp-backend-1 node -e "const http=require(\"http\");const options={hostname:\"evolution-api\",port:8080,path:\"/instance/fetchInstances\",headers:{\"apikey\":\"684de76250938ef254f136318374608b\"}};http.get(options,res=>{let d=\"\";res.on(\"data\",c=>d+=c);res.on(\"end\",()=>{const arr=JSON.parse(d);console.log(\"Instances:\",arr.map(i=>i.name+\"(\"+i.connectionStatus+\")\").join(\", \"));});}).on(\"error\",e=>console.log(e.message));setTimeout(()=>process.exit(0),5000);"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n=== Ready ===');
                    console.log('URL: http://8.222.170.254:8080/manager');
                    console.log('Key: 684de76250938ef254f136318374608b');
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
