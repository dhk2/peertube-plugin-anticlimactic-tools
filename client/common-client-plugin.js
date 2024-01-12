function register({ registerHook, peertubeHelpers, registerVideoField, registerClientRoute }) {
  console.log('lets get ready to rumble!')
  const basePath = peertubeHelpers.getBaseRouterRoute();
  registerClientRoute({
    route: 'anticlimactic/settings',
    onMount: async ({ rootEl }) => {
      let v4vPanel = `<h1>eat at joes</h1>
                      <label for="fname">Channel to dedupe:</label>
                      <input type="text" id="channelname""><br><br>
                      <button class="peertube-button orange-button ng-star-inserted" id="dedupe">De-dupe</button><br>
                      <div id="dedupe-result"></div>
                      `;
      rootEl.innerHTML = v4vPanel
      let dedupeResult = document.getElementById('dedupe-result')
      let dedupeChannel = document.getElementById('channelname')
      if (dedupeChannel){
        dedupeChannel.value="styxhexenhammer666"
      }
      let dedupeButton = document.getElementById("dedupe");
      if (dedupeButton) {
        dedupeButton.onclick = async function () {
          dedupeButton.innerText="deduping";
          let dedupeApi = `${basePath}/dedupe?channel=${dedupeChannel.value.toLowerCase()}`
          let bearer = await peertubeHelpers.getAuthHeader();

          const putMethod = {
            method: 'POST', // Method itself
            headers: bearer,
            body: bearer // We send data in JSON format
          }

          const options = {
            method: 'POST',
            url: dedupeApi,
            headers: {
              'Authorization': bearer.Authorization,
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': '74cc79460fmsh3c6d0abcb93703cp140eb4jsn8975796733b1',
              'X-RapidAPI-Host': 'textapis.p.rapidapi.com',
            },
            body: JSON.stringify(bearer),
          };

          let response
          console.log("🐔deduping",dedupeApi,bearer,options);
          try {
            response = await fetch(dedupeApi, options);
            console.log("response",response)
            if (response.data){
              dedupeResult.innerText=`removed ${response.data} videos`;
            }
          } catch (err) {
            console.log("🐔 hard error trying to call dedupe", dedupeApi, err);
          }
        }
      }
    }
  })
}

export {
  register
}
