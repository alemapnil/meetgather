var ev_host, ev_hostPic ,ev_title, ev_content, ev_cate, ev_limit, ev_attend, ev_location, ev_address, ev_lat, ev_lng, ev_tm, ev_pic;
var days_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var month_en = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var days_cn = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
var month_cn = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']

var ev_dayStr, ev_HrMin, google_calender, id, namelist, map, nextPage, record = []
var nonSpacePat = /[\S]/g


async function event(){
    //針對event頁面做版面調整
    document.body.style.backgroundColor = '#E5E5E5'
    document.getElementById('box2id').classList.remove('box2')
    document.getElementById('box2id').classList.add('box2_event')
    id = current_url.split('/')[current_url.split('/').length - 1]

    await fetch(`/api/event/${id}`) //取得活動資訊
        .then(function(response){
            if(response.ok) {return response.json();}
            })
        .catch(error => {
            console.error('GET /api/event 錯誤:', error)
        })
        .then(function(ele){
            dict = ele
            console.log('GET /api/event 回傳值',dict)

            if ('ok' in dict){
                if (dict['host'][4] === null){
                    ev_host = dict['host'][2]
                }
                else{
                    ev_host = dict['host'][4]
                }
                if (dict['host'][6] === null){
                    ev_hostPic = dict['host'][3]
                }
                else{
                    ev_hostPic = dict['host'][6]
                }
                ev_title = dict['result'][2], ev_content = dict['result'][3], ev_limit = dict['result'][5], ev_location = dict['result'][6]
                ev_address = dict['result'][7], ev_lat = dict['result'][8], ev_lng = dict['result'][9], ev_tm = dict['result'][10].replace('GMT',''), ev_pic = dict['result'][13]
                namelist = dict['namelist'], ev_attend = dict['namelist'].length

                // seeAll
                if (namelist.length === 0){
                    document.querySelector('.seeAll').style.display = 'none'
                }
                else{
                    document.querySelector('.seeAll').style.display = 'inline-block'
                }
            }
        });  
    if (access_token === undefined) {
        await fetch(`/api/attend/${id}`,{'method':'GET'})
            .then(function(response){
                if(response.ok) {return response.json();}
                })
            .catch(error => {
                console.error(`GET /api/attend/${id} 回傳值`, error)
            })
            .then(function(dict){
                console.log(`GET /api/attend/${id} 回傳值`,dict)
                if ('ok' in dict){
                    document.querySelector('.join span').innerHTML = '參加'
                    
                }
                else if ('error' in dict && dict['message'] === '已滿額'){
                    document.querySelector('.join span').innerHTML = '滿額'
                }
                else{
                    console.log('不明原因')
                }
            });  
    }

    else{
        await fetch(`/api/attend/${id}`,{'method':'GET',headers: {Authorization: `Bearer ${access_token}`}})
            .then(function(response){
                if(response.ok) {return response.json();}
                })
            .catch(error => {
                console.error(`GET /api/attend/${id} 錯誤`, error)
            })
            .then(function(dict){
                console.log(`GET /api/attend/${id} 回傳值`,dict)
                if ('ok' in dict && 'msg' in dict){
                    document.querySelector('.join span').innerHTML = `${dict['msg']}`
                }
                else if ('ok' in dict && Object.keys(dict).length === 1){
                    document.querySelector('.join span').innerHTML = '參加'
                }
                else if ('error' in dict && dict['message'] === '已滿額'){
                    document.querySelector('.join span').innerHTML = '滿額'
                }
                else{
                    if ('invalidToken' in dict){
                        window.location.href =document.URL
                    }
                    else{
                        console.log('不明原因')
                    }
                }
            });  
    }


    document.title = `${ev_title} | Meetgather`// 網頁標題

    //前端時間、標題、地點等表示
    let ev_date = new Date(ev_tm);
    ev_dayStr = `${days_cn[ev_date.getDay()]}, ${month_cn[ev_date.getMonth()]} ${String(ev_date.getDate()).padStart(2, '0')}, ${ev_date.getFullYear()}`
    ev_HrMin = `${String(ev_date.getHours()).padStart(2, '0')}:${String(ev_date.getMinutes()).padStart(2, '0')}`
    document.querySelector('.ev_tm').innerHTML = `${ev_dayStr}`
    document.querySelector('.ev_title').innerHTML = `${ev_title}`

    let host_img = document.querySelector('.ev_host .photo img')
    host_img.src =  `${ev_hostPic}`

    document.querySelector('.photo_right .host').innerHTML = `${ev_host}`

    document.querySelector('.c_now_attend_p').innerHTML = `${ev_attend}`
    document.querySelector('.c_now_attend_l').innerHTML = `${ev_limit}`




    if (ev_location === '線上' || ev_location === 'online'){
        document.querySelector('.spot_word').innerHTML = `${ev_location}`
        document.querySelector('.tm_spot').style.height = '120px'
    }
    
    else{
        let map_url = `https://www.google.com/maps/search/?api=1&query=${ev_lat},${ev_lng}`
        document.querySelector('.spot_word').innerHTML = `<a target="_blank" href=${map_url}>${ev_address}</a>`

        let map_div = document.createElement('div')
        map_div.id ='map'
        document.querySelector('.tm_spot').appendChild(map_div)
        initMap(ev_lat,ev_lng)
    }

    let pic_img = document.querySelector('.ev_pic img')
    pic_img.src = `${ev_pic}`
    document.querySelector('.detail').innerHTML = `${ev_content}`
    googleCalender()
    if (access_token === undefined){
        document.querySelector('.tm_word').innerHTML = `${ev_dayStr}<br/>${ev_HrMin} GMT+8`
    }
    else{
        document.querySelector('.tm_word').innerHTML = `${ev_dayStr}<br/>${ev_HrMin} GMT+8 <div><a  target="_blank" href=${google_calender}>紀錄在日曆中</a></div>`
        
        //確認參加活動日曆
        let calender_a = document.querySelector('.add_calender a')
        calender_a.href = `${google_calender}`
    }


    //social media meta property
    for (let m = 0; m < document.querySelectorAll('meta').length; m++ ){
        let property = document.querySelectorAll('meta')[m].getAttribute('property')
        if (property === 'og:title'){
            document.querySelectorAll('meta')[m].content=`${ev_title}`
        }
        if (property === 'og:url'){
            document.querySelectorAll('meta')[m].content=`${window.location.href}`
        }
        if (property === 'og:image'){
            document.querySelectorAll('meta')[m].content=`${ev_pic}`
        }
    }
    joinCursor()

    //載入留言
    loadGif()
    setTimeout("loadMsg(`${id}_0`,`${access_token}`)",700)

} // event() 最後

//loading gif
function loadGif(){
    let messageLoad = document.createElement('div')
    messageLoad.className = 'messageLoad'
    let imgDiv = document.createElement('div')
    imgDiv.className = 'messageLoad_div'

    let g_img = document.createElement('img')
    g_img.className = 'messageLoad_div_img'
    g_img.src = '/static/img/loadingG.gif'

    imgDiv.appendChild(g_img)
    messageLoad.appendChild(imgDiv) 
    document.querySelector('.c_message').appendChild(messageLoad)
}


// 載入留言函式
function loadMsg(para, access_token){
    let head
    if (access_token !== undefined){
        head = {'method':'GET',headers: {Authorization: `Bearer ${access_token}`}}
    }
    else{
        head = {'method':'GET'}
    }

    fetch(`/api/board/${para}`, head)
    .then(function(response){
        if(response.ok) {return response.json();}
        })
    .catch(error => {
        console.error(`GET /api/board/${id} 回傳值`, error)
    })
    .then(function(dict){
        console.log(`GET /api/board/${id} 回傳值`,dict)

        if ('invalidToken' in dict){
            access_token = undefined
            loadMsg(para, access_token)
        }
        else{
            nextPage = dict['nextPage']
            let boardData = dict['data']
            if (boardData.length > 0){
                for (let b = 0; b < boardData.length ;b++){
                    let board_id = boardData[b]['board_id'], memberId = boardData[b]['member_id']
                    let board_msg = boardData[b]['board_msg'],  board_time = boardData[b]['board_time'].replace('GMT','')
                    let board_floor = boardData[b]['board_floor'], person = boardData[b]['person'], photo = boardData[b]['photo']

                    let board_tm = new Date(board_time);
                    let strBoardTm = `${board_tm.getFullYear()}-${String(board_tm.getMonth()+1).padStart(2, '0')}-${String(board_tm.getDate()).padStart(2, '0')} ${String(board_tm.getHours()).padStart(2, '0')}:${String(board_tm.getMinutes()).padStart(2, '0')}`

                    msgDiv(dict['logger'],memberId,board_id,board_msg, strBoardTm, person, photo, board_floor)
                }
            }
            else if(boardData.length === 0 && record.length === 0){
                emptyMsgDiv()
            }
            document.querySelector('.messageLoad').remove()
            hambergerMsg()
            hambergerMsgGone()     
   
        }  
    }); 
}



//沒有留言板
function emptyMsgDiv(){
    let empty = document.createElement('span')
    empty.className = 'empty'
    empty.appendChild(document.createTextNode('目前沒有任何留言'))
    document.querySelector('.c_message').appendChild(empty)
}


//製作留言板
function msgDiv(logger,memberId,board_id,board_msg, strBoardTm, person, photo, board_floor){
    let line = document.createElement('div')
    line.className ='line'
    line.setAttribute('data-id',board_id)

    let message_photo = document.createElement('div')
    message_photo.className = 'message_photo'
    message_photo.setAttribute('data-memberId',memberId)
    message_photo.setAttribute('data-logger',logger)

    let imgdiv = document.createElement('div')
    let img = document.createElement('img')
    img.src = photo
    img.setAttribute('referrerpolicy',"no-referrer")
    imgdiv.appendChild(img)
    message_photo.appendChild(imgdiv)
    line.appendChild(message_photo)

    let message_middle = document.createElement('div')
    message_middle.className ='message_middle'

    let personName = document.createElement('div')
    personName.className ='personName'
    personName.appendChild(document.createTextNode(person))
    message_middle.appendChild(personName)

    let personMsg = document.createElement('div')
    personMsg.className ='personMsg'
    personMsg.appendChild(document.createTextNode(board_msg))
    message_middle.appendChild(personMsg)

    let personBT = document.createElement('div')
    personBT.className ='personBT'

    let floor = document.createElement('span')
    floor.className ='floor'
    floor.appendChild(document.createTextNode(board_floor+' · '))
    personBT.appendChild(floor)

    let personTM = document.createElement('span')
    personTM.className ='personTM'
    personTM.appendChild(document.createTextNode(strBoardTm))
    personBT.appendChild(personTM)
    message_middle.appendChild(personBT)
    line.appendChild(message_middle)

    let message_work = document.createElement('div')
    message_work.className ='message_work'
    let imgwork = document.createElement('img')
    imgwork .src = '/static/img/comment.svg'
    message_work.appendChild(imgwork)


    let message_work_expand = document.createElement('div')
    message_work_expand.className = 'message_work_expand'

    let edit = document.createElement('div')
    edit.className = 'edit'
    edit.appendChild(document.createTextNode('編輯留言'))
    message_work_expand.appendChild(edit)

    let deleteD = document.createElement('div')
    deleteD.className = 'delete'
    deleteD.appendChild(document.createTextNode('刪除留言'))
    message_work_expand.appendChild(deleteD)
    message_work.appendChild(message_work_expand)
    //
    line.appendChild(message_work)
    document.querySelector('.c_message').appendChild(line)
}


//製作第一個節點留言
function leaveMsg(logger,memberId,board_id,board_msg, strBoardTm, person, photo, board_floor){
    let line = document.createElement('div')
    line.className ='line'
    line.setAttribute('data-id',board_id)

    let message_photo = document.createElement('div')
    message_photo.className = 'message_photo'
    message_photo.setAttribute('data-memberId',memberId)
    message_photo.setAttribute('data-logger',logger)

    let imgdiv = document.createElement('div')
    let img = document.createElement('img')
    img.src = photo
    img.setAttribute('referrerpolicy',"no-referrer")
    imgdiv.appendChild(img)
    message_photo.appendChild(imgdiv)
    line.appendChild(message_photo)

    let message_middle = document.createElement('div')
    message_middle.className ='message_middle'

    let personName = document.createElement('div')
    personName.className ='personName'
    personName.appendChild(document.createTextNode(person))
    message_middle.appendChild(personName)

    let personMsg = document.createElement('div')
    personMsg.className ='personMsg'
    personMsg.appendChild(document.createTextNode(board_msg))
    message_middle.appendChild(personMsg)

    let personBT = document.createElement('div')
    personBT.className ='personBT'

    let floor = document.createElement('span')
    floor.className ='floor'
    floor.appendChild(document.createTextNode(board_floor+' · '))
    personBT.appendChild(floor)

    let personTM = document.createElement('span')
    personTM.className ='personTM'
    personTM.appendChild(document.createTextNode(strBoardTm))
    personBT.appendChild(personTM)
    message_middle.appendChild(personBT)
    line.appendChild(message_middle)

    let message_work = document.createElement('div')
    message_work.className ='message_work'
    let imgwork = document.createElement('img')
    imgwork .src = '/static/img/comment.svg'
    message_work.appendChild(imgwork)


    let message_work_expand = document.createElement('div')
    message_work_expand.className = 'message_work_expand'

    let edit = document.createElement('div')
    edit.className = 'edit'
    edit.appendChild(document.createTextNode('編輯留言'))
    message_work_expand.appendChild(edit)

    let deleteD = document.createElement('div')
    deleteD.className = 'delete'
    deleteD.appendChild(document.createTextNode('刪除留言'))
    message_work_expand.appendChild(deleteD)
    message_work.appendChild(message_work_expand)
    //
    line.appendChild(message_work)
    return line
}


//google Calender
function googleCalender(){
    let calendar_url= 'https://calendar.google.com/calendar/u/0/r/eventedit?'
    let calender_title = ev_title.replace(' ','+')
    let calender_add;

    if(ev_location === '線上' || ev_location === 'online'){
        calender_add = ev_location
    }
    else{
        calender_add = ev_address.replace(' ','+')
    }
    let calender_date = new Date(ev_tm).toISOString().split('.')[0].replaceAll('-','').replaceAll(':','')+'Z'
    let calender_detail = `更多資訊請看 ${window.location.href}`.replace(' ','+')
    google_calender = `${calendar_url}text=${calender_title}&dates=${calender_date}/${calender_date}&location=${calender_add}&details=${calender_detail}&ctz=Asia/Taipei`

}


function initMap(para1, para2){   
    var location ={
        lat: parseFloat(para1),
        lng: parseFloat(para2)
    }
    var options={
        center: location,
        zoom: 14
    }
    map = new google.maps.Map(document.getElementById('map'),options);
    new google.maps.Marker({
        position: location,
        map: map
    })
}



//點參加
document.querySelector('.join').addEventListener('click',function(e){
    if (access_token === undefined){
        if(document.querySelector('.join span').innerHTML === '滿額'){}
        else{
            document.querySelector('.modal1').style.display = 'block'
            document.querySelector('.window1').style.display = 'flex'
        }
    }

    else{
        if (document.querySelector('.join span').innerHTML === '參加'){
            document.querySelector('.join span').innerHTML = `<div class="attendPic"><img src="/static/img/loadingG.gif"></div>`
            joinCursor()
            fetch("/api/attend",{
                'method':'POST',
                body:JSON.stringify({"activity": id,"attendee": userEmail}),
                headers:{
                    "Content-Type":"application/json; charset=UTF-8",
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                }
                })
                .then(function(response){
                    return response.json();
                    })
                .catch(error => console.error('Error:', error))
                .then(function(dict){
                    console.log('POST /api/attend 回傳值',dict)
                    if ('ok' in dict){
                        document.querySelector('.modal2').style.display = 'block'
                        document.querySelector('.window2').style.display = 'flex'
                        document.querySelector('.popup2 .title').innerHTML =`${ev_title}`
                        document.querySelector('.popup2 .tm').innerHTML =`${ev_dayStr} · ${ev_HrMin} GMT+8`
                        document.querySelector('.join span').innerHTML = '取消參加'

                        //更新人數
                        ev_attend = dict['allJoinNum'], namelist = dict['namelist']
                        document.querySelector('.c_now_attend_p').innerHTML = `${ev_attend}`

                        // seeAll
                        if (namelist.length === 0){
                            document.querySelector('.seeAll').style.display = 'none'
                        }
                        else{
                            document.querySelector('.seeAll').style.display = 'inline-block'
                        }
                    }
                    else if ('error' in dict && dict['message'] === '已滿額'){
                        document.querySelector('.join span').innerHTML = '滿額'
                    }

                    else{
                        if ('invalidToken' in dict){
                            window.location.href =document.URL
                        }
                        else{
                            console.log('不明原因')
                        }
                    }
                    joinCursor()
                })
        }

        else if (document.querySelector('.join span').innerHTML === '取消參加'){
            document.querySelector('.join span').innerHTML = `<div class="attendPic"><img src="/static/img/loadingG.gif"></div>`
            joinCursor()
            fetch("/api/attend",{
                'method':'DELETE',
                body:JSON.stringify({"activity": id,"attendee": userEmail}),
                headers:{
                    "Content-Type":"application/json; charset=UTF-8",
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                }
                })
                .then(function(response){
                    return response.json();
                    })
                .catch(error => console.error('Error:', error))
                .then(function(dict){
                    console.log('DELETE /api/attend 回傳值',dict)
                    if ('ok' in dict){
                        document.querySelector('.join span').innerHTML = '參加'

                        //更新人數
                        ev_attend = dict['allJoinNum'], namelist = dict['namelist']
                        document.querySelector('.c_now_attend_p').innerHTML = `${ev_attend}`

                        // seeAll
                        if (namelist.length === 0){
                            document.querySelector('.seeAll').style.display = 'none'
                        }
                        else{
                            document.querySelector('.seeAll').style.display = 'inline-block'
                        }
                    }
                    else{
                        if ('invalidToken' in dict){
                            window.location.href =document.URL
                        }
                        else{
                            console.log('不明原因')
                        }
                    }
                    joinCursor()
                })
        }
    }
})


function joinCursor(){
    if(document.querySelector('.join span').innerHTML === `<div class="attendPic"><img src="/static/img/loadingG.gif"></div>` || document.querySelector('.join span').innerHTML === '滿額'){
        document.querySelector('.join').style.cursor = 'default'
    }
    else{
        document.querySelector('.join').style.cursor = 'pointer'
    }
    }


//login warn close
document.querySelector('.close').addEventListener('click',()=>{
    document.querySelector('.modal1').style.display = 'none'
    document.querySelector('.window1').style.display = 'none'
})

// share link close
document.querySelector('.close3').addEventListener('click',()=>{
    document.querySelector('.modal3').style.display = 'none'
    document.querySelector('.window3').style.display = 'none'
})

// seeAll  close
document.querySelector('.close4').addEventListener('click',()=>{
    document.querySelector('.modal4').style.display = 'none'
    document.querySelector('.window4').style.display = 'none'
})

//回到活動頁面
document.querySelector('.back div img').addEventListener('click',back)
document.querySelector('.back span').addEventListener('click',back)

function back(){
    document.querySelector('.modal2').style.display = 'none'
    document.querySelector('.window2').style.display = 'none'
}



//click share
document.querySelector('.c_join .share').addEventListener('click',function(){
    document.querySelector('.modal3').style.display = 'block'
    document.querySelector('.window3').style.display = 'flex'  
})


//set share link
let fb_a = document.querySelector('.fb a'), twi_a = document.querySelector('.twi a')
fb_a.href = `https://www.facebook.com/share.php?u=${window.location.href}`
twi_a.href = `https://twitter.com/share?url=${window.location.href}/&hashtag1,hashtag2,hashtag3`


//click seeAll
document.querySelector('.seeAll').addEventListener('click',function(){
    document.querySelector('.modal4').style.display = 'block'
    document.querySelector('.window4').style.display = 'flex' 
    document.querySelector('.person span').innerHTML=`${ev_attend}`

    document.querySelector('.nameList').innerHTML = ''
    for (let s = 0; s < namelist.length; s++){
        let email_id = namelist[s][3], name = namelist[s][5], photo = namelist[s][6]

        let rowDiv = document.createElement('div')
        rowDiv.className = 'row'
        rowDiv.setAttribute('data-id',email_id)

        let imgDiv = document.createElement('div')
        let imgSelf = document.createElement('img')
        imgSelf.setAttribute('referrerpolicy','no-referrer')
        imgSelf.src = photo
        imgDiv.appendChild(imgSelf)
        let spanSelf = document.createElement('span')
        spanSelf.appendChild(document.createTextNode(name))

        rowDiv.appendChild(imgDiv)
        rowDiv.appendChild(spanSelf)
        document.querySelector('.nameList').appendChild(rowDiv)
    }
})


// mouseover 留下你的話之留言
document.querySelector('.sendM').addEventListener('mouseover',()=>{
    let message = document.getElementById('message_text').value
    if (message.match(nonSpacePat)){
        document.querySelector('.sendM').style.cursor = 'pointer'
    }
    else{
        document.querySelector('.sendM').style.cursor = 'not-allowed'
    }
})

// click 留下你的話之留言
var sendCount = 0
document.querySelector('.sendM').addEventListener('click',function(){
    let message = document.getElementById('message_text').value
    if (message.match(nonSpacePat)){
        if (access_token === undefined){
            document.querySelector('.modal1').style.display = 'block'
            document.querySelector('.window1').style.display = 'flex'
        }
        else{
            if (sendCount === 0){
                sendCount += 1

                document.querySelector('.sendM').innerHTML =''
                document.querySelector('.sendM').innerHTML += "<span>留言中...</span>"

                fetch("/api/board",{
                    'method':'POST',
                    body:JSON.stringify({"activity": id,"message": message}),
                    headers:{
                        "Content-Type":"application/json; charset=UTF-8",
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    }
                    })
                    .then(function(response){
                        return response.json();
                        })
                    .catch(error => console.error('Error:', error))
                    .then(function(dict){
                        console.log('POST /api/board 回傳值',dict)
                        if ('ok' in dict){
                            document.getElementById('message_text').value =''
                            let board_msg = dict['inserttuple'][2], strBoardTm = dict['inserttuple'][4]
                            strBoardTm = strBoardTm.split(':')[0]+':'+strBoardTm.split(':')[1]
                            person = dict['inserttuple'][6],  photo = dict['inserttuple'][7], board_floor= dict['inserttuple'][3]

                            let logger = dict['logger'], memberId = dict['logger'], board_id = dict['board_id']
                            document.querySelector(".c_message").insertBefore(leaveMsg(logger,memberId,board_id,board_msg, strBoardTm, person, photo, board_floor),document.querySelector(".line"))
                            
                            document.querySelector('.sendM').innerHTML =''
                            document.querySelector('.sendM').innerHTML += "<span>留言</span>"

                            console.log(document.querySelector('.empty'),typeof(document.querySelector('.empty')))

                            //remove 目前沒有留言
                            if (document.querySelector('.empty') !== null){
                                document.querySelector('.empty').remove()
                            }
                            
                            sendCount = 0
                            hambergerMsg()
                        }
                        else if ('invalidToken' in dict){
                            window.location.href =document.URL
                        }
                    })                
            }
        }
    }
    else{
        document.querySelector('.sendM').style.cursor = 'not-allowed'
    }
})


// //點擊留言漢堡圖
function hambergerMsg(){
    for (let i=0; i<document.querySelectorAll('.message_work img').length;i++){
        document.querySelectorAll('.message_work img')[i].addEventListener('click',function(e){
            let memberid = document.querySelectorAll('.message_photo')[i].getAttribute('data-memberid')
            let logger = document.querySelectorAll('.message_photo')[i].getAttribute('data-logger')

            if (document.querySelectorAll('.message_work_expand')[i].style.display !== 'grid' && memberid === logger){
                document.querySelectorAll('.message_work_expand')[i].style.display = 'grid'
                hambergerEdit()
                hambergerDelete()
            }
            for (let j = 0; j < document.querySelectorAll('.message_work_expand').length; j++){
                if (j !== i ){
                    document.querySelectorAll('.message_work_expand')[j].style.display = 'none'
                }
            }
            e.stopPropagation() 
        }
        )
    }
}


//點擊任何一處都使留言編輯消失
function hambergerMsgGone(){
    document.getElementsByTagName('body')[0].addEventListener('click',function(e){
        e.stopPropagation()
        for(let i=0; i<document.querySelectorAll('.message_work_expand').length;i++){
            if (document.querySelectorAll('.message_work_expand')[i].style.display==='grid'){
                document.querySelectorAll('.message_work_expand')[i].style.display='none'
            }
        }


        for(let i=0; i<document.querySelectorAll('.line').length;i++){
            if (document.querySelectorAll('.line')[i].querySelector('.editline') !== null){
                document.querySelectorAll('.line')[i].querySelector('.editline').remove()
                document.querySelectorAll('.line')[i].querySelector('.personMsg').style.display = 'block'
                document.querySelectorAll('.line')[i].querySelector('.personBT').style.display = 'block'
                document.querySelectorAll('.line')[i].querySelector('.message_work').style.display = 'block'
            }
        }
    })
}

//編輯留言
function hambergerEdit(){
    for (let i=0; i<document.querySelectorAll('.edit').length;i++){
        document.querySelectorAll('.edit')[i].addEventListener('click',function(e){
            e.stopPropagation()
            let msgID = document.querySelectorAll('.edit')[i].parentElement.parentElement.parentElement.getAttribute('data-id')
            let line = document.querySelector(`[data-id="${msgID}"]`)
            if (line.querySelector('.personMsg').style.display !== 'none'){

                line.querySelector('.personMsg').style.display = 'none'
                line.querySelector('.personBT').style.display = 'none'
                line.querySelector('.message_work').style.display = 'none'

                let editline = '<div class="editline"><input id = "edit_text"/><div class="editsend"><span>編輯</span></div><div class="editcancel"><span>取消</span></div></div>'
                line.querySelector('.message_middle').innerHTML += editline

                line.querySelector('#edit_text').value = line.querySelector('.personMsg').innerHTML
                keyinEdit(msgID)
            }
            //使其他編輯留言消失
            for (let j =0; j< document.querySelectorAll('.line').length; j++){
                if (j !== i && document.querySelectorAll('.line')[j].querySelector('.editline') !=null){
                    document.querySelectorAll('.line')[j].querySelector('.editline').remove()
                    document.querySelectorAll('.line')[j].querySelector('.personMsg').style.display = 'block'
                    document.querySelectorAll('.line')[j].querySelector('.personBT').style.display = 'block'
                    document.querySelectorAll('.line')[j].querySelector('.message_work').style.display = 'block'
                }
            }
        })
    }
}

//刪除留言
var deleteCount = 0
function hambergerDelete(){
    for (let d =0; d < document.querySelectorAll('.delete').length; d++){
        document.querySelectorAll('.delete')[d].addEventListener('click',function(e){
            deleteCount += 1
            e.stopPropagation()

            if (deleteCount === 1){
                let line =this.parentElement.parentElement.parentElement
                let msgID = line.getAttribute('data-id')
                this.innerHTML= '刪除中...'

                fetch("/api/board",{
                    'method':'DELETE',
                    body:JSON.stringify({"activity": id,"board_id":msgID}),
                    headers:{
                        "Content-Type":"application/json; charset=UTF-8",
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    }
                    })
                    .then(function(response){
                        return response.json();
                        })
                    .catch(error => console.error('Error:', error))
                    .then(function(dict){
                        console.log('DELETE /api/board 回傳值',dict)
                        if ('invalidToken' in dict){
                            window.location.href =document.URL
                        }
                        if('ok' in dict){
                            line.remove()
                            hambergerMsg()
                            deleteCount = 0   
                            
                            if (document.querySelector('.line') === null){
                                emptyMsgDiv()
                            }
                        }
                    })  
            }
        })
    }
}

//keyin編輯留言
var editCount = 0
function keyinEdit(msgID){
    document.getElementById('edit_text').addEventListener('click',function(e){
        e.stopPropagation()

        document.querySelector('.editsend').addEventListener('click',function(e){
            e.stopPropagation()
            editCount += 1
            if (editCount === 1){
                let message = document.getElementById('edit_text').value
                let editline = this.parentElement, message_middle = this.parentElement.parentElement
                let line = message_middle.parentElement
                editline.querySelector('.editsend').innerHTML = ''
                editline.querySelector('.editsend').innerHTML += "<div><img src = '/static/img/loadingG.gif'/></div>"
                fetch("/api/board",{
                    'method':'PATCH',
                    body:JSON.stringify({"activity": id,"message": message,"board_id":msgID}),
                    headers:{
                        "Content-Type":"application/json; charset=UTF-8",
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${access_token}`,
                    }
                    })
                    .then(function(response){
                        return response.json();
                        })
                    .catch(error => console.error('Error:', error))
                    .then(function(dict){
                        console.log('PATCH /api/board 回傳值',dict)
                        if ('invalidToken' in dict){
                            window.location.href =document.URL
                        }
                        if('ok' in dict){
                            message_middle.querySelector('.personMsg').style.display ='block'
                            message_middle.querySelector('.personMsg').innerHTML = message
                            message_middle.querySelector('.personBT').style.display ='block'
                            line.querySelector('.message_work').style.display = 'block'
                            line.querySelector('.message_work_expand').style.display = 'none'
                            editline.remove()
                            editCount = 0                
                        }
                    })   
            }
        })
    })
}



//滑動載入留言
window.addEventListener('scroll',()=>{
    if (id !== undefined){
    let ajaxHeight = document.documentElement.scrollHeight;
    let deviseHeight= window.innerHeight
    let scrollable = ajaxHeight- deviseHeight
    let scrolled =document.documentElement.scrollTop

    if (scrolled + 100 >= scrollable){
        if (nextPage){            
            nexturl = `/api/board/${id}_${nextPage}/`
            if (record.includes(nextPage)){
            }
            else{
                record.push(nextPage) 
                // //載入留言
                loadGif()
                setTimeout("loadMsg(`${id}_${nextPage}`,`${access_token}`)",700)
            }
        }
    }}}
)