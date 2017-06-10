if(window.Notification && Notification.permission !== "granted") {
  Notification.requestPermission(status => {
    if (Notification.permission !== status) {
      Notification.permission = status
    }
  })
}

import {Socket} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})
socket.connect()

let clipForm = document.querySelector("#clip-form")
let clipURL = document.querySelector("#clip-url")

clipForm.addEventListener("submit", event => {
  let slug = clipURL.value.split("/").pop()
  let slugChannel = socket.channel("slug:" + slug, {})
  document.querySelector("#clip-form > button").classList.add("loading")
  slugChannel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

  slugChannel.on("found", payload => {
    document.querySelector("#clip-form > button").classList.remove("loading")
    document.querySelector("#clip-result").innerHTML = "<mark><a href='" + payload.url + "'>" + payload.url + "</a></mark>"
    if (window.Notification && Notification.permission === "granted") {
      let n = new Notification("Clipstamp", {body: "Your timestamped VOD is ready."})
      setTimeout(n.close.bind(n), 5000)
    }
    slugChannel.leave()
  })

  slugChannel.on("not_found", payload => {
    document.querySelector("#clip-form > button").classList.remove("loading")
    slugChannel.leave()
  })

  event.preventDefault()
})

export default socket
