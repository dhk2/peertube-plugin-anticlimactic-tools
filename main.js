async function register ({
   peertubeHelpers,  
  registerHook,
  registerSetting,
  settingsManager,
  storageManager,
  getRouter
}) {
    var base = await peertubeHelpers.config.getWebserverUrl();
    const router = getRouter();
    //TODO normalize behavior for account and address
    router.use('/dedupe', async (req, res) => {
        //let user = await peertubeHelpers.user.getAuthUser(res);
        console.log("🐔 deduping for user",req.query,req.body);
        let deduped=0;
        let channel;
        if (req.query.channel) {
            channel = req.query.channel;
        } else {
            console.log("🐔 no channel in request");
            return res.status(420).send("channel found in dedupe request");
        }
        let del = false;
        if (req.query.delete){
            del = true;
        }
        let header = req.body;
        let api = `${base}/api/v1/video-channels/${channel}/videos`;
        let videoListChunk;
        let videoListChunkJson;
        try {
            videoListChunk = await fetch(api);
            videoListChunkJson = await videoListChunk.json()
            console.log("🐔 hunk of videos", videoListChunkJson);
            //return res.status(200).send(videoListChunkJson);
        } catch (err) {
            console.log("🐔 hard error trying to get video list", api, err);
        }
        let videosRemaining = videoListChunkJson.total;
        let start = 0;
        while (videosRemaining>0){
            for (var video of videoListChunkJson.data){
                //console.log("🐔🐔video Searching", video.name);
                let searchString = encodeURI(video.name);
                maxD=video.duration+5
                minD = maxD-10;
                let searchResult;
                let searchApi = `${base}/api/v1/search/videos?durationMax=${maxD}&durationMin=${minD}&isLocal=true&search=${searchString}`;
                let searchJson;
                //console.log("🐔🐔 Search api", searchApi);
                try {
                    searchResult = await fetch(searchApi);
                    searchJson = await searchResult.json();
                } catch (err) {
                    console.log("🐔 hard error trying to get search results", api, err);
                }
                if (searchJson.total>1){
                    console.log(`\n🐔🐔 original video matched ${searchJson.total} times`, video.originallyPublishedAt, video.duration,video.name);
                    for (var foundVideo of searchJson.data){
                        if (Math.abs(foundVideo.duration-video.duration)<5 && foundVideo.name == video.name && foundVideo.originallyPublishedAt == video.originallyPublishedAt && foundVideo.id != video.id){
                            var options
                            let deleteApi = `${base}/api/v1/videos/${foundVideo.uuid}`;
                            if (del) {
                                console.log("🐔🐔 delete this video",foundVideo.originallyPublishedAt,foundVideo.duration,foundVideo.name);
                                options = {
                                    method: 'DELETE',
                                    url: deleteApi,
                                    headers: header,
                                };
                                console.log("🐔🐔 deleting video", deleteApi, options);
                                let deleteResult;
                                try {
                                    deleteResult = await fetch(deleteApi, options);
                                    console.log("🐔 delete file result", deleteResult
                                    );
                                } catch (err) {
                                    console.log("🐔 hard error trying to delete file", deleteApi, err);
                                }  
                            } else {
                                console.log("🐔🐔 hide this video", foundVideo.originallyPublishedAt, foundVideo.duration, foundVideo.name);

                                //let bodyObject = { 'privacy': 3 }
                                let body = new FormData;
                                body.append("privacy",3);
                                //console.log("privacy object", bodyObject);
                                //body = JSON.stringify(bodyObject);
                                //let content = {'Content-Type': "multipart/form-data"}
                                //let putHeaders = {
                                //   ...header,
                                //    ...content
                                //}
                                options = {
                                    method: 'PUT',
                                    headers: header,
                                    body: body
                                };
                                
                                console.log("🐔🐔 hiding video", deleteApi,"body",body, "options",options);
                                let deleteResult;
                                try {
                                    deleteResult = await fetch(deleteApi, options);
                                    console.log("🐔 hide file result", deleteResult);
                                    deduped++;
                                } catch (err) {
                                    console.log("🐔 hard error hiding result", deleteApi,body,err);
                                }
                            }
                        } 
                    }
                }
            }
            start = start+15
            videosRemaining=videosRemaining-15
            api = `${base}/api/v1/video-channels/${channel}/videos?start=${start}`;
            console.log("🐔 next batch", videosRemaining, start);
            try {
                videoListChunk = await fetch(api);
                videoListChunkJson = await videoListChunk.json()
                //
                //console.log("🐔 hunk of videos", videoListChunkJson);
                //return res.status(200).send(videoListChunkJson);
            } catch (err) {
                console.log("🐔 hard error trying to get video list", api, err);
            }
        }
        return res.status(200).send(deduped.toString());
    });
    router.use("/retranscode", async(req, res) => {
        let start;
        if (req.query.start){
            start=req.query.start;
        } else {
            start = 0;
        }
        api = `${base}/api/v1/videos?count=100&start=${start}&isLocal=true`;
        try {
            videoList = await fetch(api);
            videoListJson = await videoList.json();
            console.log("🐔 hunk of videos", videoListJson);
            for (var vid of videoListJson.data){
                let vidInfo = await peertubeHelpers.videos.loadByUrl(vid.url);
                console.log("🐔🐔🐔 load uuid?", vidInfo.dataValues.state);
            }
            //return res.status(200).send(videoListChunkJson);
        } catch (err) {
            console.log("🐔 hard error trying to get video list", api, err);
        }
    });

}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}
