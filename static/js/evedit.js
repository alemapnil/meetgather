var id,
  ev_title,
  ev_content,
  ev_cate,
  ev_limit,
  ev_location,
  ev_address,
  ev_lat,
  ev_lng,
  ev_tm,
  ev_pic
var acti_pho, acti_name, acti_story, acti_cate, acti_num, acti_city, acti_tm
var dataURL, blob, number

async function evedit() {
  if (access_token !== undefined) {
    document.body.style.backgroundColor = '#E5E5E5' //背景色調整

    for (s = 0; s < document.getElementsByTagName('select').length; s++) {
      //select歸零
      document.getElementsByTagName('select')[s].value = ''
    }

    for (s = 0; s < document.querySelectorAll('.enter .notice').length; s++) {
      // clear notice
      document.querySelectorAll('.enter .notice')[s].innerHTML = ''
    }
    if (language === 'en') {
      document
        .getElementById('story')
        .setAttribute('placeholder', 'Please fill in the description.')
      document
        .getElementById('gathername')
        .setAttribute('placeholder', 'Please fill in the title.')
      document
        .getElementById('gathernumber')
        .setAttribute(
          'placeholder',
          'Please fill in the limit on number of people.',
        )
      document
        .getElementById('location')
        .setAttribute('placeholder', 'Please fill in the location.')
    } else if (language === 'zh') {
      document
        .getElementById('story')
        .setAttribute('placeholder', '請描述活動內容')
      document
        .getElementById('gathername')
        .setAttribute('placeholder', '請填寫活動名稱')
      document
        .getElementById('gathernumber')
        .setAttribute('placeholder', '請填寫活動人數上限')
      document
        .getElementById('location')
        .setAttribute('placeholder', '請輸入活動地點')
    }

    id = current_url.split('/')[current_url.split('/').length - 1]

    await fetch(`/api/event/${id}`) //取得活動資訊
      .then(function (response) {
        if (response.ok) {
          return response.json()
        }
      })
      .catch((error) => {
        console.error('GET /api/event 錯誤:', error)
      })
      .then(function (ele) {
        dict = ele
        if ('ok' in dict) {
          ;(ev_title = dict['activity'][2]),
            (ev_content = dict['activity'][3]),
            (ev_cate = dict['activity'][4]),
            (ev_limit = dict['activity'][5]),
            (ev_location = dict['activity'][6])
          ;(ev_address = dict['activity'][7]),
            (ev_lat = dict['activity'][8]),
            (ev_lng = dict['activity'][9]),
            (ev_tm = dict['activity'][10]),
            (ev_pic = dict['activity'][13])

          //判斷是否為活動主辦人要編輯活動
          if (
            dict['host'][0] !==
            parseInt(document.querySelector('.shot').getAttribute('member_id'))
          ) {
            window.location.href = '/'
          }

          document.title = `${ev_title} | Edit event` // 網頁標題
          //各區塊放入相對應資訊
          document.querySelector('.activity_photo .photo img').src = ev_pic
          document.getElementById('gathername').value = ev_title
          document.getElementById('story').value = ev_content
          document.getElementById('gathernumber').value = ev_limit

          for (
            let i = 0;
            i < document.querySelectorAll('.category option').length;
            i++
          ) {
            if (
              parseInt(
                document.querySelectorAll('.category option')[i].value,
              ) === ev_cate
            ) {
              document.querySelector('.category').value = `${ev_cate}`
              document.querySelector('.category').style.color =
                'rgb(0,0,0,0.75)'
            }
          }
          for (
            let i = 0;
            i < document.querySelectorAll('.city option').length;
            i++
          ) {
            if (
              parseInt(document.querySelectorAll('.city option')[i].value) ===
              ev_location
            ) {
              document.querySelector('.city').value = `${ev_location}`
              document.querySelector('.city').style.color = 'rgb(0,0,0,0.75)'
            }
          }

          if (ev_address !== null) {
            //非線上，有實體位置
            initMap()
            document.querySelector('.searchmap').style.display = 'block'
            document.getElementById('map').style.display = 'block'
            document.getElementById('location').value = ev_address
          }
          document.getElementById('localtime').value = toGmt8TmStr(ev_tm)
        } else if ('message' in dict && dict['message'] === `沒有活動 ${id}`) {
          window.location.href = '/'
        }
      })
  } else {
    window.location.href = '/'
  }
}

// 縮小圖片
function shrink(ele, ct) {
  if (ele.naturalWidth >= ele.naturalHeight && ele.naturalWidth > 700) {
    const canvas = document.createElement('canvas')
    const max_width = 700
    const scaleSize = max_width / ele.naturalWidth
    canvas.width = max_width
    canvas.height = ele.naturalHeight * scaleSize

    const ctx = canvas.getContext('2d')
    ctx.drawImage(ele, 0, 0, canvas.width, canvas.height)
    dataURL = ctx.canvas.toDataURL(ele, ct)
    document.querySelector('.acti_pho .activity_photo img').src = dataURL
    // 建立 file
    const blobBin = atob(dataURL.split(',')[1])
    const array = []
    for (let i = 0; i < blobBin.length; i++) {
      array.push(blobBin.charCodeAt(i))
    }
    blob = new Blob([new Uint8Array(array)], { type: ct })

    aspect = canvas.width / canvas.height
    if (aspect < 0.3 || aspect > 3.5) {
      if (language === 'en') {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          'Aspect ratio shall be 0.3 ~ 3.5.'
      } else {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          '長寬比需為0.3至3.5之間'
      }
    }
  } else if (ele.naturalHeight >= ele.naturalWidth && ele.naturalHeight > 700) {
    const canvas = document.createElement('canvas')
    const max_height = 700
    const scaleSize = max_height / ele.naturalHeight
    canvas.height = max_height
    canvas.width = ele.naturalWidth * scaleSize
    const ctx = canvas.getContext('2d')
    ctx.drawImage(ele, 0, 0, canvas.width, canvas.height)
    dataURL = ctx.canvas.toDataURL(ele, ct)
    document.querySelector('.acti_pho .activity_photo img').src = dataURL
    // 建立 file
    const blobBin = atob(dataURL.split(',')[1])
    const array = []
    for (let i = 0; i < blobBin.length; i++) {
      array.push(blobBin.charCodeAt(i))
    }
    blob = new Blob([new Uint8Array(array)], { type: ct })

    aspect = canvas.width / canvas.height
    if (aspect < 0.3 || aspect > 3.5) {
      if (language === 'en') {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          'Aspect ratio shall be 0.3 ~ 3.5.'
      } else {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          '長寬比需為0.3至3.5之間'
      }
    }
  } else {
    dataURL = undefined
    blob = undefined
    if (ele.naturalWidth < 200 || ele.naturalHeight < 200) {
      if (language === 'en') {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          'The minimum image dimension is 200 x 200 pixels.'
      } else {
        document.querySelector('.acti_pho .enter .notice').innerHTML =
          '圖檔最小尺寸須為200 x 200 px'
      }
    }
  }
}

async function preview() {
  number_count += 1
  if (number_count === 1) {
    //預覽中
    document.querySelector('.view .preview').style.display = 'none'
    document.querySelector('.view .previewload').style.display = 'block'

    //活動人數上限
    number = document.getElementById('gathernumber').value.replace(spaceOff, '') //remove all space
    if (number.match(NonInt)) {
      if (language === 'en') {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          'Error number'
      } else {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          '人數有誤'
      }
    } else if (parseInt(number, 10) === 0 || parseInt(number, 10) === 1) {
      if (language === 'en') {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          'Insufficiency'
      } else {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          '人數不夠'
      }
    } else if (parseInt(number, 10) > 999999999) {
      if (language === 'en') {
        document.querySelector('.acti_num .enter .notice').innerHTML = 'Excess'
      } else {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          '人數過多'
      }
    } else if (parseInt(number, 10)) {
      await fetch(`/api/allJoinNum/${id}`, { method: 'GET' })
        .then(function (response) {
          if (response.ok) {
            return response.json()
          }
        })
        .catch((error) => {
          console.error(`GET /api/allJoinNum/${id} 回傳值`, error)
        })
        .then(function (dict) {
          if ('ok' in dict) {
            if (dict['allJoinNum'] > parseInt(number, 10)) {
              if (language === 'en') {
                document.querySelector(
                  '.acti_num .enter .notice',
                ).innerHTML = `Shall not be lower than ${dict['allJoinNum']}`
              } else {
                document.querySelector(
                  '.acti_num .enter .notice',
                ).innerHTML = `不可低於目前人數${dict['allJoinNum']}位`
              }
            } else {
              document.querySelector('.acti_num .enter .notice').innerHTML = ''
              acti_num = number
            }
          } else {
            console.log('unknown problem', dict)
          }
        })
    } else {
      if (language === 'en') {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          'Shall not be empty'
      } else {
        document.querySelector('.acti_num .enter .notice').innerHTML =
          '人數為空'
      }
    }

    //活動圖示
    if (document.getElementById('file').files.length === 0) {
      acti_pho = null
    } else {
      acti_pho = document.getElementById('file').files[0]
      if (ALLOWED_EXTENSIONS.includes(acti_pho.type)) {
        document.querySelector('.acti_pho .enter .notice').innerHTML = ''
        var reader = new FileReader()
        reader.readAsDataURL(acti_pho)
        let promise = new Promise(function (resolve, reject) {
          reader.onload = function (event) {
            const imgElement = document.createElement('img')
            imgElement.src = event.target.result
            imgElement.onload = function (e) {
              shrink(e.target, acti_pho.type)
              resolve()
            }
          }
        })
        await promise
      } else if (acti_pho.type.length === 0) {
        var reader = new FileReader()
        reader.readAsDataURL(acti_pho)
        let promise = new Promise(function (resolve, reject) {
          reader.onload = function (event) {
            const setImg = document.createElement('img')
            let colon = event.target.result.indexOf(':')
            semicolon = event.target.result.indexOf(';')
            setImg.src =
              event.target.result.slice(0, colon + 1) +
              'image/jpeg' +
              event.target.result.slice(semicolon)
            setImg.onload = function (e) {
              shrink(e.target, 'image/jpeg')
              resolve()
            }
          }
        })
        await promise
      }
    }
    //活動標題
    let gathername = document.getElementById('gathername').value.trim()
    if (gathername.match(nonSpacePat)) {
      if (gathername.length < 100) {
        document.querySelector('.acti_name .enter .notice').innerHTML = ''
        acti_name = gathername
      } else {
        if (language === 'en') {
          document.querySelector('.acti_name .enter .notice').innerHTML =
            'Title is too long.'
        } else {
          document.querySelector('.acti_name .enter .notice').innerHTML =
            '活動標題過長'
        }
      }
    } else {
      if (language === 'en') {
        document.querySelector('.acti_name .enter .notice').innerHTML =
          'Shall not be empty'
      } else {
        document.querySelector('.acti_name .enter .notice').innerHTML =
          '不可為空'
      }
    }

    //活動描述
    let story = document.getElementById('story').value.trim()
    if (story.match(nonSpacePat)) {
      document.querySelector('.acti_descp .enter .notice').innerHTML = ''
      acti_story = story
    } else {
      if (language === 'en') {
        document.querySelector('.acti_descp .enter .notice').innerHTML =
          'Shall not be empty'
      } else {
        document.querySelector('.acti_descp .enter .notice').innerHTML =
          '不可為空'
      }
    }

    //活動類別
    let category = document.querySelector('.category')
    if (category.value !== '') {
      document.querySelector('.acti_cate .enter .notice').innerHTML = ''
      acti_cate = category.value
    } else {
      if (language === 'en') {
        document.querySelector('.acti_cate .enter .notice').innerHTML =
          'Shall not be empty'
      } else {
        document.querySelector('.acti_cate .enter .notice').innerHTML =
          '不可為空'
      }
    }

    //活動地點
    let city = document.querySelector('.city')
    if (city.value !== '') {
      document.querySelector('.acti_add .enter .notice').innerHTML = ''
      acti_city = city.value
      if (city.value !== '0') {
        if (
          acti_add === undefined &&
          document.getElementById('location').value !== ev_address
        ) {
          if (language === 'en') {
            document.querySelector('.acti_add .enter .notice').innerHTML =
              'Address shall be marked on the map.'
          } else {
            document.querySelector('.acti_add .enter .notice').innerHTML =
              '地址須標記在地圖上'
          }
        } else {
          document.querySelector('.acti_add .enter .notice').innerHTML = ''
        }
      }
    } else {
      if (language === 'en') {
        document.querySelector('.acti_add .enter .notice').innerHTML =
          'Shall not be empty'
      } else {
        document.querySelector('.acti_add .enter .notice').innerHTML =
          '不可為空'
      }
    }

    //活動時間
    acti_tm = document.getElementById('localtime').value
    if (acti_tm !== undefined && new Date(acti_tm) > new Date()) {
      document.querySelector('.acti_tm .enter .notice').innerHTML = ''
      acti_tm = acti_tm.replace('T', ' ')
    } else {
      if (language === 'en') {
        document.querySelector('.acti_tm .enter .notice').innerHTML =
          'Error time'
      } else {
        document.querySelector('.acti_tm .enter .notice').innerHTML =
          '活動時間有誤'
      }
    }

    let redNotice = 0
    for (
      let n = 0;
      n < document.querySelectorAll('.enter .notice').length;
      n++
    ) {
      if (document.querySelectorAll('.enter .notice')[n].innerHTML !== '') {
        redNotice += 1
      }
    }

    if (redNotice > 0) {
      number_count = 0 //fetch 完畢歸零
      //回覆預覽顯示
      document.querySelector('.view .preview').style.display = 'block'
      document.querySelector('.view .previewload').style.display = 'none'
      document.documentElement.scrollTop = 0
      if (language === 'en') {
        alert('Data is incomplete.')
      } else {
        alert('資料輸入不完善')
      }
    }
    //預覽按鈕控制
    else {
      number_count = 0 //fetch 完畢歸零
      //回覆預覽顯示
      document.querySelector('.view .preview').style.display = 'block'
      document.querySelector('.view .previewload').style.display = 'none'

      //預覽結果顯示
      document.querySelector('.modal6').style.display = 'block'
      document.querySelector('.modal6').scrollTop = 0
      document.querySelector('.popup6').style.display = 'block'
      document.body.classList.add('noscroll')
      document.querySelector('.box0').style.position = 'static'
      document.querySelector('.laptop').style.position = 'static'

      ///顯示活動圖片

      if (acti_pho !== null) {
        var reader = new FileReader()
        reader.readAsDataURL(acti_pho)
        reader.onload = function (event) {
          document.querySelector('.view_photo .photo img').src =
            event.target.result
        }
      } else {
        document.querySelector('.view_photo .photo img').src = ev_pic
      }

      document.querySelector('.popup6 .view_gathername').innerHTML = ''
      document
        .querySelector('.popup6 .view_gathername')
        .appendChild(document.createTextNode(acti_name))

      document.querySelector('.popup6 .view_descp').innerHTML = ''
      document
        .querySelector('.popup6 .view_descp')
        .appendChild(document.createTextNode(acti_story))

      document.querySelector('.popup6 .view_cate').innerHTML = ''
      if (language === 'en') {
        document
          .querySelector('.popup6 .view_cate')
          .appendChild(
            document.createTextNode(english_i18n['cate_' + acti_cate]),
          )
      } else {
        document
          .querySelector('.popup6 .view_cate')
          .appendChild(
            document.createTextNode(chinese_i18n['cate_' + acti_cate]),
          )
      }

      document.querySelector('.popup6 .view_num').innerHTML = ''
      document
        .querySelector('.popup6 .view_num')
        .appendChild(
          document.createTextNode(numberComma(parseInt(acti_num, 10))),
        )

      document.querySelector('.popup6 .view_city').innerHTML = ''
      if (language === 'en') {
        document
          .querySelector('.popup6 .view_city')
          .appendChild(
            document.createTextNode(english_i18n['city_' + acti_city]),
          )
      } else {
        document
          .querySelector('.popup6 .view_city')
          .appendChild(
            document.createTextNode(chinese_i18n['city_' + acti_city]),
          )
      }

      try {
        document.querySelector('.popup6 .view_add').innerHTML = ''
      } catch {}
      if (acti_city !== '0') {
        if (acti_add !== undefined) {
          document
            .querySelector('.popup6 .view_add')
            .appendChild(document.createTextNode(acti_add))
        } else {
          document
            .querySelector('.popup6 .view_add')
            .appendChild(document.createTextNode(ev_address))
        }
      }
      document.querySelector('.popup6 .view_tm').innerHTML = ''
      document
        .querySelector('.popup6 .view_tm')
        .appendChild(document.createTextNode(acti_tm))

      //back to edit
      document
        .querySelector('.popup6 .view_send .back')
        .addEventListener('click', function () {
          document.querySelector('.modal6').style.display = 'none'
          document.querySelector('.popup6').style.display = 'none'
          document.body.classList.remove('noscroll')
          document.documentElement.scrollTop = 0
          document.querySelector('.box0').style.position = 'fixed'
          document.querySelector('.laptop').style.position = 'fixed'
        })
    }
  }
}

function readImg(para) {
  var reader = new FileReader()
  reader.readAsDataURL(para)
  reader.onload = function (event) {
    document.querySelector('.activity_photo .photo img').src =
      event.target.result
  }
  document.querySelector('.acti_pho .enter .notice').innerHTML = ''
}

//活動 form submit 取消
document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault()
})

// 活動圖片上傳
document
  .querySelector('.activity_photo .photo')
  .addEventListener('click', function () {
    document.getElementById('file').value = ''
    document.getElementById('file').click()
  })

document.getElementById('file').addEventListener('change', function () {
  let file = document.getElementById('file').files[0]
  if (ALLOWED_EXTENSIONS.includes(file.type) || file.type.length === 0) {
    readImg(file)
  } else {
    document.querySelector('.activity_photo .photo img').src =
      'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/upload.svg'
    if (language === 'en') {
      document.querySelector('.acti_pho .enter .notice').innerHTML =
        'Please choose a photo.'
    } else {
      document.querySelector('.acti_pho .enter .notice').innerHTML =
        '請選擇一張照片'
    }
  }
})

//活動標題
document.getElementById('gathername').addEventListener('input', function () {
  if (this.value.match(nonSpacePat)) {
    if (this.value.trim().length < 100) {
      document.querySelector('.acti_name .enter .notice').innerHTML = ''
    } else {
      if (language === 'en') {
        document.querySelector('.acti_name .enter .notice').innerHTML =
          'Title is too long.'
      } else {
        document.querySelector('.acti_name .enter .notice').innerHTML =
          '活動標題過長'
      }
    }
  } else {
    if (language === 'en') {
      document.querySelector('.acti_name .enter .notice').innerHTML =
        'Shall not be empty'
    } else {
      document.querySelector('.acti_name .enter .notice').innerHTML = '不可為空'
    }
  }
})

//活動描述
document.getElementById('story').addEventListener('input', function () {
  if (this.value.match(nonSpacePat)) {
    document.querySelector('.acti_descp .enter .notice').innerHTML = ''
  } else {
    if (language === 'en') {
      document.querySelector('.acti_descp .enter .notice').innerHTML =
        'Shall not be empty'
    } else {
      document.querySelector('.acti_descp .enter .notice').innerHTML =
        '不可為空'
    }
  }
})

//活動類別
document.querySelector('.category').style.color = '#bebebe'
document.querySelector('.category').addEventListener('change', function () {
  let select = document.querySelector('.category')
  if (select.value === '') {
    select.style.color = '#bebebe'
    if (language === 'en') {
      document.querySelector('.acti_cate .enter .notice').innerHTML =
        'Shall not be empty'
    } else {
      document.querySelector('.acti_cate .enter .notice').innerHTML = '不可為空'
    }
  } else {
    select.style.color = 'rgb(0,0,0,0.75)'
    document.querySelector('.acti_cate .enter .notice').innerHTML = ''
  }
})

//活動人數
document.getElementById('gathernumber').addEventListener('input', () => {
  number = document.getElementById('gathernumber').value.replace(spaceOff, '') //remove all space

  if (number.match(NonInt)) {
    if (language === 'en') {
      document.querySelector('.acti_num .enter .notice').innerHTML =
        'Error number'
    } else {
      document.querySelector('.acti_num .enter .notice').innerHTML = '人數有誤'
    }
  } else if (parseInt(number, 10) === 0 || parseInt(number, 10) === 1) {
    if (language === 'en') {
      document.querySelector('.acti_num .enter .notice').innerHTML =
        'Insufficiency'
    } else {
      document.querySelector('.acti_num .enter .notice').innerHTML = '人數不夠'
    }
  } else if (parseInt(number, 10) > 999999999) {
    if (language === 'en') {
      document.querySelector('.acti_num .enter .notice').innerHTML = 'Excess'
    } else {
      document.querySelector('.acti_num .enter .notice').innerHTML = '人數過多'
    }
  } else if (parseInt(number, 10)) {
    //查看目前參與人數
    document.querySelector('.acti_num .enter .notice').innerHTML = ''
  } else {
    if (language === 'en') {
      document.querySelector('.acti_num .enter .notice').innerHTML =
        'Shall not be empty'
    } else {
      document.querySelector('.acti_num .enter .notice').innerHTML = '不可為空'
    }
  }
})

//活動縣市
document.querySelector('.city').style.color = '#bebebe'
document.querySelector('.city').addEventListener('change', function () {
  document.querySelector('.acti_add .enter .notice').innerHTML = ''
  let select = document.querySelector('.city')
  if (select.value === '') {
    select.style.color = '#bebebe'
    document.querySelector('.searchmap').style.display = 'none'
    document.getElementById('map').style.display = 'none'
    if (language === 'en') {
      document.querySelector('.acti_add .enter .notice').innerHTML =
        'Shall not be empty'
    } else {
      document.querySelector('.acti_add .enter .notice').innerHTML = '不可為空'
    }
  } else if (select.value === '0') {
    select.style.color = 'rgb(0,0,0,0.75)'
    document.querySelector('.searchmap').style.display = 'none'
    document.getElementById('map').style.display = 'none'
    document.querySelector('.acti_add .enter .notice').innerHTML = ''
  } else {
    initMap()
    select.style.color = 'rgb(0,0,0,0.75)'
    document.querySelector('.searchmap').style.display = 'block'
    document.getElementById('map').style.display = 'block'
    document.getElementById('location').value = ''
    acti_add = undefined
    document.querySelector('.acti_add .enter .notice').innerHTML = ''
  }
})

let nonSpacePat_O = /[\S]/g
let NonInt_O = /[\s\D]/g
//
// let nonSpacePat = new RegExp('\\S', 'g')
let NonInt = new RegExp('\\s\\D', 'g')

//活動時間
document.getElementById('localtime').addEventListener('input', function () {
  document.getElementById('localtime').style.color = 'rgb(0,0,0,0.75)'
  if (new Date(this.value) <= new Date()) {
    if (language === 'en') {
      document.querySelector('.acti_tm .enter .notice').innerHTML = 'Error time'
    } else {
      document.querySelector('.acti_tm .enter .notice').innerHTML =
        '活動時間有誤'
    }
  } else {
    document.querySelector('.acti_tm .enter .notice').innerHTML = ''
    acti_tm = this.value
  }
})

//點擊預覽
let number_count = 0
document
  .querySelector('.acti_view .view')
  .addEventListener('click', () => preview())

//確定送出
document
  .querySelector('.popup6 .view_send .send')
  .addEventListener('click', () => {
    //預覽畫面消失
    document.querySelector('.modal6').style.display = 'none'
    document.querySelector('.popup6').style.display = 'none'
    document.body.classList.remove('noscroll')
    document.querySelector('.box0').style.position = 'fixed'
    document.querySelector('.laptop').style.position = 'fixed'

    //重整畫面出現
    document.querySelector('.overlay').style.display = 'flex'

    let formdata = new FormData()
    formdata.append('acti_id', id)
    if (dataURL !== undefined) {
      formdata.append('acti_pho', blob)
    } else {
      formdata.append('acti_pho', acti_pho) //有可能是null，有可能是照片
    }
    formdata.append('acti_name', acti_name)
    formdata.append('acti_story', acti_story)
    formdata.append('acti_cate', parseInt(acti_cate))
    formdata.append('acti_num', acti_num)
    formdata.append('acti_city', parseInt(acti_city))
    if (acti_city !== '0') {
      if (acti_add !== undefined) {
        formdata.append('acti_add', acti_add)
        formdata.append('acti_lat', acti_lat)
        formdata.append('acti_lng', acti_lng)
      } else {
        formdata.append('acti_add', ev_address)
        formdata.append('acti_lat', ev_lat)
        formdata.append('acti_lng', ev_lng)
      }
    }
    formdata.append('acti_tm', acti_tm)

    //     for(var pair of formdata.entries()) {
    //         console.log(pair[0]+ ', '+ pair[1]);
    //    }
    fetch('/api/edit', {
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
          document.querySelector('.success').style.display = 'flex'
        } else {
          document.querySelector('.fail').style.display = 'flex'
        }
      })
  })

//活動圖示顯示圖片
document.getElementById('send').addEventListener('click', function (fe) {
  fe.preventDefault()
  const file = document.querySelector('#upload').files[0]
  if (!file) {
    return
  }
  var reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = function (event) {
    document.querySelector('#input').src = event.target.result
  }
})

//放棄編輯
document
  .querySelector('.acti_view .abandon')
  .addEventListener('click', function () {
    window.location.href = document.URL.replace('evedit', 'event')
  })

//建立活動結果後確認
for (i = 0; i < document.querySelectorAll('.close').length; i++) {
  document.querySelectorAll('.close')[i].addEventListener('click', () => {
    window.location.href = document.URL.replace('evedit', 'event')
  })
}
