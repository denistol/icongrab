/*
  Grab svg icon packs from www.flaticon.com
*/

const fs = require('fs');
const https = require('https');
const path = require('path');
const { argv } = require('process');

const isURL = (str) => {
    let urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    let url = new RegExp(urlRegex, 'i');
    if(str.length < 2083 && url.test(str) && str.includes('flaticon.com'))
    return str.trim();
}

const fetchPagesCount = (url) => new Promise((resolve, reject) => {
    const re = new RegExp(/<span id="pagination-total" class="mg-left-lv1">\s?([\d\.\s]+)<\/span>/)
    
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          if(data) {
            const res = data.match(re)
            if(res && res.length) {
                const num = Math.ceil(Number(res[1].trim()))
                resolve(num)
            }
            resolve(1)
          }
          else {
              resolve(1)
          }
        });
      }).on("error", () => {
        resolve(1)
      });
  })
const fetchSvg = (url) => new Promise((resolve, reject) => {
  https.get(url, (resp) => {
      const fname = url.split('/').pop()
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        if(data) {
          resolve({ fname, data })
        }
        else {
            reject('Empty array')
        }
      });
    }).on("error", () => {
      reject('Fetch error')
    });
})
const fetchPage = (url) => new Promise((resolve, reject) => {
    const re = new RegExp(/data-icon_src="(https:\/\/[A-z\.\/0-9_]+)/g)
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          const result = [...String(data).matchAll(re)]
          if(result && result.length) {
              const arr = result.map(el => el[1])
              resolve(arr)
          }
          else {
              reject('Empty array')
          }
        });
      }).on("error", () => {
        reject('Fetch error')
      });
})
const saveSvg = (dirName, {fname, data}) => {
  const out = path.join(__dirname, dirName)
  if(!fs.existsSync(out)) {
    fs.mkdirSync(out)
  }
  fs.writeFileSync(path.join(out, fname), data)
}

const main = async (link) => {
  const pages = await fetchPagesCount(link)

  for (let index = 1; index <= pages; index++) {
    const urls = await fetchPage(`${link}/${index}`)
    const images = await Promise.all(urls.map(u => fetchSvg(u)))
    images.forEach(file => {
        saveSvg(link.replace(/[/\.?:=]/g,'_'), file)
    })
  }
}

const validUrl = argv.find(el => isURL(el))
if(!validUrl) {
    console.log('Invalid url')
} else {
    console.log('Fetching...')
    main(validUrl)
}

