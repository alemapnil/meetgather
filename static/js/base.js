//畫面一載入先要做的事
async function load(){
    console.log('onload...')

    //clear all input values
    for (i=0; i<document.getElementsByTagName('input').length; i++){
        document.getElementsByTagName('input')[i].value = ''
    }
    for (i=0; i<document.getElementsByTagName('textarea').length; i++){
        document.getElementsByTagName('textarea')[i].value = ''
    }


    createYear()
    if (document.cookie.includes('access_token')){
        const myArray = document.cookie.split(";");
        console.log('Token Array',myArray)
        for (let i = 0 ;i < myArray.length; i++){
            if (myArray[i].includes('access_token')){
                access_token = myArray[i].replace('access_token=','').replace(/\s/g,'')
            }
        }
        await googleInfo(access_token)

    }
    else{
        console.log('未登入')
        notlog_display()
    } 

    if (current_url.includes('/create')){
        create()
        setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 700);
        
    }

    if (current_url.includes('/find')){
        find()
        setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 1000);
    }

    if (current_url.includes('/event/')){
        await event()
        setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 0);
    }
}


let test = '2022-06-29 15:53:02'
console.log(test)
let a=test.split(' ')[0].replaceAll('-',''), b=test.split(' ')[1].replaceAll(':','')
console.log(a+b,parseInt(a+b))

var access_token, userName, userEmail, userPicture, anchortm, clickNoticeMsg = 0
var notification = {}, notice_nextPage, noticePage_record = [], notRead_num
var current_url = window.location.href
console.log('base.js 當前網址',current_url)
load()


//登入者資料。已登入時，右上角要做相應變化，還有token過期時的調整
async function googleInfo(para){
    await fetch("/api/user",{headers: {Authorization: `Bearer ${para}`}})
        .then(function(response){
            if(response.ok) {
                return response.json();
              }
            })
        .catch(error => {
            console.error('GET /api/user 錯誤:', error)
        })
        .then(function(dict){
            console.log('GET /api/user 回傳值',dict)
            if (dict === undefined){
                deleteAllCookies()
                notlog_display()
            }
            else if ('invalidToken' in dict){
                document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                notlog_display()
            }
            else if ('ok' in dict){
                userEmail = dict['email']
                //登入後右上角圖示變化
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='none'
                    document.querySelectorAll('.frame2')[i].style.display='flex'
                    document.querySelector('.fr2').style.display='block';
                    document.querySelector('.fr3').style.display='block'
                }
                for(let i=0; i<document.querySelectorAll('.shot img').length; i++){
                    let shot_img = document.querySelectorAll('.shot img')[i];
                    shot_img.src = dict['picture'];
                    document.querySelectorAll('.shot')[i].appendChild(shot_img)
                }

                //通知數字變化
                notRead_num = dict['notRead']['a']+dict['notRead']['b']

                if (notRead_num > 99){
                    notRead_num = 99
                }

                if (notRead_num > 0){
                    for(let n=0; n<document.querySelectorAll('.frame2 .notice').length;n++){
                        document.querySelectorAll('.frame2 .notice div')[n].innerHTML =notRead_num
                        document.querySelectorAll('.frame2 .notice')[n].style.visibility='visible'
                    }                    
                }
                else{
                    for(let n=0; n<document.querySelectorAll('.frame2 .notice').length;n++){
                        document.querySelectorAll('.frame2 .notice div')[n].innerHTML =notRead_num
                        document.querySelectorAll('.frame2 .notice')[n].style.visibility='hidden'
                    }
                }
                //時間戳記
                anchortm = dict['anchortm']
            }
            else{
                notlog_display()
            }
            
        });  

}

// 將未讀變已讀(紅色警示)
function turnToRead(){
    fetch("/api/user",{
        'method':'PATCH',
        body:JSON.stringify({"anchortm": anchortm}),
        headers: {
            "Content-Type":"application/json; charset=UTF-8",
            'Accept': 'application/json',
            'Authorization': `Bearer ${access_token}`
        }})
        .then(function(response){
            if(response.ok) {
                return response.json();
              }
            })
        .catch(error => {
            console.error('PATCH /api/user 錯誤:', error)
        })
        .then(function(dict){
            console.log('PATCH /api/user 回傳值',dict)
            if ('invalidToken' in dict){
                window.location.reload();
            }
            else if ('ok' in dict){
                notRead_num = 0
                for(let n=0; n<document.querySelectorAll('.frame2 .notice').length;n++){
                    document.querySelectorAll('.frame2 .notice div')[n].innerHTML =notRead_num
                    document.querySelectorAll('.frame2 .notice')[n].style.visibility='hidden'
                }
            }
            else{
                console.log('不明原因')
            } 
        });
}

// 載入通知訊息
function getNotice(page){
    fetch("/api/user",{
        'method':'POST',
        body:JSON.stringify({"anchortm": anchortm,"page":page}),
        headers: {
            "Content-Type":"application/json; charset=UTF-8",
            'Accept': 'application/json',
            'Authorization': `Bearer ${access_token}`
        }})
        .then(function(response){
            if(response.ok) {
                return response.json();
              }
            })
        .catch(error => {
            console.error('POST /api/user 錯誤:', error)
        })
        .then(function(dict){
            console.log('POST /api/user 回傳值',dict)

            if ('invalidToken' in dict){
                window.location.reload();
            }
            else if ('notice' in dict){
                let notice = dict['notice']
                notice_nextPage = dict['nextPage']
                notice.sort(function(a, b){return new Date(b['time']) - new Date(a['time'])});
                
                for (let n=0; n<notice.length; n++){
                    if (notice[n]['name'] === 'a'){
                        let A1 = notice[n]['name'], A2 = notice[n]['content']['board_PersonPhoto']
                        let A3 = notice[n]['content']['board_PersonName'], A4 = notice[n]['content']['board_floor']
                        let A5 = notice[n]['time']
                        let A6 = notice[n]['content']['board_name']
                        rowbox(A1,A2,A3,A4,A5,A6, notice[n])                        
                    }
                    else if (notice[n]['name'] === 'b'){
                        let A1 = notice[n]['name'], A2 = notice[n]['content']['reply_PersonPhoto']
                        let A3 = notice[n]['content']['reply_PersonName'], A4 = notice[n]['content']['reply_floor']
                        let A5 = notice[n]['time']
                        let A6 = notice[n]['content']['board_name']
                        rowbox(A1,A2,A3,A4,A5,A6, notice[n])  
                    }
                }

                //點擊通知的每一行row
                for (let r=0; r<document.querySelectorAll('.rowbox .row').length; r++){
                    document.querySelectorAll('.rowbox .row')[r].addEventListener('click',function(e){
                        let noticeid = this.getAttribute('noticeid')
                        let name = notification[noticeid]['name']
                        if (name === 'a'){
                            let board_id = notification[noticeid]['content']['board_id']
                            noticeMsg_A(board_id)
                        }

                        else if( name === 'b'){
                            let reply_id = notification[noticeid]['content']['reply_id']
                            noticeMsg_B(reply_id)
                        }
                        e.stopPropagation()
                    })
                }

                if ( page === 0 && notice.length === 0){
                    let noDiv = document.createElement('div')
                    noDiv.appendChild(document.createTextNode('目前沒有任何通知'))
                    document.querySelector('.noticeBlock .rowbox').appendChild(noDiv)
                }
            }
            else{
                console.log('不明原因')
            } 

            document.querySelector('.noticeBlock .rowbox .load').remove()
        });
}


// fetch 通知詳細留言內容
function noticeMsg_A(board_id){
    clickNoticeMsg += 1
    if (clickNoticeMsg === 1){
        popup5Load()
        fetch(`/api/message/?boardid=${board_id}`,{headers: {Authorization: `Bearer ${access_token}`}})
            .then(function(response){
                if(response.ok) {
                    return response.json();
                }
                })
            .catch(error => {
                console.error('GET /api/message 錯誤:', error)
            })
            .then(function(dict){
                console.log('GET /api/message 回傳值',dict)
                if ('invalidToken' in dict){
                    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.reload();
                }
                else if ('ok' in dict){
                    noticeMsg_A_window(dict['message'])
                }
                else if ('error' in dict){
                    if (dict['message'] === '無此筆留言'){
                        emptyMsg_window()
                    }
                }
                else{
                    console.log('不明原因')
                }
                clickNoticeMsg = 0
            });         
    }
}


// 點擊某樓通知訊息，等待通知訊息出現，loading...
function popup5Load(){
    document.querySelector('.modal5').style.display ='block'
    document.querySelector('.window5').style.display ='flex'
    document.querySelector('.popup5Load').style.display ='block'
    document.querySelector('.popup5').style.display ='none'
}


// 製作通知詳細留言視窗(已刪除)
function emptyMsg_window(){
    document.querySelector('.popup5Load').style.display ='none'
    document.querySelector('.popup5').style.display ='block'
    document.querySelector('.popup5').innerHTML ='' //淨空

    let close5 = document.createElement('div')
    close5.className = 'close5'
    close5.appendChild(document.createTextNode('×'))
    document.querySelector('.popup5').appendChild(close5)

    let goto2 = document.createElement('div')
    goto2.className = 'goto2'
    goto2.appendChild(document.createTextNode('留言已刪除'))
    document.querySelector('.popup5').appendChild(goto2)

    let no_line = document.createElement('div')
    no_line.className = 'no_line'

    let img = document.createElement('img')
    img.src = '/static/img/no_line.png'
    no_line.appendChild(img)
    document.querySelector('.popup5').appendChild(no_line)

    //關閉通知留言視窗
    document.querySelector('.popup5 .close5').addEventListener('click',function(e){
        document.querySelector('.modal5').style.display = 'none'
        document.querySelector('.window5').style.display = 'none'
        e.stopPropagation()
    })
}


// 製作通知詳細留言視窗(boardid)
function noticeMsg_A_window(para){
    document.querySelector('.popup5Load').style.display ='none'
    document.querySelector('.popup5').style.display ='block'
    document.querySelector('.popup5').innerHTML ='' //淨空

    let close5 = document.createElement('div')
    close5.className = 'close5'
    close5.appendChild(document.createTextNode('×'))
    document.querySelector('.popup5').appendChild(close5)

    let goto = document.createElement('div')
    goto.className = 'goto'
    goto.innerHTML = '去<span> 貼文 </span>查看完整留言'
    document.querySelector('.popup5').appendChild(goto)

    let line = document.createElement('div')
    line.className = 'line'

    let message_photo = document.createElement('div')
    message_photo.className = 'message_photo'

    let imgDiv = document.createElement('div')
    let img = document.createElement('img')
    img.src = para[11]
    img.setAttribute('referrerpolicy',"no-referrer")
    imgDiv.appendChild(img)
    message_photo.appendChild(imgDiv)
    line.appendChild(message_photo)

    let message_middle = document.createElement('div')
    message_middle.className = 'message_middle'

    let personName = document.createElement('div')
    personName.className = 'personName'
    personName.appendChild(document.createTextNode(para[10]))
    message_middle.appendChild(personName)

    let personMsg = document.createElement('div')
    personMsg.className = 'personMsg'
    personMsg.appendChild(document.createTextNode(para[3]))
    message_middle.appendChild(personMsg)

    let personBT = document.createElement('div')
    personBT.className = 'personBT'

    let floor = document.createElement('span')
    floor.className = 'floor'
    floor.appendChild(document.createTextNode(para[4]+" · "))

    let personTM = document.createElement('span')
    personTM.className = 'personTM'
    let reply_time = new Date(para[5].replace('GMT',''));
    let strReplyTm = `${reply_time.getFullYear()}-${String(reply_time.getMonth()+1).padStart(2, '0')}-${String(reply_time.getDate()).padStart(2, '0')} ${String(reply_time.getHours()).padStart(2, '0')}:${String(reply_time.getMinutes()).padStart(2, '0')}`
    personTM.appendChild(document.createTextNode(strReplyTm))
    personBT.appendChild(floor)
    personBT.appendChild(personTM)
    message_middle.appendChild(personBT)
    line.appendChild(message_middle)
    document.querySelector('.popup5').appendChild(line)


    let mainUrl = current_url.split('/')[0]+'//'+current_url.split('/')[2]
    let arrUrl = `${mainUrl}/event/${para[1]}`

    document.querySelector('.popup5 .goto span').addEventListener('click',function(){
        window.location.href = arrUrl
    })

    //關閉通知留言視窗
    document.querySelector('.popup5 .close5').addEventListener('click',function(e){
        document.querySelector('.modal5').style.display = 'none'
        document.querySelector('.window5').style.display = 'none'
        e.stopPropagation()
    })
}


// fetch 通知詳細留言內容
function noticeMsg_B(reply_id){
    clickNoticeMsg += 1
    if (clickNoticeMsg === 1){
        popup5Load()
        fetch(`/api/message/?replyid=${reply_id}`,{headers: {Authorization: `Bearer ${access_token}`}})
            .then(function(response){
                if(response.ok) {
                    return response.json();
                }
                })
            .catch(error => {
                console.error('GET /api/message 錯誤:', error)
            })
            .then(function(dict){
                console.log('GET /api/message 回傳值',dict)
                if ('invalidToken' in dict){
                    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.reload();
                }
                else if ('ok' in dict){
                    noticeMsg_B_window(dict['message'])
                }
                else if ('error' in dict){
                    if (dict['message'] === '無此筆留言'){
                        emptyMsg_window()
                    }
                }
                else{
                    console.log('不明原因')
                }
                clickNoticeMsg = 0
            });        
    } 
}

// 製作通知詳細留言視窗(reply_id)
function noticeMsg_B_window(para){
    document.querySelector('.popup5Load').style.display ='none'
    document.querySelector('.popup5').style.display ='block'
    document.querySelector('.popup5').innerHTML ='' //淨空

    let close5 = document.createElement('div')
    close5.className = 'close5'
    close5.appendChild(document.createTextNode('×'))
    document.querySelector('.popup5').appendChild(close5)

    let goto = document.createElement('div')
    goto.className = 'goto'
    goto.innerHTML = '去<span> 貼文 </span>查看完整留言'
    document.querySelector('.popup5').appendChild(goto)

    let line = document.createElement('div')
    line.className = 'line'

    let message_photo = document.createElement('div')
    message_photo.className = 'message_photo'

    let imgDiv = document.createElement('div')
    let img = document.createElement('img')
    img.src = para[11]
    img.setAttribute('referrerpolicy',"no-referrer")
    imgDiv.appendChild(img)
    message_photo.appendChild(imgDiv)
    line.appendChild(message_photo)

    let message_middle = document.createElement('div')
    message_middle.className = 'message_middle'

    let personName = document.createElement('div')
    personName.className = 'personName'
    personName.appendChild(document.createTextNode(para[10]))
    message_middle.appendChild(personName)

    let personMsg = document.createElement('div')
    personMsg.className = 'personMsg'
    personMsg.appendChild(document.createTextNode(para[3]))
    message_middle.appendChild(personMsg)

    let personBT = document.createElement('div')
    personBT.className = 'personBT'

    let floor = document.createElement('span')
    floor.className = 'floor'
    floor.appendChild(document.createTextNode(para[4]+" · "))

    let personTM = document.createElement('span')
    personTM.className = 'personTM'
    let reply_time = new Date(para[5].replace('GMT',''));
    let strReplyTm = `${reply_time.getFullYear()}-${String(reply_time.getMonth()+1).padStart(2, '0')}-${String(reply_time.getDate()).padStart(2, '0')} ${String(reply_time.getHours()).padStart(2, '0')}:${String(reply_time.getMinutes()).padStart(2, '0')}`
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
    _img.src = para[26]
    _img.setAttribute('referrerpolicy',"no-referrer")
    _2imgDiv.appendChild(_img)
    _2message_photo.appendChild(_2imgDiv)
    rightDiv.appendChild(_2message_photo)

    let _2message_middle = document.createElement('div')
    _2message_middle.className = '_2message_middle'

    let _2personName = document.createElement('div')
    _2personName.className = '_2personName'
    _2personName.appendChild(document.createTextNode(para[25]))
    _2message_middle.appendChild(_2personName)

    let _2personMsg = document.createElement('div')
    _2personMsg.className = '_2personMsg'
    _2personMsg.appendChild(document.createTextNode(para[18]))
    _2message_middle.appendChild(_2personMsg)

    let _2personBT = document.createElement('div')
    _2personBT.className = '_2personBT'

    let _2floor = document.createElement('span')
    _2floor.className = '_2floor'
    _2floor.appendChild(document.createTextNode(para[19]+" · "))

    let _2personTM = document.createElement('span')
    _2personTM.className = '_2personTM'
    let _reply_time = new Date(para[20].replace('GMT',''));
    let _strReplyTm = `${_reply_time.getFullYear()}-${String(_reply_time.getMonth()+1).padStart(2, '0')}-${String(_reply_time.getDate()).padStart(2, '0')} ${String(_reply_time.getHours()).padStart(2, '0')}:${String(_reply_time.getMinutes()).padStart(2, '0')}`
    _2personTM.appendChild(document.createTextNode(_strReplyTm))
    _2personBT.appendChild(_2floor)
    _2personBT.appendChild(_2personTM)
    _2message_middle.appendChild(_2personBT)
    rightDiv.appendChild(_2message_middle)
    _2line.appendChild(rightDiv)
    document.querySelector('.popup5').appendChild(_2line)

    //
    let mainUrl = current_url.split('/')[0]+'//'+current_url.split('/')[2]
    let arrUrl = `${mainUrl}/event/${para[1]}`

    document.querySelector('.popup5 .goto span').addEventListener('click',function(){
        window.location.href = arrUrl
    })

    //關閉通知留言視窗
    document.querySelector('.popup5 .close5').addEventListener('click',function(e){
        document.querySelector('.modal5').style.display = 'none'
        document.querySelector('.window5').style.display = 'none'
        e.stopPropagation()
    })
}



//make rowbox Div
function rowbox(type,photo,name,floor,time,board_name, notice){
    notification[Object.keys(notification).length+1] = notice

    let rowDiv = document.createElement('div')
    rowDiv.className = 'row'
    rowDiv.setAttribute('noticeID',Object.keys(notification).length)
    let photoDiv = document.createElement('div')
    photoDiv.className = 'photo'

    let img = document.createElement('img')
    img.src = photo
    img.setAttribute('referrerpolicy',"no-referrer")
    photoDiv.appendChild(img)
    rowDiv.appendChild(photoDiv)

    let content =document.createElement('div')
    content.className ='content'
    let message =document.createElement('div')
    message.className ='message'

    if (type === 'a'){
        message.innerHTML = `<span>${name}</span>在你的活動中留言`
    }
    else if (type === 'b'){
        message.innerHTML = `<span>${name}</span>回覆了你的留言`
    }

    content.appendChild(message)
    let messagetime = document.createElement('div')
    messagetime.className = 'messagetime'
    messagetime.appendChild(document.createTextNode(`${floor} · ${time.slice(0,16)}`))
    content.appendChild(messagetime)
    rowDiv.appendChild(content)
    document.querySelector('.noticeBlock .rowbox').appendChild(rowDiv)
}


//click alarm
for (let f = 0; f < document.querySelectorAll('.alarm').length; f++){
    document.querySelectorAll('.alarm')[f].addEventListener('click',function(e){
        if (notRead_num > 0){
            turnToRead()
        }
        if (document.querySelector('.floatRight').style.display !== 'block'){
            document.querySelector('.floatRight').style.display ='block'
            if (document.querySelector('.rowbox div:nth-child(2)') === null){
                noticeLoad()
                setTimeout("getNotice(0)",500)
            }
            
        }
        else if(document.querySelector('.floatRight').style.display === 'block'){
            document.querySelector('.floatRight').style.display = 'none'
        }
        e.stopPropagation()
    })
}


// delete all cookies
function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

//顯示copyright西元年
function createYear(){
    let Today=new Date();
    let year = Today.getFullYear();
    document.querySelector('.year').innerHTML=year
}


//未登入時右上角的呈現畫面
function notlog_display(){
    for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
        document.querySelectorAll('.frame1')[i].style.display='flex'
        document.querySelectorAll('.frame2')[i].style.display='none'
        document.querySelector('.fr2').style.display='none'
        document.querySelector('.fr3').style.display='none'
    }
}


//op透明度改變
for (let i = 0; i < document.querySelectorAll('.opc').length; i++){
    document.querySelectorAll('.opc')[i].addEventListener('mouseover',function(){
        document.querySelectorAll('.opc')[i].classList.add("op")

    })
    document.querySelectorAll('.opc')[i].addEventListener('mouseout',function(){
        document.querySelectorAll('.opc')[i].classList.remove("op")
    })
}

//點擊頭像後下方出現個人活動編輯
for (let i=0; i<document.querySelectorAll('.shot').length;i++){
    document.querySelectorAll('.shot')[i].addEventListener('click',function(e){
        if (document.querySelectorAll('.myinfo')[i].style.display==='flex'){
            document.querySelectorAll('.myinfo')[i].style.display='none'
            document.querySelector('.fr2').style.marginTop='0px'
            document.querySelector('.fr3').style.marginTop='0px'
        }
        else{
            document.querySelectorAll('.myinfo')[i].style.display='flex'
            document.querySelector('.fr2').style.display='block'
            document.querySelector('.fr2').style.marginTop='150px'
            document.querySelector('.fr3').style.display='block'
            document.querySelector('.fr3').style.marginTop='150px'
        }
        e.stopPropagation()
    })
}

//點擊任何一處都使個人活動編輯與通知內容消失
document.getElementsByTagName('body')[0].addEventListener('click',function(e){
    for(i=0; i<document.querySelectorAll('.myinfo').length;i++){
        if (document.querySelectorAll('.myinfo')[i].style.display==='flex'){
            document.querySelectorAll('.myinfo')[i].style.display='none'
            document.querySelector('.fr2').style.marginTop='0px'
            document.querySelector('.fr3').style.marginTop='0px'
        }
    }
    if(document.querySelector('.floatRight').style.display ==='block'){
        document.querySelector('.floatRight').style.display ='none'
    }
})


//點擊通知內容關閉
document.querySelector('.noticeBlock .rowbox .head span:nth-child(2)').addEventListener('click',function(){
    if(document.querySelector('.floatRight').style.display ==='block'){
        document.querySelector('.floatRight').style.display ='none'
    }
})


//點擊登入
for (i=0; i<document.querySelectorAll('.login').length; i++){
    document.querySelectorAll('.login')[i].addEventListener('click',function(){
        window.location.href = '/login'

    })
}

//fresh page and set cookie
if (document.cookie.includes('currentpage=')){
    document.cookie = "currentpage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    if (window.location.href.includes('/event')){
        document.cookie = `currentpage=${window.location.href};path=/ `
    }
    else{
      document.cookie = "currentpage="+window.location.href  
    }
}
else{
    document.cookie = "currentpage="+window.location.href
}


//點擊登出
function logout(){
    fetch("/api/user",{'method':'DELETE',headers: {Authorization: `Bearer ${access_token}`}})
    .then(function(response){
        if(response.ok) {
            return response.json();
            }
        })
    .catch(error => {
        console.error('DELETE /api/user 錯誤:', error)
    })
    .then(function(dict){
        console.log('DELETE /api/user 回傳值',dict)

        if('ok' in dict || 'invalidToken' in dict){
            window.location.reload();
        }
        else{
            console.log('不明原因')
        }
    });  
}
document.querySelector('.logoutA').addEventListener('click',logout)
document.querySelector('.logoutB').addEventListener('click',logout)



//建立活動
for (let i =0; i < document.querySelectorAll('.myinfo div .create').length; i++){
    document.querySelectorAll('.myinfo div .create')[i].addEventListener('click',function(e){
        window.location.href = '/create'
    })
}


//搜尋欄hover
document.getElementById('keyword').addEventListener('mouseover',function(){
    document.getElementById('keyword').style.borderColor = '#f6d819'
})
document.getElementById('keyword').addEventListener('mouseout',function(){
    document.getElementById('keyword').style.borderColor = '#BEBEBE'
})


//關鍵字放大鏡
document.querySelector('.search button').addEventListener('mouseover',function(){
    document.getElementById('keyword').style.borderColor = '#f6d819'
},false)
document.querySelector('.search button').addEventListener('mouseout',function(){
    document.getElementById('keyword').style.borderColor = '#BEBEBE'
},false)

//關鍵字搜尋
document.querySelector('.search button').addEventListener('click',function(){
    let keyin = document.getElementById('keyword').value
    if (! current_url.includes('/find')){ //不是在搜尋頁面
        let slash_i = current_url.indexOf('/')
        window.location.href = current_url.slice(0,slash_i)+`/find?&keyword=${keyin}`
    }
    else{ //在搜尋頁面
        if (current_url.includes('keyword=')){//先前有輸入過關鍵字
            let arr = current_url.split('&')
            for(let i = 0; i < arr.length; i++){
                if (arr[i].includes('keyword=')){

                    //去掉URL頁碼
                    let newUrl;
                    newUrl = (arr.slice(0, i).concat([`keyword=${keyin}`]).concat(arr.slice(i+1,))).join('&')
                    if (newUrl.includes('page=')){
                        let _2newUrl = newUrl.split('&')
                        for(let n = 0; n < _2newUrl.length; n++){
                            if (_2newUrl[n].includes('page=')){
                                newUrl = (_2newUrl.slice(0,n).concat(_2newUrl.slice(n+1,))).join('&')
                            }
                        }                                
                    }
                    window.location.href = newUrl
                }
            }
        }
        else{ //先前沒輸入過關鍵字
            
            //去掉URL頁碼
            let newUrl;
            newUrl = current_url + `&keyword=${keyin}`
            if (newUrl.includes('page=')){
                let _2newUrl = newUrl.split('&')
                for(let n = 0; n < _2newUrl.length; n++){
                    if (_2newUrl[n].includes('page=')){
                        newUrl = (_2newUrl.slice(0,n).concat(_2newUrl.slice(n+1,))).join('&')
                    }
                }                                
            }
            window.location.href = newUrl
        }
    }    
})


//搜尋欄中出現輸入的關鍵字
if (current_url.includes('keyword=')){//先前有輸入過關鍵字
    let arr = current_url.split('&')
    for(let i = 0; i < arr.length; i++){
        if (arr[i].includes('keyword=')){
            document.getElementById('keyword').value = decodeURI(arr[i].replace('keyword=',''))
        }
    }
}


let floatRight_h =parseInt(window.getComputedStyle(document.querySelector('.floatRight'),null).getPropertyValue('height').replace('%',''))

//通知鈴鐺scroll
document.querySelector('.noticeBlock .rowbox').addEventListener('scroll',function(){
    let ajaxHeight = this.scrollHeight;
    let deviseHeight= (window.innerHeight*floatRight_h)/100
    let scrollable = ajaxHeight- deviseHeight
    let scrolled =this.scrollTop
    if (scrolled + 5 >= scrollable){
        if (notice_nextPage){            
            if (noticePage_record.includes(notice_nextPage)){
            }
            else{
                noticePage_record.push(notice_nextPage) 
                //載入留言
                noticeLoad()
                setTimeout("getNotice(notice_nextPage)",500)
            }
        }
    }
})


// 通知劉留言等待載入圖示
function noticeLoad(){
    let noticeLoad = document.createElement('div')
    noticeLoad.className = 'load'
    let imgDiv = document.createElement('div')

    let img = document.createElement('img')
    img.src = '/static/img/yellowloader.gif'
    imgDiv.appendChild(img)
    noticeLoad.appendChild(imgDiv) 
    document.querySelector('.noticeBlock .rowbox').appendChild(noticeLoad)
}


//點擊通知的每一行row
for (let r=0; r<document.querySelectorAll('.rowbox row').length; r++){
    document.querySelectorAll('.rowbox row')[r].addEventListener('click',function(e){
        console.log(this,'***')
        e.stopPropagation()
    })
}
