var clientId = 'YOUR_CLIENT_ID';
var clientSecret = 'YOUR_CLIENT_SECRET';


var google = require('googleapis');
var readline = require('readline');
var createAPIRequest = require('googleapis/lib/apirequest');

var xml2js = require('xml2js');
var request = require('request');

var _ = require('underscore');


var token = null;


function updateMetaData(albumId, photo) {
  // Note: it seems we need to set user ("default" seems to give an error saying that multiple albums found)
  var url = 'https://picasaweb.google.com/data/entry/api/user/default/albumid/' + albumId + '/photoid/' + photo.id;

  console.log(url);

  var eTag = 'Wip7ImA9'; //todo
  var timestamp = '1450731083000'; // todo

  // Content-type: application/atom+xml
  var xml = "<?xml version='1.0' encoding='UTF-8'?>" +
  "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005' xmlns:app='http://www.w3.org/2007/app' xmlns:gphoto='http://schemas.google.com/photos/2007' xmlns:exif='http://schemas.google.com/photos/exif/2007' xmlns:media='http://search.yahoo.com/mrss/' gd:etag='&quot;" + eTag + ".&quot;'>" +
  "<gphoto:timestamp>" + timestamp + "</gphoto:timestamp>" +
  "<gphoto:albumid>" + albumId + "</gphoto:albumid>" +
  "<gphoto:id>" + photo.id + "</gphoto:id>" +
  "</entry>";

  console.log(xml);
}

function getMetadata(albumId) {
  request({
    url: 'https://picasaweb.google.com/data/feed/api/user/default/albumid/' + albumId,
    headers: {
      'Gdata-version': '2',
      'Authorization': token.token_type + ' ' + token.access_token
    }
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      xml2js.parseString(body, function (err, result) {
        if (err) return console.log(err);

        var videoEntries = _.filter(result.feed.entry, function(it) {
          return it['gphoto:originalvideo'] && it['gphoto:originalvideo'].length === 1;
        });

        var videosMapped = _.map(videoEntries, function(it) {
          return {
            id: it['gphoto:id'][0],
            size: it['gphoto:size'][0],
            filename: it['title'][0]
          };
        });

        //console.log(JSON.stringify(result, null, 4));

        //todo
        var test = _.find(videosMapped, function(it) { return it.filename == '20140420_211053.mp4' });
        if (test) updateMetaData(albumId, test);
      });
    }
    else {
      if (error) console.log(error);
      else console.log(response.statusCode);
    }
  });
}

function getAlbums() {
  request({
    url: 'https://picasaweb.google.com/data/feed/api/user/default',
    headers: {
      'Gdata-version': '2',
      'Authorization': token.token_type + ' ' + token.access_token
    }
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      xml2js.parseString(body, function (err, result) {
        if (err) return console.log(err);

        console.log(JSON.stringify(result, null, 4));

        var album = _.find(result.feed.entry, function(it) {
          return it.title[0] === 'Auto Backup' && it['gphoto:name'][0] === 'InstantUpload';
        });

        if (album == null) {
          throw new Error('Unable to find album');
        }

        var albumId = album['gphoto:id'][0];
        getMetadata(albumId);
      });
    }
    else {
      if (error) console.log(error);
      else console.log(response.statusCode);
    }
  });
}

require('google-cli-auth')({
  name: 'google-photos-timestamp-fix' // will be used to store the token under ~/.config/my-app/token.json
  , client_id: clientId // enter client id from the developer console
  , client_secret: clientSecret // enter client secret from the developer console
  , scope: ['https://picasaweb.google.com/data/'] // add scopes
}, function (error, newToken) {
  token = newToken;
  console.log(token);
  getAlbums(token);

  /*token.access_token // your token
  token.token_type // token type
  token.expires_at // timestamp when this token will be expired
  token.refresh(callback) // Refreshes the token
  */
})
