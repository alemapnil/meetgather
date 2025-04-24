# 後臺時區全是格林威治標準時間
from authlib.integrations.flask_client import OAuth
import os
import time
from flask import *
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    JWTManager,
)
from second import api
from models import db
from lang import en, zh
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_OAUTH_ID"),
    client_secret=os.getenv("GOOGLE_OAUTH_PASSWORD"),
    access_token_url="https://accounts.google.com/o/oauth2/token",
    access_token_params=None,
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params=None,
    api_base_url="https://www.googleapis.com/oauth2/v1/",
    client_kwargs={"scope": "openid email profile", "prompt": "select_account"},
)

app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["JSON_SORT_KEYS"] = False
app.secret_key = os.urandom(24)
app.config["JWT_SECRET_KEY"] = os.getenv("TOKENKEY")
app.config["JWT_TOKEN_LOCATION"] = ["headers", "query_string"]
app.register_blueprint(api, url_prefix="")

jwt = JWTManager(app)


@jwt.expired_token_loader
def my_expired_token_callback(jwt_header, jwt_payload):
    return jsonify(invalidToken=True), 200


@jwt.invalid_token_loader
def my_invalid_token_callback(invalid_token):
    return jsonify(invalidToken=True), 200


def utcNowTime():
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    return dt1.strftime("%Y-%m-%d %H:%M:%S")


def IDTime():
    dt1 = datetime.utcnow().replace(tzinfo=timezone.utc)
    dt2 = dt1.astimezone(timezone(timedelta(hours=8)))  # 轉換時區 -> 東八區
    return dt2.strftime("%Y%m%d%H%M_%S%f_")


# Pages
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/lang/en")
def langEn():
    return jsonify(en.arrLang)


@app.route("/lang/zh")
def langZh():
    return jsonify(zh.arrLang)


@app.route("/profile")
def profile():
    member = request.args.get("member", None)
    return render_template("profile.html", member=member)


@app.route("/find")
def find():
    page = int(request.args.get("page", 1))
    if page == 1:
        findfrom = utcNowTime()
    else:
        findfrom = request.cookies.get("findfrom")
        if findfrom is None:
            findfrom = utcNowTime()

    keyword, datefrom, dateto = (
        request.args.get("keyword", None),
        request.args.get("datefrom", None),
        request.args.get("dateto", None),
    )
    tzOffset = request.args.get("tzOffset", None)
    category, location, sortby = (
        request.args.get("category", None),
        request.args.get("location", None),
        request.args.get("sortby", None),
    )

    try:
        if keyword is not None:
            keyword = keyword.strip()
        if datefrom is not None:
            datetime.strptime(datefrom, "%Y-%m-%d")
        if dateto is not None:
            datetime.strptime(dateto, "%Y-%m-%d")
        if tzOffset is not None:
            datetime.strptime(datefrom + f" 00:00{tzOffset}", "%Y-%m-%d %H:%M%z")
        if category is not None:
            if 0 <= int(category) <= 13:
                pass
            else:
                raise BaseException
        if location is not None:
            if 0 <= int(location) <= 22:
                pass
            else:
                raise BaseException

        if sortby is not None:
            if 0 <= int(sortby) <= 1:
                pass
            else:
                raise BaseException
    except:
        return redirect(url_for("index"))
    else:
        f = db.Find(findfrom, page, "find")
        items = f.pick_orderbyTm(
            keyword, datefrom, dateto, tzOffset, category, location, sortby
        )
        date, people, totalpage = [], [], items["totalpage"]

        for item in items["result"]:
            date.append(item[10])
            if item[15] is None:  # 參加人數
                people.append(0)
            else:
                people.append(item[15])

        resp = make_response(
            render_template(
                "find.html",
                page=page,
                totalpage=totalpage,
                items=items,
                date=date,
                people=people,
                zip=zip,
            )
        )
        if page == 1 or request.cookies.get("findfrom") is None:
            resp.set_cookie("findfrom", findfrom)
        return resp


@app.route("/event/<id>")
def event(id):
    e = db.Event(id)
    result = e.content()
    if "ok" not in result:
        return redirect(url_for("index"))
    else:
        resp = make_response(
            render_template(
                "event.html",
                api=os.getenv("GOOGLE_MAP_API"),
                host=result["host"],
                activity=result["activity"],
                namelist_num=result["namelist_num"],
                base_url=request.base_url,
                url_root=request.url_root,
                imgType=result["activity"][13].split(".")[-1],
                c_now_attend_l=format(result["activity"][5], ","),
            )
        )
        resp.set_cookie("boardfrom", utcNowTime())
        return resp


@app.route("/create")
def create():
    return render_template("create.html", api=os.getenv("GOOGLE_MAP_API"))


@app.route("/evedit/<string:editID>")
def edit(editID):
    return render_template("edit.html", api=os.getenv("GOOGLE_MAP_API"))


# Google oauth
@app.route("/login")
def login():
    google = oauth.create_client("google")
    redirect_uri = url_for("authorize", _external=True)

    print("主機>>", request.headers["Host"])
    print("即將轉址>>", redirect_uri)
    if "localhost" in request.headers["Host"]:  # 若在筆電本機上跑
        redirect_uri = redirect_uri.replace("https", "http")
    else:
        redirect_uri = redirect_uri.replace("http", "https")
    print("此為google轉址URL>>", redirect_uri)
    currentpage = request.cookies.get("currentpage")
    print("此為Cookie登記的currentpage>>", currentpage)
    return google.authorize_redirect(redirect_uri)


@app.route("/authorize")
def authorize():
    print("進入/authorize")
    google = oauth.create_client("google")
    token = google.authorize_access_token()
    resp = google.get("userinfo")
    user_info = resp.json()

    for u in user_info:
        print(u, ":", user_info[u])
    # do something with the token and profile

    member = db.Members(
        user_info["email"], user_info["name"], user_info["picture"]
    )  # 實例化
    data = member.login()
    if "ok" in data:
        access_token = create_access_token(
            identity={
                "email": user_info["email"],
                "name": user_info["name"],
                "picture": user_info["picture"],
            },
            expires_delta=timedelta(seconds=10800),
        )

        currentpage = request.cookies.get("currentpage")
        resp = make_response(redirect(currentpage))
        resp.set_cookie("access_token", access_token)
        print("access_token >> ", access_token)
        print("Request is secure?", request.is_secure)
        return resp
    else:
        return "db.Members.login error"


# app.run(port=2000)

app.run(host="0.0.0.0", port=2000)

db.pool._remove_connections()
