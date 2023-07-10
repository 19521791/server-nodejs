const cherio = require('cherio');
const request = require('request');

const extract_img_URL = (url) => {
  return new Promise((resolve, reject) => {
    var link_list = []
    request(url, (err, resp, html) => {
      if (!err && resp.statusCode == 200) {
        console.log("Request was success ");

        const $ = cherio.load(html);

        $("img").each((index, image) => {
          var img = $(image).attr('src');
          if (img.startsWith("http")) {
            link_list.push(img);
          } else {
            link_list.push(url + img)
          }
        });

        resolve(link_list); // trả về link_list khi request thành công
      } else {
        console.log("Request Failed ");
        reject(err); // trả về lỗi khi request thất bại
      }
    });
  });
}

module.exports = extract_img_URL;