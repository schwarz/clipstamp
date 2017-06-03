import {Socket} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})
socket.connect()

let clipForm = document.querySelector("#clip-form")
let clipURL = document.querySelector("#clip-url")
let clipHint = document.querySelector("#clip-hint")
let clipResult = document.querySelector("#clip-result")

clipForm.addEventListener("submit", event => {
  let slug = clipURL.value.split("/").pop()
  let slugChannel = socket.channel("slug:" + slug, {})
  document.querySelector("#clip-form > button").classList.add("loading")
  slugChannel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

  slugChannel.on("found", payload => {
    document.querySelector("#clip-form > button").classList.remove("loading")
    clipResult.innerHTML = "<mark><a href='" + payload.url + "'>" + payload.url + "</a></mark>"
    console.log("found", payload)
  })

  slugChannel.on("not_found", payload => {
    document.querySelector("#clip-form > button").classList.remove("loading")
    console.log("Failed to fetch timestamp.")
  })

  event.preventDefault()
})

export default socket
