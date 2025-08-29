import { NextResponse } from 'next/server';

const CHATGPT_URL = 'https://chatgpt.com';
const OPENAI_API_URL = 'https://api.openai.com';
const CDN_URLS = [
  'https://cdn.oaistatic.com',
  'https://cdn.openai.com',
];

export async function handler(request, { params }) {
  try {
    const path = params.path ? params.path.join('/') : '';
    const url = new URL(request.url);
    
    // 判断请求目标
    let targetUrl = `${CHATGPT_URL}/${path}${url.search}`;
    
    // 处理不同的域名请求
    if (path.startsWith('cdn.oaistatic.com')) {
      targetUrl = `https://cdn.oaistatic.com/${path.replace('cdn.oaistatic.com/', '')}${url.search}`;
    } else if (path.startsWith('api')) {
      targetUrl = `${OPENAI_API_URL}/${path}${url.search}`;
    }

    // 创建新的headers
    const headers = new Headers();
    
    // 复制原始请求的headers
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'connection', 'cf-', 'x-forwarded-'].some(prefix => key.toLowerCase().startsWith(prefix))) {
        headers.set(key, value);
      }
    }

    // 设置必要的headers
    const targetHost = new URL(targetUrl).host;
    headers.set('host', targetHost);
    headers.set('origin', `https://${targetHost}`);
    headers.set('referer', `https://${targetHost}/`);

    // 获取请求体
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    // 发送请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: 'manual',
    });

    // 处理响应
    const responseHeaders = new Headers();
    
    // 复制响应headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    // 设置CORS headers
    responseHeaders.set('access-control-allow-origin', '*');
    responseHeaders.set('access-control-allow-methods', '*');
    responseHeaders.set('access-control-allow-headers', '*');
    responseHeaders.set('access-control-expose-headers', '*');

    // 处理响应体
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      let html = await response.text();
      
      // 替换所有的域名引用
      html = html.replace(/https:\/\/chatgpt\.com/g, '');
      html = html.replace(/https:\/\/cdn\.oaistatic\.com/g, '/cdn.oaistatic.com');
      html = html.replace(/https:\/\/api\.openai\.com/g, '/api');
      
      // 注入自定义脚本来处理JavaScript中的域名
      const customScript = `
        <script>
          (function() {
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
              if (typeof url === 'string') {
                if (url.startsWith('https://chatgpt.com')) {
                  url = url.replace('https://chatgpt.com', '');
                } else if (url.startsWith('https://cdn.oaistatic.com')) {
                  url = url.replace('https://cdn.oaistatic.com', '/cdn.oaistatic.com');
                } else if (url.startsWith('https://api.openai.com')) {
                  url = url.replace('https://api.openai.com', '/api');
                }
              }
              return originalFetch(url, options);
            };

            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              if (typeof url === 'string') {
                if (url.startsWith('https://chatgpt.com')) {
                  url = url.replace('https://chatgpt.com', '');
                } else if (url.startsWith('https://cdn.oaistatic.com')) {
                  url = url.replace('https://cdn.oaistatic.com', '/cdn.oaistatic.com');
                } else if (url.startsWith('https://api.openai.com')) {
                  url = url.replace('https://api.openai.com', '/api');
                }
              }
              return originalXHROpen.apply(this, [method, url, ...Array.from(arguments).slice(2)]);
            };
          })();
        </script>
      `;
      
      // 在</head>标签前插入脚本
      html = html.replace('</head>', customScript + '</head>');
      
      return new NextResponse(html, {
        status: response.status,
        headers: responseHeaders,
      });
    } else if (contentType && contentType.includes('application/json')) {
      let json = await response.text();
      
      // 替换JSON中的域名
      json = json.replace(/https:\/\/chatgpt\.com/g, '');
      json = json.replace(/https:\/\/cdn\.oaistatic\.com/g, '/cdn.oaistatic.com');
      
      return new NextResponse(json, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // 对于其他类型的内容，直接返回
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, context) {
  return handler(request, context);
}

export async function POST(request, context) {
  return handler(request, context);
}

export async function PUT(request, context) {
  return handler(request, context);
}

export async function DELETE(request, context) {
  return handler(request, context);
}

export async function PATCH(request, context) {
  return handler(request, context);
}

export async function HEAD(request, context) {
  return handler(request, context);
}

export async function OPTIONS(request, context) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
