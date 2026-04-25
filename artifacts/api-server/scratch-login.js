fetch('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messager: 'admin', mot_pass: 'admin123' })
}).then(res => res.json()).then(console.log);
