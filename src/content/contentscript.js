(function() {
  fetch('/web/api/user/token', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }).then(function(response) {
    console.log(response)
    if (response.status === 200) {
      return response.json()
    }
    return Promise.reject({})
  }).then(function(token) {
    chrome.runtime.sendMessage({
      type: 'LOGIN',
      options: {
        userId: token.userId,
        token: token.token,
        username: token.username
      }
    }, function(response) {
    })
  }).catch(function() {
    console.log('LOGOUT')
    chrome.runtime.sendMessage({
      type: 'LOGOUT',
      options: {}
    }, function(response) {
    })
  })
})()