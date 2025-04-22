document.querySelector('.overlay').style.display = 'flex'

function today_tomorrow() {
  const today = new Date() //前端當地時間
  let today_date = `${new Date().getFullYear()}-${padZero(
    new Date().getMonth() + 1,
  )}-${padZero(new Date().getDate())}`
  let tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  let tomorrow_date = `${tomorrow.getFullYear()}-${padZero(
    tomorrow.getMonth() + 1,
  )}-${padZero(tomorrow.getDate())}`
  return [today_date, tomorrow_date]
}

function periodButNone() {
  document.querySelector('.choosePeriod').style.display = 'none'
  document.querySelector('.calender').style.display = 'none'
  clearHas_calender()
}

function clearHas_calender() {
  if (document.querySelector('.result')) {
    document.querySelector('.result').classList.remove('has_calender')
  }
  if (document.getElementById('nofound')) {
    document.getElementById('nofound').classList.remove('has_calender')
  }
}

function addHas_calender() {
  if (document.querySelector('.result')) {
    document.querySelector('.result').classList.add('has_calender')
  }
  if (document.getElementById('nofound')) {
    document.getElementById('nofound').classList.add('has_calender')
  }
}

async function find() {
  //
  clearHas_calender()
  // location & time
  for (let l = 0; l < document.querySelectorAll('.event').length; l++) {
    let locationNum = document.querySelectorAll(
      '.event .host span:first-child',
    )[l].innerHTML
    document.querySelectorAll('.event .host span:first-child')[l].className =
      'lang'
    document
      .querySelectorAll('.event .host span:first-child')
    [l].setAttribute('key', `city_${locationNum}`)
    //
    let ev_dayStr
    let eventTime = new Date(
      document.querySelectorAll('.event .time')[l].innerHTML + 'Z',
    )
    let timezone = eventTime.toString().split(' ')[5]
    let eventDate = String(eventTime.getDate()).padStart(2, '0')
    let eventHour = String(eventTime.getHours()).padStart(2, '0')

    if (language === 'en') {
      ev_dayStr = `${days_en[eventTime.getDay()]}, ${month_en[eventTime.getMonth()]
        } ${eventDate} · ${eventHour}:${String(eventTime.getMinutes()).padStart(
          2,
          '0',
        )} <span>${timezone}</span>`
    } else if (language === 'zh') {
      ev_dayStr = `${days_cn[eventTime.getDay()]}, ${month_cn[eventTime.getMonth()]
        }${eventDate} · ${eventHour}:${String(eventTime.getMinutes()).padStart(
          2,
          '0',
        )} <span>${timezone}</span>`
    }
    document.querySelectorAll('.event .time')[l].innerHTML = ev_dayStr
  }

  if (language === 'en') {
    English()
  } else if (language === 'zh') {
    Chinese()
  }

  //
  if (
    current_url.includes('datefrom=') ||
    current_url.includes('category=') ||
    current_url.includes('location=')
  ) {
    document.querySelector('.refresh').style.display = 'flex'
  } else {
    document.querySelector('.refresh').style.display = 'none'
  }

  let main_url = current_url.slice(0, current_url.indexOf('/find')) + '/find?'
  //去除重複的query string，防止使用者惡搞
  let keyCo = [],
    dateFromCo = [],
    dateToCo = [],
    cateCo = [],
    locateCo = [],
    sortCo = [],
    pageCo = [],
    tzOffsetCo = []
  let lastCo = [] //最後完成的集合

  let split = current_url.split('&')
  for (let s = 0; s < split.length; s++) {
    if (split[s].slice(0, 8) === 'keyword=' && keyCo.length === 0) {
      keyCo.push(split[s])
    } else if (
      split[s].slice(0, 9) === 'datefrom=' &&
      dateFromCo.length === 0
    ) {
      dateFromCo.push(split[s])
    } else if (split[s].slice(0, 7) === 'dateto=' && dateToCo.length === 0) {
      dateToCo.push(split[s])
    } else if (
      split[s].slice(0, 9) === 'tzOffset=' &&
      tzOffsetCo.length === 0
    ) {
      tzOffsetCo.push(`tzOffset=${tzOffset}`)
    } else if (split[s].slice(0, 9) === 'category=' && cateCo.length === 0) {
      cateCo.push(split[s])
    } else if (split[s].slice(0, 9) === 'location=' && locateCo.length === 0) {
      locateCo.push(split[s])
    } else if (split[s].slice(0, 7) === 'sortby=' && sortCo.length === 0) {
      sortCo.push(split[s])
    } else if (split[s].slice(0, 5) === 'page=' && pageCo.length === 0) {
      pageCo.push(split[s])
    }
  }

  if (keyCo.length > 0) {
    lastCo.push(keyCo[0])
  }
  if (dateFromCo.length > 0) {
    lastCo.push(dateFromCo[0])
  }
  if (dateToCo.length > 0) {
    lastCo.push(dateToCo[0])
  }
  if (tzOffsetCo.length > 0) {
    lastCo.push(tzOffsetCo[0])
  }
  if (cateCo.length > 0) {
    lastCo.push(cateCo[0])
  }
  if (locateCo.length > 0) {
    lastCo.push(locateCo[0])
  }
  if (sortCo.length > 0) {
    lastCo.push(sortCo[0])
  }
  if (pageCo.length > 0) {
    lastCo.push(pageCo[0])
  }
  if (lastCo.length > 0) {
    current_url = main_url + '&' + lastCo.join('&')
  } else {
    current_url = main_url
  }

  //重整頁面後，篩選器的顯示(時間)
  let dateOptions = document.getElementsByTagName('select')[0].options
  if (
    current_url.includes(
      `datefrom=${today_tomorrow()[0]}&dateto=${today_tomorrow()[0]}`,
    )
  ) {
    //今天
    dateOptions[1].selected = true
    document.getElementsByTagName('select')[0].classList.add('selectChange')
  } else if (
    current_url.includes(
      `datefrom=${today_tomorrow()[1]}&dateto=${today_tomorrow()[1]}`,
    )
  ) {
    //明天
    dateOptions[2].selected = true
    document.getElementsByTagName('select')[0].classList.add('selectChange')
  } else if (
    current_url.includes('datefrom=') &&
    current_url.includes('dateto=')
  ) {
    //自選時段
    dateOptions[3].selected = true
    document.getElementsByTagName('select')[0].classList.add('selectChange')
    document.querySelector('.choosePeriod').style.display = 'flex'

    let arr = current_url.split('&')
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].includes('datefrom=')) {
        if (arr[i].split('=')[1] !== arr[i + 1].split('=')[1]) {
          document.querySelector('.choosePeriod button span').innerHTML = `${arr[i].split('=')[1]
            }~ ${arr[i + 1].split('=')[1]}`
        } else {
          document.querySelector('.choosePeriod button span').innerHTML = `${arr[i].split('=')[1]
            }`
        }
      }
    }
  } else if (
    !current_url.includes('datefrom=') &&
    !current_url.includes('dateto=')
  ) {
    //沒有選時間
    dateOptions[0].selected = true
  }

  //重整頁面後，篩選器的顯示(類別)
  let cateOptions = document.getElementsByTagName('select')[1].options
  let arrCate = current_url.split('&')
  for (let c = 0; c < arrCate.length; c++) {
    if (arrCate[c].includes('category=')) {
      let cateNo = parseInt(arrCate[c].replace('category=', ''))
      cateOptions[cateNo + 1].selected = true
      document.getElementsByTagName('select')[1].classList.add('selectChange')
    }
  }

  //重整頁面後，篩選器的顯示(地點)
  let spotOptions = document.getElementsByTagName('select')[2].options
  let arrSpot = current_url.split('&')
  for (let c = 0; c < arrSpot.length; c++) {
    if (arrSpot[c].includes('location=')) {
      let spotName = parseInt(arrSpot[c].replace('location=', ''))
      spotOptions[spotName + 1].selected = true
      document.getElementsByTagName('select')[2].classList.add('selectChange')
    }
  }

  //重整頁面後，篩選器的顯示(排序)
  let sortOptions = document.getElementsByTagName('select')[3].options
  let arrSort = current_url.split('&')

  if (current_url.includes('sortby=')) {
    sortOptions[1].selected = true
  } else {
    sortOptions[0].selected = true
  }

  // change function
  function alterDate(e) {
    if (this.value === '') {
      //任何時段
      this.classList.remove('selectChange')
      periodButNone()
      if (current_url.includes('datefrom=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('datefrom=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(arr.slice(i + 3))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      }
    } else if (this.value === '0') {
      //今天
      this.className = 'selectChange'
      periodButNone()
      if (current_url.includes('datefrom=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('datefrom=')) {
            let time = [
              `datefrom=${today_tomorrow()[0]}`,
              `dateto=${today_tomorrow()[0]}`,
              `tzOffset=${tzOffset}`,
            ]
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(time)
              .concat(arr.slice(i + 3))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      } else {
        //去掉URL頁碼
        let newUrl
        newUrl =
          current_url +
          `&datefrom=${today_tomorrow()[0]}&dateto=${today_tomorrow()[0]
          }&tzOffset=${tzOffset}`
        if (newUrl.includes('page=')) {
          let _2newUrl = newUrl.split('&')
          for (let n = 0; n < _2newUrl.length; n++) {
            if (_2newUrl[n].includes('page=')) {
              newUrl = _2newUrl
                .slice(0, n)
                .concat(_2newUrl.slice(n + 1))
                .join('&')
            }
          }
        }
        window.location.href = newUrl
      }
    } else if (this.value === '1') {
      //明天
      this.className = 'selectChange'
      periodButNone()
      if (current_url.includes('datefrom=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('datefrom=')) {
            let time = [
              `datefrom=${today_tomorrow()[1]}`,
              `dateto=${today_tomorrow()[1]}`,
              `tzOffset=${tzOffset}`,
            ]
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(time)
              .concat(arr.slice(i + 3))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      } else {
        //去掉URL頁碼
        let newUrl
        newUrl =
          current_url +
          `&datefrom=${today_tomorrow()[1]}&dateto=${today_tomorrow()[1]
          }&tzOffset=${tzOffset}`
        if (newUrl.includes('page=')) {
          let _2newUrl = newUrl.split('&')
          for (let n = 0; n < _2newUrl.length; n++) {
            if (_2newUrl[n].includes('page=')) {
              newUrl = _2newUrl
                .slice(0, n)
                .concat(_2newUrl.slice(n + 1))
                .join('&')
            }
          }
        }
        window.location.href = newUrl
      }
    } else if (this.value === '2') {
      this.removeEventListener('change', alterDate)
      //
      this.className = 'selectChange'
      document.querySelector('.choosePeriod').style.display = 'flex'

      if (language === 'en') {
        document.querySelector('.choosePeriod button span').innerHTML =
          'Time periods'
      } else if (language === 'zh') {
        document.querySelector('.choosePeriod button span').innerHTML =
          '起訖時段'
      }
      document.querySelector('.calender').style.display = 'block'
      addHas_calender()
      this.addEventListener('change', alterDate)
    }
  }

  // filter choose time : any, today, tomorrow
  document.getElementById('selectdate').addEventListener('change', alterDate)

  let dateCount = 0 //因為點擊自選時段的特殊性，所以select date用click事件，其他選擇器用change
  // //filter choose 自選時段
  document.getElementById('selectdate').addEventListener('click', function () {
    console.log('safari test')
    dateCount += 1
    if (dateCount === 1) {
      if (this.value === '2') {
        this.removeEventListener('change', alterDate)
        //
        this.className = 'selectChange'
        document.querySelector('.choosePeriod').style.display = 'flex'

        if (language === 'en') {
          document.querySelector('.choosePeriod button span').innerHTML =
            'Time periods'
        } else if (language === 'zh') {
          document.querySelector('.choosePeriod button span').innerHTML =
            '起訖時段'
        }
        document.querySelector('.calender').style.display = 'block'
        addHas_calender()
        this.addEventListener('change', alterDate)
      }
    }
    dateCount = 0
  })

  // filter choose category
  let selectcategory = document.getElementById('selectcategory')
  selectcategory.addEventListener('change', function () {
    if (this.value === '') {
      //任何類別
      selectcategory.classList.remove('selectChange')
      if (current_url.includes('category=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('category=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(arr.slice(i + 1))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      }
    } else {
      // 其他類別
      selectcategory.className = 'selectChange'
      if (current_url.includes('category=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('category=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat([`category=${this.value}`])
              .concat(arr.slice(i + 1))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      } else {
        //去掉URL頁碼
        let newUrl
        newUrl = current_url + `&category=${this.value}`
        if (newUrl.includes('page=')) {
          let _2newUrl = newUrl.split('&')
          for (let n = 0; n < _2newUrl.length; n++) {
            if (_2newUrl[n].includes('page=')) {
              newUrl = _2newUrl
                .slice(0, n)
                .concat(_2newUrl.slice(n + 1))
                .join('&')
            }
          }
        }
        window.location.href = newUrl
      }
    }
  })

  // filter choose city
  let selectcity = document.getElementById('selectcity')
  selectcity.addEventListener('change', function () {
    if (this.value === '') {
      //任何地點
      selectcity.classList.remove('selectChange')
      if (current_url.includes('location=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('location=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(arr.slice(i + 1))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      }
    } else {
      // 其他類別
      selectcity.className = 'selectChange'
      if (current_url.includes('location=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('location=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat([`location=${this.value}`])
              .concat(arr.slice(i + 1))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      } else {
        //去掉URL頁碼
        let newUrl
        newUrl = current_url + `&location=${this.value}`
        if (newUrl.includes('page=')) {
          let _2newUrl = newUrl.split('&')
          for (let n = 0; n < _2newUrl.length; n++) {
            if (_2newUrl[n].includes('page=')) {
              newUrl = _2newUrl
                .slice(0, n)
                .concat(_2newUrl.slice(n + 1))
                .join('&')
            }
          }
        }
        window.location.href = newUrl
      }
    }
  })

  // filter choose sort
  let selectsort = document.getElementById('selectsort')
  selectsort.addEventListener('change', function () {
    if (this.value === '0') {
      //時間
      if (current_url.includes('sortby=')) {
        let arr = current_url.split('&')
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].includes('sortby=')) {
            //去掉URL頁碼
            let newUrl
            newUrl = arr
              .slice(0, i)
              .concat(arr.slice(i + 1))
              .join('&')
            if (newUrl.includes('page=')) {
              let _2newUrl = newUrl.split('&')
              for (let n = 0; n < _2newUrl.length; n++) {
                if (_2newUrl[n].includes('page=')) {
                  newUrl = _2newUrl
                    .slice(0, n)
                    .concat(_2newUrl.slice(n + 1))
                    .join('&')
                }
              }
            }
            window.location.href = newUrl
          }
        }
      }
    } else {
      // 熱門
      if (current_url.includes('sortby=')) {
      } else {
        //去掉URL頁碼
        let newUrl
        newUrl = current_url + `&sortby=${this.value}`
        if (newUrl.includes('page=')) {
          let _2newUrl = newUrl.split('&')
          for (let n = 0; n < _2newUrl.length; n++) {
            if (_2newUrl[n].includes('page=')) {
              newUrl = _2newUrl
                .slice(0, n)
                .concat(_2newUrl.slice(n + 1))
                .join('&')
            }
          }
        }
        window.location.href = newUrl
      }
    }
  })

  //refresh filter
  document
    .querySelector('.refresh button')
    .addEventListener('click', function () {
      for (
        let i = 0;
        i < document.getElementsByTagName('select').length - 1;
        i++
      ) {
        let select = document.getElementsByTagName('select')[i]
        select.value = ''
        select.classList.remove('selectChange')
      }
      document.getElementById('selectsort').value = '0'
      periodButNone()
      let find_i = current_url.indexOf('find')
      window.location.href = current_url.slice(0, find_i) + 'find'
    })

  if (document.querySelector('.page') !== null) {
    //下一頁
    document.getElementById('next').addEventListener('click', () => {
      let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
      let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
      if (curentPage < totalPage) {
        let href = current_url

        if (href.includes('page=')) {
          let arr = href.split('&')
          for (let a = 0; a < arr.length; a++) {
            if (arr[a].includes('page=')) {
              window.location.href = arr
                .slice(0, a)
                .concat([`page=${curentPage + 1}`])
                .concat(arr.slice(a + 1))
                .join('&')
            }
          }
        } else {
          window.location.href = href + `&page=${curentPage + 1}`
        }
      }
    })

    //上一頁
    document.getElementById('former').addEventListener('click', () => {
      let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
      let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
      if (curentPage > 1) {
        let href = current_url
        if (href.includes('page=')) {
          let arr = href.split('&')
          for (let a = 0; a < arr.length; a++) {
            if (arr[a].includes('page=')) {
              window.location.href = arr
                .slice(0, a)
                .concat([`page=${curentPage - 1}`])
                .concat(arr.slice(a + 1))
                .join('&')
            }
          }
        } else {
          window.location.href = href + `&page=${curentPage - 1}`
        }
      }
    })
  }
}
