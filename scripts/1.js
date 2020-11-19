let open = window.__open || XMLHttpRequest.prototype.open;
window.__open = open;
window.results = {};
XMLHttpRequest.prototype.open = function() {
  this.addEventListener("load", event => {
    console.log(event);
    let url = event.currentTarget.responseURL;
    let matches = url.match(/.*.?hire.?applicants.?([0-9]+)/);
    if (matches) {
      let id = matches[1];
      let result = JSON.parse(event.currentTarget.responseText);
      window.results[id.toString().trim()] = result["attachments"];
    }
  }, false);
  open.apply(this, arguments);
};


let url = window.location.href;
let matches = url.match(/.*candidates.?listview.?([0-9]+)/);
console.log(matches);
id = matches[1];
window.results[id];