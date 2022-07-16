exports.history = {
    isDownloaded: function(candidateId) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([candidateId], function(result) {
                if (result && result[candidateId]) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    },
    downloaded: function(candidateId) {
        let result = {}
        result[candidateId] = true
        chrome.storage.local.set(result, function() {
            console.log("Saved")
        })
    },
    clear: function() {
        chrome.storage.local.clear()
    },
    count: function() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, function(results) {
                resolve(results.length)
            })
        })
    }
}
