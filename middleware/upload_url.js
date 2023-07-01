const axios = require('axios');
const fs = require('fs');

const imageUrl = 'https://www.bridgeport.edu/files/images/template/web-logo.png'; // đường dẫn của hình ảnh cần tải về

axios({
  url: imageUrl,
  responseType: 'arraybuffer'
}).then(response => {
  const imageData = Buffer.from(response.data, 'binary');
  fs.writeFileSync('image.jpg', imageData);
  console.log('Hình ảnh đã được tải về và lưu vào biến img');
}).catch(error => {
  console.log(error);
});