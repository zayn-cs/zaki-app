import http from 'http';

const data = JSON.stringify({ messager: 'admin', mot_pass: 'admin123' });

const req = http.request('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let cookie = res.headers['set-cookie']?.[0];
  console.log('Login status:', res.statusCode);
  if (!cookie) {
    console.log('No cookie received');
    return;
  }
  
  const req2 = http.request('http://localhost:3002/api/projets', {
    method: 'GET',
    headers: { 'Cookie': cookie }
  }, (res2) => {
    let body = '';
    res2.on('data', chunk => body += chunk);
    res2.on('end', () => {
      console.log('Projets status:', res2.statusCode);
      if (res2.statusCode !== 200) {
        console.log('Error Body:', body);
      } else {
        const projets = JSON.parse(body);
        console.log(`Loaded ${projets.length} projets`);
      }
    });
  });
  req2.end();
});

req.write(data);
req.end();
