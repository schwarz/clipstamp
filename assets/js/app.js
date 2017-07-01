// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in "brunch-config.js".
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import "phoenix_html"

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

import {h, app} from "hyperapp"
import socket from "./socket"


if(window.Notification && Notification.permission !== "granted") {
  Notification.requestPermission(status => {
    if (Notification.permission !== status) {
      Notification.permission = status
    }
  })
}

app({
  state: {vod: "", slug: "", isLoading: false, slugError: ""},
  root: document.querySelector("#clip-app"),
  view: (state, actions) =>
    h("div", {}, [
      h("mark", {class: (state.vod === "" ? "hide" : "")}, [
        h("a", {href: state.vod}, state.vod)
      ]),
      h("form", {id: "clip-form", onsubmit: actions.getClip}, [
        h("div", {class: "form-group"}, [
          h("label", {class: "form-label", for: "clip-url"}, "URL"),
          h("input", {
            class: "form-input" + (state.slugError === "" ? "" : " is-error"),
            id: "clip-url",
            placeholder: "https://clips.twitch.tv/SnappyHorribleGoshawkDAESuppy",
            autofocus: true,
            type: "url",
            oninput: e => actions.setSlug(e.target.value)
          }, state.slug),
          h("p", {class: "form-input-hint"}, state.slugError)
        ]),
        h("button", {
          class: "btn btn-primary" + (state.isLoading ? " loading" : ""),
          type: "submit"
        }, "Get timestamp")
      ])
    ]),
  actions: {
    setSlug: (state, actions, slug) => ({slug}),
    setSlugError: (state, actions, slugError) => ({slugError}),
    toggleLoading: state => ({ isLoading: !state.isLoading }),
    setVOD: (state, actions, vod) => ({vod}),
    getClip: (state, actions, {target}) => {
      let slug = state.slug.split("/").pop()
      let chan = socket.channel("slug:" + slug, {})
      actions.toggleLoading()
      chan.join()
      .receive("ok", resp => { console.log("Joined successfully", resp) })
      .receive("error", resp => { console.log("Unable to join", resp) })

      chan.on("found", payload => {
        chan.leave()
        if (window.Notification && Notification.permission === "granted") {
          let n = new Notification("Clipstamp", {body: "Your timestamped VOD is ready."})
          setTimeout(n.close.bind(n), 5000)
        }
        actions.toggleLoading()
        actions.setSlugError("")
        actions.setVOD(payload.url)
      })

      chan.on("not_found", payload => {
        chan.leave()
        actions.toggleLoading()
        actions.setSlugError("Clip not found.")
      })

      chan.on("timed_out", payload => {
        chan.leave()
        actions.toggleLoading()
        actions.setSlugError("Failed to find VOD.")
      })
      event.preventDefault()
    }
  }
})
