from flask import *
from flask_jwt_extended import (create_access_token, get_jwt_identity, jwt_required, JWTManager )
from model import *


api = Blueprint('api',__name__)



@api.route('/api/user', methods = ['GET'])
@jwt_required()
def user_get():
    if request.method =='GET':
        try:
            decrypt = get_jwt_identity()
            data = {"ok": True,"email":decrypt['email'], 
                                "name":decrypt['name'],
                                "picture":decrypt['picture']}
        except:
            data = {"error": True,'message':'JWT解碼出錯'}

        return jsonify(data)

@jwt_required()
@api.route('/api/user', methods = ["DELETE"])
def user_delete():
    resp = make_response({"ok":True})
    resp.delete_cookie('access_token')
    return resp

@jwt_required()
@api.route('/api/send', methods = ['POST'])
def send():
    global data
    #測試上傳檔案正確與否
    try:
        file = request.files['file']
    except :
        print(traceback.format_exc())
        data = {"error": True,"message": "輸入的檔案錯誤"}
        return jsonify(data)
	#附檔名是否合格
    if allowed_file(file.filename):
        s3_object = 'meetgather/activity/' + uuid.uuid1().hex +'.' + file.filename.rsplit('.', 1)[1].lower()
        cdn_url = 'https://d3i2i3wop7mzlm.cloudfront.net/' + s3_object
        try:
            s3.upload_fileobj(file, 'bucketfromaws', s3_object)	
            upload_file(cdn_url)
            data = {"ok":True,'position':cdn_url}
        except: 
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
        return jsonify(data)

    else:
        data = {"error": True,"message": "非圖片檔"}
        return jsonify(data)