'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // 自动重定向到代理页面
    window.location.href = '/api/proxy';
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>
        <h1>FreeGPT Loading...</h1>
        <p>Redirecting to FreeGPT...</p>
      </div>
    </div>
  );
}