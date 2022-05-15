window.onload=()=>{
    let Today=new Date();
    let year = Today.getFullYear();
    document.querySelector('.year').innerHTML=year
    document.querySelector('.year').style.color='white'
    document.getElementsByTagName('select')[0].value=''
    document.getElementById('keyword').value=''
}
