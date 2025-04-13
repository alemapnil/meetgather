var ev_title, ev_attend, ev_location, ev_address, ev_lat, ev_lng, timezone
var days_en = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']
var month_en = [
  'Jan.',
  'Feb.',
  'Mar.',
  'Apr.',
  'May.',
  'Jun.',
  'Jul.',
  'Aug.',
  'Sep.',
  'Oct.',
  'Nov.',
  'Dec.',
]

var days_cn = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
var month_cn = [
  '1 月',
  '2 月',
  '3 月',
  '4 月',
  '5 月',
  '6 月',
  '7 月',
  '8 月',
  '9 月',
  '10 月',
  '11 月',
  '12 月',
]

var ev_dayStr,
  ev_HrMin,
  google_calender,
  id,
  namelist,
  map,
  nextPage,
  ajaxRecord = [],
  messageRecord = [],
  myEmail
var nonSpacePat_O = /[\S]/,
  flag = 0

async function activity() {
  //針對event頁面做版面調整
  document.body.style.backgroundColor = '#E5E5E5'
  document.getElementById('box2id').classList.remove('box2')
  document.getElementById('box2id').classList.add('box2_event')
  id = current_url.split('/')[current_url.split('/').length - 1]
  history.replaceState({ modal: null }, 'Default state', `./${id}`)
  //
  await fetch(`/api/event/${id}`) //取得活動資訊
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('GET /api/event 錯誤:', error)
    })
    .then(function (dict) {
      if ('ok' in dict) {
        ev_title = dict['activity'][2];
      }
    })
  //
  ev_attend = parseInt(document.querySelector('.c_now_attend_p').innerHTML)
  ev_location = parseInt(document.querySelector('.spot_word').innerHTML)

  //地圖顯示
  if (ev_location === 0) {
    if (language === 'en') {
      document.querySelector('.spot_word').innerHTML = `Online`
    } else {
      document.querySelector('.spot_word').innerHTML = `線上`
    }
    document.querySelector('.tm_spot').style.height = '120px'
  } else {
    ev_lat = document.querySelector('.ev_spot .hiddenlat').innerHTML
    ev_lng = document.querySelector('.ev_spot .hiddenlng').innerHTML
    ev_address = document.querySelector('.ev_spot .hiddenadd').innerHTML
    let map_url = `https://www.google.com/maps/search/?api=1&query=${ev_lat},${ev_lng}`
    document.querySelector(
      '.spot_word',
    ).innerHTML = `<a target="_blank" href=${map_url}>${ev_address}</a>`

    let map_div = document.createElement('div')
    map_div.id = 'map'
    document.querySelector('.tm_spot').appendChild(map_div)
    initMap(ev_lat, ev_lng)
  }

  //判斷登入者是否與活動主辦人同一人
  let loginID = parseInt(
    document.querySelector('.shot').getAttribute('member_id'),
  )
  let hostID = parseInt(
    document
      .querySelector('.photo_right .host a')
      .getAttribute('href')
      .split('=')[1],
  )
  if (loginID === hostID) {
    document.querySelector('.c_edit').style.display = 'grid'
    document
      .getElementsByTagName('body')[0]
      .addEventListener('click', hambergerEvGone)
    document
      .querySelector('.c_edit .photo img')
      .addEventListener('click', function (e) {
        document.querySelector('.ev_edit_expand').style.display = 'grid'
        //編輯活動
        document
          .querySelector('.ev_edit_expand .edit a')
          .setAttribute('href', `/evedit/${id}`)
        //刪除活動
        document
          .querySelector('.ev_edit_expand .delete')
          .addEventListener('click', eventDelete)
        //通知參與者
        document
          .querySelector('.ev_edit_expand .inform')
          .addEventListener('click', eventInform)

        e.stopPropagation()
      })
  }

  // seeAll namelist
  if (ev_attend === 0) {
    document.querySelector('.seeAll').style.display = 'none'
  } else {
    document.querySelector('.seeAll').style.display = 'inline-block'
  }

  //前端時間
  let UTCTm = document.querySelector('.header .ev_tm').innerHTML
  let ev_tm = new Date(UTCTm + 'Z')
  if (language === 'en') {
    ev_dayStr = `${days_en[ev_tm.getDay()]}, ${month_en[ev_tm.getMonth()]
      } ${String(ev_tm.getDate()).padStart(2, '0')}, ${ev_tm.getFullYear()}`
  } else if (language === 'zh') {
    ev_dayStr = `${days_cn[ev_tm.getDay()]}, ${month_cn[ev_tm.getMonth()]
      } ${String(ev_tm.getDate()).padStart(2, '0')}, ${ev_tm.getFullYear()}`
  }
  ev_HrMin = `${String(ev_tm.getHours()).padStart(2, '0')}:${String(
    ev_tm.getMinutes(),
  ).padStart(2, '0')}`
  document.querySelector('.ev_tm').innerHTML = `${ev_dayStr}`
  timezone = new Date().toString().split(' ')[5]

  googleCalender(UTCTm)
  if (access_token === undefined) {
    document.querySelector(
      '.tm_word',
    ).innerHTML = `${ev_dayStr}<br/>${ev_HrMin} ${timezone}`
  } else {
    if (language === 'en') {
      document.querySelector(
        '.tm_word',
      ).innerHTML = `${ev_dayStr}<br/>${ev_HrMin} ${timezone} <div><a  target="_blank" href=${google_calender}>Record in the calender</a></div>`
    } else if (language === 'zh') {
      document.querySelector(
        '.tm_word',
      ).innerHTML = `${ev_dayStr}<br/>${ev_HrMin} ${timezone} <div><a  target="_blank" href=${google_calender}>紀錄在日曆中</a></div>`
    }
    //確認參加活動日曆
    let calender_a = document.querySelector('.add_calender a')
    calender_a.href = `${google_calender}`
  }

  joinCursor()
  attendStatus() //GET attend result

  //載入留言
  loadGif()
  setTimeout('loadMsg(`${id}_0`,`${access_token}`)', 0)

  //placeholder 語言轉換
  if (language === 'en') {
    document
      .getElementById('inform_text')
      .setAttribute('placeholder', 'Write the words to attendees.')
    document
      .getElementById('message_text')
      .setAttribute('placeholder', 'Write a comment...')
    document
      .getElementById('reply_text')
      .setAttribute('placeholder', 'Leave words...')
  } else if (language === 'zh') {
    document
      .getElementById('inform_text')
      .setAttribute('placeholder', '寫下想告訴參與者的話')
    document
      .getElementById('message_text')
      .setAttribute('placeholder', '留下你的話')
    document.getElementById('reply_text').setAttribute('placeholder', '留言')
  }

  const mQuery = window.matchMedia('(max-width:900px)')
  if (
    mQuery.matches &&
    language === 'en' &&
    document.querySelector('c_attendee br') === null
  ) {
    let div3 = document.querySelector('.c_attendee div')
    div3.insertBefore(
      document.createElement('br'),
      document.querySelector('.limit'),
    )
  }
  document.documentElement.scrollTop = 0
}

//刪除活動
function eventDelete() {
  document.querySelector('.modal6').style.display = 'block'
  document.querySelector('.window6').style.display = 'flex'
  document.querySelector('.popup6 .title').innerHTML = ev_title
  document.getElementById('delete_text').value = ''
  if (language === 'en') {
    document.querySelector('.deleteLang .english').checked = true
    document.querySelector('.deleteLang .chinese').checked = false
  } else {
    document.querySelector('.deleteLang .english').checked = false
    document.querySelector('.deleteLang .chinese').checked = true
  }
  document.getElementById('delete_text').addEventListener('input', function () {
    if (this.value === 'delete') {
      this.parentElement.querySelector('div').className = 'delete'
      document
        .querySelector('.popup6 .delete')
        .addEventListener('click', function () {
          let chinese = document.querySelector('.deleteLang .chinese').checked
          let english = document.querySelector('.deleteLang .english').checked
          flag += 1
          if (flag === 1 && (chinese === true || english === true)) {
            // delete event  close
            document
              .querySelector('.window6 .close6 span')
              .addEventListener('click', () => {
                document.querySelector('.modal6').style.display = 'block'
                document.querySelector('.window6').style.display = 'flex'
              })

            let element = document.querySelector('.popup6 .delete')
            element.classList.remove('delete')
            element.classList.add('deleteloading')
            document.querySelector('.popup6 .deleteloading').innerHTML =
              '<img src= "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/circleYellowLoader.gif"/>'
            fetch('/api/create', {
              method: 'DELETE',
              body: JSON.stringify({ id: id, language: [chinese, english] }),
              headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                Accept: 'application/json',
                Authorization: `Bearer ${access_token}`,
              },
            })
              .then(function (response) {
                return response.json()
              })
              .catch((error) => console.error('Error:', error))
              .then(function (dict) {
                if ('invalidToken' in dict) {
                  window.location.href = document.URL
                }
                if ('ok' in dict) {
                  window.location.href = '/find'
                }
                flag = 0
              })
          }
        })
    } else {
      this.parentElement.querySelector('div').className = 'notdelete'
    }
  })
}

//通知參與者
function eventInform() {
  document.querySelector('.modal7').style.display = 'block'
  document.querySelector('.window7').style.display = 'flex'
  document.querySelector('.popup7 .title').innerHTML = ev_title
  document.getElementById('inform_text').value = ''
  if (language === 'en') {
    document.querySelector('.informLang .english').checked = true
    document.querySelector('.informLang .chinese').checked = false
  } else {
    document.querySelector('.informLang .english').checked = false
    document.querySelector('.informLang .chinese').checked = true
  }
  document.getElementById('inform_text').addEventListener('input', function () {
    document
      .querySelector('.popup7 .inform')
      .addEventListener('click', function () {
        let chinese = document.querySelector('.informLang .chinese').checked
        let english = document.querySelector('.informLang .english').checked
        if (
          document.getElementById('inform_text').value.match(nonSpacePat) &&
          (chinese === true || english === true)
        ) {
          flag += 1
          if (flag === 1) {
            // delete event  close
            document
              .querySelector('.window7 .close7 span')
              .addEventListener('click', () => {
                document.querySelector('.modal7').style.display = 'block'
                document.querySelector('.window7').style.display = 'flex'
              })
            let element = document.querySelector('.popup7 .inform')
            element.classList.remove('inform')
            element.classList.add('informing')
            document.querySelector('.popup7 .informing').innerHTML =
              '<img src= "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/circleYellowLoader.gif"/>'

            fetch('/api/email', {
              method: 'POST',
              body: JSON.stringify({
                url: window.location.href,
                inform: document.getElementById('inform_text').value.trim(),
                language: [chinese, english],
                id: id,
              }),
              headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                Accept: 'application/json',
                Authorization: `Bearer ${access_token}`,
              },
            })
              .then(function (response) {
                return response.json()
              })
              .catch((error) => console.error('Error:', error))
              .then(function (dict) {
                if ('invalidToken' in dict) {
                  window.location.href = document.URL
                }
                if ('ok' in dict) {
                  //恢復關閉功能
                  document
                    .querySelector('.window7 .close7 span')
                    .addEventListener('click', () => {
                      document.querySelector('.modal7').style.display = 'none'
                      document.querySelector('.window7').style.display = 'none'
                    })
                  document.querySelector('.window7 .close7 span').click()
                  //回覆寄信按鈕
                  element.classList.remove('informing')
                  element.classList.add('inform')
                  if (language === 'en') {
                    element.innerHTML = 'Email'
                  } else if (language === 'zh') {
                    element.innerHTML = '寄信'
                  }
                  //發信成功通知
                  myEmail = dict['email']
                  let modal = 8
                  history.pushState(
                    { modal },
                    `Selected : ${modal}`,
                    `modal=${modal}`,
                  )
                  selectBox(modal)
                }
                flag = 0
              })
          }
        }
      })
  })
}

//loading gif
function loadGif() {
  let messageLoad = document.createElement('div')
  messageLoad.className = 'messageLoad'
  let imgDiv = document.createElement('div')
  imgDiv.className = 'messageLoad_div'

  let g_img = document.createElement('img')
  g_img.className = 'messageLoad_div_img'
  g_img.src =
    'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/circleYellowLoader.gif'

  imgDiv.appendChild(g_img)
  messageLoad.appendChild(imgDiv)
  document.querySelector('.c_message').appendChild(messageLoad)
}

// 載入留言函式
function loadMsg(para, access_token) {
  let head
  if (access_token !== undefined) {
    head = {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    }
  } else {
    head = { method: 'GET' }
  }

  fetch(`/api/board/${para}`, head)
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error(`GET /api/board/${id} 回傳值`, error)
    })
    .then(function (dict) {
      if ('invalidToken' in dict) {
        access_token = undefined
        loadMsg(para, access_token)
      } else {
        nextPage = dict['nextPage']
        let boardData = dict['data']
        if (boardData.length > 0) {
          for (let b = 0; b < boardData.length; b++) {
            let board_id = boardData[b]['board_id'],
              memberId = boardData[b]['member_id']
            //UTC
            let board_msg = boardData[b]['board_msg'],
              board_time = boardData[b]['board_time']
            let board_floor = boardData[b]['board_floor'],
              person = boardData[b]['person'],
              photo = boardData[b]['photo']
            let reply = boardData[b]['reply']
            let board_tm = new Date(board_time)
            let strBoardTm = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1,
            ).padStart(2, '0')}-${String(board_tm.getDate()).padStart(
              2,
              '0',
            )} ${String(board_tm.getHours()).padStart(2, '0')}:${String(
              board_tm.getMinutes(),
            ).padStart(2, '0')}`

            //只呈現沒呈現過的留言樓層
            if (!messageRecord.includes(board_id)) {
              msgDiv(
                dict['logger'],
                memberId,
                board_id,
                board_msg,
                strBoardTm,
                person,
                photo,
                board_floor,
              )

              if (reply.length > 0) {
                //有回覆
                replyMain(board_id)
                //查看其他回覆留言
                let hideReply = document.createElement('div')
                hideReply.className = 'hideReply'
                let div1 = document.createElement('div')
                hideReply.appendChild(div1)
                let div2 = document.createElement('div')
                div2.className = 'word'
                if (language === 'en') {
                  if (reply.length === 1) {
                    div2.innerHTML = `View <span>${reply.length}</span> reply`
                  } else {
                    div2.innerHTML = `View <span>${reply.length}</span> replies`
                  }
                } else if (language === 'zh') {
                  div2.innerHTML = `查看 <span>${reply.length}</span> 則回覆留言`
                }
                hideReply.appendChild(div2)
                document
                  .querySelector(`[boardID="${board_id}"]`)
                  .appendChild(hideReply)
                //製作回覆留言
                for (let r = 0; r < reply.length; r++) {
                  let row = reply[r]
                  let name, photo
                  if (row[12] === null) {
                    name = row[10]
                  } else {
                    name = row[12]
                  }
                  if (row[14] === null) {
                    photo = row[11]
                  } else {
                    photo = row[14]
                  }
                  //UTC
                  let reply_time = new Date(row[5])
                  let strReplyTm = `${reply_time.getFullYear()}-${String(
                    reply_time.getMonth() + 1,
                  ).padStart(2, '0')}-${String(reply_time.getDate()).padStart(
                    2,
                    '0',
                  )} ${String(reply_time.getHours()).padStart(2, '0')}:${String(
                    reply_time.getMinutes(),
                  ).padStart(2, '0')}`
                  replyLine(
                    dict['logger'],
                    row[8],
                    row[1],
                    row[0],
                    row[3],
                    strReplyTm,
                    name,
                    photo,
                    row[4],
                  )
                }
                //隱藏回覆留言
                let _2lineAll = document
                  .querySelector(`[boardID="${board_id}"]`)
                  .querySelectorAll('._2line')
                for (let d = 0; d < _2lineAll.length; d++) {
                  _2lineAll[d].style.display = 'none'
                }

                document.querySelector(
                  `[boardID="${board_id}"]`,
                ).style.borderBottom = '1px solid #BEBEBE'
              } else {
                //無回覆
                document.querySelector(
                  `[data-id="${board_id}"]`,
                ).style.borderBottom = '1px solid #BEBEBE'
              }
              messageRecord.push(board_id)
            }
          }
        } else if (boardData.length === 0 && ajaxRecord.length === 0) {
          emptyMsgDiv()
        }
        document.querySelector('.messageLoad').remove()
        hambergerMsg()
        //點擊任何一處都使留言編輯消失
        document
          .getElementsByTagName('body')[0]
          .removeEventListener('click', hambergerMsgGone)
        document
          .getElementsByTagName('body')[0]
          .addEventListener('click', hambergerMsgGone)
        //查看回覆
        for (
          let d = 0;
          d < document.querySelectorAll('.hideReply .word').length;
          d++
        ) {
          document
            .querySelectorAll('.hideReply .word')
          [d].removeEventListener('click', conceal)
          document
            .querySelectorAll('.hideReply .word')
          [d].addEventListener('click', conceal)
        }
      }
    })
}

//沒有留言板
function emptyMsgDiv() {
  let empty = document.createElement('span')
  empty.className = 'empty'
  if (language === 'en') {
    empty.appendChild(document.createTextNode('No comment now.'))
  } else if (language === 'zh') {
    empty.appendChild(document.createTextNode('目前沒有任何留言'))
  }
  document.querySelector('.c_message').appendChild(empty)
}

//製作留言板 .line
function msgDiv(
  logger,
  memberId,
  board_id,
  board_msg,
  strBoardTm,
  person,
  photo,
  board_floor,
) {
  let line = document.createElement('div')
  line.className = 'line'
  line.setAttribute('data-id', board_id)

  let message_photo = document.createElement('div')
  message_photo.className = 'message_photo'
  message_photo.setAttribute('data-memberId', memberId)
  message_photo.setAttribute('data-logger', logger)

  let imgdiv = document.createElement('div')
  let imgA = document.createElement('a')
  imgA.setAttribute('href', `/profile?member=${memberId}`)
  let img = document.createElement('img')
  img.src = photo
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgA.appendChild(img)
  imgdiv.appendChild(imgA)
  message_photo.appendChild(imgdiv)
  line.appendChild(message_photo)

  let message_middle = document.createElement('div')
  message_middle.className = 'message_middle'

  let personName = document.createElement('div')
  personName.className = 'personName'
  let spanA = document.createElement('a')
  spanA.setAttribute('href', `/profile?member=${memberId}`)
  let namespan = document.createElement('span')
  namespan.appendChild(document.createTextNode(person))
  spanA.appendChild(namespan)
  personName.appendChild(spanA)
  message_middle.appendChild(personName)

  let personMsg = document.createElement('div')
  personMsg.className = 'personMsg'
  personMsg.appendChild(document.createTextNode(board_msg))
  message_middle.appendChild(personMsg)

  let personBT = document.createElement('div')
  personBT.className = 'personBT'

  let floor = document.createElement('span')
  floor.className = 'floor'
  floor.appendChild(document.createTextNode(board_floor + ' · '))
  personBT.appendChild(floor)

  let personTM = document.createElement('span')
  personTM.className = 'personTM'
  personTM.appendChild(document.createTextNode(strBoardTm))
  personBT.appendChild(personTM)

  if (access_token !== undefined) {
    let response = document.createElement('span')
    response.className = 'response'
    if (language === 'en') {
      response.appendChild(document.createTextNode('reply'))
    } else if (language === 'zh') {
      response.appendChild(document.createTextNode('回覆'))
    }
    personBT.appendChild(response)
  }

  message_middle.appendChild(personBT)
  line.appendChild(message_middle)

  let message_work = document.createElement('div')
  message_work.className = 'message_work'

  if (memberId === logger) {
    let imgwork = document.createElement('img')
    imgwork.src =
      'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/comment.svg'
    message_work.appendChild(imgwork)

    let message_work_expand = document.createElement('div')
    message_work_expand.className = 'message_work_expand'

    let edit = document.createElement('div')
    edit.className = 'edit'
    if (language === 'en') {
      edit.appendChild(document.createTextNode('Edit'))
    } else if (language === 'zh') {
      edit.appendChild(document.createTextNode('編輯留言'))
    }
    message_work_expand.appendChild(edit)

    let deleteD = document.createElement('div')
    deleteD.className = 'delete'
    if (language === 'en') {
      deleteD.appendChild(document.createTextNode('Delete'))
    } else if (language === 'zh') {
      deleteD.appendChild(document.createTextNode('刪除留言'))
    }
    message_work_expand.appendChild(deleteD)
    message_work.appendChild(message_work_expand)
  }
  line.appendChild(message_work)
  document.querySelector('.c_message').appendChild(line)
}

//製作回覆板
function replyMain(board_id) {
  let reply = document.createElement('div')
  reply.className = 'reply'
  reply.setAttribute('boardID', board_id)
  document.querySelector('.c_message').appendChild(reply)
}

function replyLine(
  logger,
  memberId,
  board_id,
  reply_id,
  reply_msg,
  reply_time,
  person,
  photo,
  reply_floor,
) {
  let _2line = document.createElement('div')
  _2line.className = '_2line'
  _2line.setAttribute('replyID', reply_id)

  let left = document.createElement('div')
  left.className = 'left'
  let right = document.createElement('div')
  right.className = 'right'

  let _2message_photo = document.createElement('div')
  _2message_photo.className = '_2message_photo'
  _2message_photo.setAttribute('memberId', memberId)
  _2message_photo.setAttribute('logger', logger)

  let imgdiv = document.createElement('div')
  let imgA = document.createElement('a')
  imgA.setAttribute('href', `/profile?member=${memberId}`)
  let img = document.createElement('img')
  img.src = photo
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgA.appendChild(img)
  imgdiv.appendChild(imgA)
  _2message_photo.appendChild(imgdiv)
  right.appendChild(_2message_photo)

  let _2message_middle = document.createElement('div')
  _2message_middle.className = '_2message_middle'

  let _2personName = document.createElement('div')
  _2personName.className = '_2personName'

  let spanA = document.createElement('a')
  spanA.setAttribute('href', `/profile?member=${memberId}`)
  let namespan = document.createElement('span')
  namespan.appendChild(document.createTextNode(person))
  spanA.appendChild(namespan)
  _2personName.appendChild(spanA)
  _2message_middle.appendChild(_2personName)

  let _2personMsg = document.createElement('div')
  _2personMsg.className = '_2personMsg'
  _2personMsg.appendChild(document.createTextNode(reply_msg))
  _2message_middle.appendChild(_2personMsg)

  let _2personBT = document.createElement('div')
  _2personBT.className = '_2personBT'

  let _2floor = document.createElement('span')
  _2floor.className = '_2floor'
  _2floor.appendChild(document.createTextNode(reply_floor + ' · '))
  _2personBT.appendChild(_2floor)

  let _2personTM = document.createElement('span')
  _2personTM.className = '_2personTM'
  _2personTM.appendChild(document.createTextNode(reply_time))
  _2personBT.appendChild(_2personTM)
  _2message_middle.appendChild(_2personBT)
  right.appendChild(_2message_middle)

  let _2message_work = document.createElement('div')
  _2message_work.className = '_2message_work'

  if (logger === memberId) {
    let imgwork = document.createElement('img')
    imgwork.src =
      'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/comment.svg'
    _2message_work.appendChild(imgwork)

    let _2message_work_expand = document.createElement('div')
    _2message_work_expand.className = '_2message_work_expand'

    let _2edit = document.createElement('div')
    _2edit.className = '_2edit'
    if (language === 'en') {
      _2edit.appendChild(document.createTextNode('Edit'))
    } else if (language === 'zh') {
      _2edit.appendChild(document.createTextNode('編輯留言'))
    }
    _2message_work_expand.appendChild(_2edit)

    let _2delete = document.createElement('div')
    _2delete.className = '_2delete'
    if (language === 'en') {
      _2delete.appendChild(document.createTextNode('Delete'))
    } else if (language === 'zh') {
      _2delete.appendChild(document.createTextNode('刪除留言'))
    }
    _2message_work_expand.appendChild(_2delete)
    _2message_work.appendChild(_2message_work_expand)
  }
  //
  right.appendChild(_2message_work)
  _2line.appendChild(left)
  _2line.appendChild(right)

  document.querySelector(`[boardID="${board_id}"]`).appendChild(_2line)

  //點擊 class _2line的頭像與姓名
  let lastIndex = document.querySelectorAll('.c_message ._2line').length - 1
  let mainUrl = current_url.split('/')[0] + '//' + current_url.split('/')[2]
  let data_memberid = document
    .querySelectorAll('.c_message ._2line ._2message_photo')
  [lastIndex].getAttribute('memberid')
}

//製作第一個節點留言
function leaveMsg(
  logger,
  memberId,
  board_id,
  board_msg,
  strBoardTm,
  person,
  photo,
  board_floor,
) {
  let line = document.createElement('div')
  line.className = 'line'
  line.setAttribute('data-id', board_id)

  let message_photo = document.createElement('div')
  message_photo.className = 'message_photo'
  message_photo.setAttribute('data-memberId', memberId)
  message_photo.setAttribute('data-logger', logger)

  let imgdiv = document.createElement('div')
  let imgA = document.createElement('a')
  imgA.setAttribute('href', `/profile?member=${memberId}`)
  let img = document.createElement('img')
  img.src = photo
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgA.appendChild(img)
  imgdiv.appendChild(imgA)
  message_photo.appendChild(imgdiv)
  line.appendChild(message_photo)

  let message_middle = document.createElement('div')
  message_middle.className = 'message_middle'

  let personName = document.createElement('div')
  personName.className = 'personName'
  let spanA = document.createElement('a')
  spanA.setAttribute('href', `/profile?member=${memberId}`)
  let namespan = document.createElement('span')
  namespan.appendChild(document.createTextNode(person))
  spanA.appendChild(namespan)
  personName.appendChild(spanA)
  message_middle.appendChild(personName)

  let personMsg = document.createElement('div')
  personMsg.className = 'personMsg'
  personMsg.appendChild(document.createTextNode(board_msg))
  message_middle.appendChild(personMsg)

  let personBT = document.createElement('div')
  personBT.className = 'personBT'

  let floor = document.createElement('span')
  floor.className = 'floor'
  floor.appendChild(document.createTextNode(board_floor + ' · '))
  personBT.appendChild(floor)

  let personTM = document.createElement('span')
  personTM.className = 'personTM'
  personTM.appendChild(document.createTextNode(strBoardTm))
  personBT.appendChild(personTM)

  if (access_token !== undefined) {
    let response = document.createElement('span')
    response.className = 'response'
    if (language === 'en') {
      response.appendChild(document.createTextNode('reply'))
    } else if (language === 'zh') {
      response.appendChild(document.createTextNode('回覆'))
    }
    personBT.appendChild(response)
  }

  message_middle.appendChild(personBT)
  line.appendChild(message_middle)

  let message_work = document.createElement('div')
  message_work.className = 'message_work'
  let imgwork = document.createElement('img')
  imgwork.src =
    'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/comment.svg'
  message_work.appendChild(imgwork)

  let message_work_expand = document.createElement('div')
  message_work_expand.className = 'message_work_expand'

  let edit = document.createElement('div')
  edit.className = 'edit'
  if (language === 'en') {
    edit.appendChild(document.createTextNode('Edit'))
  } else if (language === 'zh') {
    edit.appendChild(document.createTextNode('編輯留言'))
  }
  message_work_expand.appendChild(edit)

  let deleteD = document.createElement('div')
  deleteD.className = 'delete'
  if (language === 'en') {
    deleteD.appendChild(document.createTextNode('Delete'))
  } else if (language === 'zh') {
    deleteD.appendChild(document.createTextNode('刪除留言'))
  }
  message_work_expand.appendChild(deleteD)
  message_work.appendChild(message_work_expand)
  //
  line.appendChild(message_work)
  return line
}

// 將UTC時間轉成東八區時間
function Gmt8TmStrCalender(tm) {
  let Gmt8TmStr = new Date(tm + 'Z').toLocaleString('en-US', {
    timeZone: 'Asia/Taipei',
  })
  let loY = Gmt8TmStr.split(',')[0].split('/')[2],
    loM = Gmt8TmStr.split(',')[0].split('/')[0],
    loD = Gmt8TmStr.split(',')[0].split('/')[1]
  let loH = parseInt(Gmt8TmStr.split(',')[1].split(':')[0]),
    lom = Gmt8TmStr.split(',')[1].split(':')[1]
  let _12hour = Gmt8TmStr.split(' ')[2]
  if (_12hour === 'PM' && loH < 12) {
    loH += 12
  } else if (_12hour === 'AM' && loH === 12) {
    loH = '00'
  }
  return `${loY}-${padZero(loM)}-${padZero(loD)}T${padZero(loH)}:${padZero(
    lom,
  )}:00`
}

//google Calender
function googleCalender(para) {
  let calendar_url = 'https://calendar.google.com/calendar/u/0/r/eventedit?'
  let calender_title = ev_title.replace(' ', '+')
  let calender_add
  if (ev_location === 0) {
    if (language === 'en') {
      calender_add = 'Online'
    } else {
      calender_add = '線上'
    }
  } else {
    calender_add = ev_address.replace(' ', '+')
  }
  let calender_date = Gmt8TmStrCalender(para)
    .replaceAll('-', '')
    .replaceAll(':', '')
  let calender_detail = `更多資訊請看 ${window.location.href}`.replace(' ', '+')
  google_calender = `${calendar_url}text=${calender_title}&dates=${calender_date}/${calender_date}&location=${calender_add}&details=${calender_detail}&ctz=Asia/Taipei`
  console.log(google_calender)
}

// google map
function initMap(para1, para2) {
  var location = {
    lat: parseFloat(para1),
    lng: parseFloat(para2),
  }
  var options = {
    center: location,
    zoom: 14,
  }
  map = new google.maps.Map(document.getElementById('map'), options)
  new google.maps.Marker({
    position: location,
    map: map,
  })
}

//點參加或取消參加
document
  .querySelector('.c_join  div:nth-of-type(2n)')
  .addEventListener('click', function (e) {
    if (access_token === undefined) {
      if (
        document.querySelector('.c_join  div:nth-of-type(2n) span')
          .className === 'full' ||
        document.querySelector('.c_join  div:nth-of-type(2n) span')
          .className === 'expired'
      ) {
        document.querySelector('.c_join  div:nth-of-type(2n)').className =
          'join_tm_over'
      } else {
        loginWarnUp()
      }
    } else {
      if (
        document.querySelector('.c_join  div:nth-of-type(2n) span')
          .className === 'in'
      ) {
        flag += 1
        if (flag === 1) {
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).innerHTML = `<div class="attendPic"><img src="https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif"></div>`
          joinCursor()
          fetch('/api/attend', {
            method: 'POST',
            body: JSON.stringify({ activity: id, attendee: userEmail }),
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              Accept: 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
          })
            .then(function (response) {
              return response.json()
            })
            .catch((error) => console.error('Error:', error))
            .then(function (dict) {
              if ('ok' in dict) {
                let modal = 2
                history.pushState(
                  { modal },
                  `Selected : ${modal}`,
                  `modal=${modal}`,
                )
                selectBox(modal)

                  //更新人數
                  ; (ev_attend = dict['allJoinNum']), (namelist = dict['namelist'])
                document.querySelector(
                  '.c_now_attend_p',
                ).innerHTML = `${ev_attend}`

                // seeAll
                if (namelist.length === 0) {
                  document.querySelector('.seeAll').style.display = 'none'
                } else {
                  document.querySelector('.seeAll').style.display =
                    'inline-block'
                }
              } else if ('error' in dict && dict['message'] === '已滿額') {
                if (language === 'en') {
                  document.querySelector(
                    '.c_join  div:nth-of-type(2n) span',
                  ).innerHTML = 'Full'
                } else if (language === 'zh') {
                  document.querySelector(
                    '.c_join  div:nth-of-type(2n) span',
                  ).innerHTML = '滿額'
                }
                document.querySelector(
                  '.c_join  div:nth-of-type(2n) span',
                ).className = 'full'
                document.querySelector(
                  '.c_join  div:nth-of-type(2n)',
                ).className = 'join_tm_over'
              } else if (
                'error' in dict &&
                dict['message'] === '已過活動時間'
              ) {
                if (language === 'en') {
                  document.querySelector(
                    '.c_join  div:nth-of-type(2n) span',
                  ).innerHTML = 'Expired'
                } else if (language === 'zh') {
                  document.querySelector(
                    '.c_join  div:nth-of-type(2n) span',
                  ).innerHTML = '活動已過期'
                }
                document.querySelector(
                  '.c_join  div:nth-of-type(2n) span',
                ).className = 'expired'
                document.querySelector(
                  '.c_join  div:nth-of-type(2n)',
                ).className = 'join_tm_over'
              } else {
                if ('invalidToken' in dict) {
                  window.location.href = document.URL
                } else {
                  console.log('unknown problem', dict)
                }
              }
              joinCursor()
              flag = 0
            })
        }
      } else if (
        document.querySelector('.c_join  div:nth-of-type(2n) span')
          .className === 'out'
      ) {
        let modal = 9
        history.pushState({ modal }, `Selected : ${modal}`, `modal=${modal}`)
        selectBox(modal)
        document
          .querySelector('.popup9 .cancel')
          .addEventListener('click', () => {
            //確定取消參加
            flag += 1
            if (flag === 1) {
              document.querySelector(
                '.popup9 .cancel',
              ).innerHTML = `<div><img src="https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif"></div>`
              joinCursor()
              fetch('/api/attend', {
                method: 'DELETE',
                body: JSON.stringify({ activity: id, attendee: userEmail }),
                headers: {
                  'Content-Type': 'application/json; charset=UTF-8',
                  Accept: 'application/json',
                  Authorization: `Bearer ${access_token}`,
                },
              })
                .then(function (response) {
                  return response.json()
                })
                .catch((error) => console.error('Error:', error))
                .then(function (dict) {
                  if ('ok' in dict) {
                    if (language === 'en') {
                      document.querySelector(
                        '.c_join  div:nth-of-type(2n) span',
                      ).innerHTML = 'Attend'
                    } else if (language === 'zh') {
                      document.querySelector(
                        '.c_join  div:nth-of-type(2n) span',
                      ).innerHTML = '參加'
                    }
                    document.querySelector(
                      '.c_join  div:nth-of-type(2n) span',
                    ).className = 'in'
                      //更新人數
                      ; (ev_attend = dict['allJoinNum']),
                        (namelist = dict['namelist'])
                    document.querySelector(
                      '.c_now_attend_p',
                    ).innerHTML = `${ev_attend}`
                    // seeAll
                    if (namelist.length === 0) {
                      document.querySelector('.seeAll').style.display = 'none'
                    } else {
                      document.querySelector('.seeAll').style.display =
                        'inline-block'
                    }
                    if (
                      document.querySelector(`.modal9`).style.display !== 'none'
                    ) {
                      //離開確定取消參加頁面
                      document.querySelector('.popup9 .back span').click()
                    }
                  } else {
                    if ('invalidToken' in dict) {
                      window.location.href = document.URL
                    } else if (
                      'error' in dict &&
                      dict['message'] === '無參加紀錄'
                    ) {
                      document.querySelector('.popup9 .back span').click()
                    } else {
                      console.log('unknown problem', dict)
                    }
                  }
                  if (language === 'en') {
                    document.querySelector(
                      '.popup9 .cancel',
                    ).innerHTML = `<span>OK</span>`
                  } else if (language === 'zh') {
                    document.querySelector(
                      '.popup9 .cancel',
                    ).innerHTML = `<span>確定</span>`
                  }
                  joinCursor()
                  flag = 0
                })
            }
          })
      }
    }
  })

function joinCursor() {
  if (
    document.querySelector('.c_join  div:nth-of-type(2n) span').className ===
    'in' ||
    document.querySelector('.c_join  div:nth-of-type(2n) span').className ===
    'out'
  ) {
    document.querySelector('.c_join  div:nth-of-type(2n)').style.cursor =
      'pointer'
  } else {
    document.querySelector('.c_join  div:nth-of-type(2n)').style.cursor =
      'default'
  }
}

//login warn close
document.querySelector('.window1 .close span').addEventListener('click', () => {
  loginWarnGone()
})

// share link close
document
  .querySelector('.window3 .close3 span')
  .addEventListener('click', () => {
    document.querySelector('.modal3').style.display = 'none'
    document.querySelector('.window3').style.display = 'none'
  })

// seeAll  close
document.querySelector('.window4 .close4').addEventListener('click', () => {
  document.querySelector('.modal4').style.display = 'none'
  document.querySelector('.window4').style.display = 'none'
})

// delete event  close
document
  .querySelector('.window6 .close6 span')
  .addEventListener('click', () => {
    document.querySelector('.modal6').style.display = 'none'
    document.querySelector('.window6').style.display = 'none'
  })

// inform attendee close
document
  .querySelector('.window7 .close7 span')
  .addEventListener('click', () => {
    document.querySelector('.modal7').style.display = 'none'
    document.querySelector('.window7').style.display = 'none'
  })

//回到活動頁面
document
  .querySelector('.popup2 .back div img')
  .addEventListener('click', () => {
    history.go(-1)
  })
document.querySelector('.popup2 .back span').addEventListener('click', () => {
  history.go(-1)
})

document
  .querySelector('.popup8 .back div img')
  .addEventListener('click', () => {
    history.go(-1)
  })
document.querySelector('.popup8 .back span').addEventListener('click', () => {
  history.go(-1)
})

document
  .querySelector('.popup9 .back div img')
  .addEventListener('click', () => {
    history.go(-1)
  })
document.querySelector('.popup9 .back span').addEventListener('click', () => {
  history.go(-1)
})

function clearModal() {
  document.querySelector(`.modal2`).style.display = 'none'
  document.querySelector(`.window2`).style.display = 'none'
  document.querySelector(`.modal8`).style.display = 'none'
  document.querySelector(`.window8`).style.display = 'none'
  document.querySelector(`.modal9`).style.display = 'none'
  document.querySelector(`.window9`).style.display = 'none'
}

//click share
document.querySelector('.c_join .share').addEventListener('click', function () {
  document.querySelector('.modal3').style.display = 'block'
  document.querySelector('.window3').style.display = 'flex'
})

//set share link
for (let a = 0; a < document.querySelectorAll('.fb a').length; a++) {
  document.querySelectorAll('.fb a')[
    a
  ].href = `https://www.facebook.com/share.php?u=${window.location.href}`
}
for (let a = 0; a < document.querySelectorAll('.twi a').length; a++) {
  document.querySelectorAll('.twi a')[
    a
  ].href = `https://twitter.com/share?url=${window.location.href}`
}
for (let a = 0; a < document.querySelectorAll('.lineshare a').length; a++) {
  document.querySelectorAll('.lineshare a')[
    a
  ].href = `https://social-plugins.line.me/lineit/share?url=${window.location.href}`
}

//click seeAll
document.querySelector('.seeAll').addEventListener('click', function () {
  document.querySelector('.modal4').style.display = 'block'
  document.querySelector('.window4').style.display = 'flex'
  document.querySelector(
    '.person span:nth-of-type(2)',
  ).innerHTML = `${ev_attend}`

  if (namelist === undefined) {
    if (language === 'en') {
      document.querySelector('.nameList').innerHTML =
        '<span style="color: gray;">Loading...</span>'
    } else if (language === 'zh') {
      document.querySelector('.nameList').innerHTML =
        '<span style="color: gray;">載入中...</span>'
    }
    //
    fetch(`/api/namelist/${id}`, {
      method: 'POST',
      body: JSON.stringify({ num: ev_attend }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
      },
    })
      .then(function (response) {
        return response.json()
      })
      .catch((error) => console.error('Error:', error))
      .then(function (dict) {
        namelist = dict['namelist']
        makeNamelist(dict['namelist'])
      })
  } else {
    makeNamelist(namelist)
  }
})

function makeNamelist(namelist) {
  document.querySelector('.nameList').innerHTML = ''
  for (let s = 0; s < namelist.length; s++) {
    let email_id = namelist[s][3],
      name,
      photo
    if (namelist[s][7] === null) {
      name = namelist[s][5]
    } else {
      name = namelist[s][7]
    }

    if (namelist[s][9] === null) {
      photo = namelist[s][6]
    } else {
      photo = namelist[s][9]
    }
    let rowDiv = document.createElement('div')
    rowDiv.className = 'row'

    let imgDiv = document.createElement('div')
    let imgA = document.createElement('a')
    imgA.setAttribute('href', `/profile?member=${email_id}`)
    let imgSelf = document.createElement('img')
    imgSelf.setAttribute('referrerpolicy', 'no-referrer')
    imgSelf.src = photo
    imgA.appendChild(imgSelf)
    imgDiv.appendChild(imgA)

    let nameDiv = document.createElement('div')
    let spanA = document.createElement('a')
    spanA.setAttribute('href', `/profile?member=${email_id}`)
    let spanSelf = document.createElement('span')
    spanSelf.appendChild(document.createTextNode(name))
    spanA.appendChild(spanSelf)

    nameDiv.appendChild(spanA)
    rowDiv.appendChild(imgDiv)
    rowDiv.appendChild(nameDiv)
    document.querySelector('.nameList').appendChild(rowDiv)
  }
}

// mouseover 留下你的話之留言
document.querySelector('.sendM').addEventListener('mouseover', () => {
  let message = document.getElementById('message_text').value
  if (message.match(nonSpacePat)) {
    document.querySelector('.sendM').style.cursor = 'pointer'
  } else {
    document.querySelector('.sendM').style.cursor = 'not-allowed'
  }
})

function loginWarnUp() {
  document.querySelector('.modal1').style.display = 'block'
  document.querySelector('.window1').style.display = 'flex'
  document.querySelector('.popup1').style.animation = 'loginUp 0.5s'

  setTimeout(() => {
    if (document.querySelector('.modal1').style.display === 'block') {
      loginWarnGone()
    }
  }, 8000)
}

function loginWarnGone() {
  document.querySelector('.popup1').style.animation = 'loginGone 0.5s'
  setTimeout(() => {
    document.querySelector('.modal1').style.display = 'none'
    document.querySelector('.window1').style.display = 'none'
  }, 450)
}

// click 留下你的話之留言
document.querySelector('.sendM').addEventListener('click', function () {
  let message = document.getElementById('message_text').value
  if (message.match(nonSpacePat)) {
    if (access_token === undefined) {
      loginWarnUp()
    } else {
      if (flag === 0) {
        flag += 1
        document.querySelector('.sendM').innerHTML =
          '<div><img src="https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif"></div>'
        fetch('/api/board', {
          method: 'POST',
          body: JSON.stringify({ activity: id, message: message }),
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
        })
          .then(function (response) {
            return response.json()
          })
          .catch((error) => console.error('Error:', error))
          .then(function (dict) {
            if ('ok' in dict) {
              document.getElementById('message_text').value = ''
              let board_msg = dict['inserttuple'][2]
              let person = dict['inserttuple'][7],
                photo = dict['inserttuple'][8],
                board_floor = dict['inserttuple'][3]

              let board_tm = new Date(dict['inserttuple'][4])
              let strBoardTm = `${board_tm.getFullYear()}-${String(
                board_tm.getMonth() + 1,
              ).padStart(2, '0')}-${String(board_tm.getDate()).padStart(
                2,
                '0',
              )} ${String(board_tm.getHours()).padStart(2, '0')}:${String(
                board_tm.getMinutes(),
              ).padStart(2, '0')}`

              let logger = dict['logger'],
                memberId = dict['logger'],
                board_id = dict['board_id']
              document
                .querySelector('.c_message')
                .insertBefore(
                  leaveMsg(
                    logger,
                    memberId,
                    board_id,
                    board_msg,
                    strBoardTm,
                    person,
                    photo,
                    board_floor,
                  ),
                  document.querySelector('.line'),
                )
              document.querySelector('.line').style.borderBottom =
                '1px solid #BEBEBE'
              if (language === 'en') {
                document.querySelector('.sendM').innerHTML = '<span>Send</span>'
              } else if (language === 'zh') {
                document.querySelector('.sendM').innerHTML = '<span>送出</span>'
              }

              //remove 目前沒有留言
              if (document.querySelector('.empty') !== null) {
                document.querySelector('.empty').remove()
              }

              flag = 0
              hambergerMsg()
            } else if ('invalidToken' in dict) {
              window.location.href = document.URL
            }
          })
      }
    }
  } else {
    document.querySelector('.sendM').style.cursor = 'not-allowed'
  }
})

function editGone() {
  //先使其他編輯留言消失
  for (let j = 0; j < document.querySelectorAll('.line').length; j++) {
    if (
      document.querySelectorAll('.line')[j].querySelector('.editline') != null
    ) {
      document.querySelectorAll('.line')[j].querySelector('.editline').remove()
      document
        .querySelectorAll('.line')
      [j].querySelector('.personMsg').style.display = 'block'
      document
        .querySelectorAll('.line')
      [j].querySelector('.personBT').style.display = 'block'
      document
        .querySelectorAll('.line')
      [j].querySelector('.message_work').style.display = 'block'
    }
  }
  for (let j = 0; j < document.querySelectorAll('._2line').length; j++) {
    if (
      document.querySelectorAll('._2line')[j].querySelector('._2editline') !=
      null
    ) {
      document
        .querySelectorAll('._2line')
      [j].querySelector('._2editline')
        .remove()
      document
        .querySelectorAll('._2line')
      [j].querySelector('._2personMsg').style.display = 'block'
      document
        .querySelectorAll('._2line')
      [j].querySelector('._2personBT').style.display = 'block'
      document
        .querySelectorAll('._2line')
      [j].querySelector('._2message_work').style.display = 'block'
    }
  }
}

function message_work_img(e) {
  if (document.querySelector('.replyclose span') !== null) {
    document.querySelector('.replyclose span').click()
  }
  editGone()
  let mainLine = this.parentElement.parentElement
  let memberid = mainLine
    .querySelector('.message_photo')
    .getAttribute('data-memberid')
  let logger = mainLine
    .querySelector('.message_photo')
    .getAttribute('data-logger')

  for (
    let j = 0;
    j < document.querySelectorAll('._2message_work_expand').length;
    j++
  ) {
    document.querySelectorAll('._2message_work_expand')[j].style.display =
      'none'
  }
  for (
    let j = 0;
    j < document.querySelectorAll('.message_work_expand').length;
    j++
  ) {
    document.querySelectorAll('.message_work_expand')[j].style.display = 'none'
  }

  if (
    mainLine.querySelector('.message_work_expand').style.display !== 'grid' &&
    memberid === logger
  ) {
    mainLine.querySelector('.message_work_expand').style.display = 'grid'
    Edit()
    //刪除樓層留言
    for (
      let d = 0;
      d < document.querySelectorAll('.message_work_expand .delete').length;
      d++
    ) {
      document
        .querySelectorAll('.message_work_expand .delete')
      [d].removeEventListener('click', boardDelete)
      document
        .querySelectorAll('.message_work_expand .delete')
      [d].addEventListener('click', boardDelete)
    }
  }
  e.stopPropagation()
}

function _2message_work_img(e) {
  if (document.querySelector('.replyclose span') !== null) {
    document.querySelector('.replyclose span').click()
  }
  editGone()
  let mainLine = this.parentElement.parentElement
  let memberid = mainLine
    .querySelector('._2message_photo')
    .getAttribute('memberId')
  let logger = mainLine.querySelector('._2message_photo').getAttribute('logger')

  for (
    let j = 0;
    j < document.querySelectorAll('._2message_work_expand').length;
    j++
  ) {
    document.querySelectorAll('._2message_work_expand')[j].style.display =
      'none'
  }
  for (
    let j = 0;
    j < document.querySelectorAll('.message_work_expand').length;
    j++
  ) {
    document.querySelectorAll('.message_work_expand')[j].style.display = 'none'
  }

  if (
    mainLine.querySelector('._2message_work_expand').style.display !== 'grid' &&
    memberid === logger
  ) {
    mainLine.querySelector('._2message_work_expand').style.display = 'grid'
    Edit()
    //刪除回覆留言
    for (
      let d = 0;
      d < document.querySelectorAll('._2message_work_expand ._2delete').length;
      d++
    ) {
      document
        .querySelectorAll('._2message_work_expand ._2delete')
      [d].removeEventListener('click', replyDelete)
      document
        .querySelectorAll('._2message_work_expand ._2delete')
      [d].addEventListener('click', replyDelete)
    }
  }
  e.stopPropagation()
}

// //點擊留言漢堡圖
function hambergerMsg() {
  for (
    let i = 0;
    i < document.querySelectorAll('.message_work img').length;
    i++
  ) {
    document
      .querySelectorAll('.message_work img')
    [i].removeEventListener('click', message_work_img)
    document
      .querySelectorAll('.message_work img')
    [i].addEventListener('click', message_work_img)
  }
  //回覆留言
  for (
    let i = 0;
    i < document.querySelectorAll('._2message_work img').length;
    i++
  ) {
    document
      .querySelectorAll('._2message_work img')
    [i].removeEventListener('click', _2message_work_img)
    document
      .querySelectorAll('._2message_work img')
    [i].addEventListener('click', _2message_work_img)
  }
  //點擊回覆
  clickReply()
}

//點擊任何一處都使留言編輯
function hambergerMsgGone(e) {
  ///回覆留言
  for (
    let i = 0;
    i < document.querySelectorAll('._2message_work_expand').length;
    i++
  ) {
    if (
      document.querySelectorAll('._2message_work_expand')[i].style.display ===
      'grid'
    ) {
      document.querySelectorAll('._2message_work_expand')[i].style.display =
        'none'
    }
  }
  for (let i = 0; i < document.querySelectorAll('._2line').length; i++) {
    if (
      document.querySelectorAll('._2line')[i].querySelector('._2editline') !==
      null
    ) {
      document
        .querySelectorAll('._2line')
      [i].querySelector('._2editline')
        .remove()
      document
        .querySelectorAll('._2line')
      [i].querySelector('._2personMsg').style.display = 'block'
      document
        .querySelectorAll('._2line')
      [i].querySelector('._2personBT').style.display = 'block'
      document
        .querySelectorAll('._2line')
      [i].querySelector('._2message_work').style.display = 'block'
    }
  }
  //本樓
  for (
    let i = 0;
    i < document.querySelectorAll('.message_work_expand').length;
    i++
  ) {
    if (
      document.querySelectorAll('.message_work_expand')[i].style.display ===
      'grid'
    ) {
      document.querySelectorAll('.message_work_expand')[i].style.display =
        'none'
    }
  }
  for (let i = 0; i < document.querySelectorAll('.line').length; i++) {
    if (
      document.querySelectorAll('.line')[i].querySelector('.editline') !== null
    ) {
      document.querySelectorAll('.line')[i].querySelector('.editline').remove()
      document
        .querySelectorAll('.line')
      [i].querySelector('.personMsg').style.display = 'block'
      document
        .querySelectorAll('.line')
      [i].querySelector('.personBT').style.display = 'block'
      document
        .querySelectorAll('.line')
      [i].querySelector('.message_work').style.display = 'block'
    }
  }
  e.stopPropagation()
}

//點擊任何一處都使活動編輯消失
function hambergerEvGone(e) {
  document.querySelector('.ev_edit_expand').style.display = 'none'
  e.stopPropagation()
}

//編輯留言
function Edit() {
  for (
    let i = 0;
    i < document.querySelectorAll('.message_work_expand .edit').length;
    i++
  ) {
    document
      .querySelectorAll('.message_work_expand .edit')
    [i].addEventListener('click', function (e) {
      let msgID = this.parentElement.parentElement.parentElement.getAttribute(
        'data-id',
      )
      let line = document.querySelector(`[data-id="${msgID}"]`)
      if (line.querySelector('.personMsg').style.display !== 'none') {
        line.querySelector('.personMsg').style.display = 'none'
        line.querySelector('.personBT').style.display = 'none'
        line.querySelector('.message_work').style.display = 'none'
        let editline
        if (language === 'en') {
          editline =
            '<div class="editline"><input id = "edit_text"/><div><div class="editsend"><span>Edit</span></div><div class="editcancel"><span>Cancel</span></div></div></div>'
        } else if (language === 'zh') {
          editline =
            '<div class="editline"><input id = "edit_text"/><div><div class="editsend"><span>編輯</span></div><div class="editcancel"><span>取消</span></div></div></div>'
        }
        line.querySelector('.message_middle').innerHTML += editline
        line.querySelector('#edit_text').value = line.querySelector(
          '.personMsg',
        ).innerHTML

        //編輯、取消顏色轉換
        document
          .querySelector('.editsend')
          .addEventListener('mouseover', function () {
            document.querySelector('.editsend span').style.color = 'white'
          })
        document
          .querySelector('.editsend')
          .addEventListener('mouseout', function () {
            document.querySelector('.editsend span').style.color = 'gray'
          })
        document
          .querySelector('.editcancel')
          .addEventListener('mouseover', function () {
            document.querySelector('.editcancel span').style.color = 'white'
          })
        document
          .querySelector('.editcancel')
          .addEventListener('mouseout', function () {
            document.querySelector('.editcancel span').style.color = 'gray'
          })

        //keyin編輯樓層留言
        document
          .getElementById('edit_text')
          .removeEventListener('click', edit_text)
        document
          .getElementById('edit_text')
          .addEventListener('click', edit_text)
        document
          .querySelector('.editsend')
          .removeEventListener('click', mainEdit)
        document
          .querySelector('.editsend')
          .addEventListener('click', mainEdit)
      }
      e.stopPropagation()
    })
  }
  for (
    let i = 0;
    i < document.querySelectorAll('._2message_work_expand ._2edit').length;
    i++
  ) {
    document
      .querySelectorAll('._2message_work_expand ._2edit')
    [i].addEventListener('click', function (e) {
      let replyid = this.parentElement.parentElement.parentElement.parentElement.getAttribute(
        'replyid',
      )
      let _2line = document.querySelector(`[replyid="${replyid}"]`)
      if (_2line.querySelector('._2personMsg').style.display !== 'none') {
        _2line.querySelector('._2personMsg').style.display = 'none'
        _2line.querySelector('._2personBT').style.display = 'none'
        _2line.querySelector('._2message_work').style.display = 'none'
        let _2editline
        if (language === 'en') {
          _2editline =
            '<div class="_2editline"><input id = "_2edit_text"/><div><div class="_2editsend"><span>Edit</span></div><div class="_2editcancel"><span>Cancel</span></div></div></div>'
        } else if (language === 'zh') {
          _2editline =
            '<div class="_2editline"><input id = "_2edit_text"/><div><div class="_2editsend"><span>編輯</span></div><div class="_2editcancel"><span>取消</span></div></div></div>'
        }
        _2line.querySelector('._2message_middle').innerHTML += _2editline
        _2line.querySelector('#_2edit_text').value = _2line.querySelector(
          '._2personMsg',
        ).innerHTML

        //編輯、取消顏色轉換
        document
          .querySelector('._2editsend')
          .addEventListener('mouseover', function () {
            document.querySelector('._2editsend span').style.color = 'white'
          })
        document
          .querySelector('._2editsend')
          .addEventListener('mouseout', function () {
            document.querySelector('._2editsend span').style.color = 'gray'
          })
        document
          .querySelector('._2editcancel')
          .addEventListener('mouseover', function () {
            document.querySelector('._2editcancel span').style.color = 'white'
          })
        document
          .querySelector('._2editcancel')
          .addEventListener('mouseout', function () {
            document.querySelector('._2editcancel span').style.color = 'gray'
          })
        //編輯回覆留言
        document
          .getElementById('_2edit_text')
          .removeEventListener('click', _2edit_text)
        document
          .getElementById('_2edit_text')
          .addEventListener('click', _2edit_text)
        document
          .querySelector('._2editsend')
          .removeEventListener('click', replyEdit)
        document
          .querySelector('._2editsend')
          .addEventListener('click', replyEdit)
      }
      e.stopPropagation()
    })
  }
}

//刪除樓層留言
function boardDelete(e) {
  flag += 1
  e.stopPropagation()
  if (flag === 1) {
    let line = this.parentElement.parentElement.parentElement
    let msgID = line.getAttribute('data-id')
    if (language === 'en') {
      this.innerHTML = 'Deleting'
    } else if (language === 'zh') {
      this.innerHTML = '刪除中...'
    }
    fetch('/api/board', {
      method: 'DELETE',
      body: JSON.stringify({ activity: id, board_id: msgID }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(function (response) {
        return response.json()
      })
      .catch((error) => console.error('Error:', error))
      .then(function (dict) {
        if ('invalidToken' in dict) {
          window.location.href = document.URL
        }
        if ('ok' in dict) {
          line.remove()
          if (document.querySelector(`[boardID="${msgID}"]`) !== null) {
            document.querySelector(`[boardID="${msgID}"]`).remove()
          }
          hambergerMsg()
          flag = 0
          if (document.querySelector('.line') === null) {
            emptyMsgDiv()
          }
        }
      })
  }
}

//刪除回覆留言
function replyDelete(e) {
  flag += 1
  e.stopPropagation()
  if (flag === 1) {
    let _2line = this.parentElement.parentElement.parentElement.parentElement
    let replyid = _2line.getAttribute('replyid')
    if (language === 'en') {
      this.innerHTML = 'Deleting'
    } else if (language === 'zh') {
      this.innerHTML = '刪除中...'
    }
    fetch('/api/reply', {
      method: 'DELETE',
      body: JSON.stringify({ activity: id, reply_id: replyid }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(function (response) {
        return response.json()
      })
      .catch((error) => console.error('Error:', error))
      .then(function (dict) {
        if (
          'invalidToken' in dict ||
          ('error' in dict && dict['message'] === '無此回覆ID')
        ) {
          window.location.href = document.URL
        }
        if ('ok' in dict) {
          let board_id = _2line.parentElement.getAttribute('boardid')
          _2line.remove()
          if (
            document
              .querySelector(`[boardid="${board_id}"]`)
              .querySelector('._2line') === null
          ) {
            document.querySelector(`[boardid="${board_id}"]`).remove()
            document.querySelector(
              `[data-id="${board_id}"]`,
            ).style.borderBottom = '1px solid #BEBEBE'
          }
          hambergerMsg()
          flag = 0
        }
      })
  }
}

//keyin編輯樓層留言
function edit_text(e) {
  e.stopPropagation()
}

function editlinehover() { }

function mainEdit(e) {
  e.stopPropagation()
  flag += 1
  if (flag === 1) {
    let msgID = this.parentElement.parentElement.parentElement.parentElement.getAttribute(
      'data-id',
    )
    let message = this.parentElement.parentElement.querySelector('#edit_text')
      .value
    let editline = this.parentElement.parentElement,
      message_middle = this.parentElement.parentElement.parentElement
    let line = message_middle.parentElement
    editline.querySelector('.editsend').innerHTML =
      "<div><img src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif'/></div>"
    fetch('/api/board', {
      method: 'PATCH',
      body: JSON.stringify({ activity: id, message: message, board_id: msgID }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(function (response) {
        return response.json()
      })
      .catch((error) => console.error('Error:', error))
      .then(function (dict) {
        if ('invalidToken' in dict) {
          window.location.href = document.URL
        }
        if ('ok' in dict) {
          message_middle.querySelector('.personMsg').style.display = 'block'
          message_middle.querySelector('.personMsg').innerHTML = message
          message_middle.querySelector('.personBT').style.display = 'block'
          line.querySelector('.message_work').style.display = 'block'
          line.querySelector('.message_work_expand').style.display = 'none'
          editline.remove()
          flag = 0
          clickReply()
        }
      })
  }
}

//keyin回覆編輯留言
function replyEdit(e) {
  e.stopPropagation()
  flag += 1
  if (flag === 1) {
    let replyid = this.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute(
      'replyid',
    )
    let message = this.parentElement.parentElement.querySelector('#_2edit_text')
      .value
    let _2editline = this.parentElement.parentElement,
      _2message_middle = this.parentElement.parentElement.parentElement
    let _2line = _2message_middle.parentElement.parentElement
    _2editline.querySelector('._2editsend').innerHTML =
      "<div><img src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif'/></div>"
    fetch('/api/reply', {
      method: 'PATCH',
      body: JSON.stringify({
        activity: id,
        message: message,
        reply_id: replyid,
      }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(function (response) {
        return response.json()
      })
      .catch((error) => console.error('Error:', error))
      .then(function (dict) {
        if (
          'invalidToken' in dict ||
          ('error' in dict && dict['message'] === '無此回覆ID')
        ) {
          window.location.href = document.URL
        }
        if ('ok' in dict) {
          _2message_middle.querySelector('._2personMsg').style.display = 'block'
          _2message_middle.querySelector('._2personMsg').innerHTML = message
          _2message_middle.querySelector('._2personBT').style.display = 'block'
          _2line.querySelector('._2message_work').style.display = 'block'
          _2line.querySelector('._2message_work_expand').style.display = 'none'
          _2editline.remove()
          flag = 0
        }
      })
  }
}
function _2edit_text(e) {
  e.stopPropagation()
}

function replyclose() {
  document.querySelector('.replycontent').style.animation = 'replyGone 0.5s'
  setTimeout(() => {
    document.querySelector('.replycontent').style.display = 'none'
  }, 450)
}

function response() {
  document.querySelector('.replycontent').style.display = 'block'
  document.querySelector('.replycontent').style.animation = 'replyUp 0.5s'
  let line = this.parentElement.parentElement.parentElement
  let msgID = line.getAttribute('data-id')
  let personName = line.querySelector('.personName').innerHTML
  let personMsg = line.querySelector('.personMsg').innerHTML
  let floor = line.querySelector('.floor').innerHTML.replace(' · ', '')
  document.querySelector(
    '.floorContent div:nth-of-type(2n)',
  ).innerHTML = `${floor}`
  document.querySelector(
    '.floorContent div:nth-of-type(3n)',
  ).innerHTML = `${personName}`
  document.querySelector(
    '.floorContent div:nth-of-type(4n)',
  ).innerHTML = `${personMsg}`
  document.querySelector('.replycontent').setAttribute('msgID', msgID)
  //關閉回覆
  document.querySelector('.replyclose').removeEventListener('click', replyclose)
  document.querySelector('.replyclose').addEventListener('click', replyclose)
  //送出回覆
  document
    .querySelector('.keyinreply div:first-of-type')
    .removeEventListener('click', replySend)
  document
    .querySelector('.keyinreply div:first-of-type')
    .addEventListener('click', replySend)
}

//點擊回覆
function clickReply() {
  for (let r = 0; r < document.querySelectorAll('.response').length; r++) {
    document
      .querySelectorAll('.response')
    [r].removeEventListener('click', response)
    document
      .querySelectorAll('.response')
    [r].addEventListener('click', response)
  }
}

// mouseover 送出
document
  .querySelector('.keyinreply div:first-of-type')
  .addEventListener('mouseover', function () {
    let message = document.getElementById('reply_text').value
    if (message.match(nonSpacePat)) {
      this.style.cursor = 'pointer'
    } else {
      this.style.cursor = 'not-allowed'
    }
  })

//送出回覆留言
function replySend() {
  let board_id = this.parentElement.parentElement.getAttribute('msgID')
  let message = document.getElementById('reply_text').value
  if (message.match(nonSpacePat)) {
    if (flag === 0) {
      flag += 1
      if (language === 'en') {
        document.querySelector('.keyinreply div:first-of-type').innerHTML =
          '<span>Sending</span>'
      } else if (language === 'zh') {
        document.querySelector('.keyinreply div:first-of-type').innerHTML =
          '<span>送出中</span>'
      }
      fetch('/api/reply', {
        method: 'POST',
        body: JSON.stringify({
          activity: id,
          message: message,
          board_id: board_id,
        }),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      })
        .then(function (response) {
          return response.json()
        })
        .catch((error) => console.error('Error:', error))
        .then(function (dict) {
          if ('ok' in dict) {
            if (language === 'en') {
              document.querySelector(
                '.keyinreply div:first-of-type',
              ).innerHTML = '<span>Send</span>'
            } else if (language === 'zh') {
              document.querySelector(
                '.keyinreply div:first-of-type',
              ).innerHTML = '<span>送出</span>'
            }
            document.getElementById('reply_text').value = ''
            if (document.querySelector('.replyclose span') !== null) {
              document.querySelector('.replyclose span').click()
            }

            let board_tm = new Date(dict['inserttuple'][4])
            let strReplyTm = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1,
            ).padStart(2, '0')}-${String(board_tm.getDate()).padStart(
              2,
              '0',
            )} ${String(board_tm.getHours()).padStart(2, '0')}:${String(
              board_tm.getMinutes(),
            ).padStart(2, '0')}`
            //
            let reply_msg = dict['inserttuple'][2]
            let person = dict['inserttuple'][7],
              photo = dict['inserttuple'][8],
              reply_floor = dict['inserttuple'][3]
            let logger = dict['logger'],
              memberId = dict['logger'],
              reply_id = dict['reply_id']

            let replyDiv = document.querySelector(`[boardid="${board_id}"]`)
            //先前無回覆，要建立reply div
            if (replyDiv === null) {
              document.querySelector(
                `[data-id="${board_id}"]`,
              ).style.borderBottom = ''
              let replyDiv_1 = document.createElement('div')
              replyDiv_1.className = 'reply'
              replyDiv_1.setAttribute('boardid', board_id)
              insertAfter(
                replyDiv_1,
                document.querySelector(`[data-id="${board_id}"]`),
              )
              /// 製作回覆留言
              let hideReply = document.createElement('div')
              hideReply.className = 'hideReply'
              let div1 = document.createElement('div')
              hideReply.appendChild(div1)
              let div2 = document.createElement('div')
              div2.className = 'word'
              //
              if (language === 'en') {
                div2.innerHTML = 'Hide reply'
              } else if (language === 'zh') {
                div2.innerHTML = '隱藏回覆留言'
              }
              hideReply.appendChild(div2)
              document
                .querySelector(`[boardID="${board_id}"]`)
                .appendChild(hideReply)
              ///
              replyLine(
                dict['logger'],
                memberId,
                board_id,
                reply_id,
                reply_msg,
                strReplyTm,
                person,
                photo,
                reply_floor,
              )
              //查看回覆
              for (
                let d = 0;
                d < document.querySelectorAll('.hideReply .word').length;
                d++
              ) {
                document
                  .querySelectorAll('.hideReply .word')
                [d].removeEventListener('click', conceal)
                document
                  .querySelectorAll('.hideReply .word')
                [d].addEventListener('click', conceal)
              }
            }
            //先前有留言，要查看是否有隱藏留言
            else {
              replyDiv.insertBefore(
                leaveReplyMsg(
                  logger,
                  memberId,
                  board_id,
                  reply_id,
                  reply_msg,
                  strReplyTm,
                  person,
                  photo,
                  reply_floor,
                ),
                replyDiv.querySelector('._2line'),
              )
              //
              if (
                replyDiv.querySelector('.hideReply .word').innerHTML ===
                '隱藏回覆留言' ||
                replyDiv.querySelector('.hideReply .word').innerHTML ===
                'Hide reply'
              ) {
              } //開啟狀態
              else {
                //關閉狀態
                let siblings_2Line = document
                  .querySelector(`[boardID="${board_id}"]`)
                  .querySelectorAll('._2line')
                for (let s = 0; s < siblings_2Line.length; s++) {
                  siblings_2Line[s].style.display = 'none'
                }
                if (language === 'en') {
                  if (siblings_2Line.length === 1) {
                    replyDiv.querySelector(
                      '.hideReply .word',
                    ).innerHTML = `View <span>${siblings_2Line.length}</span> reply.`
                  } else {
                    replyDiv.querySelector(
                      '.hideReply .word',
                    ).innerHTML = `View <span>${siblings_2Line.length}</span> replies.`
                  }
                } else if (language === 'zh') {
                  replyDiv.querySelector(
                    '.hideReply .word',
                  ).innerHTML = `查看 <span>${siblings_2Line.length}</span> 則回覆留言`
                }
              }
            }
            flag = 0
            hambergerMsg()
          } else if (
            'invalidToken' in dict ||
            ('error' in dict && dict['message'] === '無此樓')
          ) {
            window.location.href = document.URL
          }
        })
    }
  } else {
    document.querySelector('.keyinreply div:first-of-type').style.cursor =
      'not-allowed'
  }
}

///回覆留言時，新增回覆
function insertAfter(newElement, targetElement) {
  let parent = targetElement.parentNode
  if (parent.lastChild == targetElement) {
    // 如果最後的節點是目標元素，則直接新增。因為預設是最後
    parent.appendChild(newElement)
  } else {
    parent.insertBefore(newElement, targetElement.nextSibling) //如果不是，則插入在目標元素的下一個兄弟節點的前面。也就是目標元素的後面。
  }
}

//製作第一個節點的回覆留言
function leaveReplyMsg(
  logger,
  memberId,
  board_id,
  reply_id,
  reply_msg,
  reply_time,
  person,
  photo,
  reply_floor,
) {
  let _2line = document.createElement('div')
  _2line.className = '_2line'
  _2line.setAttribute('replyID', reply_id)

  let left = document.createElement('div')
  left.className = 'left'
  let right = document.createElement('div')
  right.className = 'right'

  let _2message_photo = document.createElement('div')
  _2message_photo.className = '_2message_photo'
  _2message_photo.setAttribute('memberId', memberId)
  _2message_photo.setAttribute('logger', logger)

  let imgdiv = document.createElement('div')
  let imgA = document.createElement('a')
  imgA.setAttribute('href', `/profile?member=${memberId}`)
  let img = document.createElement('img')
  img.src = photo
  img.setAttribute('referrerpolicy', 'no-referrer')
  imgA.appendChild(img)
  imgdiv.appendChild(imgA)
  _2message_photo.appendChild(imgdiv)
  right.appendChild(_2message_photo)

  let _2message_middle = document.createElement('div')
  _2message_middle.className = '_2message_middle'

  let _2personName = document.createElement('div')
  let spanA = document.createElement('a')
  spanA.setAttribute('href', `/profile?member=${memberId}`)
  _2personName.className = '_2personName'
  let namespan = document.createElement('span')
  namespan.appendChild(document.createTextNode(person))
  spanA.appendChild(namespan)
  _2personName.appendChild(spanA)
  _2message_middle.appendChild(_2personName)

  let _2personMsg = document.createElement('div')
  _2personMsg.className = '_2personMsg'
  _2personMsg.appendChild(document.createTextNode(reply_msg))
  _2message_middle.appendChild(_2personMsg)

  let _2personBT = document.createElement('div')
  _2personBT.className = '_2personBT'

  let _2floor = document.createElement('span')
  _2floor.className = '_2floor'
  _2floor.appendChild(document.createTextNode(reply_floor + ' · '))
  _2personBT.appendChild(_2floor)

  let _2personTM = document.createElement('span')
  _2personTM.className = '_2personTM'
  _2personTM.appendChild(document.createTextNode(reply_time))
  _2personBT.appendChild(_2personTM)
  _2message_middle.appendChild(_2personBT)
  right.appendChild(_2message_middle)

  let _2message_work = document.createElement('div')
  _2message_work.className = '_2message_work'

  if (logger === memberId) {
    let imgwork = document.createElement('img')
    imgwork.src =
      'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/comment.svg'
    _2message_work.appendChild(imgwork)

    let _2message_work_expand = document.createElement('div')
    _2message_work_expand.className = '_2message_work_expand'

    let _2edit = document.createElement('div')
    _2edit.className = '_2edit'
    if (language === 'en') {
      _2edit.appendChild(document.createTextNode('Edit'))
    } else if (language === 'zh') {
      _2edit.appendChild(document.createTextNode('編輯留言'))
    }
    _2message_work_expand.appendChild(_2edit)

    let _2delete = document.createElement('div')
    _2delete.className = '_2delete'
    if (language === 'en') {
      _2delete.appendChild(document.createTextNode('Delete'))
    } else if (language === 'zh') {
      _2delete.appendChild(document.createTextNode('刪除留言'))
    }
    _2message_work_expand.appendChild(_2delete)
    _2message_work.appendChild(_2message_work_expand)
  }
  //
  right.appendChild(_2message_work)
  _2line.appendChild(left)
  _2line.appendChild(right)

  return _2line
}

//查看回覆留言
function conceal() {
  if (language === 'en') {
    if (this.innerHTML !== 'Hide reply') {
      let siblings_2Line = this.parentElement.parentElement.querySelectorAll(
        '._2line',
      )
      for (let s = 0; s < siblings_2Line.length; s++) {
        siblings_2Line[s].style.display = 'grid'
      }
      this.innerHTML = 'Hide reply'
    } else if (this.innerHTML === 'Hide reply') {
      let siblings_2Line = this.parentElement.parentElement.querySelectorAll(
        '._2line',
      )
      for (let s = 0; s < siblings_2Line.length; s++) {
        siblings_2Line[s].style.display = 'none'
      }
      if (siblings_2Line.length === 1) {
        this.innerHTML = `View <span>${siblings_2Line.length}</span> reply`
      } else {
        this.innerHTML = `View <span>${siblings_2Line.length}</span> replies`
      }
    }
  } else if (language === 'zh') {
    if (this.innerHTML !== '隱藏回覆留言') {
      let siblings_2Line = this.parentElement.parentElement.querySelectorAll(
        '._2line',
      )
      for (let s = 0; s < siblings_2Line.length; s++) {
        siblings_2Line[s].style.display = 'grid'
      }
      this.innerHTML = '隱藏回覆留言'
    } else if (this.innerHTML === '隱藏回覆留言') {
      let siblings_2Line = this.parentElement.parentElement.querySelectorAll(
        '._2line',
      )
      for (let s = 0; s < siblings_2Line.length; s++) {
        siblings_2Line[s].style.display = 'none'
      }
      this.innerHTML = `查看 <span>${siblings_2Line.length}</span> 則回覆留言`
    }
  }
}

//滑動載入留言
window.addEventListener('scroll', () => {
  if (id !== undefined) {
    let ajaxHeight = document.documentElement.scrollHeight
    let deviseHeight = window.innerHeight
    let scrollable = ajaxHeight - deviseHeight
    let scrolled = document.documentElement.scrollTop

    if (scrolled + 100 >= scrollable) {
      if (nextPage) {
        nexturl = `/api/board/${id}_${nextPage}`
        if (ajaxRecord.includes(nextPage)) {
        } else {
          ajaxRecord.push(nextPage)
          // //載入留言
          loadGif()
          setTimeout('loadMsg(`${id}_${nextPage}`,`${access_token}`)', 700)
        }
      }
    }
  }
})

function selectBox(modal) {
  if (modal === 2) {
    document.querySelector('.modal2').style.display = 'block'
    document.querySelector('.window2').style.display = 'flex'
    document.querySelector('.popup2 .title').innerHTML = `${ev_title}`
    document.querySelector(
      '.popup2 .tm',
    ).innerHTML = `${ev_dayStr} · ${ev_HrMin} ${timezone}`
    //
    if (language === 'en') {
      document.querySelector('.c_join  div:nth-of-type(2n) span').innerHTML =
        'Not going'
    } else if (language === 'zh') {
      document.querySelector('.c_join  div:nth-of-type(2n) span').innerHTML =
        '取消參加'
    }
    document.querySelector('.c_join  div:nth-of-type(2n) span').className =
      'out'
  } else if (modal === 8) {
    //發信成功通知
    document.querySelector('.modal8').style.display = 'block'
    document.querySelector('.window8').style.display = 'flex'
    document.querySelector(
      '.popup8 .title .mailadd',
    ).innerHTML = `<i>${myEmail}</i>`
  } else if (modal === 9) {
    document.querySelector('.modal9').style.display = 'block'
    document.querySelector('.window9').style.display = 'flex'
    document.querySelector('.popup9 .title').innerHTML = `${ev_title}`
    document.querySelector(
      '.popup9 .tm',
    ).innerHTML = `${ev_dayStr} · ${ev_HrMin} ${timezone}`
  } else {
    clearModal()
  }
}

//上一頁效果
window.addEventListener('popstate', (e) => {
  selectBox(e.state.modal)
})

//GET attend result function
async function attendStatus() {
  if (access_token === undefined) {
    await fetch(`/api/attend/${id}`, { method: 'GET' })
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error(`GET /api/attend/${id} 回傳值`, error)
      })
      .then(function (dict) {
        if ('ok' in dict) {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Attend'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '參加'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'in'
        } else if ('error' in dict && dict['message'] === '已滿額') {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Full'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '滿額'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'full'
          document.querySelector('.c_join  div:nth-of-type(2n)').className =
            'join_tm_over'
        } else if ('error' in dict && dict['message'] === '已過活動時間') {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Expired'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '活動已過期'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'expired'
          document.querySelector('.c_join  div:nth-of-type(2n)').className =
            'join_tm_over'
        } else {
          console.log('unknown problem', dict)
        }
        joinCursor()
      })
  } else {
    await fetch(`/api/attend/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error(`GET /api/attend/${id} 錯誤`, error)
      })
      .then(function (dict) {
        if ('ok' in dict && 'msg' in dict) {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Not going'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = `${dict['msg']}`
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'out'
        } else if ('ok' in dict && Object.keys(dict).length === 1) {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Attend'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '參加'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'in'
        } else if ('error' in dict && dict['message'] === '已滿額') {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Full'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '滿額'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'full'
          document.querySelector('.c_join  div:nth-of-type(2n)').className =
            'join_tm_over'
        } else if ('error' in dict && dict['message'] === '已過活動時間') {
          if (language === 'en') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = 'Expired'
          } else if (language === 'zh') {
            document.querySelector(
              '.c_join  div:nth-of-type(2n) span',
            ).innerHTML = '活動已過期'
          }
          document.querySelector(
            '.c_join  div:nth-of-type(2n) span',
          ).className = 'expired'
          document.querySelector('.c_join  div:nth-of-type(2n)').className =
            'join_tm_over'
        } else {
          if ('invalidToken' in dict) {
            window.location.href = document.URL
          } else {
            console.log('unknown problem', dict)
          }
        }
        joinCursor()
      })
  }
}
