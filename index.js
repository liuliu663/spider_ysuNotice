const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const moment = require('moment');

const errRseult = [];

const spiderNotice = ($, i) => {
  const length = $('li', '#main_mid_content').length;
  if (i < length) {
    const title = $('a', '#main_mid_content').eq(i).attr('title')
      .trim()
      .replace(/\//g, '-').replace(/\\/g, '-')
      .replace(/</g, '《')
      .replace(/>/g, '》')
      .replace(/:/g, '：')
      .replace(/"/g, '“')
      .replace(/\*/g, '&')
      .replace(/\?/g, '？');
    let href = $('a', '#main_mid_content').eq(i).attr('href').trim();
    const patt = new RegExp('http://');
    if (!patt.test(href)) {
      href = `http://noticeold.ysu.edu.cn${href}`;
    }
    const time = $('span', '#main_mid_content').eq(i).text().trim();
    const year = moment(time, 'YYYY-MM-DD').format('YYYY');
    const month = moment(time, 'YYYY-MM-DD').format('MM');
    const day = moment(time, 'YYYY-MM-DD').format('DD');
    try {
      fs.mkdirSync('result');
    } catch (e) {}
    try {
      fs.mkdirSync(`result/${year}`);
    } catch (e) {}
    try {
      fs.mkdirSync(`result/${year}/${month}`);
    } catch (e) {}
    try {
      fs.mkdirSync(`result/${year}/${month}/${day}`);
    } catch (e) {}

    return new Promise((resolve, reject) => {
        setTimeout(resolve, 1);
      })
      .then(() => new Promise((resolve, reject) => {
        request(href, {
          timeout: 3000,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      }))
      .then((data) => {
        fs.writeFileSync(`result/${year}/${month}/${day}/${title}.html`, data);
        // console.log(`${i + 1}/${length}`);
        return spiderNotice($, i + 1);
      })
      .catch((error) => {
        if (error.code !== 'ETIMEDOUT' && error.code !== 'ESOCKETTIMEDOUT') {
          console.log(error);
        }
        const patto = new RegExp('info');
        if (!patto.test(href)) {
          fs.writeFileSync(`result/${year}/${month}/${day}/${title}.html`, '');
          // console.log(`${i + 1}/${length}`);
          errRseult.push(`result/${year}/${month}/${day}/${title}.html`);
          return spiderNotice($, i + 1);
        }
        return spiderNotice($, i);
      });
  }
};

const spiderList = (p) => {
  if (p === 359) {
    fs.writeFileSync('errRseult.txt', errRseult);
    console.log('完成！');
  } else {
    new Promise((resolve, reject) => {
        request(`http://noticeold.ysu.edu.cn/index.jsp?a50767t=358&a50767p=${p}&a50767c=20`, {
          timeout: 3000,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(cheerio.load(body));
          }
        });
      })
      .then($ => spiderNotice($, 0))
      .then(() => {
        console.log(`${p}/358`);
        spiderList(p + 1);
      })
      .catch((error) => {
        if (error.code !== 'ETIMEDOUT' && error.code !== 'ESOCKETTIMEDOUT') {
          console.log(error);
        }
        spiderList(p);
      });
  }
};
spiderList(1);