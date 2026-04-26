async function test() {
  try {
    const res = await fetch('http://localhost:3002/api/healthz');
    console.log('Healthz Status:', res.status);
    console.log('Healthz Data:', await res.json());
    
    const resP = await fetch('http://localhost:3002/api/projets');
    console.log('Projets Status:', resP.status);
    console.log('Projets Data:', await resP.json());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
