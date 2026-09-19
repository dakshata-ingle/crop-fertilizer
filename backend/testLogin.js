const fetch = global.fetch || require('node-fetch');

const run = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        loginType: 'admin',
      }),
    });

    const text = await response.text();
    console.log('STATUS', response.status);
    console.log(text);
  } catch (error) {
    console.error('ERROR', error);
  }
};

run();
