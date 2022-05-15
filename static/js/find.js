window.onload=()=>{
    let Today=new Date();
    let year = Today.getFullYear();
    document.querySelector('.year').innerHTML=year
}


//篩選器選擇，之後連API搜尋顯示結果
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

//click重整篩選器，之後連API搜尋顯示結果
document.getElementsByTagName('button')[0].addEventListener('click',function(){
    for (let i=0; i<document.getElementsByTagName('select').length-1; i++){
        let select = document.getElementsByTagName('select')[i]
        select.value=''
        select.classList.remove('selectChange')
    }
})

//分享、愛心透明度改變
for (let i = 0; i < document.querySelectorAll('.items div').length; i++){
    document.querySelectorAll('.items div')[i].addEventListener('mouseover',function(){
        document.querySelectorAll('.items div')[i].style.opacity = '0.5'
    })
    document.querySelectorAll('.items div')[i].addEventListener('mouseout',function(){
        document.querySelectorAll('.items div')[i].style.opacity = '1'
    })
}


//愛心圖示改變
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

//輸入關鍵字
document.getElementById('keyword').addEventListener('mouseover',function(){
    console.log(123)
    document.getElementById('keyword').style.border='1px solid #f6d819'
    document.getElementById('keyword').style.borderRight='none'
})
document.getElementById('keyword').addEventListener('mouseout',function(){
    console.log(3)
    document.getElementById('keyword').style.border='1px solid #BEBEBE'
    document.getElementById('keyword').style.borderRight='none'
})
