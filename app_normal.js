var cheerio = require('cheerio');
var fs = require('fs');
var http = require('http');

var options = {
  hostname: 'meizhi.im',
  headers: { 'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:34.0) Gecko/20100101 Firefox/34.0' }
};

http.get(options, function (res) {
  var html = '';
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    html += chunk;
  }).on('end', function () {
    var $ = cheerio.load(html);
    var topicUrls = $('.box > a').map(function (element) {
      return $(this).attr('href');
    }).get();

    topicUrls.map(function (element) {
      options.path = element;
      http.get(options, function (res) {
        var html = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          html += chunk;
        }).on('end', function () {
          var $ = cheerio.load(html);
          var imgUrls = $('.show-box img').map(function (element) {
            return $(this).attr('src');
          }).get();
          
          imgUrls.map(function (imgUrl) {
            http.get(imgUrl, function (res) {
              var imageData = '';
              res.setEncoding('binary');
              res.on('data', function (data) {
                imageData += data;
              }).on('end', function () {
                var imageName = res.headers['etag'];
                var imageType = res.headers['content-type'];
                var imageFullName = imageName.split('"')[1] + '.' + imageType.split('/')[1];
                fs.writeFile('images/' + imageFullName, imageData, 'binary', function (err) {
                  if (err) throw err;
                  console.log('Image ' + imageFullName +' saved!');
                });
              });
            });
          });
        });
      });
    });
  });
});
