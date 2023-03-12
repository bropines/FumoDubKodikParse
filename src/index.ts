const express = require("express");
const app = express();
import url from "url";
import qs from "querystring";
import axios from "axios";
import chalk from 'chalk';
import rateLimit from 'express-rate-limit'

// Rate-Limit
const seclimiter = rateLimit({
	windowMs: 1000,
	message: {"ok": false, "error": "Too many requests. Bruh. Be slow."},
	max: 5,
	legacyHeaders: true,
})

const minlimiter = rateLimit({
	max: 60,
	message: {"ok": false, "error": "Too many requests. Bruh. Be slow."},
	legacyHeaders: true,
})



var opp_tokenlist = ['aniu_gksuHHUhsmmi', 'shirixdev_guyFIKUYIgjN']






app.use(seclimiter)
app.use(minlimiter)


// Rate-limit for opp

// soon




const port = 80;


var mongo_url = "mongodb://mongo:zcsmH1NkwcOvb31fdgGG@containers-us-west-45.railway.app:7988/opp"


const islink =
  /^(?:https?:)?\/\/aniqit\.com\/([a-zA-Z]+)\/(\d+)\/([a-zA-Z0-9]+)\/(\d+)p$/;


const ArrayAsObject = (example: { [x: string | symbol | number]: number }) => {
  return function (enterArray: any[]) {
    const obj = {};
    for (const [key, value] of Object.entries(example)) {
      obj[key] = enterArray[value];
    }
    return obj;
  };
};



// Technical parse
app.get("/v1/parse", async (req, res) => {
  let query = req.query;
  if (typeof query.link !== "string") {
      
      return res.status(400).send({
          ok: false,
          error: "link not a string",
          error_ru: "Параметр link не типа String"
        })
      
    }
    const link = query.link as string;
    if (!islink.test(link)) {
      
      return res.status(400).send({
          ok: false,
          error: "link is not a aniqit.com link",
          error_ru: "Передана ссылка не на плеер Кодик"
        })
      
    }

    const [, type, id, hash, quality] = islink.exec(link);

    const params = {
      type,
      id,
      hash,
      quality,
    };

    if ("extended" in query) {
      const page = await axios.get(
        `${!link.startsWith("http") ? "https:" : ""}${link}`
      );

      const matched = page.data.match(
        /iframe\.src = "\/\/aniqit.com\/go\/([a-zA-Z]+)\/(\d+)\/([a-zA-Z0-9]+)\/(\d+)p\?d=([a-zA-Z0-9\.]+)&d_sign=([a-z0-9]+)&pd=([a-zA-Z0-9\.]+)&pd_sign=([a-z0-9]+)&ref=&ref_sign=([a-z0-9]+).+";/
      );

      Object.assign(
        params,
        ArrayAsObject({
          type: 1,
          id: 2,
          hash: 3,
          quality: 4,
          d: 5,
          d_sign: 6,
          pd: 7,
          pd_sign: 8,
          ref_sign: 9,
        })(matched),
        { ref: "" }
      );
    }

    res.status(200).send(
      JSON.stringify({
        ok: true,
        parsed: params,
      })
    );
  
})

// getVideo
app.get("/v1/getVideo", async (req, res) => {
  let query = req.query;
      
      
  const { data: releaseParsedResponse } = await axios.get("https://shirix-backend.vercel.app/v1/parse", {
      params: {
        extended: true,
        link: query.link,
      },
      validateStatus: (_) => true,
    });

    if (!releaseParsedResponse.ok)
      return res.status(400).send(releaseParsedResponse);

      const paramstoo = {

        info: "{}",
        ban_user: false,
        ...releaseParsedResponse.parsed,
      };
      delete paramstoo.quality;

    try {
      const postresponse = await axios.post("https://aniqit.com/gvi", null, {
        params: paramstoo
      });
      
      for (const key of Object.keys(postresponse.data.links)) {
        postresponse.data.links[key].map(video => (video.src = Buffer.from(video.src.split("").reverse().join(""), "base64").toString("utf-8")))
      }
      const unclear_360 = postresponse.data.links['360'][0]['src']
      const unclear_480 = postresponse.data.links['480'][0]['src']
      const unclear_720 = postresponse.data.links['720'][0]['src']

      
      if (unclear_360.startsWith('//')) {
              var clear_360 = "https:" + unclear_360.split(':')[0] + ":" + unclear_360.split(':')[1] 
      } else if (unclear_360.startsWith('https://')) {
              var clear_360 = unclear_360.split(':')[0] + ":" + unclear_360.split(':')[1] + ":" + unclear_360.split(':')[2]
      }

      if (unclear_480.startsWith('//')) {
              var clear_480 = "https:" + unclear_480.split(':')[0] + ":" + unclear_480.split(':')[1] 
      } else if (unclear_480.startsWith('https://')) {
              var clear_480 = unclear_480.split(':')[0] + ":" + unclear_480.split(':')[1] + ":" + unclear_480.split(':')[2]
      }

      var clear_720 = clear_480.replace('480.mp4', "") + "720.mp4"

      var player = `https://shirix-player.web.app/?360=${clear_360}&480=${clear_480}&720=${clear_720}`

      res.status(200).send({
        ok: true,
        ...("extended" in query && {
          params: paramstoo
        }),
        links: {
          "360": clear_360,
          "480": clear_480,
          "720": clear_720,
          "player": player
        },
        
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: "cannot get sources from aniqit.com/gvi",
        error_ru: "Ошибка получения источника",
      });
    }
})

// Search(anime only)
app.get("/v1/getSearchAnime", async (req, res) => {
  let query = req.query;
  const q = query.q as string;
        var page = query.page as string;
        if (q == undefined) {
          return res.end(JSON.stringify({
            ok: false,
            error: "query.",
            error_ru: "Вы забыли указать запрос."
      }))
        } else if (page == undefined) {
          page = "1"
          
        } 
         
           axios.get(encodeURI(`https://shikimori.one/api/animes?search=${q}&limit=10&page=${page}&order=popularity`), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
          }
        })
          .then((resp) => {
            var data = resp.data
            
            return res.status(200).send({
            ok: true,
            message: "yeah",
            results: data
              
      })
          })
          .catch((err) => {
            console.log(err)
            return res.status(500).send({
            ok: false,
            error: "searching error.",
            error_ru: "Ошибка поиска."
      })
          })
        
      
  
})

// Detail Info
app.get("/v1/getAnimeDetail", async (req, res) => {
  
      var id = req.query.id;
      
      if (id == undefined || id == "") {
        return res.status(400).send({
            ok: false,
            error: "id.",
            error_ru: "Вы забыли указать id"
        })
    
    }
        axios.get(encodeURI(`https://shikimori.one/api/animes/${id}`), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
          }
        })
        .then((resp) => {
            var data = resp.data;
            axios.get(encodeURI(`https://shirix-api.nkno.site/v1/getEpisodes?id=${id}`), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
          }
        })
        .then((respk) => {
            var datak = respk.data;
            return res.status(200).send({
              ok: true,
              message: "ohh man.",
              data: {
                data: data,
                episodes: datak.casts
              }
            })
           }
        )
        .catch((err) => {
          return res.status(200).send({
            ok: true,
            message: "ohh man.",
            data: {
              data: data,
            }
          })
        })
      
          })
        .catch((err) => {
            console.log(err)
            return res.status(err.response.data.code).send({
              ok: false,
              error_ru: err.response.data.message
            })
        })
})


app.get("/v1/getMangaInfo", async (req, res) => {
  var q = req.query.id;
      
  if (q == undefined || q == "") {
    return res.status(400).send({
        ok: false,
        error: "q.",
        error_ru: "Вы забыли указать q"
    })

}
    axios.get(encodeURI(`https://readmanga.io/search/suggestion?query=${q}`))
      .then(datar => {
        var rm = datar.data
        return res.status(200).send({
          ok: true,
          rm: rm
        })
})
})






app.get("/v2/getSchedule", async (req, res) => {
  var day = req.query.day
  
  if (day == undefined || day == ""){
    day = "today"
  }
  var daylist = ['monday', 'tuesday', "wednesday", "thursday", "friday", "saturday", "sunday", "today"]
  
  if (!daylist.includes(day)){
    res.status(400).send({
      ok: false,
      error: "Bad Arguments"
    });
  }


  if (day == "today") {
    let today = new Date().toLocaleDateString('jp-JP', { weekday: 'long' }).toLowerCase()
    day = today
  }
  
  axios.get(encodeURI(`https://api.jikan.moe/v4/schedules?filter=${day}`))
        .then((resp) => {
            let data = resp.data;
            var result = 0;
            var items = []
 
  
 
            for(var i = 0; i < data.data.length;i++) {
              var pic = data.data[i].images.jpg.large_image_url
              if (pic != "https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png"){
                items.push({
                  "id" : data.data[i].mal_id,
                  "title_en"  : data.data[i].title,
                  "pic": pic,
                  "bc_time" : data.data[i].broadcast.time,
                  "bc_tz": data.data[i].broadcast.timezone,
              });
              }
              
            }
  
            
            var ids = []
            
            for(var i = 0; i < data.data.length;i++) {
              var pic = data.data[i].images.jpg.large_image_url
              if (pic != "https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png"){
                ids.push(data.data[i].mal_id);
              }
              
            }
            
            
            
            
             res.send({
              ok: true,
              message: "sorry guys, i can't get ru title of anime, i dumb",
              ids: ids,
              releases: items
            });
            
        })
  
  
});




// Getting eps
app.get("/v1/getEpisodes", (req, res) => {
  let id = req.query.id
  
  if (id == undefined || id == "") {
        return res.status(400).send({
            ok: false,
            error: "id.",
            error_ru: "Вы забыли указать id"
  })
  }
  
  axios.get(encodeURI(`https://kodikapi.com/search?token=f72d17af17189dbbc5f2dd03271c74fc&with_episodes=true&shikimori_id=${id}`))
        .then((resp) => {
            let data = resp.data;
            var result = 0;
            var items = []
 
  
 
            for(var i = 0; i < data.results.length;i++) {
              items.push({
                "name" : data.results[i].translation.title,
                "kodik_id"  : data.results[i].translation.id,
                "episodes_count" : data.results[i].episodes_count,
                "type": data.results[i].translation.type,
                "episodes": data.results[i].seasons[data.results[i].last_season].episodes
            });
            }
  
            var obj = new Object();
            var arr = new Array();
    
            
    
            var jsonString = JSON.stringify(obj);
            

            
             res.send({
              ok: true,
              casts: items
            });
            
        })
      
    
    
 
  }
);

app.get("/v2/getPlayer", (req, res) => {
  let link = req.query.link;
  
  if (link == undefined || link == "") {
        return res.status(400).send({
            ok: false,
            error: "link.",
            error_ru: "Вы забыли указать link"
  })
  }
  axios.get(`https://shirix-api.nkno.site/v1/getVideo?link=${link}`)
    .then((resp) => {
      res.send({
        ok: true,
        player: resp.data.links.player
      });
    })
    .catch((err) => {
      res.status(500).send({
         ok: false,
         error: err.data.error
      });
    })
  
});



// Opening API
app.use("/v1/getOpening", (req, res) => {
  let id = req.query.id
  
  if (id == undefined || id == "") {
        return res.status(400).send({
            ok: false,
            error: "id.",
            error_ru: "Вы забыли указать id"
  })
  }
  axios.get(`https://shirix-openings.herokuapp.com/api/v1/anime/${id}`)
    .then((resp) => {
      res.send(resp.data);
    })
    .catch((err) => {
      res.status(500).send(err.data);
    })
  
});


app.get("/v2/getSomeFuckingMusic", (req, res) => {
	
  const music = ['https://www.youtube.com/watch?v=ssOqe-0_AHg', 'https://www.youtube.com/watch?v=wqY8N9FuyR8&t=2s', 'https://www.youtube.com/watch?v=tktcOUi-x-A', 'https://www.youtube.com/watch?v=osevHxmmnNU', 'https://www.youtube.com/watch?v=ugpywe34_30', 'https://www.youtube.com/watch?v=nBteO-bU78Y', 'https://www.youtube.com/watch?v=ulfY8WQE_HE', 'https://www.youtube.com/watch?v=avfzmofxzig', 'https://www.youtube.com/watch?v=yoHR8qwuqmY', 'https://www.youtube.com/watch?v=Tc8iu0XFUQc', 'https://www.youtube.com/watch?v=HQgaCVT9Bw8', 'https://www.youtube.com/watch?v=dJf4wCdLU18', 'https://www.youtube.com/watch?v=sgdPlDG1-8k', 'https://www.youtube.com/watch?v=x-AHnwQPf9s', 'https://www.youtube.com/watch?v=slazi2PpYUo', 'https://www.youtube.com/watch?v=40w0fdXiPP0', 'https://www.youtube.com/watch?v=OJXi5BvR_DU', 'https://www.youtube.com/watch?v=6cx1WaoWQ34', 'https://www.youtube.com/watch?v=S9uTScSgzrM']
  res.send({
    ok: true,
    message:
      "a-ha",
    url: music[Math.floor(Math.random()*music.length)]
    
  });
});


// Main endpoints
app.use("/v1/", (req, res) => {
  res.send({
    ok: true,
    message:
      "welcome to shirix api v1.",
    
  });
});

app.use("/", (req, res) => {
  res.redirect('/v1')
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "where are you? 404",
    favorite_food: "pancakeeeeks!!"
  });
});

app.listen(port, () => {
  console.log("[Shirix.Server] Listening on port: " + port);
});
