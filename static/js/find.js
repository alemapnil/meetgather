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
    document.querySelectorAll('.fav img')[i].addEventListener('click',function(){
        let src = document.querySelectorAll('.fav img')[i].src
        if (src.includes('favorite1.png')){
            document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite2.png'
        }
        else if (src.includes('favorite2.png')){
            document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite1.png'
        }
    })
}