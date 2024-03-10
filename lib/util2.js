const { Curl, CurlHttpVersion, CurlSslVersion } = require('node-libcurl');
// var log = require('./log');

const DEFAULT_HEADERS = {
  'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  // 'Accept: */*',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-User': '?1',
  'Sec-Fetch-Dest': 'document',
  // 'Accept-Encoding: gzip, deflate, br',
  // 'Accept-Encoding: gzip, deflate, br, zstd',
  // 'Accept-Encoding: gzip, deflate, br',
  // 'Accept-Language: en-AU,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-GB;q=0.6,en-US;q=0.5',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  'Origin': 'https://leetcode.com',
  'Pragma': 'no-cache',
  // 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // 'X-Newrelic-Id: UAQDVFVRGwIBVFFQDgIHXlM=',
  // 'Cookie': lc_cookie,
  // 'X-Csrftoken': 'hBsHzxPUep57J2gbXk3nJvM8LrpMYMfBBnyitrxDcf6xWQGbQEGuToQECo2CzBd8',
  'Referer': 'https://leetcode.com/',
};

const request = (opts, callback) => {
  let level = 'INFO';
  if (process.argv.indexOf('-v') >= 0) level = 'DEBUG';
  if (process.argv.indexOf('-vv') >= 0) level = 'TRACE';

  const curl = new Curl();
  const method = opts.method || 'GET';
  const url = opts.url;
  const headers = { ...DEFAULT_HEADERS, ...opts.headers };

  let arr_headers = [];
  Object.entries(headers).forEach(([key, value]) => {
    arr_headers.push(key + ": " + value.replace(/"/g, '\\"'));
  });

  curl.setOpt(Curl.option.URL, url);
  curl.setOpt(Curl.option.CUSTOMREQUEST, method);
  curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
  curl.setOpt(Curl.option.HTTPHEADER, arr_headers);
  curl.setOpt(Curl.option.VERBOSE, true);
  // curl.setOpt(Curl.option.SSL_SESSIONID_CACHE)
  curl.setOpt(Curl.option.HTTP_VERSION, CurlHttpVersion.V2_0);
  curl.setOpt(
    Curl.option.SSL_CIPHER_LIST,
    'TLS_AES_128_GCM_SHA256,TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256,ECDHE-ECDSA-AES128-GCM-SHA256,ECDHE-RSA-AES128-GCM-SHA256,ECDHE-ECDSA-AES256-GCM-SHA384,ECDHE-RSA-AES256-GCM-SHA384,ECDHE-ECDSA-CHACHA20-POLY1305,ECDHE-RSA-CHACHA20-POLY1305,ECDHE-RSA-AES128-SHA,ECDHE-RSA-AES256-SHA,AES128-GCM-SHA256,AES256-GCM-SHA384,AES128-SHA,AES256-SHA',
  );
  curl.setOpt(Curl.option.SSLVERSION, CurlSslVersion.TlsV1_2);
  curl.setOpt(Curl.option.SSL_ENABLE_NPN, 0);
  curl.setOpt(Curl.option.SSL_ENABLE_ALPN, true);

  // Set headers
  const formattedHeaders = Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
  if (formattedHeaders.length > 0) {
    curl.setOpt(Curl.option.HTTPHEADER, formattedHeaders);
  }

  // Handle POST/PUT data
  if (['POST', 'PUT', 'PATCH'].includes(method) && opts.body) {
    curl.setOpt(Curl.option.POSTFIELDS, JSON.stringify(opts.body));
  }

  // Handle query parameters if any
  if (opts.qs) {
    const queryString = Object.keys(opts.qs)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(opts.qs[key]))
      .join('&');
    curl.setOpt(Curl.option.URL, url + '?' + queryString);
  }

  curl.on('end', (statusCode, body, headers) => {
    curl.close();

    const response = {
      statusCode,
      body,
      headers,
    };

    console.log('status code', statusCode);
    console.log('response body', body);
    console.log('response headers', headers);
    // console.log(url, typeof(body), body);

    const data = typeof(body) == "string" ? JSON.parse(body) : body;
    callback && callback(null, response, data);
  });

  curl.on('error', (err) => {
    curl.close();
    callback && callback(err);
  });

  curl.perform();
}
// log.init();

module.exports = { request };