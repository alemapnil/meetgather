const date = new Date();
let current_year = date.getFullYear(), current_mon = date.getMonth() , jump = 0
let calender_year = date.getFullYear()
let chooseWhen, completeTime


rederCalender()

function rederCalender(){
    date.setDate(1)  // 將日期設定為第一天，方便計算

    const prevlastday = new Date(date.getFullYear(),date.getMonth(),0).getDate()// 前月的最後一天
    const lastDay = new Date(date.getFullYear(),date.getMonth()+1,0).getDate() //本月的最後一天

    const firstDayIndex = date.getDay() //本月第一天是星期幾
    const lastDayIndex =  new Date(date.getFullYear(),date.getMonth()+1,0).getDay() // 本月最末天是星期幾

    const nextDays = 7- lastDayIndex - 1
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    //月曆上方顯示當前月份、年份
    document.querySelector('.date h1').innerHTML = months[date.getMonth()]
    document.querySelector('.date p').innerHTML = date.getFullYear()

    // 產生31天
    let days = "";

    for (let x = firstDayIndex; x > 0; x--){ //前一月天數
        days +=  `<div class="prev-date">${prevlastday -x +1}</div>`
    }

    for (let i = 1; i <= lastDay; i++){  //當月天數
        if(i === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()){
            days += `<div class="today">${i}</div>`
        }
        else{
            days += `<div>${i}</div>`
        }        

    } 

    for (let j = 1 ;j <= nextDays; j++){ //次月天數
        days += `<div class="next-date">${j}</div>`;
    }
    document.querySelector('.days').innerHTML = days; //將所有天數顯示在頁面上


    if (current_mon === date.getMonth() && current_year === date.getFullYear()){ //將當月過去日期變白，並將往前的箭頭消失
        for(let i = 0; i < document.querySelectorAll('.days div').length; i++){
            if (document.querySelectorAll('.days div')[i].className === 'today'){break}
            document.querySelectorAll('.days div')[i].className='past'
        }
        document.querySelector('.prev').style.visibility = 'hidden'
    }
    else{
        document.querySelector('.prev').style.visibility = 'visible'
    }

    let chooseMon = document.querySelector('.date h1').innerHTML, chooseYear = document.querySelector('.date p').innerHTML
    let chooseDate_list = document.querySelectorAll(".days div"); 

    let mark_i;

    for (let i = 0; i < chooseDate_list.length; i++) { //選擇日期:單天

        chooseDate_list[i].addEventListener('click',()=>{
            deleteTime()

            for (let i = 0; i < chooseDate_list.length; i++){ //全部移除先前的點擊日期  
                chooseDate_list[i].classList.remove('pick')

                if(chooseDate_list[i].classList.contains('notoday')){
                    chooseDate_list[i].classList.remove('notoday')
                    chooseDate_list[i].classList.add('today')
                }
            }

            if (chooseDate_list[i].classList.length === 0 ){ 
                
                var chooseDate = chooseDate_list[i].innerHTML
                chooseWhen= `${chooseYear}-${padZero(months.indexOf(chooseMon)+1)}-${padZero(chooseDate)}`
                
                document.querySelector('.when').innerHTML = chooseWhen
                document.querySelector('.when').style.color = 'black'

                chooseDate_list[i].classList.add('pick')
                mark_i = i
            }

            else if(chooseDate_list[i].classList.contains('today')){
                var chooseDate = chooseDate_list[i].innerHTML
                chooseWhen= `${chooseYear}-${padZero(months.indexOf(chooseMon)+1)}-${padZero(chooseDate)}`

                document.querySelector('.when').innerHTML = chooseWhen
                document.querySelector('.when').style.color = 'black'

                chooseDate_list[i].classList.remove('today')
                chooseDate_list[i].classList.add('pick','notoday')
                mark_i = i              
            }

            else{
                if (mark_i!==undefined){
                   chooseDate_list[mark_i].classList.add('pick') 
                }
            }




            document.querySelector('.time').addEventListener('change',function(){
                if (this.value ===''){
                    this.style.color = '#bebebe'
                }
                else{
                    this.style.color = 'black'
                    if (chooseWhen !== undefined){
                        completeTime = chooseWhen + ' ' + this.options[this.selectedIndex].text + ':00'
            
                        if ((new Date(completeTime).getTime() - new Date().getTime()) < 0 ){
                            document.querySelector('.acti_tm .enter .notice').innerHTML = '活動時間有誤'
                            completeTime = undefined
                        }
                        else{
                            document.querySelector('.acti_tm .enter .notice').innerHTML = ''
                        }
                    }
                }
            })
        })
    }
}


document.querySelector('.prev').addEventListener('click',()=>{
    date.setMonth(date.getMonth() - 1)
    rederCalender()
})

document.querySelector('.next').addEventListener('click',()=>{
    date.setMonth(date.getMonth()+1)
    rederCalender()
})


function padZero(num){
    let strnum = num.toString()
    if (strnum.length === 1){
        strnum ='0' + strnum
    }
    return strnum
}

function range(start, stop, step){
    if (typeof stop=='undefined'){
        // one param defined
        stop = start;
        start = 0;
    };
    if (typeof step=='undefined'){
        step = 1;
    };
    var result = [];
    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
        result.push(i);
    };
    result.push(stop);
    return result;
};



//活動時間
function deleteTime(){
    document.querySelector('.time').style.color = '#bebebe'
    document.querySelector('.time').value = '' //重新選日期，時間歸零
    completeTime = undefined
    document.querySelector('.acti_tm .enter .notice').innerHTML = ''
}
function createTime(){
    let arr_h = range(0,24), arr_m = ['00','15','30','45']
    count = 0
    for (let i = 0; i < arr_h.length; i++){
        for(let j = 0; j < arr_m.length; j++){
            let hm = padZero(arr_h[i]) + ':' + arr_m[j]

            let option = document.createElement('option')
            option.appendChild(document.createTextNode(hm + ' GMT+8'))
            option.value = count
            document.querySelector('.time').appendChild(option)
            count += 1

        }
    }
}
