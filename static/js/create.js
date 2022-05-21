function create(){
    if (typeof(dict)==='object' && 'ok' in dict){
        document.body.style.backgroundColor = '#E5E5E5' //背景色調整
        document.getElementById('file').value='' // input值歸零

        setTimeout(() => {document.querySelector('.overlay').style.display='none'}, 700);


    }
    else{
        window.location.href = '/'
    }
}


//
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
})




//活動地點
document.querySelector('.city').style.color = 'gray'
document.querySelector('.city').addEventListener('change',function(){
    let select = document.querySelector('.city')
    if (select.value ===''){
        select.style.color = 'gray'
    }
    else{
        select.style.color = 'black'
    }

})