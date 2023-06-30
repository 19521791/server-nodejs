const cherio = require('cherio');
const request = require('request');
const fs = require('fs');


var WriteStream  = fs.createWriteStream("ImagesLink.txt", "UTF-8");

var url = "https://en.wikipedia.org/wiki/Nine-dash_line"

const extract_img_URL = (url) => {
    var link_list = []
    request(url, (err, resp, html)=>{

    if(!err && resp.statusCode == 200){
        console.log("Request was success ");

        const $ = cherio.load(html);

        $("img").each((index, image)=>{

            var img = $(image).attr('src');
            var baseUrl = url;
            var Links = baseUrl + img;
            console.log(Links)
            link_list.push(Links);
              
        });

    }else{
        console.log("Request Failed ");
    }
    return link_list;
});
}

module.exports = extract_img_URL;
// extract_img_URL(url)