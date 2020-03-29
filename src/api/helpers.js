import axios from 'axios'
const urlMap = {
  development: '/',
  production: '120.77.25.155/eleme/'
}
const baseUrl = urlMap[process.env.NODE_ENV]
const ERR_OK = 0

export function get (url) {
  return function (params) {
    return axios.get(baseUrl + url, {
      params
    }).then(res => {
      let { errno, data } = res.data
      if (errno === ERR_OK) {
        return data
      }
    }).catch(e => {})
  }
}
