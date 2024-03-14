const { request } = require('./util2')

request.get = (opts, callback) => request({...opts, ...{method: 'GET'}}, callback);
request.post = (opts, callback) => request({...opts, ...{method: 'POST'}}, callback);
request.patch = (opts, callback) => request({...opts, ...{method: 'PATCH'}}, callback);
request.delete = (opts, callback) => request({...opts, ...{method: 'DELETE'}}, callback);

module.exports = { request };