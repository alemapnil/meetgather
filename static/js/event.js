var ev_host, ev_hostPic ,ev_title, ev_content, ev_cate, ev_limit, ev_attend, ev_location, ev_address, ev_lat, ev_lng, ev_tm, ev_pic;
var days_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var month_en = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var days_cn = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
var month_cn = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']


var ev_dayStr, ev_HrMin, google_calender, id, namelist;
var  map

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
                ev_title = dict['result'][2], ev_content = dict['result'][3], ev_limit = dict['result'][5], ev_attend = dict['result'][6], ev_location = dict['result'][7]
                ev_address = dict['result'][8], ev_lat = dict['result'][9], ev_lng = dict['result'][10], ev_tm = dict['result'][11].replace('GMT',''), ev_pic = dict['result'][14]
                namelist = dict['namelist']

                // seeAll
                if (namelist.length === 0){
                    document.querySelector('.seeAll').style.display = 'none'
                }
                else{
                    document.querySelector('.seeAll').style.display = 'inline-block'
                }
            }
        });  
    console.log(ev_attend,'attend')
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



//愛心圖示改變，空心與紅心
// document.querySelector('.fav').addEventListener('click',function(e){
//     e.stopPropagation()
//     if (access_token === undefined){
//         document.querySelector('.modal1').style.display = 'block'
//         document.querySelector('.window1').style.display = 'flex'
//     }
//     else{
//         let src = document.querySelector('.fav img').src
//         if (src.includes('fav2.png')){
//             document.querySelector('.fav img').src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/fav.png'
//         }
//         else{
//             document.querySelector('.fav img').src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/fav2.png'
//         }        
//     }
// },true)


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



function joinCursor(){
if(document.querySelector('.join span').innerHTML === `<div class="attendPic"><img src="/static/img/loadingG.gif"></div>` || document.querySelector('.join span').innerHTML === '滿額'){
    document.querySelector('.join').style.cursor = 'default'
}
else{
    document.querySelector('.join').style.cursor = 'pointer'
}
}




