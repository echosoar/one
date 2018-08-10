const Axios = require('axios');

const FetchData = (url, method, data, params) => {
  return new Promise(resolve => {
    method = method.toLowerCase();
    if (method == 'get') {
      Axios.get(url).then(res => {
        resolve(res && res.data || null);
      }).catch(e => { resolve( null );});
    } else {
      resolve( null );
    }
  });
}

module.exports = FetchData;