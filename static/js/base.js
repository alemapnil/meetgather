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
        for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
            document.querySelectorAll('.frame1')[i].style.display='flex'
            document.querySelectorAll('.frame2')[i].style.display='none'
            document.querySelector('.fr2').style.display='none'
            document.querySelector('.fr3').style.display='none'
        }
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



//fetch登入者資料。已登入時，右上角要做相應變化，還有token過期時的調整
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
        .then(function(ele){
            dict = ele
            console.log('GET /api/user 回傳值',dict)
            if (dict === undefined){
                deleteAllCookies()
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='flex'
                    document.querySelectorAll('.frame2')[i].style.display='none'
                    document.querySelector('.fr2').style.display='none'
                    document.querySelector('.fr3').style.display='none'
                }
            }
            else if ('invalidToken' in dict){
                document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='flex'
                    document.querySelectorAll('.frame2')[i].style.display='none'
                    document.querySelector('.fr2').style.display='none'
                    document.querySelector('.fr3').style.display='none'
                }
            }
            else if ('ok' in dict){
                userEmail = dict['email']
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
            }
            else{
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='flex'
                    document.querySelectorAll('.frame2')[i].style.display='none'
                    document.querySelector('.fr2').style.display='none'
                    document.querySelector('.fr3').style.display='none'
                }
            }
            
        });  

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

//點擊任何一處都使個人活動編輯消失
document.getElementsByTagName('body')[0].addEventListener('click',function(e){
    for(i=0; i<document.querySelectorAll('.myinfo').length;i++){
        if (document.querySelectorAll('.myinfo')[i].style.display==='flex'){
            document.querySelectorAll('.myinfo')[i].style.display='none'
            document.querySelector('.fr2').style.marginTop='0px'
            document.querySelector('.fr3').style.marginTop='0px'
        }
        e.stopPropagation()
    }
})

//點擊登入
for (i=0; i<document.querySelectorAll('.login').length; i++){
    document.querySelectorAll('.login')[i].addEventListener('click',function(){
        window.location.href = '/login'

    })
}

//fresh page and set cookie
console.log(document.cookie,'前')
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

console.log(document.cookie,'後')

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

        if('ok' in dict){
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


var access_token, userName, userEmail, userPicture, dict
var current_url = window.location.href
console.log('base.js 當前網址',current_url)
load()


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


