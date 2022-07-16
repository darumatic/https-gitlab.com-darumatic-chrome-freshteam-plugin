function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

import options from "./options"


const scriptService = {
    scripts: [
        {
            id: "2",
            host: ".*.freshteam.com$",
            path: "^/hire/jobs/.*/candidates/listview/?$",
            name: "Download Attachments",
            script: "(async function() {\n" +
                "    function formatName(name) {\n" +
                "        return name.replace(/[^a-z0-9]/gi, \"_\").toLowerCase()\n" +
                "    }\n" +
                "\n" +
                "    function filePath(jobName, username, fileName) {\n" +
                "        return \"freshteam/\" + formatName(jobName) + \"/\" + formatName(username) + \"/\" + fileName\n" +
                "    }\n" +
                "\n" +
                "    async function nextPageButton() {\n" +
                "        try {\n" +
                "            return await driver.findElement(By.css(\".next-page\"))\n" +
                "        } catch (e) {\n" +
                "            return null\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    async function hasNextPage() {\n" +
                "        try {\n" +
                "            await driver.executeScript(\"document.querySelector('.next-page').scrollIntoViewIfNeeded()\")\n" +
                "        } catch (e) {\n" +
                "        }\n" +
                "\n" +
                "        try {\n" +
                "            let nextButtonClass = await driver.executeScript(\"return document.querySelector('.next-page').className\")\n" +
                "            return !nextButtonClass.includes(\"disabled\")\n" +
                "        } catch (e) {\n" +
                "            console.log(\"warning: none next page button\", e)\n" +
                "            return false\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    function download(url, name, retry) {\n" +
                "        let retried = typeof retry !== \"undefined\" ? retry : 0\n" +
                "        let MAX_RETRIED = 5\n" +
                "\n" +
                "        if (retried <= MAX_RETRIED) {\n" +
                "            browser.downloads.download({ url: url, filename: name }, (downloadId) => {\n" +
                "                if (downloadId) {\n" +
                "                    console.log(\"download \" + url + \" successfully\")\n" +
                "                } else {\n" +
                "                    download(url, name, retried++)\n" +
                "                }\n" +
                "            })\n" +
                "        } else {\n" +
                "            console.log(\"download \" + url + \" failed\")\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    let totalDownloads = 0\n" +
                "\n" +
                "    browser.downloads.onChanged.addListener(function() {\n" +
                "        browser.downloads.search({ limit: 0 }, function(items) {\n" +
                "            var activeDownloads = []\n" +
                "            for (var i = 0; i < items.length; i++) {\n" +
                "                var item = items[i]\n" +
                "                if (item.state === \"in_progress\") activeDownloads.push(item.id)\n" +
                "            }\n" +
                "            totalDownloads = activeDownloads.length\n" +
                "        })\n" +
                "    })\n" +
                "\n" +
                "    async function downloadAttachments(url) {\n" +
                "        await driver.get(url)\n" +
                "\n" +
                "        await driver.wait(until.elementLocated(By.css(\".breadcrumb-title\")), 60000)\n" +
                "\n" +
                "        let jobName = await driver.executeScript(\"return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();\")\n" +
                "\n" +
                "        let tried = 0\n" +
                "        while (tried < 3) {\n" +
                "            try {\n" +
                "                await driver.executeScript(\"let open = window.__open || XMLHttpRequest.prototype.open;window.__open = open;window.results = {};XMLHttpRequest.prototype.open = function() {  this.addEventListener('load', event => {  let url = event.currentTarget.responseURL;    let matches = url.match(/.*.?hire.?applicants.?([0-9]+)/);    if (matches) {      let id = matches[1];      let result = JSON.parse(event.currentTarget.responseText);      window.results[id.toString().trim()] = result['attachments']||[];    }  }, false);  open.apply(this, arguments);};\")\n" +
                "                break\n" +
                "            } catch (e) {\n" +
                "                tried++\n" +
                "            }\n" +
                "        }\n" +
                "\n" +
                "        let nextPageEnabled = false\n" +
                "        do {\n" +
                "            await driver.wait(async function() {\n" +
                "                return await driver.executeScript(\"return document.querySelector('.pagearea-content .no-data-title') !== null || document.querySelector('.pagearea-content .candidate-list-item') !==null\")\n" +
                "            }, 60000)\n" +
                "\n" +
                "            let elements = await driver.findElements(By.css(\".candidate-list-item\"))\n" +
                "\n" +
                "            for (let i = 0; i < elements.length; i++) {\n" +
                "                console.log(\"candidates \", i)\n" +
                "                let selector = \".pagearea-content tr:nth-child(\" + (i + 2) + \") td:nth-child(2) a\"\n" +
                "                let linkElement = await driver.findElement(By.css(selector))\n" +
                "                let url = await linkElement.getAttribute(\"href\")\n" +
                "                let matches = url.match(/.*candidates.?listview.?([0-9]+)/)\n" +
                "                let id = matches[1]\n" +
                "\n" +
                "                let downloaded = await downloadHistory.isDownloaded(id)\n" +
                "                if (downloaded) {\n" +
                "                    continue\n" +
                "                }\n" +
                "\n" +
                "                await driver.executeScript(\"document.querySelector('\" + selector + \"').scrollIntoViewIfNeeded()\")\n" +
                "                await linkElement.click()\n" +
                "\n" +
                "                let nameElement = await linkElement.findElement(By.css(\".name\"))\n" +
                "                let username = await nameElement.getAttribute(\"title\")\n" +
                "\n" +
                "                let ajaxResults = null\n" +
                "                await driver.wait(async function() {\n" +
                "                    ajaxResults = await driver.executeScript(\"let url = window.location.href;let matches = url.match(/.*candidates.?listview.?([0-9]+)/);id = matches[1];return window.results[id];\")\n" +
                "                    return ajaxResults != null\n" +
                "                }, 60000)\n" +
                "\n" +
                "                let attachments = ajaxResults.filter(it => it.description === \"resume\").map(item => {\n" +
                "                    return {\n" +
                "                        name: item[\"content_file_name\"],\n" +
                "                        url: item[\"expiring_urls\"][\"original\"]\n" +
                "                    }\n" +
                "                })\n" +
                "                console.log(username + \" attachments\", attachments)\n" +
                "\n" +
                "                for (let j = 0; j < attachments.length; j++) {\n" +
                "                    let attachment = attachments[j]\n" +
                "                    console.log(\"find attachment\", attachment.name, attachment.url)\n" +
                "\n" +
                "                    await driver.wait(async function() {\n" +
                "                        return currentDownloading < 5\n" +
                "                    }, 240000)\n" +
                "\n" +
                "                    download(attachment.url, filePath(jobName, username, attachment.name))\n" +
                "                }\n" +
                "\n" +
                "                downloadHistory.downloaded(id)\n" +
                "\n" +
                "                let closeButton = await driver.findElement(By.css(\".custom-modal-close a\"))\n" +
                "                await closeButton.click()\n" +
                "\n" +
                "                await driver.wait(async function() {\n" +
                "                    await driver.executeScript(\"return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()\")\n" +
                "                    let buttons = await driver.findElements(By.css(\".custom-modal-close\"))\n" +
                "                    console.log(\"buttons\", buttons)\n" +
                "                    return buttons.length === 0\n" +
                "                }, 60000)\n" +
                "            }\n" +
                "\n" +
                "            let nextButton = await nextPageButton()\n" +
                "            if (nextButton) {\n" +
                "                console.log(\"hasNextPage\", hasNextPage)\n" +
                "                nextPageEnabled = await hasNextPage()\n" +
                "                if (nextPageEnabled) {\n" +
                "                    console.log(\"Start next page, \", nextPageEnabled)\n" +
                "                    try {\n" +
                "                        await driver.executeScript(\"document.querySelector('.next-page').scrollIntoViewIfNeeded()\")\n" +
                "                    } catch (e) {\n" +
                "                    }\n" +
                "                    await nextButton.click()\n" +
                "                }\n" +
                "            } else {\n" +
                "                nextPageEnabled = false\n" +
                "            }\n" +
                "\n" +
                "        } while (nextPageEnabled)\n" +
                "    }\n" +
                "\n" +
                "    await downloadAttachments(url)\n" +
                "})()\n",
            options: []
        },
        {
            id: "1",
            host: ".*.freshteam.com$",
            path: "^/hire/jobs(\\?.*)?$",
            name: "Download All Attachments",
            script: "(async function() {\n" +
                "    function formatName(name) {\n" +
                "        return name.replace(/[^a-z0-9]/gi, \"_\").toLowerCase()\n" +
                "    }\n" +
                "\n" +
                "    function filePath(jobName, username, fileName) {\n" +
                "        return \"freshteam/\" + formatName(jobName) + \"/\" + formatName(username) + \"/\" + fileName\n" +
                "    }\n" +
                "\n" +
                "\n" +
                "    async function nextPageButton() {\n" +
                "        try {\n" +
                "            return await driver.findElement(By.css(\".next-page\"))\n" +
                "        } catch (e) {\n" +
                "            return null\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    async function hasNextPage() {\n" +
                "        try {\n" +
                "            await driver.executeScript(\"document.querySelector('.next-page').scrollIntoViewIfNeeded()\")\n" +
                "        } catch (e) {\n" +
                "        }\n" +
                "\n" +
                "        try {\n" +
                "            let nextButtonClass = await driver.executeScript(\"return document.querySelector('.next-page').className\")\n" +
                "            return !nextButtonClass.includes(\"disabled\")\n" +
                "        } catch (e) {\n" +
                "            console.log(\"warning: none next page button\", e)\n" +
                "            return false\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    function download(url, name, retry) {\n" +
                "        let retried = typeof retry !== \"undefined\" ? retry : 0\n" +
                "        let MAX_RETRIED = 5\n" +
                "\n" +
                "        if (retried <= MAX_RETRIED) {\n" +
                "            browser.downloads.download({ url: url, filename: name }, (downloadId) => {\n" +
                "                if (downloadId) {\n" +
                "                    console.log(\"download \" + url + \" successfully\")\n" +
                "                } else {\n" +
                "                    download(url, name, retried++)\n" +
                "                }\n" +
                "            })\n" +
                "        } else {\n" +
                "            console.log(\"download \" + url + \" failed\")\n" +
                "        }\n" +
                "    }\n" +
                "\n" +
                "    let currentDownloading = 0\n" +
                "\n" +
                "    browser.downloads.onChanged.addListener(function() {\n" +
                "        browser.downloads.search({ limit: 0 }, function(items) {\n" +
                "            var activeDownloads = []\n" +
                "            for (var i = 0; i < items.length; i++) {\n" +
                "                var item = items[i]\n" +
                "                if (item.state === \"in_progress\") activeDownloads.push(item.id)\n" +
                "            }\n" +
                "            currentDownloading = activeDownloads.length\n" +
                "        })\n" +
                "    })\n" +
                "\n" +
                "    async function downloadAttachments(url) {\n" +
                "        await driver.get(url)\n" +
                "\n" +
                "        await driver.wait(until.elementLocated(By.css(\".breadcrumb-title\")), 60000)\n" +
                "\n" +
                "        let jobName = await driver.executeScript(\"return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();\")\n" +
                "\n" +
                "        let tried = 0\n" +
                "        while (tried < 3) {\n" +
                "            try {\n" +
                "                await driver.executeScript(\"let open = window.__open || XMLHttpRequest.prototype.open;window.__open = open;window.results = {};XMLHttpRequest.prototype.open = function() {  this.addEventListener('load', event => {  let url = event.currentTarget.responseURL;    let matches = url.match(/.*.?hire.?applicants.?([0-9]+)/);    if (matches) {      let id = matches[1];      let result = JSON.parse(event.currentTarget.responseText);      window.results[id.toString().trim()] = result['attachments']||[];    }  }, false);  open.apply(this, arguments);};\")\n" +
                "                break\n" +
                "            } catch (e) {\n" +
                "                tried++\n" +
                "            }\n" +
                "        }\n" +
                "\n" +
                "        let nextPageEnabled = false\n" +
                "        do {\n" +
                "            await driver.wait(async function() {\n" +
                "                return await driver.executeScript(\"return document.querySelector('.pagearea-content .no-data-title') !== null || document.querySelector('.pagearea-content .candidate-list-item') !==null\")\n" +
                "            }, 60000)\n" +
                "\n" +
                "            let elements = await driver.findElements(By.css(\".candidate-list-item\"))\n" +
                "\n" +
                "            for (let i = 0; i < elements.length; i++) {\n" +
                "                console.log(\"candidates \", i)\n" +
                "                let selector = \".pagearea-content tr:nth-child(\" + (i + 2) + \") td:nth-child(2) a\"\n" +
                "                let linkElement = await driver.findElement(By.css(selector))\n" +
                "                let url = await linkElement.getAttribute(\"href\")\n" +
                "                let matches = url.match(/.*candidates.?listview.?([0-9]+)/)\n" +
                "                let id = matches[1]\n" +
                "\n" +
                "                let downloaded = await downloadHistory.isDownloaded(id)\n" +
                "                if (downloaded) {\n" +
                "                    continue\n" +
                "                }\n" +
                "\n" +
                "                await driver.executeScript(\"document.querySelector('\" + selector + \"').scrollIntoViewIfNeeded()\")\n" +
                "                await linkElement.click()\n" +
                "\n" +
                "                let nameElement = await linkElement.findElement(By.css(\".name\"))\n" +
                "                let username = await nameElement.getAttribute(\"title\")\n" +
                "\n" +
                "                let ajaxResults = null\n" +
                "                await driver.wait(async function() {\n" +
                "                    ajaxResults = await driver.executeScript(\"let url = window.location.href;let matches = url.match(/.*candidates.?listview.?([0-9]+)/);id = matches[1];return window.results[id];\")\n" +
                "                    return ajaxResults != null\n" +
                "                }, 60000)\n" +
                "\n" +
                "                let attachments = ajaxResults.filter(it => it.description === \"resume\").map(item => {\n" +
                "                    return {\n" +
                "                        name: item[\"content_file_name\"],\n" +
                "                        url: item[\"expiring_urls\"][\"original\"]\n" +
                "                    }\n" +
                "                })\n" +
                "                console.log(username + \" attachments\", attachments)\n" +
                "\n" +
                "                for (let j = 0; j < attachments.length; j++) {\n" +
                "                    let attachment = attachments[j]\n" +
                "                    console.log(\"find attachment\", attachment.name, attachment.url)\n" +
                "\n" +
                "                    await driver.wait(async function() {\n" +
                "                        return currentDownloading < 5\n" +
                "                    }, 240000)\n" +
                "\n" +
                "                    download(attachment.url, filePath(jobName, username, attachment.name))\n" +
                "                }\n" +
                "\n" +
                "                downloadHistory.downloaded(id)\n" +
                "\n" +
                "                let closeButton = await driver.findElement(By.css(\".custom-modal-close a\"))\n" +
                "                await closeButton.click()\n" +
                "\n" +
                "                await driver.wait(async function() {\n" +
                "                    await driver.executeScript(\"return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()\")\n" +
                "                    let buttons = await driver.findElements(By.css(\".custom-modal-close\"))\n" +
                "                    console.log(\"buttons\", buttons)\n" +
                "                    return buttons.length === 0\n" +
                "                }, 60000)\n" +
                "            }\n" +
                "\n" +
                "            let nextButton = await nextPageButton()\n" +
                "            if (nextButton) {\n" +
                "                console.log(\"hasNextPage\", hasNextPage)\n" +
                "                nextPageEnabled = await hasNextPage()\n" +
                "                if (nextPageEnabled) {\n" +
                "                    console.log(\"Start next page, \", nextPageEnabled)\n" +
                "                    try {\n" +
                "                        await driver.executeScript(\"document.querySelector('.next-page').scrollIntoViewIfNeeded()\")\n" +
                "                    } catch (e) {\n" +
                "                    }\n" +
                "                    await nextButton.click()\n" +
                "                }\n" +
                "            } else {\n" +
                "                nextPageEnabled = false\n" +
                "            }\n" +
                "\n" +
                "        } while (nextPageEnabled)\n" +
                "    }\n" +
                "\n" +
                "    function nextPageURL(url) {\n" +
                "        if (!url.includes(\"page=\")) {\n" +
                "            return url + \"?page=2\"\n" +
                "        }\n" +
                "\n" +
                "        let matched = url.match(/page=(\\d+)/)\n" +
                "        if (matched) {\n" +
                "            let page = matched[1]\n" +
                "            if (parseInt(page) > 0) {\n" +
                "                return url.replace(/page=\\d+/, \"page=\" + (parseInt(page) + 1))\n" +
                "            }\n" +
                "        }\n" +
                "        return null\n" +
                "    }\n" +
                "\n" +
                "    async function downloadJobs(url) {\n" +
                "\n" +
                "        await driver.get(url)\n" +
                "        let nextPageEnabled = false\n" +
                "\n" +
                "        do {\n" +
                "            await driver.wait(until.elementLocated(By.css(\".job-list .col-block\")), 60000)\n" +
                "            let elements = await driver.findElements(By.css(\".job-list .col-block .col-inside > a\"))\n" +
                "\n" +
                "            let jobURLs = []\n" +
                "            for (let i = 0; i < elements.length; i++) {\n" +
                "                let element = elements[i]\n" +
                "                let jobURL = await element.getAttribute(\"href\")\n" +
                "                jobURLs.push(jobURL + \"/candidates/listview\")\n" +
                "            }\n" +
                "\n" +
                "            nextPageEnabled = await hasNextPage()\n" +
                "\n" +
                "            console.log(\"nextPageEnabled:\", nextPageEnabled)\n" +
                "            let nextURL = nextPageEnabled ? nextPageURL(url) : null\n" +
                "            console.log(\"nextURL:\", nextURL)\n" +
                "\n" +
                "            for (let i = 0; i < jobURLs.length; i++) {\n" +
                "                let jobURL = jobURLs[i]\n" +
                "                try {\n" +
                "                    await downloadAttachments(jobURL)\n" +
                "                } catch (e) {\n" +
                "                    console.log(\"failed to download job\", jobURL)\n" +
                "                }\n" +
                "            }\n" +
                "\n" +
                "            if (nextURL) {\n" +
                "                await driver.get(nextURL)\n" +
                "            } else {\n" +
                "                nextPageEnabled = false\n" +
                "            }\n" +
                "        } while (nextPageEnabled)\n" +
                "    }\n" +
                "\n" +
                "    await downloadJobs(url)\n" +
                "})()\n",
            options: []
        }
    ],
    textIndex: function(callback) {
        chrome.storage.sync.get(["textIndex"], value => {
            if (value.textIndex) {
                let textIndex = parseInt(value.textIndex) + 1
                chrome.storage.sync.set({
                    "textIndex": textIndex
                }, function() {
                })
                callback(textIndex)
            } else {
                let textIndex = 1
                chrome.storage.sync.set({
                    "textIndex": textIndex
                }, function() {
                })
                callback(textIndex)
            }
        })
    },
    getScript(id) {
        for (let i = 0; i < this.scripts.length; i++) {
            if (this.scripts[i].id === id) {
                return this.scripts[i]
            }
        }
        return null
    },
    loadScripts: function(query, callback) {
        let url = new URL(query.url)

        console.log("url", url)

        function filter(script, host, path) {
            if (host && path) {
                return new RegExp(script.host).test(host) && new RegExp(script.path).test(path)
            }
            return false
        }

        let scripts = []
        for (let i = 0; i < scriptService.scripts.length; i++) {
            if (filter(scriptService.scripts[i], url.hostname, url.pathname)) {
                scripts.push(scriptService.scripts[i])
            }
        }

        callback(scripts)
    },

    getUserInfo: function(callback) {
        chrome.storage.sync.get(["userInfo"], value => {
            if (value.userInfo) {
                callback(JSON.parse(value.userInfo))
            } else {
                const userInfo = {
                    clientId: uuidv4()
                }
                scriptService.setUserInfo(userInfo)
                callback(userInfo)
            }
        })
    },
    setUserInfo: function(userInfo) {
        chrome.storage.sync.set({
            "userInfo": JSON.stringify(userInfo)
        }, function() {
        })
    },
    getHistory: function(callback) {
        scriptService.getOptions(options => {
            if (options.historyEnabled) {
                chrome.storage.sync.get(["history"], value => {
                    if (value.history) {
                        callback(JSON.parse(value.history))
                    } else {
                        callback([])
                    }
                })
            } else {
                callback([])
            }
        })
    },
    setHistory: function(history) {
        scriptService.getOptions(options => {
            if (options.historyEnabled) {
                if (history.length > 100) {
                    history = history.slice(history.length - 100, history.length)
                }
                chrome.storage.sync.set({
                    "history": JSON.stringify(history)
                }, function() {
                })
            }
        })
    },
    defaultOptions: function() {
        return {
            serverURL: options.SERVER_URL,
            historyEnabled: true
        }
    },
    getOptions: (callback) => {
        return callback(scriptService.defaultOptions())
    }
}

export default scriptService
