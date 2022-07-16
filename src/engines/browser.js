exports.browser = {
    tabs: {
        create: function(options) {
            chrome.tabs.create(options)
        }
    },
    downloads: {
        download: function(options, callback) {
            chrome.downloads.download(options, callback)
        },
        onChanged: chrome.downloads.onChanged,
        search: chrome.downloads.search
    }
}
