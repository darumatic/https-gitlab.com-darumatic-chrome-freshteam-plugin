/**
 * Setup browser action to open freshteam UI
 */
const testsRun = require("../tests-run")
import db from "../../popup/script-service"
import "./analytics"

let index = 0
let runEnabled = false
let timer = null
const SYNC_INTERVAL = 12 * 60 * 60 * 1000
exports.setup = function() {
    let currentScript

    function running() {
        if (runEnabled) {
            var path = "frame-" + index + ".png"
            chrome.browserAction.setIcon({ path })
            index = (index + 1) % 9
            setTimeout(running, 30)
            if (!runEnabled) {
                done()
            }
        } else {
            done()
        }
    }

    chrome.storage.sync.get("syncEnabled", (result) => {
        console.log("=====================", result, result.syncEnabled)

        if (result.syncEnabled) {
            if (timer) {
                clearInterval(timer)
            }
            timer = setInterval(() => {
                downloadAllAttachments()
            }, SYNC_INTERVAL)
        }
    })


    function done() {
        runEnabled = false
        chrome.browserAction.setIcon({ path: "favicon-128x128.png" })
    }

    chrome.debugger.onDetach.addListener(() => {
        done()
    })

    function downloadAllAttachments() {
        console.log(new Date() + ": start job")
        chrome.tabs.query({ active: true, windowType: "normal", currentWindow: true }, (d) => {
            console.log(d)
            currentScript = db.getScript("1")
            let options = {
                id: "1",
                tabId: currentScript.id,
                name: currentScript.name,
                url: "https://darumatic.freshteam.com/hire/jobs",
                option: null
            }
            runScript({ options })
        })
    }

    function runScript(request) {
        console.log("RUN Script", request)
        currentScript = request.options
        runEnabled = true
        running()

        let script = db.getScript(currentScript.id)

        testsRun.run({
                target: {
                    serverUrl: "http://freshteam",
                    loopback: true,
                    tabId: request.options.tabId,
                    caps: {
                        "browserName": "chrome"
                    }
                },
                snippets: [{
                    path: "code.js",
                    code: script.script,
                    params: {
                        url: request.options.url,
                        option: request.options.option
                    }
                }]
            }
        ).then(() => {
            console.log("DONE")
            done()
        }).catch((e) => {
            console.log("ERROR", e)
            done()
        })
    }

    chrome.runtime.onMessage.addListener(function(request) {
        console.log("MESSAGE", request)

        if (request.type === "SCRIPT_RUN") {
            runScript(request)
            return true
        } else if (request.type === "SCRIPT_CANCEL") {
            console.log("SCRIPT_CANCEL")
            done()
        } else if (request.type === "LOGIN") {
            db.setUserInfo({
                userId: request.options.userId,
                username: request.options.username,
                token: request.options.token
            })
            return true
        } else if (request.type === "LOGOUT") {
            db.setUserInfo({})
            return true
        } else if (request.type === "LOADED") {
            if (runEnabled) {
                done()
            }
            return true
        } else if (request.type === "START_TIMER") {
            console.log("Start timer")
            if (timer) {
                clearInterval(timer)
            }
            timer = setInterval(() => {
                downloadAllAttachments()
            }, SYNC_INTERVAL)
            return true
        } else if (request.type === "STOP_TIMER") {
            console.log("Stop timer")
            if (timer) {
                clearInterval(timer)
            }
            return true
        }
    })
}
