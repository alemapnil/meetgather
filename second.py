from flask import *
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    JWTManager,
)
from models import db
from datetime import datetime, timezone, timedelta
import traceback
import re
import requests
import os

api = Blueprint("api", __name__)


def utcNowTime():  # UTC現在時刻
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    return dt1.strftime("%Y-%m-%d %H:%M:%S")


def IDTime():
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    dt2 = dt1.astimezone(timezone(timedelta(hours=8)))  # 轉換時區 -> 東八區
    return dt2.strftime("%Y%m%d%H%M_%S%f_")


def localToUTC(t, tz):  # 原時區改為UTC
    browser = datetime.strptime(
        t + f"{tz}", "%Y-%m-%d %H:%M%z")  # 將時間字串設為瀏覽器時區時間
    utc = browser.astimezone(timezone(timedelta(hours=0)))  # 將瀏覽器時區時間改為UTC
    return utc.strftime("%Y-%m-%d %H:%M")


cate_list = [
    "商業投資",
    "影音藝術",
    "遊戲",
    "運動健身",
    "美容時尚",
    "外語",
    "體驗學習",
    "命理心靈",
    "美食美酒",
    "科技",
    "唱歌派對",
    "戶外旅遊",
    "社交",
    "其他",
]
spots = [
    "線上",
    "基隆市",
    "臺北市",
    "新北市",
    "桃園市",
    "新竹市",
    "新竹縣",
    "苗栗縣",
    "臺中市",
    "彰化縣",
    "南投縣",
    "雲林縣",
    "嘉義市",
    "嘉義縣",
    "臺南市",
    "高雄市",
    "屏東縣",
    "宜蘭縣",
    "花蓮縣",
    "臺東縣",
    "澎湖縣",
    "金門縣",
    "連江縣",
]


@api.route("/api/user", methods=["GET"])
@jwt_required()
def user_get():
    if request.method == "GET":
        decrypt = get_jwt_identity()
        data = {"ok": True, "email": decrypt["email"]}
        n = db.Notify(decrypt["email"])
        tm = utcNowTime()
        data["anchortm"] = tm
        user_get_back = n.notRead(tm)
        data["member_id"] = user_get_back["member_id"]
        data["notRead"] = user_get_back["notRead"]
        data["name"], data["picture"] = user_get_back["name"], user_get_back["picture"]
        return jsonify(data)


@api.route("/api/user", methods=["DELETE"])
@jwt_required()
def user_delete():
    resp = make_response({"ok": True})
    resp.delete_cookie("access_token")
    return resp


@api.route("/api/user", methods=["POST"])
@jwt_required()
def user_post():
    decrypt = get_jwt_identity()
    anchortm, page = request.get_json()["anchortm"], request.get_json()["page"]
    n = db.Notify(decrypt["email"])
    data = n.notice(anchortm, page)
    return jsonify(data)


@api.route("/api/user", methods=["PATCH"])
@jwt_required()
def user_patch():
    decrypt = get_jwt_identity()
    anchortm = request.get_json()["anchortm"]
    n = db.Notify(decrypt["email"])
    data = n.read(anchortm)
    return jsonify(data)


@api.route("/api/create", methods=["POST"])
@jwt_required()
def create_post():
    data = {"error": True}
    try:
        acti_pho, acti_name = (
            request.files["acti_pho"],
            request.form["acti_name"].strip().capitalize(),
        )
        acti_story, acti_cate = (
            request.form["acti_story"].strip().capitalize(),
            request.form["acti_cate"],
        )
        acti_num, acti_city = request.form["acti_num"], request.form["acti_city"]
        acti_tm = localToUTC(request.form["acti_tm"], "+0800")
        acti_add, acti_lat, acti_lng = None, None, None
        if acti_city == "0":
            pass
        else:
            acti_add, acti_lat, acti_lng = (
                request.form["acti_add"].strip(),
                request.form["acti_lat"],
                request.form["acti_lng"],
            )

            try:
                float(acti_lat)
                float(acti_lng)
            except:
                data["message"] = "經緯度不符"
                return jsonify(data)

        try:
            acti_num = int(acti_num)
        except:
            data["message"] = "人數不符"
            return jsonify(data)

        print(acti_pho, acti_name, acti_story,
              acti_cate, acti_num, acti_city, acti_tm)
        print("------")
        print(acti_add, acti_lat, acti_lng)
        print("------------------------")

        if "image/" not in acti_pho.content_type:
            data["message"] = "照片不符規格"
            return jsonify(data)

        if re.compile("[\S]").findall(acti_name) == [] or len(acti_name) >= 100:
            data["message"] = "標題為空或過長"
            return jsonify(data)

        if re.compile("[\S]").findall(acti_story) == []:
            data["message"] = "描述為空"
            return jsonify(data)

        if int(acti_cate) < 0 or int(acti_cate) > 13:
            data["message"] = "類別不符"
            return jsonify(data)

        if acti_num <= 1 or acti_num > 999999999:
            data["message"] = "人數過少或過多"
            return jsonify(data)

        if int(acti_city) < 0 or int(acti_city) > 22:
            data["message"] = "地點不符"
            return jsonify(data)

        if datetime.strptime(acti_tm, "%Y-%m-%d %H:%M") <= datetime.strptime(
            utcNowTime(), "%Y-%m-%d %H:%M:%S"
        ):
            data["message"] = "活動時間已過期"
            return jsonify(data)

        decrypt = get_jwt_identity()
        activity = db.Activity(
            IDTime(),
            decrypt["email"],
            acti_name,
            acti_story,
            int(acti_cate),
            acti_num,
            int(acti_city),
            acti_add,
            acti_lat,
            acti_lng,
            acti_tm,
            utcNowTime(),
            utcNowTime(),
            acti_pho,
        )
        result = activity.create()
        return jsonify(result)

    except:
        print(traceback.format_exc())
        data["message"] = "輸入的值有誤"
        return jsonify(data)


@api.route("/api/create", methods=["DELETE"])
@jwt_required()
def create_delete():
    decrypt = get_jwt_identity()
    event_id, language = request.get_json()["id"], request.get_json()[
        "language"]
    activity = db.Activity(
        event_id,
        decrypt["email"],
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    if language[0] is True:
        result = activity.delete("zh")
        return jsonify(result)
    elif language[1] is True:
        result = activity.delete("en")
        return jsonify(result)


@api.route("/api/edit", methods=["POST"])
@jwt_required()
def edit_post():
    data = {"error": True}
    try:
        if len(request.files) == 0:
            acti_pho = None
        else:
            acti_pho = request.files["acti_pho"]
            print()

        acti_id, acti_name = request.form["acti_id"], request.form["acti_name"].strip(
        ).capitalize()
        acti_story, acti_cate = (
            request.form["acti_story"].strip().capitalize(),
            request.form["acti_cate"],
        )
        acti_num, acti_city = request.form["acti_num"], request.form["acti_city"]
        acti_tm = localToUTC(request.form["acti_tm"], "+0800")
        acti_add, acti_lat, acti_lng = None, None, None

        print(acti_num, 'acti_num', type(acti_num))
        if acti_city == "0":
            pass
        else:
            acti_add, acti_lat, acti_lng = (
                request.form["acti_add"].strip(),
                request.form["acti_lat"],
                request.form["acti_lng"],
            )
            try:
                float(acti_lat)
                float(acti_lng)
            except:
                data["message"] = "經緯度不符"
                return jsonify(data)

        try:
            acti_num = int(acti_num)
        except:
            data["message"] = "人數不符"
            return jsonify(data)

        print(acti_pho, acti_name, acti_story,
              acti_cate, acti_num, acti_city, acti_tm)
        print("------")
        print(acti_add, acti_lat, acti_lng)
        print(acti_pho, type(acti_pho))

        if acti_pho is not None and acti_pho.content_type not in [
            "image/png",
            "image/jpeg",
                "image/gif"]:
            data["message"] = "照片不符規格"
            return jsonify(data)

        if re.compile("[\S]").findall(acti_name) == []:
            data["message"] = "標題為空"
            return jsonify(data)

        if re.compile("[\S]").findall(acti_story) == []:
            data["message"] = "描述為空"
            return jsonify(data)

        if int(acti_cate) < 0 or int(acti_cate) > 13:
            data["message"] = "類別不符"
            return jsonify(data)

        if acti_num <= 1 or acti_num > 999999999:
            data["message"] = "人數過少或過多"
            return jsonify(data)

        if int(acti_city) < 0 or int(acti_city) > 22:
            data["message"] = "地點不符"
            return jsonify(data)

        if datetime.strptime(acti_tm, "%Y-%m-%d %H:%M") <= datetime.strptime(
            utcNowTime(), "%Y-%m-%d %H:%M:%S"
        ):
            data["message"] = "活動時間已過期"
            return jsonify(data)

        decrypt = get_jwt_identity()
        activity = db.Activity(
            acti_id,
            decrypt["email"],
            acti_name,
            acti_story,
            int(acti_cate),
            acti_num,
            int(acti_city),
            acti_add,
            acti_lat,
            acti_lng,
            acti_tm,
            "createtime",
            utcNowTime(),
            acti_pho,
        )
        result = activity.edit()
        return jsonify(result)

    except:
        print(traceback.format_exc())
        data["message"] = "輸入的值有誤"
        return jsonify(data)


@api.route("/api/email", methods=["POST"])
@jwt_required()
def email_post():
    url, inform, id, language = (
        request.get_json()["url"],
        request.get_json()["inform"],
        request.get_json()["id"],
        request.get_json()["language"],
    )
    decrypt = get_jwt_identity()
    n = db.Notify(decrypt["email"])

    if language[0] is True:
        result = n.email_inform(url, inform, id, "zh")
        return jsonify(result)

    elif language[1] is True:
        result = n.email_inform(url, inform, id, "en")
        return jsonify(result)


# 後端取得該活動的所有資料，標題、時間、地點、主辦等
@api.route("/api/event/<string:id>", methods=["GET"])
def event(id):
    e = db.Event(id)
    result = e.content()
    return jsonify(result)


@api.route("/api/allJoinNum/<string:id>", methods=["GET"])  # 編輯活動時獲取目前參與人數
def allJoinNum(id):
    activity = id
    e = db.Event(activity)
    result = e.allJoinNum()
    return jsonify(result)


@api.route("/api/namelist/<string:id>", methods=["POST"])  # 活動頁面的參與者名單
def namelist(id):
    activity = id
    num = int(request.get_json()["num"])
    e = db.Event(activity)
    result = e.namelist(num)
    return jsonify(result)


@api.route("/api/attend/<string:id>", methods=["GET"])
@jwt_required(optional=True)
def attendGet(id):
    activity = id
    decrypt = get_jwt_identity()
    if decrypt is None:
        e = db.Event(activity)
        result = e.mystatus_notLogin(utcNowTime())
        return jsonify(result)

    else:
        e = db.Event(activity)
        result = e.mystatus_Login(decrypt["email"], utcNowTime())
        return jsonify(result)


@api.route("/api/attend", methods=["POST"])
@jwt_required()
def attendPost():
    activity, attendee = request.get_json()["activity"], request.get_json()[
        "attendee"]
    e = db.Event(activity)
    result = e.attend(attendee, utcNowTime())
    return jsonify(result)


@api.route("/api/attend", methods=["DELETE"])
@jwt_required()
def attendDelete():
    activity, attendee = request.get_json()["activity"], request.get_json()[
        "attendee"]
    e = db.Event(activity)
    result = e.not_going(attendee)
    return jsonify(result)


@api.route("/api/board", methods=["POST"])
@jwt_required()
def boardPost():
    activity, message = request.get_json()["activity"], request.get_json()[
        "message"
    ].strip(" ")
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardPost(decrypt["email"], message, utcNowTime())
    return jsonify(result)


@api.route("/api/reply", methods=["POST"])
@jwt_required()
def replyPost():
    activity, message, board_id = (
        request.get_json()["activity"],
        request.get_json()["message"].strip(" "),
        int(request.get_json()["board_id"]),
    )
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyPost(decrypt["email"], message, utcNowTime(), board_id)
    return jsonify(result)


@api.route("/api/board", methods=["DELETE"])
@jwt_required()
def boardDelete():
    activity, board_id = request.get_json()["activity"], request.get_json()[
        "board_id"]
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardDelete(decrypt["email"], board_id)
    return jsonify(result)


@api.route("/api/reply", methods=["DELETE"])
@jwt_required()
def replyDelete():
    activity, reply_id = request.get_json()["activity"], request.get_json()[
        "reply_id"]
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyDelete(decrypt["email"], reply_id)
    return jsonify(result)


@api.route("/api/board", methods=["PATCH"])
@jwt_required()
def boardPatch():
    activity, board_id = request.get_json()["activity"], request.get_json()[
        "board_id"]
    message = request.get_json()["message"].strip(" ")
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.boardPatch(decrypt["email"], board_id, message)
    return jsonify(result)


@api.route("/api/reply", methods=["PATCH"])
@jwt_required()
def replyPatch():
    activity, reply_id = request.get_json()["activity"], request.get_json()[
        "reply_id"]
    message = request.get_json()["message"].strip(" ")
    decrypt = get_jwt_identity()
    e = db.Event(activity)
    result = e.replyPatch(decrypt["email"], reply_id, message)
    return jsonify(result)


@api.route("/api/board/<string:id_page>", methods=["GET"])
@jwt_required(optional=True)
def boardGet(id_page):
    page = int(id_page.split("_")[-1])
    activity = "_".join(id_page.split("_")[:-1])

    anchortm = request.cookies.get("boardfrom")
    print("boardfrom", anchortm)

    e = db.Event(activity)
    decrypt = get_jwt_identity()
    if decrypt is None:
        result = e.boardGet(page, None, anchortm)
    else:
        result = e.boardGet(page, decrypt["email"], anchortm)
    return jsonify(result)


@api.route("/api/message/", methods=["GET"])
@jwt_required()
def message():
    decrypt = get_jwt_identity()
    boardid, replyid = request.args.get("boardid", None), request.args.get(
        "replyid", None
    )
    if boardid is not None and replyid is not None:
        return "/api/message搜尋有誤"

    if boardid is not None:
        n = db.Notify(decrypt["email"])
        result = n.msg_boardid(boardid)
        return jsonify(result)
    if replyid is not None:
        n = db.Notify(decrypt["email"])
        result = n.msg_replyid(replyid)
        return jsonify(result)


@api.route("/api/profile", methods=["GET"])
@jwt_required()
def profile_get():
    decrypt = get_jwt_identity()
    try:
        query_member_id = int(request.args.get("member", 0))
    except:
        return jsonify({"error": True})
    else:
        member = db.Members(
            decrypt["email"], decrypt["name"], decrypt["picture"]
        )  # 實例化
        result = member.profile(query_member_id)
        return jsonify(result)


@api.route("/api/profile", methods=["POST"])
@jwt_required()
def profile_post():
    decrypt = get_jwt_identity()
    if len(request.files) == 0:
        newphoto = None
    else:
        newphoto = request.files["newphoto"]

    newname, newaboutme = (
        request.form["newname"].strip(),
        request.form["newaboutme"].strip(),
    )
    # 偵測儲存的圖片是google肖像抑或上次上傳的圖片
    background = request.form["background"].strip()
    if newname == "null":
        newname = None
    if newaboutme == "null":
        newaboutme = None

    member = db.Members(
        decrypt["email"], decrypt["name"], decrypt["picture"])  # 實例化
    result = member.edit(newname, newaboutme, newphoto, background)
    return jsonify(result)


@api.route("/api/hostdisplay", methods=["GET"])
@jwt_required()
def hostdisplay():
    member_id = int(request.args.get("member", None))
    page = int(request.args.get("page", 0))
    anchortm = request.args.get("anchortm", None)
    f = db.Find(anchortm, page, "hostdisplay")  # 實例化
    result = f.host_record(member_id)
    return jsonify(result)


@api.route("/api/joindisplay", methods=["GET"])
@jwt_required()
def joindisplay():
    member_id = int(request.args.get("member", None))
    page = int(request.args.get("page", 0))
    anchortm = request.args.get("anchortm", None)
    f = db.Find(anchortm, page, "joindisplay")  # 實例化
    result = f.join_record(member_id)
    return jsonify(result)


# Facebook scrape api
@api.route("/api/scrape", methods=["POST"])
def scrape():
    url = request.get_json()["url"]
    r = requests.post(
        "https://graph.facebook.com/v15.0",
        data={"scrape": True, "id": url,
              "access_token": os.getenv("FACEBOOKTOKEN")},
    )
    print(r, r.status_code)

    if r.status_code == 200:
        return {"ok": True}
    else:
        return {"error": True}
