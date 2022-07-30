function create(){
    if (access_token !== undefined){
        document.body.style.backgroundColor = '#E5E5E5' //背景色調整

        for(s = 0; s < document.getElementsByTagName('select').length; s++){ //select歸零
            document.getElementsByTagName('select')[s].value = ''
        }

        for(s = 0; s < document.querySelectorAll('.notice').length; s++){ // clear notice
            document.querySelectorAll('.notice')[s].innerHTML = ''
        }
    }
    else{
        window.location.href = '/'
    }
}


//活動 form submit 取消
document.getElementById('form').addEventListener('submit',function(e){
    e.preventDefault();
})


// 活動圖片上傳
document.querySelector('.activity_photo .photo').addEventListener('click',function(){
    document.getElementById('file').value=''
    document.getElementById('file').click()    
})

document.getElementById('file').addEventListener('change',function(){
    let file = document.getElementById('file').files[0]
    if (file.type.includes('image/')){
        var reader  = new FileReader();
        reader.readAsDataURL(file)
        reader.onload = function(event){
            const imgElement = document.querySelector('.activity_photo .photo img')
            imgElement.src = event.target.result          
        }
        document.querySelector('.acti_pho .enter .notice').innerHTML = ''        
    }
    else{
        document.querySelector('.activity_photo .photo img').src = '/static/img/upload.svg'
        document.querySelector('.acti_pho .enter .notice').innerHTML = '請選擇一張照片'
    }
})

//活動標題
document.getElementById('gathername').addEventListener('input',function(){
    if(this.value.match(nonSpacePat)){
        document.querySelector('.acti_name .enter .notice').innerHTML = ''
    }
    else{
        document.querySelector('.acti_name .enter .notice').innerHTML = '活動標題不可為空'
    }
})

//活動描述
document.getElementById('story').addEventListener('input',function(){
    if(this.value.match(nonSpacePat)){
        document.querySelector('.acti_descp .enter .notice').innerHTML = ''
    }
    else{
        document.querySelector('.acti_descp .enter .notice').innerHTML = '活動標題不可為空'
    }
})


//活動類別
document.querySelector('.category').style.color = '#bebebe'
document.querySelector('.category').addEventListener('change',function(){
    let select = document.querySelector('.category')
    if (select.value ===''){
        select.style.color = '#bebebe'
        document.querySelector('.acti_cate .enter .notice').innerHTML = '活動類別不可為空'
    }
    else{
        select.style.color = 'rgb(0,0,0,0.75)'
        document.querySelector('.acti_cate .enter .notice').innerHTML = ''
    }
})


//活動人數
document.getElementById('gathernumber').addEventListener('input', ()=>{
  let number = document.getElementById('gathernumber').value.replace(/[\s]/g,'') //remove all space
    if(number.match(NonInt)){
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數有誤'
    }
    else if( parseInt(number, 10) === 0 || parseInt(number, 10) === 1){
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數不夠'
    }
    else if (parseInt(number, 10) > 1){
        document.querySelector('.acti_num .enter .notice').innerHTML = ''
    }
    else{
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數為空'
    }
})



//活動縣市
document.querySelector('.city').style.color = '#bebebe'
document.querySelector('.city').addEventListener('change',function(){
    document.querySelector('.acti_add .enter .notice').innerHTML = ''
    let select = document.querySelector('.city')
    if (select.value ===''){
        select.style.color = '#bebebe'
        document.querySelector('.searchmap').style.display = 'none';
        document.getElementById('map').style.display = 'none'
        document.querySelector('.acti_add .enter .notice').innerHTML = '活動縣市不可為空'
    }
    else if(select.value === 'online'){
        select.style.color = 'rgb(0,0,0,0.75)'
        document.querySelector('.searchmap').style.display = 'none';
        document.getElementById('map').style.display = 'none'
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
    }
    else{
        initMap()
        select.style.color = 'rgb(0,0,0,0.75)'
        document.querySelector('.searchmap').style.display = 'block';
        document.getElementById('map').style.display = 'block'
        document.getElementById('location').value = ''
        acti_add = undefined
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
    }
})

let nonSpacePat = /[\S]/g
let NonInt = /[\s\D]/g


//活動時間
document.getElementById('localtime').addEventListener('input',function(){

    document.getElementById('localtime').style.color = 'rgb(0,0,0,0.75)'
    if (new Date(this.value) <= new Date()){
        document.querySelector('.acti_tm .enter .notice').innerHTML = '活動時間有誤'
    }
    else{
        document.querySelector('.acti_tm .enter .notice').innerHTML = ''
        acti_tm = this.value
    }


})

//點擊預覽
document.querySelector('.acti_view .view').addEventListener('click',()=>{
    if(document.getElementById('file').files.length === 0){
        document.querySelector('.acti_pho .enter .notice').innerHTML = '請選擇一張照片'
    }
    else{
        if (document.getElementById('file').files[0].type.includes('image/')){
            document.querySelector('.acti_pho .enter .notice').innerHTML = ''
            acti_pho = document.getElementById('file').files[0]
        }
    }

    let gathername = document.getElementById('gathername').value.trim()
    if (gathername.match(nonSpacePat)){
        document.querySelector('.acti_name .enter .notice').innerHTML = ''
        acti_name = gathername
    }
    else{
        document.querySelector('.acti_name .enter .notice').innerHTML = '活動標題不可為空'
    }

    let story = document.getElementById('story').value.trim()
    if (story.match(nonSpacePat)){
        document.querySelector('.acti_descp .enter .notice').innerHTML = ''
        acti_story = story
    }
    else{
        document.querySelector('.acti_descp .enter .notice').innerHTML = '活動描述不可為空'
    }

    let category = document.querySelector('.category')
    if( category.value !== ''){
        document.querySelector('.acti_cate .enter .notice').innerHTML = ''
        acti_cate = category.options[category.selectedIndex].text
    }
    else{
        document.querySelector('.acti_cate .enter .notice').innerHTML = '活動類別不可為空'
    }

    
    let number = document.getElementById('gathernumber').value.replace(/[\s]/g,'') //remove all space
    if(number.match(NonInt)){
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數有誤'
    }
    else if( parseInt(number, 10) === 0 || parseInt(number, 10) === 1){
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數不夠'
    }
    else if (parseInt(number, 10) > 1){
        document.querySelector('.acti_num .enter .notice').innerHTML = ''
        acti_num = parseInt(number, 10)
    }
    else{
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數為空'
    }
    

    let city = document.querySelector('.city')
    if( city.value !== ''){
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
        acti_city = city.options[city.selectedIndex].text

        if (city.value !=='online'){
            if (acti_add === undefined){
                document.querySelector('.acti_add .enter .notice').innerHTML = '地址須標記在地圖上'
            }
            else{
                document.querySelector('.acti_add .enter .notice').innerHTML = ''
            }
        }
    }
    else{
        document.querySelector('.acti_add .enter .notice').innerHTML = '活動縣市不可為空'
    }

    acti_tm = document.getElementById('localtime').value
    if( acti_tm !== undefined && new Date(acti_tm)> new Date()){
        document.querySelector('.acti_tm .enter .notice').innerHTML = ''
        acti_tm = acti_tm.replace('T',' ')
    }
    else{
        document.querySelector('.acti_tm .enter .notice').innerHTML = '活動時間有誤'
    }


    let redNotice =  0
    for (let n=0; n < document.querySelectorAll('.notice').length; n++){
        if (document.querySelectorAll('.notice')[n].innerHTML !== ''){
            redNotice += 1
        }
    }


    if (redNotice > 0){
        alert('資料輸入不完善')
    }
    //預覽按鈕控制
    else{
        document.querySelector('.modal6').style.display ='block';
        document.querySelector('.modal6').scrollTop = 0;
        document.querySelector('.popup6').style.display ='block';
        document.body.classList.add('noscroll');
        document.querySelector('.box0').style.position = 'static';
        document.querySelector('.laptop').style.position = 'static'

        ///顯示預覽圖片、活動內容等
        var reader  = new FileReader();
        reader.readAsDataURL(acti_pho)
        reader.onload = function(event){document.querySelector('.view_photo .photo img').src = event.target.result}

        document.querySelector('.popup6 .view_gathername').innerHTML = ''
        document.querySelector('.popup6 .view_gathername').appendChild(document.createTextNode(acti_name))

        document.querySelector('.popup6 .view_descp').innerHTML = ''
        document.querySelector('.popup6 .view_descp').appendChild(document.createTextNode(acti_story))

        document.querySelector('.popup6 .view_cate').innerHTML =''
        document.querySelector('.popup6 .view_cate').appendChild(document.createTextNode(acti_cate))

        document.querySelector('.popup6 .view_num').innerHTML = ''
        document.querySelector('.popup6 .view_num').appendChild(document.createTextNode(acti_num))

        document.querySelector('.popup6 .view_city').innerHTML = ''
        document.querySelector('.popup6 .view_city').appendChild(document.createTextNode(acti_city))
        try{
            document.querySelector('.popup6 .view_add').innerHTML =''
        }catch{}
        if (acti_city !=='online' && acti_city !=='線上'){
            document.querySelector('.popup6 .view_add').appendChild(document.createTextNode(acti_add))
        }
        document.querySelector('.popup6 .view_tm').innerHTML =''
        document.querySelector('.popup6 .view_tm').appendChild(document.createTextNode(acti_tm))

        //back to edit
        document.querySelector('.popup6 .view_send .back').addEventListener('click',function(){
            document.querySelector('.modal6').style.display ='none'
            document.querySelector('.popup6').style.display ='none'
            document.body.classList.remove('noscroll');
            document.documentElement.scrollTop = 0
            document.querySelector('.box0').style.position = 'fixed'
            document.querySelector('.laptop').style.position = 'fixed'
        })

    }
})

var acti_pho, acti_name, acti_story, acti_cate, acti_num, acti_city, acti_tm;



//確定送出
document.querySelector('.popup6 .view_send .send').addEventListener('click',()=>{
    //預覽畫面消失
    document.querySelector('.modal6').style.display ='none'
    document.querySelector('.popup6').style.display ='none'
    document.body.classList.remove('noscroll');
    document.querySelector('.box0').style.position = 'fixed'
    document.querySelector('.laptop').style.position = 'fixed'

    //重整畫面出現
    document.querySelector('.overlay').style.display='flex'

    let formdata = new FormData()
    formdata.append('acti_pho', acti_pho)
    formdata.append('acti_name', acti_name)
    formdata.append('acti_story', acti_story)
    formdata.append('acti_cate', acti_cate)
    formdata.append('acti_num', acti_num)
    formdata.append('acti_city', acti_city)
    if (acti_city !=='online' && acti_city !=='線上'){
        formdata.append('acti_add', acti_add)
        formdata.append('acti_lat', acti_lat)
        formdata.append('acti_lng', acti_lng)        
    }
    formdata.append('acti_tm', acti_tm)

    fetch('/api/send',{
        method : 'POST',
        body: formdata,
        headers: {Authorization: `Bearer ${access_token}`}
    }).catch(error => console.error('Error:', error))
    .then(response => response.json()) // 輸出成 json
    .then(function(dict){
        setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 0)
        
        console.log('POST /send 回傳值',dict)
        if ('ok' in dict){
            document.querySelector('.success').style.display = 'flex'
        }
        else{
            document.querySelector('.fail').style.display = 'flex'   
        }
    })
})


//建立活動結果後確認
for (i =0; i<document.querySelectorAll('.close').length; i++){
    document.querySelectorAll('.close')[i].addEventListener('click',()=>{
    window.location.href = '/find'
})
}


//預覽時顯示圖片
document.getElementById("send").addEventListener("click",function(fe){
    fe.preventDefault()
    const file = document.querySelector('#upload').files[0]

    if(!file) {
        console.log('未上傳圖片')
        return 
    }

    var reader  = new FileReader();
    reader.readAsDataURL(file)
    reader.onload = function(event){
        const imgElement = document.createElement('img')
        imgElement.src = event.target.result

        console.log(event.target.result.width,event.target.result.height,'*********')
        document.querySelector('#input').src = event.target.result      
          
        imgElement.onload = function(e){
            var dataURL;

            if (imgElement.width >= imgElement.height && imgElement.width > 150){
            console.log('原圖寬度過長')
            const canvas = document.createElement('canvas');
            const max_width = 150;
            const scaleSize = max_width/e.target.width;
            canvas.width = max_width;
            canvas.height = e.target.height* scaleSize;

            const ctx = canvas.getContext('2d')
            ctx.drawImage(e.target,0, 0, canvas.width, canvas.height);
            dataURL = ctx.canvas.toDataURL(e.target,"image/jpeg")
            document.querySelector('#output').src = dataURL;
        }
        else if (imgElement.height >= imgElement.width && imgElement.height > 150){
            console.log('原圖高度過長')
            const canvas = document.createElement('canvas');
            const max_height = 150;
            const scaleSize = max_height/e.target.height;
            canvas.height = max_height;
            canvas.width= e.target.width* scaleSize;
            const ctx = canvas.getContext('2d')
            ctx.drawImage(e.target,0, 0, canvas.width, canvas.height);
            dataURL = ctx.canvas.toDataURL(e.target,"image/jpeg")
            document.querySelector('#output').src = dataURL;

        }
        else{
            console.log('原圖不必壓縮')
            const canvas = document.createElement('canvas');

            canvas.width = imgElement.width
            canvas.height = imgElement.height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(e.target,0, 0, canvas.width, canvas.height);
            dataURL = ctx.canvas.toDataURL(e.target,"image/jpeg")
            document.querySelector('#output').src = dataURL;
        }

            // 建立 file
            const blobBin = atob(dataURL.split(',')[1])
            const array = []
            for (let i = 0; i < blobBin.length; i++) {
                array.push(blobBin.charCodeAt(i))
            }
            const blob = new Blob([new Uint8Array(array)], { type: 'image/png' })

            // 將file 加至 formData
            const formData = new FormData()
            formData.append('file', blob, file.name)


            fetch('/api/send',{
                method : 'POST',
                body: formData
            }).catch(error => console.error('Error:', error))
            .then(response => response.json()) // 輸出成 json
            .then(function(dict){
                console.log('POST /send 回傳值',dict)
            })
        }
    }
})