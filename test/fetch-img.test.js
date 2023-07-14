const https = require('https');
const fs = require('fs');

const imageUrl = 'https://congan.kontum.gov.vn/upload/105000/20220603/c-users-admin-desktop-untitled-png19f2.jpg';
const imageName = 'image.jpg'; // Optional: Provide a filename for saving the image

https.get(imageUrl, response => {
  if (response.statusCode === 200) {
    const fileStream = fs.createWriteStream(imageName); // Optional: Create a writable stream to save the image

    response.pipe(fileStream); // Optional: Pipe the image data to the file stream for saving

    console.log('Image downloaded successfully.');
  } else {
    console.log('Failed to download the image.');
  }
});
