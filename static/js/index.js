//畫面一載入先要做的事
window.onload=function(){
    console.log('onload...')
    createYear()
    if (document.cookie.includes('access_token')){
        const myArray = document.cookie.split(";");
        console.log('Token Array',myArray)
        for (let i = 0 ;i < myArray.length; i++){
            if (myArray[i].includes('access_token')){
                access_token = myArray[i].replace('access_token=','').replace(/\s/g,'')
            }
        }
        googleInfo(access_token)
    }
    else{
        console.log('未登入')
        for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
            document.querySelectorAll('.frame1')[i].style.display='flex'
            document.querySelectorAll('.frame2')[i].style.display='none'
            document.querySelector('.fr2').style.display='none'
        }
    } 

    setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 500);
}


//fetch登入者資料。已登入時，右上角要做相應變化，還有token過期時的調整
function googleInfo(para){
    fetch("/api/user",{headers: {Authorization: `Bearer ${para}`}})
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
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='flex'
                    document.querySelectorAll('.frame2')[i].style.display='none'
                    document.querySelector('.fr2').style.display='none'
                }
            }
            else if ('invalidToken' in dict){
                document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='flex'
                    document.querySelectorAll('.frame2')[i].style.display='none'
                    document.querySelector('.fr2').style.display='none'
                }
            }
            else if ('ok' in dict){
                for(let i=0; i<document.querySelectorAll('.frame1').length; i++){
                    document.querySelectorAll('.frame1')[i].style.display='none'
                    document.querySelectorAll('.frame2')[i].style.display='flex'
                    document.querySelector('.fr2').style.display='block';
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
                }
            }
            
        });  

}

// // delete all cookies
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
    document.querySelector('.year').innerHTML = ' '+year+' '
    document.querySelector('.year').style.color = 'white'
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
        }
        else{
            document.querySelectorAll('.myinfo')[i].style.display='flex'
            document.querySelector('.fr2').style.display='block'
            document.querySelector('.fr2').style.marginTop='150px'
        }
        e.stopPropagation()
    })
}

// //點擊任何一處都使個人活動編輯消失
document.getElementsByTagName('body')[0].addEventListener('click',function(e){
    for(i=0; i<document.querySelectorAll('.myinfo').length;i++){
        if (document.querySelectorAll('.myinfo')[i].style.display==='flex'){
            document.querySelectorAll('.myinfo')[i].style.display='none'
            document.querySelector('.fr2').style.marginTop='0px'
        }
        e.stopPropagation()
    }
})


//建立活動
for (let i =0; i < document.querySelectorAll('.myinfo div .create').length; i++){
    document.querySelectorAll('.myinfo div .create')[i].addEventListener('click',function(e){
        window.location.href = '/create'
    })
}



//點擊登入
for (i=0; i<document.querySelectorAll('.login').length; i++){
    document.querySelectorAll('.login')[i].addEventListener('click',function(){
        document.cookie = "currentpage="+window.location.href
        window.location.href = '/login'

    })
}




// // //點擊登出
function logout(){
    fetch("/api/user",{'method':'DELETE'})
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



var access_token, userName, userEmail, userPicture


var index_Url = window.location.href

//首頁關鍵字搜尋
document.querySelector('.searchBar div').addEventListener('click',function(){
    let keyin = document.getElementById('keyword').value
    if (! index_Url.includes('/find')){ //不是在搜尋頁面
        let slash_i = index_Url.indexOf('/')
        window.location.href = index_Url.slice(0,slash_i)+`/find?&keyword=${keyin}`
    }
})
