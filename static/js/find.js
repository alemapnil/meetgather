document.querySelector('.overlay').style.display = 'flex'







function today_tomorrow(){
    const today = new Date() //前端當地時間

    // to return the date number(1-31) for the specified date
    let today_date = today.toLocaleDateString().slice(0, 10).split('/')

    if (today_date[1].length === 1){
        today_date[1] = '0'+today_date[1]
    }
    if (today_date[2].length === 1){
        today_date[2] = '0'+today_date[2]
    }

    let tomorrow =  new Date()
    tomorrow.setDate(today.getDate() + 1)
    //returns the tomorrow date
    let tomorrow_date = tomorrow.toLocaleDateString().slice(0, 10).split('/')

    if (tomorrow_date[1].length === 1){
        tomorrow_date[1] = '0'+tomorrow_date[1]
    }
    if (tomorrow_date[2].length === 1){
        tomorrow_date[2] = '0'+tomorrow_date[2]
    }
    today_date = today_date.join('-'), tomorrow_date = tomorrow_date.join('-')

    return [today_date,tomorrow_date]
}


function periodButNone(){
    document.querySelector('.choosePeriod').style.display = 'none'
    document.querySelector('.calender').style.display = 'none'
}

function clearHas_calender(){
    if (document.querySelector('.result')){
        document.querySelector('.result').classList.remove('has_calender')
    }
    if (document.getElementById('nofound')){
        document.getElementById('nofound').classList.remove('has_calender')
    }
}


function addHas_calender(){
    if (document.querySelector('.result')){
        document.querySelector('.result').classList.add('has_calender')
    }
    if (document.getElementById('nofound')){
        document.getElementById('nofound').classList.add('has_calender')
    }
}


function find(){
    clearHas_calender()

    if (! current_url.includes('?')){
        current_url += '?'
    }

    console.log(current_url,'目前網址')

    //重整頁面後，篩選器的顯示(時間)
    let dateOptions= document.getElementsByTagName('select')[0].options
    if (current_url.includes(`datefrom=${today_tomorrow()[0]}&dateto=${today_tomorrow()[0]}`)){ //今天
        dateOptions[1].selected = true
        document.getElementsByTagName('select')[0].classList.add('selectChange')
    }
    else if (current_url.includes(`datefrom=${today_tomorrow()[1]}&dateto=${today_tomorrow()[1]}`)){ //明天
        dateOptions[2].selected = true
        document.getElementsByTagName('select')[0].classList.add('selectChange')
    }
    else if (current_url.includes('datefrom=') && current_url.includes('dateto=')){ //自選時段
        dateOptions[3].selected = true
        document.getElementsByTagName('select')[0].classList.add('selectChange')
        document.querySelector('.choosePeriod').style.display = 'flex'

        let arr = current_url.split('&')
        for(let i = 0; i < arr.length; i++){
            if (arr[i].includes('datefrom=')){
                document.querySelector('.choosePeriod button span').innerHTML = `${arr[i].split('=')[1]}~ ${ arr[i+1].split('=')[1]}`
            }
        }
    }
    else if(! current_url.includes('datefrom=') && ! current_url.includes('dateto=')){ //沒有選時間
        dateOptions[0].selected = true
    }

    //重整頁面後，篩選器的顯示(類別)
    let cateOptions= document.getElementsByTagName('select')[1].options
    let arr = current_url.split('&')
    for (let c = 0; c < arr.length; c++){
        if (arr[c].includes('category=')){
            let cateName = decodeURI(arr[c].replace('category=',''))
            for (let d = 0; d < cateOptions.length; d++){
                if (cateName === cateOptions[d].text){
                    cateOptions[parseInt(cateOptions[d].value)+1].selected = true
                    document.getElementsByTagName('select')[1].classList.add('selectChange')
                }
            }
        }
    }




    // filter choose time
    for (let i = 0; i < document.querySelectorAll('#selectdate option').length; i++){
        let option = document.querySelectorAll('#selectdate option')[i]
        option.addEventListener('click',function(){
    
            if (option.value === ''){ //任何時段
                document.getElementById('selectdate').classList.remove('selectChange')
                periodButNone()
                if (current_url.includes('datefrom=')){
                    let arr = current_url.split('&')
                    for(let i = 0; i < arr.length; i++){
                        if (arr[i].includes('datefrom=')){
                            //去掉URL頁碼
                            let newUrl;
                            newUrl = (arr.slice(0, i).concat(arr.slice(i+2,))).join('&')
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
            }
    
            else if (option.value === '0'){//今天
                document.getElementById('selectdate').className = 'selectChange'
                periodButNone()
                if (current_url.includes('datefrom=')){
                    let arr = current_url.split('&')
                    for(let i = 0; i < arr.length; i++){
                        if (arr[i].includes('datefrom=')){
                            let time = [`datefrom=${today_tomorrow()[0]}`,`dateto=${today_tomorrow()[0]}`]
                            //去掉URL頁碼
                            let newUrl;
                            newUrl = (arr.slice(0, i).concat(time).concat(arr.slice(i+2,))).join('&')
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
                else{
                        //去掉URL頁碼
                        let newUrl;
                        newUrl = current_url + `&datefrom=${today_tomorrow()[0]}&dateto=${today_tomorrow()[0]}`
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
    
            else if (option.value === '1'){ //明天
                document.getElementById('selectdate').className = 'selectChange'
                periodButNone()
                if (current_url.includes('datefrom=')){
                    let arr = current_url.split('&')
                    for(let i = 0; i < arr.length; i++){
                        if (arr[i].includes('datefrom=')){
                            let time = [`datefrom=${today_tomorrow()[1]}`,`dateto=${today_tomorrow()[1]}`]
                            //去掉URL頁碼
                            let newUrl;
                            newUrl = (arr.slice(0, i).concat(time).concat(arr.slice(i+2,))).join('&')
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
                else{
                        //去掉URL頁碼
                        let newUrl;
                        newUrl = current_url + `&datefrom=${today_tomorrow()[1]}&dateto=${today_tomorrow()[1]}`
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
    
            else if (option.value === '2'){ //自選時段
                document.getElementById('selectdate').className = 'selectChange'
                document.querySelector('.choosePeriod').style.display = 'flex'
                document.querySelector('.calender').style.display = 'block'
                addHas_calender()
            }
        })
    }
    

    // filter choose category
    for (let i = 0; i < document.querySelectorAll('#selectcategory option').length; i++){
        let option = document.querySelectorAll('#selectcategory option')[i]
        option.addEventListener('click',function(){

            console.log(this.text)
    
            if (option.value === ''){ //任何類別
                document.getElementById('selectcategory').classList.remove('selectChange')
                if (current_url.includes('category=')){
                    let arr = current_url.split('&')
                    for(let i = 0; i < arr.length; i++){
                        if (arr[i].includes('category=')){

                            //去掉URL頁碼
                            let newUrl;
                            newUrl = (arr.slice(0, i).concat(arr.slice(i+1,))).join('&')
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
            }
    
            else { // 其他類別
                document.getElementById('selectcategory').className = 'selectChange'
                if (current_url.includes('category=')){
                    let arr = current_url.split('&')
                    for(let i = 0; i < arr.length; i++){
                        if (arr[i].includes('category=')){

                            //去掉URL頁碼
                            let newUrl;
                            newUrl = (arr.slice(0, i).concat([`category=${this.text}`]).concat(arr.slice(i+1,))).join('&')
                            console.log(newUrl,'*')
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
                else{
                    //去掉URL頁碼
                    let newUrl;
                    newUrl = current_url + `&category=${this.text}`
                    console.log(newUrl,')')
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
        document.querySelectorAll('.fav img')[i].addEventListener('click',function(e){
            e.stopPropagation()
            let src = document.querySelectorAll('.fav img')[i].src
            if (src.includes('favorite1.png')){
                document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite2.png'
            }
            else if (src.includes('favorite2.png')){
                document.querySelectorAll('.fav img')[i].src = 'https://d3i2i3wop7mzlm.cloudfront.net/meetgather/favorite1.png'
            }
        },true)
    }

    //超連結到各頁面
    for (let i=0; i < document.querySelectorAll('.event').length; i++){
        document.querySelectorAll('.event')[i].addEventListener('click',function(e){
            e.stopPropagation()
            window.location.href = document.querySelectorAll('.event')[i].dataset.id
        })
    }

    if (document.querySelector('.page') !== null){
        //下一頁
        document.querySelector('.page div .next').addEventListener('click', ()=>{
            let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
            let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
            if (curentPage < totalPage){
                let href = current_url
                
                if (href.includes('page=')){
                    let arr = href.split('&')
                    for (let a =0; a < arr.length; a++){
                        if (arr[a].includes('page=')){
                            window.location.href = (arr.slice(0,a).concat([`page=${curentPage+1}`]).concat(arr.slice(a+1,))).join('&')
                        }
                    }
                }


                else{
                    window.location.href  = href+`&page=${curentPage + 1}`
                }
            }   
        })

        //上一頁
        document.querySelector('.page div .former').addEventListener('click', ()=>{
            let curentPage = parseInt(document.querySelector('.curentPage').innerHTML)
            let totalPage = parseInt(document.querySelector('.totalPage').innerHTML)
            if (curentPage > 1){
                let href = current_url
                if (href.includes('page=')){
                    let arr = href.split('&')
                    for (let a =0; a < arr.length; a++){
                        if (arr[a].includes('page=')){
                            window.location.href = (arr.slice(0,a).concat([`page=${curentPage-1}`]).concat(arr.slice(a+1,))).join('&')
                        }
                    }
                }
            

                else{
                    window.location.href  = href+`&page=${curentPage - 1}`
                }
            }
        })
        
}
}