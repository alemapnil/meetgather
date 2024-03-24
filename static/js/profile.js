var googlename, googlePhoto, altername, aboutme, alterphoto
var newphoto = null,
  newname = null,
  newaboutme = null
var flag = 0
var dataURL, blob

var month_en = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
var days_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
var nextPage_right,
  nextPage_right_list = []
var nextPage_left,
  nextPage_left_list = []

async function profile() {
  //placeholder 語言轉換
  if (language === 'en') {
    document
      .getElementById('myname_text')
      .setAttribute('placeholder', 'Your name.')
    document
      .getElementById('myself_text')
      .setAttribute('placeholder', 'About you.')
  } else if (language === 'zh') {
    document
      .getElementById('myname_text')
      .setAttribute('placeholder', '你的姓名')
    document.getElementById('myself_text').setAttribute('placeholder', '關於你')
  }

  //
  if (access_token !== undefined) {
    let member_shot = parseInt(
      document.querySelector('.shot').getAttribute('member_id'),
    )
    // document.body.style.backgroundColor = '#F5F5F5' //背景色調整
    await fetch(`/api/profile?member=${member_url}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error('GET /api/profile 錯誤:', error)
      })
      .then(function (dict) {
        if ('invalidToken' in dict || 'error' in dict) {
          window.location.href = '/'
        } else if ('ok' in dict) {
          ;(googlename = dict['message'][2]),
            (googlePhoto = dict['message'][3]),
            (altername = dict['message'][4])
          ;(aboutme = dict['message'][5]), (alterphoto = dict['message'][6])

          if (alterphoto !== null) {
            document.querySelector(
              '.profile .pf .photo div:first-child img',
            ).src = alterphoto
          } else {
            document.querySelector(
              '.profile .pf .photo div:first-child img',
            ).src = googlePhoto
          }

          if (altername !== null) {
            document.querySelector('.profile .about h1').innerHTML = altername
            document.title = `${altername} | Meetgather` // 網頁標題
          } else {
            document.querySelector('.profile .about h1').innerHTML = googlename
            document.title = `${googlename} | Meetgather` // 網頁標題
          }
          document.querySelector(
            '.profile .about .myself span',
          ).innerHTML = aboutme
        }
      })
    //判斷是否為本人
    if (member_url == member_shot) {
      document.querySelector('.profile .pfedit').style.display = 'flex'
      // 直接載入主辦紀錄
      hostDisplay(member_url, 0)
    } else {
      document.querySelector('.eventscroll').style.display = 'none'
    }
  } else {
    document.querySelector('.modal10').style.display = 'block'
    document.querySelector('.window10').style.display = 'flex'
    document.title = 'Not login' // 網頁標題
  }

  document.querySelector('.overlay').style.display = 'none' //close loading
}

//輸入姓名聚焦
document.getElementById('myname_text').addEventListener('focus', function () {
  document.querySelector('.myname_edit').style.borderColor = '#26619c'
})
//輸入姓名失焦
document.getElementById('myname_text').addEventListener('blur', function () {
  document.querySelector('.myname_edit').style.borderColor = '#bebebe'
})
//姓名字數管控
document.getElementById('myname_text').addEventListener('input', function () {
  document.querySelector('.myname_edit span').innerHTML = `${
    20 - this.value.length
  }`
})

//輸入自介聚焦
document.getElementById('myself_text').addEventListener('focus', function () {
  document.querySelector('.myself_edit').style.borderColor = '#26619c'
})
//輸入自介失焦
document.getElementById('myself_text').addEventListener('blur', function () {
  document.querySelector('.myself_edit').style.borderColor = '#bebebe'
})
//自介字數管控
document.getElementById('myself_text').addEventListener('input', function () {
  document.querySelector('.myself_edit span').innerHTML = `${
    250 - this.value.length
  }`
})

//點個人檔案取消
document
  .querySelector('.pfedit .cancel')
  .addEventListener('click', function () {
    document.querySelector('.profile .about h1').style.display = 'block'
    document.querySelector('.profile .about .myname_edit').style.display =
      'none'
    document.querySelector('.profile .about .myself').style.display = 'block'
    document.querySelector('.profile .about .myself_edit').style.display =
      'none'
    document.querySelector('.pfedit .edit').style.display = 'flex'
    document.querySelector(
      '.profile .photo div:nth-child(2)',
    ).style.visibility = 'hidden'
    document.querySelector('.pfedit .upload').style.display = 'none'
    document.querySelector('.pfedit .cancel').style.display = 'none'
    document.querySelector('.pfedit .save').style.display = 'none'

    if (alterphoto !== null) {
      document.querySelector(
        '.profile .pf .photo div:first-child img',
      ).src = alterphoto
    } else {
      document.querySelector(
        '.profile .pf .photo div:first-child img',
      ).src = googlePhoto
    }
  })

//點個人檔案編輯
document.querySelector('.pfedit .edit').addEventListener('click', function () {
  document.querySelector('.profile .about h1').style.display = 'none'
  document.querySelector('.profile .about .myname_edit').style.display = 'flex'
  ///
  if (altername !== null) {
    document.getElementById('myname_text').value = altername
  } else {
    document.getElementById('myname_text').value = googlename
  }
  ///
  document.querySelector('.profile .about .myself').style.display = 'none'
  document.querySelector('.profile .about .myself_edit').style.display = 'block'
  document.getElementById('myself_text').value = aboutme
  document.querySelector('.pfedit .edit').style.display = 'none'

  if (
    document.querySelector('.profile .pf .photo div:first-child img').src !==
    googlePhoto
  ) {
    document.querySelector(
      '.profile .photo div:nth-child(2)',
    ).style.visibility = 'visible'
  }
  document.querySelector('.pfedit .upload').style.display = 'flex'
  document.querySelector('.pfedit .cancel').style.display = 'flex'
  document.querySelector('.pfedit .save').style.display = 'flex'
})

//點上傳圖片
document
  .querySelector('.pfedit .upload')
  .addEventListener('click', function () {
    document.getElementById('file').click()
  })

//圖片預覽
document.getElementById('file').addEventListener('change', function () {
  let file = document.getElementById('file').files[0]
  if (ALLOWED_EXTENSIONS.includes(file.type) || file.type.length === 0) {
    document.querySelector(
      '.profile .photo div:nth-child(2)',
    ).style.visibility = 'visible'
    var reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function (event) {
      document.querySelector('.profile .photo div:first-child img').src =
        event.target.result
    }
  } else {
  }
})

//圖片刪除
document
  .querySelector('.profile .photo div:nth-child(2)')
  .addEventListener('click', function () {
    document.getElementById('file').value = ''
    document.querySelector(
      '.profile .pf .photo div:first-child img',
    ).src = googlePhoto
    document.querySelector(
      '.profile .photo div:nth-child(2)',
    ).style.visibility = 'hidden'
  })

//存檔
document
  .querySelector('.pfedit .save')
  .addEventListener('click', async function () {
    flag += 1
    //姓名
    let myname = document.getElementById('myname_text').value.trim()
    if (myname.match(nonSpacePat)) {
      newname = myname
    }
    //自介
    let myself = document.getElementById('myself_text').value.trim()
    if (myself.match(nonSpacePat)) {
      newaboutme = myself
    }
    //圖片

    if (document.getElementById('file').files.length > 0) {
      newphoto = document.getElementById('file').files[0]
      let contentType = document.getElementById('file').files[0].type
      if (
        ALLOWED_EXTENSIONS.includes(contentType) ||
        contentType.length === 0
      ) {
        var reader = new FileReader()
        reader.readAsDataURL(newphoto)
        let promise = new Promise(function (resolve, reject) {
          reader.onload = function (event) {
            /***/
            const imgElement = document.createElement('img')
            if (contentType.length === 0) {
              contentType = 'image/jpeg'
              let colon = event.target.result.indexOf(':')
              semicolon = event.target.result.indexOf(';')
              imgElement.src =
                event.target.result.slice(0, colon + 1) +
                contentType +
                event.target.result.slice(semicolon)
            } else {
              imgElement.src = event.target.result
            }
            /***/
            imgElement.onload = function (e) {
              if (
                e.target.naturalWidth >= e.target.naturalHeight &&
                e.target.naturalWidth > 700
              ) {
                const canvas = document.createElement('canvas')
                const max_width = 700
                const scaleSize = max_width / e.target.naturalWidth
                canvas.width = max_width
                canvas.height = e.target.naturalHeight * scaleSize

                const ctx = canvas.getContext('2d')
                ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height)
                dataURL = ctx.canvas.toDataURL(e.target, contentType)
                document.querySelector(
                  '.profile .photo div:first-child img',
                ).src = dataURL
                // 建立 file
                const blobBin = atob(dataURL.split(',')[1])
                const array = []
                for (let i = 0; i < blobBin.length; i++) {
                  array.push(blobBin.charCodeAt(i))
                }
                blob = new Blob([new Uint8Array(array)], { type: contentType })

                aspect = canvas.width / canvas.height
              } else if (
                e.target.naturalHeight >= e.target.naturalWidth &&
                e.target.naturalHeight > 700
              ) {
                const canvas = document.createElement('canvas')
                const max_height = 700
                const scaleSize = max_height / e.target.naturalHeight
                canvas.height = max_height
                canvas.width = e.target.naturalWidth * scaleSize
                const ctx = canvas.getContext('2d')
                ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height)
                dataURL = ctx.canvas.toDataURL(e.target, contentType)
                document.querySelector(
                  '.profile .photo div:first-child img',
                ).src = dataURL
                // 建立 file
                const blobBin = atob(dataURL.split(',')[1])
                const array = []
                for (let i = 0; i < blobBin.length; i++) {
                  array.push(blobBin.charCodeAt(i))
                }
                blob = new Blob([new Uint8Array(array)], { type: contentType })

                aspect = canvas.width / canvas.height
              } else {
                dataURL = undefined
                blob = undefined
              }
              resolve()
            }
            /***/
          }
        })
        await promise
      }
    }

    //send to server
    let formdata = new FormData()
    formdata.append(
      'background',
      document.querySelector('.profile .pf .photo div:first-child img').src,
    )
    if (dataURL !== undefined) {
      formdata.append('newphoto', blob)
    } else {
      formdata.append('newphoto', newphoto) //有可能是null，有可能是照片
    }
    formdata.append('newname', newname)
    formdata.append('newaboutme', newaboutme)

    if (flag === 1) {
      document.querySelector('.pfedit .save').innerHTML =
        "<div><img src='https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/grayLoader.gif'/></div>"
      fetch('/api/profile', {
        method: 'POST',
        body: formdata,
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .catch((error) => console.error('Error:', error))
        .then((response) => response.json()) // 輸出成 json
        .then(function (dict) {
          setTimeout(() => {
            document.querySelector('.overlay').style.display = 'none'
          }, 0)
          if ('ok' in dict) {
            window.location.href = document.URL
          } else if ('invalidToken' in dict) {
            window.location.href = '/'
          }
        })
    }
  })

//登入畫面 點登入
document
  .querySelector('.popup10 .cancel')
  .addEventListener('click', function () {
    window.location.href = '/login'
  })

//回上一頁
document.querySelector('.popup10 .back').addEventListener('click', function () {
  window.history.back()
})

//點擊主辦紀錄
document
  .querySelectorAll('.eventRecord div')[0]
  .addEventListener('click', function () {
    this.classList.add('choose')
    document.querySelectorAll('.eventRecord div')[1].classList.remove('choose')
  })

//點擊參加紀錄
document
  .querySelectorAll('.eventRecord div')[1]
  .addEventListener('click', function () {
    this.classList.add('choose')
    document.querySelectorAll('.eventRecord div')[0].classList.remove('choose')
  })

var member_url = parseInt(
  document.querySelector('.profile').getAttribute('member_id'),
)

//生成主辦活動紀錄
function hostDisplay(member_url, page) {
  fetch(
    `/api/hostdisplay?member=${member_url}&page=${page}&anchortm=${anchortm}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  )
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('GET /api/hostDisplay 錯誤:', error)
    })
    .then(function (dict) {
      if ('invalidToken' in dict || 'error' in dict) {
        window.location.href = '/'
      } else if ('nextPage' in dict) {
        _12event = dict['_12event']
        nextPage_left = dict['nextPage']
        //生成主辦活動紀錄
        for (let e = 0; e < _12event.length; e++) {
          let a = document.createElement('a')
          a.setAttribute('href', `/event/${_12event[e][0]}`)

          let eventDiv = document.createElement('div')
          eventDiv.className = 'event'

          let eventinDiv = document.createElement('div')
          eventinDiv.className = 'event_in'

          let picture = document.createElement('div')
          picture.className = 'picture'
          let pictureImg = document.createElement('img')
          pictureImg.src = _12event[e][13]
          picture.appendChild(pictureImg)
          eventinDiv.appendChild(picture)

          let section = document.createElement('div')
          section.className = 'section'
          //
          let ev_dayStr
          let eventTime = new Date(_12event[e][10])
          let timezone = eventTime.toString().split(' ')[5]
          let eventDate = String(eventTime.getDate()).padStart(2, '0')
          let eventHour = String(eventTime.getHours()).padStart(2, '0')
          let eventYear = eventTime.getFullYear()
          if (language === 'en') {
            ev_dayStr = `${days_en[eventTime.getDay()]}, ${
              month_en[eventTime.getMonth()]
            } ${eventDate} · ${eventHour}:${String(
              eventTime.getMinutes(),
            ).padStart(2, '0')}, ${eventYear} <span>${timezone}</span>`
          } else if (language === 'zh') {
            ev_dayStr = `${days_cn[eventTime.getDay()]}, ${
              month_cn[eventTime.getMonth()]
            }${eventDate} · ${eventHour}:${String(
              eventTime.getMinutes(),
            ).padStart(2, '0')}, ${eventYear} <span>${timezone}</span>`
          }

          let time = document.createElement('div')
          time.className = 'time'
          time.innerHTML = ev_dayStr
          section.appendChild(time)

          let title = document.createElement('div')
          title.className = 'title'
          title.appendChild(document.createTextNode(_12event[e][2]))
          section.appendChild(title)

          if (_12event[e][20]) {
            var name = _12event[e][20]
          } else {
            var name = _12event[e][18]
          }
          let host = document.createElement('div')
          host.className = 'host'
          if (language === 'en') {
            host.innerHTML = `<span>${
              english_i18n[`city_${_12event[e][6]}`]
            }</span><span> | ${name}</span>`
          } else if (language === 'zh') {
            host.innerHTML = `<span>${
              chinese_i18n[`city_${_12event[e][6]}`]
            }</span><span> | ${name}</span>`
          }
          section.appendChild(host)

          let lastRow = document.createElement('div')
          lastRow.className = 'lastRow'
          let attendee = document.createElement('div')
          if (_12event[e][15] === null) {
            var people = 0
          } else {
            var people = _12event[e][15]
          }
          //
          if (language === 'en') {
            if (people > 1) {
              attendee.innerHTML = `<span>${people}</span><span>attendees</span>`
            } else {
              attendee.innerHTML = `<span>${people}</span><span>attendee</span>`
            }
          } else {
            if (people > 1) {
              attendee.innerHTML = `<span>${people}</span><span>人參加</span>`
            } else {
              attendee.innerHTML = `<span>${people}</span><span>人參加</span>`
            }
          }
          lastRow.appendChild(attendee)

          if (new Date(anchortm) < new Date(_12event[e][10])) {
            let anchorDiv = document.createElement('div')
            let anchorSpan = document.createElement('span')
            if (language === 'en') {
              anchorSpan.appendChild(document.createTextNode('Unbegun'))
            } else if (language === 'zh') {
              anchorSpan.appendChild(document.createTextNode('尚未開始'))
            }
            anchorDiv.appendChild(anchorSpan)
            lastRow.appendChild(anchorDiv)
          }
          section.appendChild(lastRow)
          eventinDiv.appendChild(section)
          eventDiv.appendChild(eventinDiv)
          a.appendChild(eventDiv)
          document.querySelector('.eventList .left').appendChild(a)
        }
        if (_12event.length === 0) {
          document.querySelector('.eventList .left').innerHTML =
            '<div id = "nofound"><img src= "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/nofound.png"/></div>'
        }
        document.querySelector('.eventLoad').style.display = 'none'
      }
    })
}

//生成參加活動紀錄
function joinDisplay(member_url, page) {
  fetch(
    `/api/joindisplay?member=${member_url}&page=${page}&anchortm=${anchortm}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  )
    .then(function (response) {
      if (response.ok) {
        return response.json()
      }
    })
    .catch((error) => {
      console.error('GET /api/joinDisplay 錯誤:', error)
    })
    .then(function (dict) {
      if ('invalidToken' in dict || 'error' in dict) {
        window.location.href = '/'
      } else if ('nextPage' in dict) {
        _12event = dict['_12event']
        nextPage_right = dict['nextPage']

        //生成活動紀錄
        for (let e = 0; e < _12event.length; e++) {
          let a = document.createElement('a')
          a.setAttribute('href', `/event/${_12event[e][3]}`)

          let eventDiv = document.createElement('div')
          eventDiv.className = 'event'

          let eventinDiv = document.createElement('div')
          eventinDiv.className = 'event_in'

          let picture = document.createElement('div')
          picture.className = 'picture'
          let pictureImg = document.createElement('img')
          pictureImg.src = _12event[e][16]
          picture.appendChild(pictureImg)
          eventinDiv.appendChild(picture)

          let section = document.createElement('div')
          section.className = 'section'

          let ev_dayStr
          let eventTime = new Date(_12event[e][13])
          let timezone = eventTime.toString().split(' ')[5]
          let eventDate = String(eventTime.getDate()).padStart(2, '0')
          let eventHour = String(eventTime.getHours()).padStart(2, '0')
          let eventYear = eventTime.getFullYear()
          if (language === 'en') {
            ev_dayStr = `${days_en[eventTime.getDay()]}, ${
              month_en[eventTime.getMonth()]
            } ${eventDate} · ${eventHour}:${String(
              eventTime.getMinutes(),
            ).padStart(2, '0')}, ${eventYear} <span>${timezone}</span>`
          } else if (language === 'zh') {
            ev_dayStr = `${days_cn[eventTime.getDay()]}, ${
              month_cn[eventTime.getMonth()]
            }${eventDate} · ${eventHour}:${String(
              eventTime.getMinutes(),
            ).padStart(2, '0')}, ${eventYear} <span>${timezone}</span>`
          }

          let time = document.createElement('div')
          time.className = 'time'
          time.innerHTML = ev_dayStr
          section.appendChild(time)

          let title = document.createElement('div')
          title.className = 'title'
          title.appendChild(document.createTextNode(_12event[e][5]))
          section.appendChild(title)

          if (_12event[e][23]) {
            var name = _12event[e][23]
          } else {
            var name = _12event[e][21]
          }
          let host = document.createElement('div')
          host.className = 'host'
          //
          if (language === 'en') {
            host.innerHTML = `<span>${
              english_i18n[`city_${_12event[e][9]}`]
            }</span><span> | ${name}</span>`
          } else if (language === 'zh') {
            host.innerHTML = `<span>${
              chinese_i18n[`city_${_12event[e][9]}`]
            }</span><span> | ${name}</span>`
          }
          section.appendChild(host)

          let lastRow = document.createElement('div')
          lastRow.className = 'lastRow'
          let attendee = document.createElement('div')
          if (_12event[e][18] === null) {
            var people = 0
          } else {
            var people = _12event[e][18]
          }

          if (language === 'en') {
            if (people > 1) {
              attendee.innerHTML = `<span>${people}</span><span>attendees</span>`
            } else {
              attendee.innerHTML = `<span>${people}</span><span>attendee</span>`
            }
          } else {
            if (people > 1) {
              attendee.innerHTML = `<span>${people}</span><span>人參加</span>`
            } else {
              attendee.innerHTML = `<span>${people}</span><span>人參加</span>`
            }
          }
          lastRow.appendChild(attendee)

          if (new Date(anchortm) < new Date(_12event[e][13])) {
            let anchorDiv = document.createElement('div')
            let anchorSpan = document.createElement('span')
            if (language === 'en') {
              anchorSpan.appendChild(document.createTextNode('Unbegun'))
            } else if (language === 'zh') {
              anchorSpan.appendChild(document.createTextNode('尚未開始'))
            }
            anchorDiv.appendChild(anchorSpan)
            lastRow.appendChild(anchorDiv)
          }
          section.appendChild(lastRow)
          eventinDiv.appendChild(section)
          eventDiv.appendChild(eventinDiv)
          a.appendChild(eventDiv)
          document.querySelector('.eventList .right').appendChild(a)
        }
        if (_12event.length === 0) {
          document.querySelector('.eventList .right').innerHTML =
            '<div id = "nofound"><img src= "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/nofound.png"/></div>'
        }
        document.querySelector('.eventLoad').style.display = 'none'
        flag = 0
      }
    })
}

//滑動載入活動紀錄
window.addEventListener('scroll', () => {
  if (
    document.querySelector('.eventRecord div:nth-child(1)').className ===
    'choose'
  ) {
    let ajaxHeight = document.documentElement.scrollHeight
    let deviseHeight = window.innerHeight
    let scrollable = ajaxHeight - deviseHeight
    let scrolled = document.documentElement.scrollTop

    if (scrolled + 10 >= scrollable) {
      if (nextPage_left) {
        if (nextPage_left_list.includes(nextPage_left)) {
        } else {
          nextPage_left_list.push(nextPage_left)
          // //載入留言
          document.querySelector('.eventLoad').style.display = 'flex'
          hostDisplay(member_url, nextPage_left)
        }
      }
    }
  } else if (
    document.querySelector('.eventRecord div:nth-child(2)').className ===
    'choose'
  ) {
    let ajaxHeight = document.documentElement.scrollHeight
    let deviseHeight = window.innerHeight
    let scrollable = ajaxHeight - deviseHeight
    let scrolled = document.documentElement.scrollTop

    if (scrolled + 10 >= scrollable) {
      if (nextPage_right) {
        if (nextPage_right_list.includes(nextPage_right)) {
        } else {
          nextPage_right_list.push(nextPage_right)
          // //載入留言
          document.querySelector('.eventLoad').style.display = 'flex'
          joinDisplay(member_url, nextPage_right)
        }
      }
    }
  }
})

//點擊主辦紀錄
document
  .querySelector('.eventRecord div:nth-child(1)')
  .addEventListener('click', () => {
    document.querySelector('.eventList .left').style.display = 'block'
    document.querySelector('.eventList .right').style.display = 'none'
  })

//點擊參加紀錄
document
  .querySelector('.eventRecord div:nth-child(2)')
  .addEventListener('click', () => {
    document.querySelector('.eventList .left').style.display = 'none'
    document.querySelector('.eventList .right').style.display = 'block'

    if (document.querySelector('.eventList .right').innerHTML === '') {
      flag += 1
      if (flag === 1) {
        document.querySelector('.eventLoad').style.display = 'flex'
        joinDisplay(member_url, 0)
      }
    }
  })
