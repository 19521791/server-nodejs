class Stack{

    constructor(){
        this.data = []
    }

    Add(elem){
        this.data.push(elem);
    }

    Size(){
        if (this.data.length == 0){return 0;}else{
            return this.data.length;
        }
    }

    Pop(){
        if (this.data.length == 0){
            return -1;
        }else{
            return this.data.pop()
        }
    }

    isEmpty(){
        if(this.data.length == 0){
            return true;}
    else{
        return false;}
    }

    getStack(){
        return this.data;
    }
};

class ImageHunter{

    constructor(WebsiteUrl){
        this.URL = WebsiteUrl;              
        this._Counter = 0;                  
        this.stack = new Stack();  
        const urlObject = new URL(WebsiteUrl);
        const baseUrl = urlObject.origin;
        this.BaseUrl =  baseUrl;            
    
        this.options = {
            'method': 'GET',
            'url': `${this.URL}`,
            'headers': {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36'}
          };
    }

    ProcessHTML(html) {
        const cherio = require('cherio');
        const $ = cherio.load(html);
      
        $("img").each((index, image) => {
          this._Counter = this._Counter + 1;
          var fileName = "Image" + this._Counter.toString() + '.jpg';
        
          var img = $(image).attr('data-src') || $(image).attr('src') || $(image).attr('data-lazy-src');
          
          var baseUrl = this.BaseUrl;
          
          let links;
        
          if (img.startsWith("//")) {
            links = "https:" + img;
          } else if (img.startsWith("/")) {
            links = baseUrl + img;
          } else {
            links = img;
          }
        
          const isMatch = /\.(jpg|jpeg|png)$/i.test(links) || /\.(jpg|jpeg|png)/i.test(links);
            if ( isMatch ) {
                this.stack.Add(links);
            }
        });
      }
      
    Load() {
    const request = require('request');
    const lists = [];

    return new Promise((resolve, reject) => {
      request(this.options, async (err, resp, html) => {
        if (!err && resp.statusCode == 200) {
          console.log(`Request was Success ${resp.statusCode}`);
          this.ProcessHTML(html);
        } else {
          console.log("Error");
        }

        resp.on('close', () => {
          console.log("Finished Crawling................");
          while (!this.stack.isEmpty()) {
            lists.push(this.stack.Pop());
          }
          resolve(lists);
        });
      });
    });
  }
};

module.exports = ImageHunter;




