const { exec } = require('child_process')

// curl_chrome116 will add other headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com/',
};

const request = (opts, callback) => {
  let level = 'INFO';
  if (process.argv.indexOf('-v') >= 0) level = 'DEBUG';
  if (process.argv.indexOf('-vv') >= 0) level = 'TRACE';

  return new Promise((resolve, reject) => {
    const method = opts.method || 'GET';
    const url = opts.url;
    const headers = { ...DEFAULT_HEADERS, ...opts.headers };
    
    // Construct query string from queryParams object
    let queryString = '';
    if (opts.qs) {
      queryString = Object.keys(opts.qs)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(opts.qs[key]))
        .join('&');
    }
    const fullUrl = queryString ? `${url}?${queryString}` : url;
      
    // Construct curl command
    // -i to return status code and response headers!
    let curlCmd = `curl_chrome116 -i -X ${method} "${fullUrl}"`;

    // Add headers to curl command
    if (Array.isArray(headers)) {
      headers.forEach(header => {
        curlCmd += ` -H "${header.replace(/"/g, '\\"')}"`;
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        curlCmd += ` -H "${key}: ${value.replace(/"/g, '\\"')}"`;
      });
    }

    // Add data for POST requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && opts.body) {
      // if posted body is an object, we need to double stringify it!
      // for curl_chrome116 command, we need to escape $ as well!
      const data = typeof(opts.body) == 'object' 
        ? JSON.stringify(JSON.stringify(opts.body)).replace(/\$/g, '\\$')
        : JSON.stringify(opts.body).replace(/\$/g, '\\$');
      curlCmd += " -d " + data;
    }

    // console.log(curlCmd);

    // Execute the curl command
    exec(curlCmd, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        callback && callback(error);
        return;
      }
      // if (stderr) {
      //   reject(new Error(stderr));
      //   return;
      // }

      // console.log(stdout);
      // const re = new RegExp("^HTTP.*\s+(\d+)\n([\w\s:;\-,/='\.\*]*)\n(.*)$", 'gms');
      // const re = new RegExp("^HTTP.*\\s+(\\d+)\\n([\\w\\s:;\\-,/='\\.\\*]*)\\n\\n(.*)$", 'gms');
      // const re = /^HTTP.*\s+(\d+)\n([\w\s:;\-,/='\.\*]*)\n(.*)$/gms;
      const re = /^HTTP[\/\d]*\s+(\d+)[\s\r\n]+(.*)\n(.*)$/gms;
      const rr = re.exec(stdout);
      // console.log(rr.length);
      var statusCode = 200;
      var headers = [];
      var body = {};
      if (rr && rr.length == 4) {
        statusCode = Number(rr[1]);
        headers = rr[2].split(/[\r\n]+/);
        body = JSON.parse(rr[3]);
      }

      // console.log('error:', error);
      // console.log('stdout:', stdout);
      const response = {
        statusCode,
        body,
        headers,
      };

      resolve(response);
      callback && callback(null, response, body);
    });
  });
}

module.exports = { request };