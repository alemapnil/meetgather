from flask import *
from flask_jwt_extended import (create_access_token, get_jwt_identity, jwt_required, JWTManager )


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


@api.route('/api/user', methods = ["DELETE"])
def user_delete():
    resp = make_response({"ok":True})
    resp.delete_cookie('access_token')
    return resp