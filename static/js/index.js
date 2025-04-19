var access_token,
  userName,
  userEmail,
  userPicture,
  anchortm,
  clickNoticeMsg = 0,
  language
var notification = {},
  notice_nextPage,
  noticePage_record = [],
  notRead_num
var current_url = window.location.href
var spaceOff = new RegExp('\\s', 'g')

//i18n
for (let i = 0; i < document.cookie.split(';').length; i++) {
  if (document.cookie.split(';')[i].includes('language')) {
    language = document.cookie
      .split(';')
    [i].replace('language=', '')
      .replace(spaceOff, '')
  }
}
if (language === undefined && navigator.language.slice(0, 2) !== 'zh') {
  //瀏覽器不是中文一律轉英文
  langCookie('en')
  English()
} else if (language === undefined && navigator.language.slice(0, 2) === 'zh') {
  langCookie('zh')
  Chinese()
} else if (language === 'en') {
  English()
} else if (language === 'zh') {
  Chinese()
}

//點擊語言轉換
for (let l = 0; l < document.querySelectorAll('.earth').length; l++) {
  document.querySelectorAll('.earth')[l].addEventListener('click', function () {
    let nowLang = document.querySelectorAll('.earth span')[l].innerHTML
    if (nowLang === 'English') {
      langCookie('en')
    } else if (nowLang === '中文') {
      langCookie('zh')
    }
    window.location.reload()
  })
}
//set language cookie
function langCookie(para) {
  document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = `language=${para};path=/ `
  for (let i = 0; i < document.cookie.split(';').length; i++) {
    if (document.cookie.split(';')[i].includes('language')) {
      language = document.cookie
        .split(';')
      [i].replace('language=', '')
        .replace(spaceOff, '')
    }
  }
}
//轉英文
function English() {
  fetch(`/lang/en`)
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error(error)
    })
    .then(function (dict) {
      for (let l = 0; l < document.querySelectorAll('.lang').length; l++) {
        let langName = document.querySelectorAll('.lang')[l].getAttribute('key')
        document.querySelectorAll('.lang')[l].innerHTML = dict[langName]
      }
      document.querySelector('.slogan_en').style.display = 'block'
      document.querySelector('.slogan_cn').style.display = 'none'
    })
}
//轉中文
function Chinese() {
  fetch(`/lang/zh`)
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error(error)
    })
    .then(function (dict) {
      for (let l = 0; l < document.querySelectorAll('.lang').length; l++) {
        let langName = document.querySelectorAll('.lang')[l].getAttribute('key')
        document.querySelectorAll('.lang')[l].innerHTML = dict[langName]
      }
      document.querySelector('.slogan_en').style.display = 'none'
      document.querySelector('.slogan_cn').style.display = 'block'
    })
}

//畫面一載入先要做的事
load()

async function load() {
  createYear()
  if (document.cookie.includes('access_token')) {
    const myArray = document.cookie.split(';')
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].includes('access_token')) {
        access_token = myArray[i]
          .replace('access_token=', '')
          .replace(spaceOff, '')
      }
    }
    await googleInfo(access_token)
    setTimeout(() => {
      document.querySelector('.overlay').style.display = 'none'
    }, 0)
  } else {
    document.querySelector('.frame1').style.display = 'flex'
    document.querySelector('.frame2').style.display = 'none'
    document.querySelector('.fr2').style.display = 'none'
    setTimeout(() => {
      document.querySelector('.overlay').style.display = 'none'
    }, 500)
  }
  fetch('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ url: `${window.location.href}` }),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
    },
  })
    .then(function (response) {
      return response.json()
    })
    .catch((error) => console.error('Error:', error))
    .then(function (dict) { })
}

//fetch登入者資料。已登入時，右上角要做相應變化，還有token過期時的調整
async function googleInfo(para) {
  await fetch('/api/user', { headers: { Authorization: `Bearer ${para}` } })
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('GET /api/user 錯誤:', error)
    })
    .then(function (dict) {
      if (dict === undefined) {
        deleteAllCookies()
        document.querySelector('.frame1').style.display = 'flex'
        document.querySelector('.frame2').style.display = 'none'
        document.querySelector('.fr2').style.display = 'none'
      } else if ('invalidToken' in dict) {
        document.cookie =
          'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.querySelector('.frame1').style.display = 'flex'
        document.querySelector('.frame2').style.display = 'none'
        document.querySelector('.fr2').style.display = 'none'
      } else if ('ok' in dict) {
        document.querySelector('.frame1').style.display = 'none'
        document.querySelector('.frame2').style.display = 'flex'
        document.querySelector('.fr2').style.display = 'block'

        let shot_img = document.querySelector('.shot img')
        shot_img.src = dict['picture']
        document.querySelector('.shot').appendChild(shot_img)
        document
          .querySelector('.myprofile a')
          .setAttribute('href', `/profile?member=${dict['member_id']}`)
        //通知數字變化
        notRead_num = dict['notRead']['a'] + dict['notRead']['b']

        if (notRead_num > 99) {
          notRead_num = 99
        }

        if (notRead_num > 0) {
          document.querySelector('.frame2 .notice').style.visibility = 'visible'
          document.querySelector(
            '.frame2 .notice',
          ).innerHTML = `<span>${notRead_num}</span>`
        } else {
          document.querySelector(
            '.frame2 .notice',
          ).innerHTML = `<span>${notRead_num}</span>`
          document.querySelector('.frame2 .notice').style.visibility = 'hidden'
        }
        //時間戳記
        anchortm = dict['anchortm']
      } else {
        document.querySelector('.frame1').style.display = 'flex'
        document.querySelector('.frame2').style.display = 'none'
        document.querySelector('.fr2').style.display = 'none'
      }
    })
}

// // delete all cookies
function deleteAllCookies() {
  var cookies = document.cookie.split(';')

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i]
    var eqPos = cookie.indexOf('=')
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

//顯示copyright西元年
function createYear() {
  let Today = new Date()
  document.querySelector('.year').innerHTML = Today.getFullYear()
  document.querySelector('.year').style.color = 'white'
}

//點擊頭像後下方出現個人活動編輯
document.querySelector('.shot').addEventListener('click', function (e) {
  if (document.querySelector('.myinfo').style.display === 'flex') {
    document.querySelector('.myinfo').style.display = 'none'
    document.querySelector('.fr2').style.marginTop = '0px'
  } else {
    document.querySelector('.myinfo').style.display = 'flex'
    document.querySelector('.fr2').style.display = 'block'
    document.querySelector('.fr2').style.marginTop = '118px'
  }

  //若通知留言為開啟狀態須關閉
  if (document.querySelector('.floatRight').style.display === 'block') {
    document.querySelector('.floatRight').style.display = 'none'
  }
  e.stopPropagation()
})

//點擊任何一處都使個人活動編輯、通知內容消失
document
  .getElementsByTagName('body')[0]
  .addEventListener('click', function (e) {
    if (document.querySelector('.myinfo').style.display === 'flex') {
      document.querySelector('.myinfo').style.display = 'none'
      document.querySelector('.fr2').style.marginTop = '0px'
    }

    //若通知留言為開啟狀態須關閉，除非mdal5是開啟的
    if (document.querySelector('.modal5').style.display === 'block') {
    } else {
      if (document.querySelector('.floatRight').style.display === 'block') {
        document.querySelector('.floatRight').style.display = 'none'
      }
    }
  })

//點擊登入
document.querySelector('.login').addEventListener('click', function () {
  document.cookie =
    'currentpage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;' //清除之前設定的cookie
  document.cookie = 'currentpage=' + window.location.href
  window.location.href = '/login'
})

//點擊登出
function logout() {
  fetch('/api/user', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${access_token}` },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('DELETE /api/user 錯誤:', error)
    })
    .then(function (dict) {
      if ('ok' in dict) {
        window.location.reload()
      } else {
        console.log('unknown problem', dict)
      }
    })
}
document.querySelector('.logoutA').addEventListener('click', logout)

//click alarm
document.querySelector('.alarm').addEventListener('click', function (e) {
  if (notRead_num > 0) {
    turnToRead()
  }
  if (screen.width > 650) {
    //desktop
    if (document.querySelector('.floatRight').style.display !== 'block') {
      document.querySelector('.floatRight').style.display = 'block'
      if (
        document.querySelector('.rowbox img') === null &&
        document.getElementById('emptyNotice') === null
      ) {
        noticeLoad()
        setTimeout('getNotice(0)', 500)
      }
    } else if (
      document.querySelector('.floatRight').style.display === 'block'
    ) {
      document.querySelector('.floatRight').style.display = 'none'
    }
  } else {
    if (document.querySelector('.modal11').style.display !== 'block') {
      document.querySelector('.modal11').style.display = 'block'
      if (
        document.querySelector('.modal11 .rowbox img') === null &&
        document.getElementById('emptyNotice') === null
      ) {
        noticeLoad()
        setTimeout('getNotice(0)', 500)
      }
    } else if (document.querySelector('.modal11').style.display === 'block') {
      document.querySelector('.modal11').style.display = 'none'
    }
  }
  //若頭像為開啟狀態須關閉
  if (document.querySelector('.myinfo').style.display === 'flex') {
    document.querySelector('.myinfo').style.display = 'none'
    document.querySelector('.fr2').style.marginTop = '0px'
  }
  e.stopPropagation()
})

// 將未讀變已讀(紅色警示)
function turnToRead() {
  fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify({ anchortm: anchortm }),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('PATCH /api/user 錯誤:', error)
    })
    .then(function (dict) {
      if ('invalidToken' in dict) {
        window.location.reload()
      } else if ('ok' in dict) {
        notRead_num = 0
        document.querySelector(
          '.frame2 .notice',
        ).innerHTML = `<span>${notRead_num}</span>`
        document.querySelector('.frame2 .notice').style.visibility = 'hidden'
      } else {
        console.log('unknown problem', dict)
      }
    })
}

//通知鈴鐺scroll
document
  .querySelector('.noticeBlock .rowbox')
  .addEventListener('scroll', function () {
    let ajaxHeight = this.scrollHeight
    let deviseHeight = this.offsetHeight
    let scrollable = ajaxHeight - deviseHeight
    let scrolled = this.scrollTop
    if (scrolled + 10 >= scrollable) {
      if (notice_nextPage) {
        if (noticePage_record.includes(notice_nextPage)) {
        } else {
          noticePage_record.push(notice_nextPage)
          //載入留言
          noticeLoad()
          setTimeout('getNotice(notice_nextPage)', 500)
        }
      }
    }
  })

//通知鈴鐺scroll 手機
document.querySelector('.modal11').addEventListener('scroll', function () {
  let ajaxHeight = this.scrollHeight
  let deviseHeight = screen.height
  let scrollable = ajaxHeight - deviseHeight
  let scrolled = this.scrollTop
  if (scrolled + 10 >= scrollable) {
    if (notice_nextPage) {
      if (noticePage_record.includes(notice_nextPage)) {
      } else {
        noticePage_record.push(notice_nextPage)
        //載入留言
        noticeLoad()
        setTimeout('getNotice(notice_nextPage)', 500)
      }
    }
  }
})

//close modall11
document
  .querySelector('.modal11 span:nth-child(2)')
  .addEventListener('click', function () {
    document.querySelector('.modal11').style.display = 'none'
  })

// 通知留言等待載入圖示
function noticeLoad() {
  let noticeLoad = document.createElement('div')
  noticeLoad.className = 'load'
  let imgDiv = document.createElement('div')

  let img = document.createElement('img')
  img.src =
    'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/circleYellowLoader.gif'
  imgDiv.appendChild(img)
  noticeLoad.appendChild(imgDiv)

  if (screen.width > 650) {
    document.querySelector('.noticeBlock .rowbox .tail').appendChild(noticeLoad)
  } else {
    document.querySelector('.modal11 ._2tail .rowbox').appendChild(noticeLoad)
  }
}

//點擊通知的每一行row
for (let r = 0; r < document.querySelectorAll('.rowbox row').length; r++) {
  document
    .querySelectorAll('.rowbox row')
  [r].addEventListener('click', function (e) {
    e.stopPropagation()
  })
}

// 載入通知訊息
function getNotice(page) {
  fetch('/api/user', {
    method: 'POST',
    body: JSON.stringify({ anchortm: anchortm, page: page }),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('POST /api/user 錯誤:', error)
    })
    .then(function (dict) {
      if ('invalidToken' in dict) {
        window.location.reload()
      } else if ('notice' in dict) {
        let notice = dict['notice']
        notice_nextPage = dict['nextPage']
        notice.sort(function (a, b) {
          return new Date(b['time']) - new Date(a['time'])
        })

        for (let n = 0; n < notice.length; n++) {
          if (notice[n]['name'] === 'a') {
            let A1 = notice[n]['name'],
              A2 = notice[n]['content']['board_PersonPhoto']
            let A3 = notice[n]['content']['board_PersonName'],
              A4 = notice[n]['content']['board_floor']
            let board_tm = new Date(notice[n]['time'])
            let A5 = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1,
            ).padStart(2, '0')}-${String(board_tm.getDate()).padStart(
              2,
              '0',
            )} ${String(board_tm.getHours()).padStart(2, '0')}:${String(
              board_tm.getMinutes(),
            ).padStart(2, '0')}`
            let A6 = notice[n]['content']['board_name']

            //製作link，表示留言已讀未讀，未讀底色為深，已讀沒底色
            let a_BoardLink = notice[n]["content"]["board_link"]; //not link or linked
            rowbox(A1, A2, A3, A4, A5, A6, notice[n], a_BoardLink)

          } else if (notice[n]['name'] === 'b') {
            let A1 = notice[n]['name'],
              A2 = notice[n]['content']['reply_PersonPhoto']
            let A3 = notice[n]['content']['reply_PersonName'],
              A4 = notice[n]['content']['reply_floor']
            let board_tm = new Date(notice[n]['time'])
            let A5 = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1,
            ).padStart(2, '0')}-${String(board_tm.getDate()).padStart(
              2,
              '0',
            )} ${String(board_tm.getHours()).padStart(2, '0')}:${String(
              board_tm.getMinutes(),
            ).padStart(2, '0')}`
            let A6 = notice[n]['content']['board_name']

            //製作link，表示留言已讀未讀，未讀底色為深，已讀沒底色
            let b_BoardLink = notice[n]["content"]["reply_link"]; //not link or linked
            rowbox(A1, A2, A3, A4, A5, A6, notice[n], b_BoardLink)
          }
        }

        // hover留言link底色變化，mouseover變白色，mouseleave變回原來的顏色
        for (let i = 0; i < document.querySelectorAll('.rowbox .row').length; i++) {
          document.querySelectorAll('.rowbox .row')[i].addEventListener('mouseover', () => {
            document.querySelectorAll('.rowbox .row')[i].style.backgroundColor = 'white'
          })
          document.querySelectorAll('.rowbox .row')[i].addEventListener('mouseleave', function () {
            // 依據屬性link status的值來決定留言notification的底色
            if (this.getAttribute('status') === 'nl') {
              document.querySelectorAll('.rowbox .row')[i].style.backgroundColor = '#e0e0e0'
            } else {
              document.querySelectorAll('.rowbox .row')[i].style.backgroundColor = 'transparent'
            }
          })
        }

        //點擊通知的每一行row
        for (let r = 0; r < document.querySelectorAll('.rowbox .row').length; r++) {
          document.querySelectorAll('.rowbox .row')[r].addEventListener('click', function (e) {
            let noticeid = this.getAttribute('noticeid')
            let name = notification[noticeid]['name']
            if (name === 'a') {
              let board_id = notification[noticeid]['content']['board_id']
              noticeMsg_A(board_id)
              // 若點開未讀留言，則修改狀態
              if (this.getAttribute('status') === 'nl') {
                alterLinkStatus(name, board_id) //首個參數判斷是主樓留言，還是回覆留言；末個參數是指主樓留言或回覆留言的ID
              }
            } else if (name === 'b') {
              let reply_id = notification[noticeid]['content']['reply_id']
              noticeMsg_B(reply_id)
              // 若點開未讀留言，則修改狀態
              if (this.getAttribute('status') === 'nl') { //若點開未讀留言，則修改狀態
                alterLinkStatus(name, reply_id) //首個參數判斷是主樓留言，還是回覆留言；末個參數是指主樓留言或回覆留言的ID
              }
            }
            // 改變屬性link status的值
            if (this.getAttribute('status') === 'nl') {
              document.querySelectorAll('.rowbox .row')[r].setAttribute('status', 'l')
            }
            //
            e.stopPropagation()
          })
        }

        if (page === 0 && notice.length === 0) {
          let noDiv = document.createElement('div')
          noDiv.setAttribute('id', 'emptyNotice')
          if (language === 'en') {
            noDiv.appendChild(document.createTextNode('None notification'))
          } else if (language === 'zh') {
            noDiv.appendChild(document.createTextNode('目前沒有任何通知'))
          }

          if (screen.width > 650) {
            document.querySelector('.noticeBlock .rowbox').appendChild(noDiv)
          } else {
            document.querySelector('._2tail .rowbox').appendChild(noDiv)
          }
        }
        //移除黃色loading圖示
        for (
          let r = 0;
          r < document.querySelectorAll('.rowbox .load').length;
          r++
        ) {
          document.querySelectorAll('.rowbox .load')[r].remove()
        }

        //加載畫面未超過螢幕
        if (
          (screen.width <= 650 &&
            document.querySelector('.modal11 .rowbox').offsetHeight <=
            screen.height) ||
          (screen.width > 650 &&
            document.querySelector('.floatRight .tail').offsetHeight <=
            document.querySelector('.floatRight .rowbox').offsetHeight)
        ) {
          if (notice_nextPage) {
            if (noticePage_record.includes(notice_nextPage)) {
            } else {
              noticePage_record.push(notice_nextPage)
              //載入留言
              noticeLoad()
              setTimeout('getNotice(notice_nextPage)', 500)
            }
          }
        }
      } else {
        console.log('unknown problem', dict)
      }
    })
}

// fetch api改變留言的board_link或reply_link
// 首個參數判斷是主樓留言，還是回覆留言；末個參數是指主樓留言或回覆留言的ID
function alterLinkStatus(name, mID) {
  fetch("/api/notification", {
    method: "PATCH",
    body: JSON.stringify({ main_or_reply: name, msgID: mID }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${access_token}`,
    },
  }).then(function (response) {
    if (response.ok) {
      return response.json();
    }
  })
    .catch((error) => {
      console.error("PATCH /api/notification 錯誤:", error);
    })
    .then(function (dict) {
      if (!('ok' in dict)) {
        console.log("unknown problem", dict);
      }
    })
};

// fetch 通知詳細留言內容
function noticeMsg_A(board_id) {
  clickNoticeMsg += 1
  if (clickNoticeMsg === 1) {
    popup5Load()
    fetch(`/api/message/?boardid=${board_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error('GET /api/message 錯誤:', error)
      })
      .then(function (dict) {
        if ('invalidToken' in dict) {
          document.cookie =
            'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.reload()
        } else if ('ok' in dict) {
          noticeMsg_A_window(dict['message'])
        } else if ('error' in dict) {
          if (dict['message'] === '無此筆留言') {
            emptyMsg_window()
          }
        } else {
          console.log('unknown problem', dict)
        }
        clickNoticeMsg = 0
      })
  }
}

// 點擊某樓通知訊息，等待通知訊息出現，loading...
function popup5Load() {
  document.querySelector('.modal5').style.display = 'block'
  document.querySelector('.window5').style.display = 'flex'
  document.querySelector('.popup5Load').style.display = 'block'
  document.querySelector('.popup5').style.display = 'none'
}

// 製作通知詳細留言視窗(已刪除)
function emptyMsg_window() {
  document.querySelector('.popup5Load').style.display = 'none'
  document.querySelector('.popup5').style.display = 'block'
  document.querySelector('.popup5').innerHTML = '' //淨空

  let close5 = document.createElement('div')
  close5.className = 'close5'
  let spanclose5 = document.createElement('span')
  spanclose5.appendChild(document.createTextNode('×'))
  close5.appendChild(spanclose5)
  document.querySelector('.popup5').appendChild(close5)

  let goto2 = document.createElement('div')
  goto2.className = 'goto2'
  if (language === 'en') {
    goto2.appendChild(document.createTextNode('deleted message'))
  } else if (language === 'zh') {
    goto2.appendChild(document.createTextNode('留言已刪除'))
  }

  document.querySelector('.popup5').appendChild(goto2)
  let no_line = document.createElement('div')
  no_line.className = 'no_line'

  let img = document.createElement('img')
  img.src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/empty.png'
  no_line.appendChild(img)
  document.querySelector('.popup5').appendChild(no_line)

  //關閉通知留言視窗
  document
    .querySelector('.popup5 .close5 span')
    .addEventListener('click', function (e) {
      document.querySelector('.modal5').style.display = 'none'
      document.querySelector('.window5').style.display = 'none'
      e.stopPropagation()
    })
}

// 製作通知詳細留言視窗(boardid)
function noticeMsg_A_window(para) {
  document.querySelector('.popup5Load').style.display = 'none'
  document.querySelector('.popup5').style.display = 'block'
  document.querySelector('.popup5').innerHTML = '' //淨空

  let close5 = document.createElement('div')
  close5.className = 'close5'
  let spanclose5 = document.createElement('span')
  spanclose5.appendChild(document.createTextNode('×'))
  close5.appendChild(spanclose5)
  document.querySelector('.popup5').appendChild(close5)

  let goto = document.createElement('div')
  goto.className = 'goto'
  let mainUrl = current_url.split('/')[0] + '//' + current_url.split('/')[2]
  let arrUrl = `${mainUrl}/event/${para[1]}`
  if (language === 'en') {
    goto.innerHTML = `go to<a href=${arrUrl}>activity</a>page`
  } else if (language === 'zh') {
    goto.innerHTML = `去<a href=${arrUrl}>貼文</a>查看完整留言`
  }
  document.querySelector('.popup5').appendChild(goto)
  let line = document.createElement('div')
  line.className = 'line'

  let message_photo = document.createElement('div')
  message_photo.className = 'message_photo'

  let imgDiv = document.createElement('div')
  let img = document.createElement('img')
  if (para[14] === null) {
    img.src = para[11]
  } else {
    img.src = para[14]
  }
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgDiv.appendChild(img)
  message_photo.appendChild(imgDiv)
  line.appendChild(message_photo)

  let message_middle = document.createElement('div')
  message_middle.className = 'message_middle'

  let personName = document.createElement('div')
  personName.className = 'personName'
  if (para[12] === null) {
    personName.appendChild(document.createTextNode(para[10]))
  } else {
    personName.appendChild(document.createTextNode(para[12]))
  }
  message_middle.appendChild(personName)

  let personMsg = document.createElement('div')
  personMsg.className = 'personMsg'
  personMsg.appendChild(document.createTextNode(para[3]))
  message_middle.appendChild(personMsg)

  let personBT = document.createElement('div')
  personBT.className = 'personBT'

  let floor = document.createElement('span')
  floor.className = 'floor'
  floor.appendChild(document.createTextNode(para[4] + ' · '))

  let personTM = document.createElement('span')
  personTM.className = 'personTM'
  let reply_time = new Date(para[5])
  let strReplyTm = `${reply_time.getFullYear()}-${String(
    reply_time.getMonth() + 1,
  ).padStart(2, '0')}-${String(reply_time.getDate()).padStart(2, '0')} ${String(
    reply_time.getHours(),
  ).padStart(2, '0')}:${String(reply_time.getMinutes()).padStart(2, '0')}`
  personTM.appendChild(document.createTextNode(strReplyTm))
  personBT.appendChild(floor)
  personBT.appendChild(personTM)
  message_middle.appendChild(personBT)
  line.appendChild(message_middle)
  document.querySelector('.popup5').appendChild(line)
  //關閉通知留言視窗
  document
    .querySelector('.popup5 .close5 span')
    .addEventListener('click', function (e) {
      document.querySelector('.modal5').style.display = 'none'
      document.querySelector('.window5').style.display = 'none'
      e.stopPropagation()
    })
}

// fetch 通知詳細留言內容
function noticeMsg_B(reply_id) {
  clickNoticeMsg += 1
  if (clickNoticeMsg === 1) {
    popup5Load()
    fetch(`/api/message/?replyid=${reply_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error('GET /api/message 錯誤:', error)
      })
      .then(function (dict) {
        if ('invalidToken' in dict) {
          document.cookie =
            'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.reload()
        } else if ('ok' in dict) {
          noticeMsg_B_window(dict['message'])
        } else if ('error' in dict) {
          if (dict['message'] === '無此筆留言') {
            emptyMsg_window()
          }
        } else {
          console.log('unknown problem', dict)
        }
        clickNoticeMsg = 0
      })
  }
}

// 製作通知詳細留言視窗(reply_id)
function noticeMsg_B_window(para) {
  document.querySelector('.popup5Load').style.display = 'none'
  document.querySelector('.popup5').style.display = 'block'
  document.querySelector('.popup5').innerHTML = '' //淨空

  let close5 = document.createElement('div')
  close5.className = 'close5'
  let spanclose5 = document.createElement('span')
  spanclose5.appendChild(document.createTextNode('×'))
  close5.appendChild(spanclose5)
  document.querySelector('.popup5').appendChild(close5)

  let mainUrl = current_url.split('/')[0] + '//' + current_url.split('/')[2]
  let arrUrl = `${mainUrl}/event/${para[1]}`
  let goto = document.createElement('div')
  goto.className = 'goto'
  if (language === 'en') {
    goto.innerHTML = `go to<a href=${arrUrl}>activity</a>page`
  } else if (language === 'zh') {
    goto.innerHTML = `去<a href=${arrUrl}>貼文</a>查看完整留言`
  }
  document.querySelector('.popup5').appendChild(goto)

  let line = document.createElement('div')
  line.className = 'line'

  let message_photo = document.createElement('div')
  message_photo.className = 'message_photo'

  let imgDiv = document.createElement('div')
  let img = document.createElement('img')
  if (para[14] === null) {
    img.src = para[11]
  } else {
    img.src = para[14]
  }
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgDiv.appendChild(img)
  message_photo.appendChild(imgDiv)
  line.appendChild(message_photo)

  let message_middle = document.createElement('div')
  message_middle.className = 'message_middle'

  let personName = document.createElement('div')
  personName.className = 'personName'
  if (para[12] === null) {
    personName.appendChild(document.createTextNode(para[10]))
  } else {
    personName.appendChild(document.createTextNode(para[12]))
  }
  message_middle.appendChild(personName)

  let personMsg = document.createElement('div')
  personMsg.className = 'personMsg'
  personMsg.appendChild(document.createTextNode(para[3]))
  message_middle.appendChild(personMsg)

  let personBT = document.createElement('div')
  personBT.className = 'personBT'

  let floor = document.createElement('span')
  floor.className = 'floor'
  floor.appendChild(document.createTextNode(para[4] + ' · '))

  let personTM = document.createElement('span')
  personTM.className = 'personTM'
  let reply_time = new Date(para[5])
  let strReplyTm = `${reply_time.getFullYear()}-${String(
    reply_time.getMonth() + 1,
  ).padStart(2, '0')}-${String(reply_time.getDate()).padStart(2, '0')} ${String(
    reply_time.getHours(),
  ).padStart(2, '0')}:${String(reply_time.getMinutes()).padStart(2, '0')}`
  personTM.appendChild(document.createTextNode(strReplyTm))
  personBT.appendChild(floor)
  personBT.appendChild(personTM)
  message_middle.appendChild(personBT)
  line.appendChild(message_middle)
  document.querySelector('.popup5').appendChild(line)
  //
  let _2line = document.createElement('div')
  _2line.className = '_2line'

  let leftDiv = document.createElement('div')
  _2line.appendChild(leftDiv)
  let rightDiv = document.createElement('div')
  rightDiv.className = 'right'

  let _2message_photo = document.createElement('div')
  _2message_photo.className = '_2message_photo'
  let _2imgDiv = document.createElement('div')
  let _img = document.createElement('img')
  if (para[29] === null) {
    _img.src = para[26]
  } else {
    _img.src = para[29]
  }
  _img.setAttribute('referrerpolicy', 'no-referrer')
  _2imgDiv.appendChild(_img)
  _2message_photo.appendChild(_2imgDiv)
  rightDiv.appendChild(_2message_photo)

  let _2message_middle = document.createElement('div')
  _2message_middle.className = '_2message_middle'

  let _2personName = document.createElement('div')
  _2personName.className = '_2personName'

  if (para[27] === null) {
    _2personName.appendChild(document.createTextNode(para[25]))
  } else {
    _2personName.appendChild(document.createTextNode(para[27]))
  }
  _2message_middle.appendChild(_2personName)

  let _2personMsg = document.createElement('div')
  _2personMsg.className = '_2personMsg'
  _2personMsg.appendChild(document.createTextNode(para[18]))
  _2message_middle.appendChild(_2personMsg)

  let _2personBT = document.createElement('div')
  _2personBT.className = '_2personBT'

  let _2floor = document.createElement('span')
  _2floor.className = '_2floor'
  _2floor.appendChild(document.createTextNode(para[19] + ' · '))

  let _2personTM = document.createElement('span')
  _2personTM.className = '_2personTM'
  let _reply_time = new Date(para[20])
  let _strReplyTm = `${_reply_time.getFullYear()}-${String(
    _reply_time.getMonth() + 1,
  ).padStart(2, '0')}-${String(_reply_time.getDate()).padStart(
    2,
    '0',
  )} ${String(_reply_time.getHours()).padStart(2, '0')}:${String(
    _reply_time.getMinutes(),
  ).padStart(2, '0')}`
  _2personTM.appendChild(document.createTextNode(_strReplyTm))
  _2personBT.appendChild(_2floor)
  _2personBT.appendChild(_2personTM)
  _2message_middle.appendChild(_2personBT)
  rightDiv.appendChild(_2message_middle)
  _2line.appendChild(rightDiv)
  document.querySelector('.popup5').appendChild(_2line)

  //關閉通知留言視窗
  document
    .querySelector('.popup5 .close5 span')
    .addEventListener('click', function (e) {
      document.querySelector('.modal5').style.display = 'none'
      document.querySelector('.window5').style.display = 'none'
      e.stopPropagation()
    })
}

//make rowbox Div
function rowbox(type, photo, name, floor, time, board_name, notice, linkStatus) {
  notification[Object.keys(notification).length + 1] = notice

  let rowDiv = document.createElement('div')
  rowDiv.className = 'row'
  rowDiv.setAttribute('noticeID', Object.keys(notification).length)
  //notification每條留言標明linked與否之狀態,並製作未讀留言的底色區別
  if (linkStatus === 'not link') {
    rowDiv.setAttribute('status', 'nl')
    rowDiv.style.backgroundColor = '#e0e0e0';
  } else {
    rowDiv.setAttribute('status', 'l')
  }
  //
  let photoDiv = document.createElement('div')
  photoDiv.className = 'photo'
  let imgDiv = document.createElement('div')
  let img = document.createElement('img')
  img.src = photo
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgDiv.appendChild(img)
  photoDiv.appendChild(imgDiv)
  rowDiv.appendChild(photoDiv)

  let content = document.createElement('div')
  content.className = 'content'
  let message = document.createElement('div')
  message.className = 'message'

  if (type === 'a') {
    if (language === 'en') {
      message.innerHTML = `<div>${name}</div> <div>writes a comment</div>`
    } else if (language === 'zh') {
      message.innerHTML = `<div>${name}</div> <div>在你的活動中留言</div>`
    }
  } else if (type === 'b') {
    if (language === 'en') {
      message.innerHTML = `<div>${name}</div> <div>responds your comment</div>`
    } else if (language === 'zh') {
      message.innerHTML = `<div>${name}</div> <div>回覆了你的留言</div>`
    }
  }

  content.appendChild(message)
  let messagetime = document.createElement('div')
  messagetime.className = 'messagetime'
  messagetime.appendChild(
    document.createTextNode(`${floor} · ${time.slice(0, 16)}`),
  )
  content.appendChild(messagetime)
  rowDiv.appendChild(content)

  if (screen.width > 650) {
    document.querySelector('.noticeBlock .rowbox .tail').appendChild(rowDiv)
  } else {
    document.querySelector('.modal11 ._2tail  .rowbox').appendChild(rowDiv)
  }
}

//點擊通知內容關閉
document
  .querySelector('.noticeBlock .rowbox .head span:nth-child(2)')
  .addEventListener('click', function () {
    if (document.querySelector('.floatRight').style.display === 'block') {
      document.querySelector('.floatRight').style.display = 'none'
    }
  })
