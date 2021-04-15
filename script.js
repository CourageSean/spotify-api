const { render } = require("ejs");
const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const formidable = require("formidable");
const SpotifyWebApi = require("spotify-web-api-node");

app.listen(PORT, () => {
  console.log("listening port 3000");
});
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let state = "some-state-of-my-choice";
const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];
let redirectUri = "http://127.0.0.1:3000/home";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: "http://127.0.0.1:3000/home",
});
//   spotifyApi.setAccessToken("BQCUM477H7Sd1h3tSlZcxdjxIVtq9knsQYmKcvs5MPrO5WmxKcfsWS2iP61Bb6lHsQv6MfDppeldbRe3Y4_kYACh6uE-9MImFB6ICNPzyJ1OWgZd1FBjUB-G7TzQ_60X2Tr1-mygnsjTovhSQDO42_VCz78nepqOnkmp7pKNBESg9Zs0BvxGWg")

//======== GET REQUESTS ============//
app.get("/", (req, res) => {
  // res.redirect(spotifyApi.createAuthorizeURL(scopes));

  res.redirect(authorizeURL);
});

let authorizeURL = spotifyApi.createAuthorizeURL(scopes);

app.get("/home", (req, res) => {
  console.log(req.query);
  let code = req.query.code;
  spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);

         spotifyApi.refreshAccessToken().then(
          function(data) {
            console.log('The access token has been refreshed!');

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
          },
          function(err) {
            console.log('Could not refresh access token', err);
          }
        )
        .catch(err =>{
            console.log("error getting token",err)
        })
     

 
      spotifyApi.getNewReleases({ limit : 5, offset: 0, country: 'DE' })
  .then(function(data) {
    // console.log(data.body.albums.items[0].images[2]);
     const newReleases = data.body.albums.items
    //   return data.body.albums


    res.render("pages/home",{newReleases})
    }, 
   
    
    
    function(err) {
       console.log("Something went wrong!", err);
    });
    },

    function (err) {
      console.log("Something went wrong!", err);
    }
  );

  
});

app.get("/search", (req, res) => {
  spotifyApi.searchArtists(req.query.artist).then(
    function (data) {
      const datas = data.body.artists.items;
      
console.log(datas[0].images[0])
      console.log(`Search artists by ${req.query.artist} `);
      res.render("pages/artists", { datas });
    },
    function (err) {
      console.error(err);
    }
  );
});

app.get("/:artist/:id", (req, res) => {
  const id = req.params.id;
  const artist = req.params.artist
  spotifyApi.getArtistAlbums(id).then(
    function (data) {
      const albums = data.body.items;
      // console.log('Artist albums', data.body.items);
      res.render("pages/albums", { albums,artist });
    },
    function (err) {
      console.error(err);
    }
  );
});

app.get("/artist/album/:id", (req, res) => {
  const id = req.params.id;
  spotifyApi.getAlbumTracks(id, { limit: 5, offset: 1 }).then(
    function (data) {
      // console.log(data.body);
      const tracks = data.body.items;
      res.render("pages/tracks", { tracks });
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
});

app.get("/create_playlist", (req, res) => {
  spotifyApi
    .createPlaylist("My playlist", {
      description: "My description",
      public: true,
    })
    .then(
      function (data) {
        console.log("Created playlist!");
        console.log(data)
      },
      function (err) {
        console.log("Something went wrong!", err);
      }
    );
});
