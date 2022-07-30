let map;
var acti_add, acti_lat, acti_lng;



function initMap(){    
    var location ={
        lat: 25.0484137,
        lng: 121.5110256
    }
    var options={
        center: location,
        zoom: 12
    }

    if (navigator.geolocation){
        console.log('I am here now.')

        navigator.geolocation.getCurrentPosition((loc)=>{
            location.lat = loc.coords.latitude;
            location.lng = loc.coords.longitude;
            map = new google.maps.Map(document.getElementById('map'),options);
        },
        (err) =>{
            console.log("Don't show my position.")
            map = new google.maps.Map(document.getElementById('map'),options);
        }
        )
    }
    else{
        console.log("Don't know my position.")
        map = new google.maps.Map(document.getElementById('map'),options);
    }

    autocomplete = new google.maps.places.Autocomplete(document.getElementById('location'),
    {
        componentRestrictions: {'country':['tw']},
        fields: ['geometry','name'],
        types: ["establishment","geocode"]
    });

    autocomplete.addListener("place_changed",() => {
        const place = autocomplete.getPlace();
        let latitude = place.geometry.location.lat(), longitude = place.geometry.location.lng()
        location.lat = latitude, location.lng = longitude

        acti_add = document.getElementById('location').value
        acti_lat = latitude, acti_lng = longitude

        map = new google.maps.Map(document.getElementById('map'),options)
        new google.maps.Marker({
            position: place.geometry.location,
            title: place.name,
            map: map
        })
        document.querySelector('.acti_add .enter .notice').innerHTML = '' 

    });


    //打字時地址歸零
    document.getElementById('location').addEventListener('input',function(){
        acti_add = undefined
        map = new google.maps.Map(document.getElementById('map'),options)
    })

}
