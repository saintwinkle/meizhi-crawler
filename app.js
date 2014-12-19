var fs = require('fs');
var http = require('http');
var url = require('url');

var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var superagent = require('superagent');

var meizhiUrl = 'http://meizhi.im';

superagent.get(meizhiUrl)
  .end(function (err, res) {
    if (err) throw err;
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    $('.box > a').each(function (i, element) {
      var $element = $(element);
      var href = url.resolve(meizhiUrl, $element.attr('href'));
      topicUrls.push(href);
    });

    var ep = new eventproxy();
    ep.after('topic_html', topicUrls.length, function (topics) {
      var imgUrls = [];
      topics.forEach(function (topic) {
        var $ = cheerio.load(topic);
        $('.show-box img').each(function (i, element) {
          var src = $(this).attr('src');
          imgUrls.push(src);
        });
      });

      imgUrls.forEach(function (imgUrl) {
        http.get(imgUrl, function (res) {
          res.setEncoding('binary');
          var imageData = '';
          res.on('data', function (data) {
            imageData += data;
          }).on('end', function () {
            var imageName = res.headers['etag'];
            var imageType = res.headers['content-type'];
            var imageFullName = imageName.split('"')[1] + '.' + imageType.split('/')[1];
            fs.writeFile(imageFullName, imageData, 'binary', function (err) {
              if (err) throw err;
              console.log('Image ' + imageFullName +' saved!');
            });
          });
        });
      });
    });

    topicUrls.forEach(function (topicUrl) {
      superagent.get(topicUrl)
        .end(function (err, res) {
          if (err) throw err;
          console.log('Fetch ' + topicUrl + ' successful!');
          ep.emit('topic_html', res.text);
        });
    });
  });
