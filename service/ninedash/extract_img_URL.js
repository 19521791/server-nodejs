
// Web Scrapping using Node js and Cherio Request
// npm install cherio
// npm install request

// Imports 
const cherio = require('cherio');
const request = require('request');
const fs = require('fs');

// Create a Write Stream 
var WriteStream  = fs.createWriteStream("ImagesLink.txt", "UTF-8");

var url = "https://www.bridgeport.edu/"

const extrac_img_URL = (url) => {
    var link_list = []
    request('https://www.bridgeport.edu/', (err, resp, html)=>{

    if(!err && resp.statusCode == 200){
        console.log("Request was success ");
        
        // Define Cherio or $ Object 
        const $ = cherio.load(html);

        $("img").each((index, image)=>{

            var img = $(image).attr('src');
            var baseUrl = 'https://www.bridgeport.edu';
            var Links = baseUrl + img;
            console.log(Links)
            // WriteStream.write(Links);
            // WriteStream.write("\n");
            link_list.push(Links)
        });

    }else{
        console.log("Request Failed ");
    }
    return link_list;
});
}


extrac_img_URL(url)