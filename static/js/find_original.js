//篩選器選擇，之後向API要搜尋結果
for (let i=0; i<document.getElementsByTagName('select').length; i++){
    let select = document.getElementsByTagName('select')[i]
    select.addEventListener('change',function(){
        if (select.value!==''){
            select.className = 'selectChange'
        }
        else{
            select.classList.remove('selectChange')
        }
    })
}


//重整篩選器，之後向API要搜尋結果
document.querySelector('.refresh button').addEventListener('click',function(){
    for (let i=0; i<document.getElementsByTagName('select').length-1; i++){
        let select = document.getElementsByTagName('select')[i]
        select.value=''
        select.classList.remove('selectChange')
    }
})


//愛心圖示改變，空心與紅心
for (let i=0; i < document.querySelectorAll('.fav img').length; i++){
    document.querySelectorAll('.fav img')[i].addEventListener('click',function(e){
        e.stopPropagation()
        let src = document.querySelectorAll('.fav img')[i].src
        if (src.includes('favorite1.png')){
            document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite2.png'
        }
        else if (src.includes('favorite2.png')){
            document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite1.png'
        }
    },true)
}



//超連結到各頁面
for (let i=0; i < document.querySelectorAll('.event').length; i++){
    document.querySelectorAll('.event')[i].addEventListener('click',function(e){
        e.stopPropagation()
        window.location.href = document.querySelectorAll('.event')[i].dataset.id
    })
}


//前端時間轉換台灣時間

function toTWtime(){
    let TWtime = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}).replaceAll('/','-')
    let si = TWtime.indexOf(' '), fi = TWtime.indexOf('午'), li = TWtime.indexOf(':')
    let date = TWtime.slice(0, si),  minute_seconds = TWtime.slice(li)
    if (TWtime.includes('上午')){
        var hr = parseInt(TWtime.slice(fi+1, li))
    }
    else{
        var hr = parseInt(TWtime.slice(fi+1, li)) + 12
    }
    return `${date} ${hr}${minute_seconds}`
}


var frontEndTime;



document.querySelector('.next').addEventListener('click', ()=>{
    let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
    let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
    if (curentPage < totalPage){
        pageloading()
        find({'frontEndTime':frontEndTime,'page':curentPage + 1})
    }   
})


document.querySelector('.former').addEventListener('click', ()=>{
    let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
    let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
    if (curentPage > 1){
        pageloading()
        find({'frontEndTime':frontEndTime,'page':curentPage - 1})
    }   
})



console.log('***********************')


function pageloading(){
    // to top
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    // clear result
    document.querySelector('.result').innerHTML = ''
    document.getElementById('resultLoading').style.display = 'block'
    document.querySelector('.page').style.visibility = 'hidden'
}

function pageloadDone(){
    document.getElementById('resultLoading').style.display = 'none'
    document.querySelector('.page').style.visibility = 'visible'
}


async function find(para){
    // frontEndTime = para.frontEndTime;

    // await fetch("/api/findall",{
    //     'method':'POST',
    //     body:JSON.stringify(para),
    //     headers:{
    //         "Content-Type":"application/json; charset=UTF-8",
    //         'Accept': 'application/json',
    //         }
    //     })
    // .then(function(response){
    //     if(response.ok) {
    //         return response.json();
    //         }
    //     })
    // .catch(error => {
    //     console.error('POST /api/findall 錯誤:', error)
    // })
    // .then(function(dict){
    //     console.log('POST /api/findall 回傳值',dict)
    //     if('ok' in dict){

    //         if (dict['result'] ===[]){

    //         }
    //         else{
    //             document.querySelector('.page .curentPage').innerHTML = para.page
    //             document.querySelector('.page .totalPage').innerHTML = dict['totalpage']
    //             eventDisplay(dict['result'])
    //             favarite()            
    //         }

    //     }
    //     else{
    //         console.log('不明原因')
    //     }
    //     pageloadDone()
    // });  
}

function eventDisplay(results){
    for (let r =0; r < results.length; r++){
        let row = results[r]
        let event = document.createElement('div') //第一層
        event.className = 'event'
        event.setAttribute('data-id', `${row[7]}`);

        let event_in = document.createElement('div') //第二層
        event_in.className = 'event_in'

        let picture = document.createElement('div') 
        picture.className ='picture'

        let img = document.createElement('img') 
        img.src = row[21]
        picture.appendChild(img)

        let section = document.createElement('div')
        section.className ='section'

        //轉換時間格式
        let time = row[18].split(' ')
        let day = time.slice(0,3).join(' '), hr_min = time[4].slice(0,5)
        time = `${day} · ${hr_min}  GMT+8`

        let date_tm = document.createElement('div') 
        date_tm.className = 'time'
        date_tm.appendChild(document.createTextNode(time))

        let title = document.createElement('div') 
        title.className = 'title'
        title.appendChild(document.createTextNode(row[9
        ]))

        let host = document.createElement('div') 
        host.className = 'host'
        host.innerHTML=`${row[2]}<span>${' '}| ${row[14]}</span>`

        let lastRow = document.createElement('div') 
        lastRow.className = 'lastRow'

        let attendee = document.createElement('div') 
        attendee.className = 'attendee'
        attendee.innerHTML = `<span>${row[13]}</span> 人參加`
        lastRow.appendChild(attendee)

        let items = document.createElement('div') 
        items.className = 'items'

        let share = document.createElement('div')
        share.className = 'share'
        let img2 = document.createElement('img')
        img2.src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/share.png'
        share.appendChild(img2)
        items.appendChild(share)

        let fav = document.createElement('div')
        fav.className = 'fav'
        let img3 = document.createElement('img')
        img3.src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite1.png'
        fav.appendChild(img3)
        items.appendChild(fav)
        lastRow.appendChild(items)

        section.appendChild(date_tm)
        section.appendChild(title)
        section.appendChild(host)
        section.appendChild(lastRow)

        event_in.appendChild(picture)
        event_in.appendChild(section)
        event.appendChild(event_in)
        document.querySelector('.result').appendChild(event)
    }
}


