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
document.querySelector('.photo').addEventListener('click',function(){
    document.getElementById('file').value=''
    document.getElementById('file').click()    
})

document.getElementById('file').addEventListener('change',function(){
    let file = document.getElementById('file').files[0]
    if (file.type.includes('image/')){
        var reader  = new FileReader();
        reader.readAsDataURL(file)
        reader.onload = function(event){
            const imgElement = document.querySelector('.photo img')
            imgElement.src = event.target.result          
        }
        document.querySelector('.acti_pho .enter .notice').innerHTML = ''        
    }
    else{
        document.querySelector('.photo img').src = '/static/img/upload.svg'
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
        select.style.color = 'rgb(0,0,0,0.75)'
        document.querySelector('.searchmap').style.display = 'block';
        document.getElementById('map').style.display = 'block'
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
document.querySelector('.view').addEventListener('click',()=>{
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
    else{
        //預覽按鈕控制
    }

})


var acti_pho, acti_name, acti_story, acti_cate, acti_num, acti_city, acti_tm;


// //確定送出
// document.querySelector('.confirm').addEventListener('click',()=>{
//     document.querySelector('.preview').style.display = 'none'
//     document.querySelector('.overlay').style.display='flex'

//     let formdata = new FormData()
//     formdata.append('acti_pho', acti_pho)
//     formdata.append('acti_name', acti_name)
//     formdata.append('acti_story', acti_story)
//     formdata.append('acti_cate', acti_cate)
//     formdata.append('acti_num', acti_num)
//     formdata.append('acti_city', acti_city)
//     if (acti_city ==='online' || acti_city ==='線上'){}
//     else{
//         formdata.append('acti_add', acti_add)
//         formdata.append('acti_lat', acti_lat)
//         formdata.append('acti_lng', acti_lng)
//     }
//     formdata.append('acti_tm', acti_tm)

//     fetch('/api/send',{
//         method : 'POST',
//         body: formdata,
//         headers: {Authorization: `Bearer ${access_token}`}
//     }).catch(error => console.error('Error:', error))
//     .then(response => response.json()) // 輸出成 json
//     .then(function(dict){
//         setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 0)
        
//         console.log('POST /send 回傳值',dict)
//         if ('ok' in dict){
//             document.querySelector('.success').style.display = 'flex'
//         }
//         else{
//             document.querySelector('.fail').style.display = 'flex'   
//         }
//     })
// })


//建立活動結果後確認
for (i =0; i<document.querySelectorAll('.close').length; i++){
    document.querySelectorAll('.close')[i].addEventListener('click',()=>{
    window.location.href = '/find'
})
}