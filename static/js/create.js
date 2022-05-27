function create(){
    if (typeof(dict)==='object' && 'ok' in dict){
        document.body.style.backgroundColor = '#E5E5E5' //背景色調整

        for(s = 0; s < document.getElementsByTagName('select').length; s++){ //select歸零
            document.getElementsByTagName('select')[s].value = ''
        }

        for(s = 0; s < document.querySelectorAll('.notice').length; s++){ // clear notice
            document.querySelectorAll('.notice')[s].innerHTML = ''
        }

        //預覽按鈕控制
        document.querySelector('.view').style.display = 'flex';
        document.querySelector('.backToEdit').style.display = 'none';
        document.querySelector('.confirm').style.display = 'none';

        //create time
        createTime()
        //delete time
        deleteTime()
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
    var reader  = new FileReader();
    reader.readAsDataURL(file)
    reader.onload = function(event){
        const imgElement = document.querySelector('.photo img')
        imgElement.src = event.target.result          
    }
    document.querySelector('.acti_pho .enter .notice').innerHTML = ''
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
        select.style.color = 'black'
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
        document.querySelector('.enter .search').style.display = 'none';
        document.getElementById('map').style.display = 'none'
        document.querySelector('.acti_add .enter .notice').innerHTML = '活動縣市不可為空'
    }
    else if(select.value === 'online'){
        select.style.color = 'black'
        document.querySelector('.enter .search').style.display = 'none';
        document.getElementById('map').style.display = 'none'
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
    }
    else{
        select.style.color = 'black'
        document.querySelector('.enter .search').style.display = 'block';
        document.getElementById('map').style.display = 'block'
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
    }
})

let nonSpacePat = /[\S]/g
let NonInt = /[\s\D]/g

//點擊預覽
document.querySelector('.view').addEventListener('click',()=>{
    if(document.getElementById('file').files.length === 0){
        document.querySelector('.acti_pho .enter .notice').innerHTML = '請選擇一張照片'
    }
    else{
        document.querySelector('.acti_pho .enter .notice').innerHTML = ''
        var acti_pho = document.getElementById('file').files[0]
    }


    let gathername = document.getElementById('gathername').value.trim()
    if (gathername.match(nonSpacePat)){
        document.querySelector('.acti_name .enter .notice').innerHTML = ''
        var acti_name = gathername
        
    }
    else{
        document.querySelector('.acti_name .enter .notice').innerHTML = '活動標題不可為空'
    }

    let story = document.getElementById('story').value.trim()
    if (story.match(nonSpacePat)){
        document.querySelector('.acti_descp .enter .notice').innerHTML = ''
        var acti_story = story
    }
    else{
        document.querySelector('.acti_descp .enter .notice').innerHTML = '活動標題不可為空'
    }


    let category = document.querySelector('.category')
    if( category.value !== ''){
        document.querySelector('.acti_cate .enter .notice').innerHTML = ''
        var acti_cate = category.options[category.selectedIndex].text
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
        var acti_num = parseInt(number, 10)
    }
    else{
        document.querySelector('.acti_num .enter .notice').innerHTML = '人數為空'
    }
    

    let city = document.querySelector('.city')
    if( city.value !== ''){
        document.querySelector('.acti_add .enter .notice').innerHTML = ''
        var acti_city = city.options[city.selectedIndex].text

        if (city.value !=='online'){
            if (acti_add === undefined){
                document.querySelector('.acti_add .enter .notice').innerHTML = '地圖上須標記位置'
            }
            else{
                document.querySelector('.acti_add .enter .notice').innerHTML = ''
                console.log(acti_add,acti_lat,acti_lng)
            }
        }
    }
    else{
        document.querySelector('.acti_add .enter .notice').innerHTML = '活動縣市不可為空'
    }


    if( completeTime !== undefined){
        document.querySelector('.acti_tm .enter .notice').innerHTML = ''
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
        alert('輸入資料有誤')
    }
    else{
        console.log('input data success')
        document.querySelector('.preview').style.display = 'block'

        //預覽按鈕控制
        document.querySelector('.view').style.display = 'none';
        document.querySelector('.backToEdit').style.display = 'flex';
        document.querySelector('.confirm').style.display = 'flex';
    }

})


//返回編輯
document.querySelector('.backToEdit').addEventListener('click',()=>{
    document.querySelector('.preview').style.display = 'none'
    //預覽按鈕控制
    document.querySelector('.view').style.display = 'flex';
    document.querySelector('.backToEdit').style.display = 'none';
    document.querySelector('.confirm').style.display = 'none';
})

//確定送出
document.querySelector('.confirm').addEventListener('click',()=>{
    window.location.href = '/find'

})
