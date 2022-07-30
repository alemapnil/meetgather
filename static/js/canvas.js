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