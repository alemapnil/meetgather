from flask import *
from flask_jwt_extended import (create_access_token, get_jwt_identity, jwt_required, JWTManager )
from models import db
from datetime import datetime,timezone,timedelta
import traceback,re

api = Blueprint('api',__name__)



def nowTime():
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    dt2 = dt1.astimezone(timezone(timedelta(hours=8))) # 轉換時區 -> 東八區
    return dt2.strftime("%Y-%m-%d %H:%M:%S")

def IDTime():
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    dt2 = dt1.astimezone(timezone(timedelta(hours=8))) # 轉換時區 -> 東八區
    return dt2.strftime("%Y%m%d%H%M_%S%f_")

cate_list = ['商業投資', '影音藝術', '遊戲', '運動健身', '美容時尚', '外語', '體驗學習', '命理心靈', '美食美酒', '科技', '唱歌派對', '戶外旅遊', '社交', '其他']
spots = ['線上', '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣']

@api.route('/api/user', methods = ['GET'])
@jwt_required()
def user_get():
    if request.method =='GET':
        decrypt = get_jwt_identity()
        data = {"ok": True,"email":decrypt['email'], 
                            "name":decrypt['name'],
                            "picture":decrypt['picture']}
        return jsonify(data)

@api.route('/api/user', methods = ["DELETE"])
def user_delete():
    resp = make_response({"ok":True})
    resp.delete_cookie('access_token')
    return resp


@api.route('/api/send', methods = ['POST'])
@jwt_required()
def send():
    data = {'error':True}
    try:
        acti_pho, acti_name = request.files['acti_pho'], request.form['acti_name'].strip(),
        acti_story, acti_cate = request.form['acti_story'].strip(), request.form['acti_cate']
        acti_num, acti_city = request.form['acti_num'], request.form['acti_city']
        acti_tm = ' '.join(request.form['acti_tm'].split(' ')[:2])
        acti_add, acti_lat, acti_lng = None, None, None
        if acti_city == 'online' or acti_city == '線上':
            pass
        else:
            acti_add, acti_lat, acti_lng = request.form['acti_add'].strip(), request.form['acti_lat'], request.form['acti_lng']
            try:
                float(acti_lat)
                float(acti_lng) 
            except:
                data['message'] = '經緯度不符'
                return jsonify(data)

        try:
            acti_num = int(acti_num)
        except:
            data['message'] = '人數不符'
            return jsonify(data)

        print(acti_pho, acti_name, acti_story, acti_cate, acti_num, acti_city,acti_tm)
        print('------')
        print(acti_add, acti_lat, acti_lng)
        print('------------------------')

        if 'image/' not in acti_pho.content_type:
            data['message'] = '照片不符規格'
            return jsonify(data)

        if re.compile('[\S]').findall(acti_name) == []:
            data['message'] = '標題為空'
            return jsonify(data)

        if re.compile('[\S]').findall(acti_story) == []:
            data['message'] = '描述為空'
            return jsonify(data)
        
        if acti_cate not in cate_list:
            data['message'] = '類別不符'
            return jsonify(data)

        if acti_num <= 1:
            data['message'] = '人數過少'
            return jsonify(data)

        if acti_city not in spots:
            data['message'] = '地點不符'
            return jsonify(data)

        if datetime.strptime(acti_tm, "%Y-%m-%d %H:%M") <= datetime.strptime(nowTime(), "%Y-%m-%d %H:%M:%S"):
            data['message'] = '活動時間已過期'
            return jsonify(data)

        if acti_city in spots[1:]:
            if re.compile('[\S]').findall(acti_add) == []:
                    data['message'] = '地址為空'
                    return jsonify(data)

        decrypt = get_jwt_identity()
        print(nowTime())
        activity = db.Activity(IDTime(), decrypt['email'],acti_name, acti_story, acti_cate, acti_num,
        acti_city, acti_add, acti_lat, acti_lng, acti_tm, nowTime(), nowTime(),acti_pho)
        result = activity.create()
        print(nowTime())
        return jsonify(result)

    except:
        print(traceback.format_exc())
        data['message'] ='輸入的值有誤'
        return jsonify(data)



@api.route("/api/event/<string:id>", methods = ['GET']) #後端取得該活動的所有資料，標題、時間、地點、主辦等
def event(id):
    e = db.Event(id)
    result = e.content()
    return jsonify(result)


@api.route("/api/attend/<string:id>", methods = ['GET'])
@jwt_required(optional=True)
def attendGet(id):
    activity = id
    decrypt = get_jwt_identity()
    if decrypt is None:
        e = db.Event(activity)
        result = e.mystatus_notLogin()
        return jsonify(result)

    else:
        e = db.Event(activity)
        result = e.mystatus_Login(decrypt['email'])
        return jsonify(result)


@api.route("/api/attend", methods = ['POST'])
@jwt_required()
def attendPost():
    activity, attendee = request.get_json()['activity'], request.get_json()['attendee']
    e = db.Event(activity)
    result =e.attend(attendee)
    return jsonify(result)


@api.route("/api/attend", methods = ['DELETE'])
@jwt_required()
def attendDelete():
    activity, attendee = request.get_json()['activity'], request.get_json()['attendee']
    e = db.Event(activity)
    result = e.not_going(attendee)
    return jsonify(result)


@api.route('/api/allJoinNum/<string:id>', methods = ['GET'])
def allJoinNum(id):
    activity = id
    e = db.Event(activity)
    result = e.allJoinNum()
    return jsonify(result)


@api.route('/api/board', methods = ['POST'])
@jwt_required()
def boardPost():
    activity, message = request.get_json()['activity'], request.get_json()['message'].strip(' ')
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardPost(decrypt['email'],message, nowTime())
    return jsonify(result)

@api.route('/api/reply', methods = ['POST'])
@jwt_required()
def replyPost():
    activity, message, board_id = request.get_json()['activity'], request.get_json()['message'].strip(' '), int(request.get_json()['board_id'])
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyPost(decrypt['email'],message, nowTime(), board_id)
    return jsonify(result)

@api.route('/api/board', methods = ['DELETE'])
@jwt_required()
def boardDelete():
    activity, board_id = request.get_json()['activity'], request.get_json()['board_id']
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardDelete(decrypt['email'],board_id)
    return jsonify(result)


@api.route('/api/reply', methods = ['DELETE'])
@jwt_required()
def replyDelete():
    activity, reply_id = request.get_json()['activity'], request.get_json()['reply_id']
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyDelete(decrypt['email'],reply_id)
    return jsonify(result)

@api.route('/api/board', methods = ['PATCH'])
@jwt_required()
def boardPatch():
    activity, board_id = request.get_json()['activity'], request.get_json()['board_id']
    message = request.get_json()['message'].strip(' ')
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardPatch(decrypt['email'], board_id, message)
    return jsonify(result)


@api.route('/api/reply', methods = ['PATCH'])
@jwt_required()
def replyPatch():
    activity, reply_id = request.get_json()['activity'], request.get_json()['reply_id']
    message = request.get_json()['message'].strip(' ')
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyPatch(decrypt['email'], reply_id, message)
    return jsonify(result)


@api.route('/api/board/<string:id_page>', methods = ['GET'])
@jwt_required(optional=True)
def boardGet(id_page):
    page = int(id_page.split('_')[-1])
    activity = '_'.join(id_page.split('_')[:-1])
    print(activity, page)
    e = db.Event(activity)

    decrypt = get_jwt_identity()
    if decrypt is None:
        result = e.boardGet(page,None)
    else:
        result = e.boardGet(page,decrypt['email'])
    return jsonify(result)
