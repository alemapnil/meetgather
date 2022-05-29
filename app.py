import os
from flask import *
from flask_jwt_extended import (create_access_token, get_jwt_identity, jwt_required, JWTManager)
from second import api
from models import db

from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

app = Flask (__name__) 

from authlib.integrations.flask_client import OAuth
oauth = OAuth(app)
google = oauth.register(
    name='google',client_id=os.getenv("GOOGLE_OAUTH_ID"),client_secret=os.getenv("GOOGLE_OAUTH_PASSWORD"),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile','prompt': 'select_account'}    
)

app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['JSON_SORT_KEYS'] = False
app.secret_key = os.urandom(24)
app.config["JWT_SECRET_KEY"] = os.getenv('TOKENKEY')
app.register_blueprint(api, url_prefix='')

jwt = JWTManager(app)
@jwt.expired_token_loader
def my_expired_token_callback(jwt_header, jwt_payload):
    return jsonify(invalidToken = True), 200

@jwt.invalid_token_loader
def my_invalid_token_callback(invalid_token):
	return jsonify(invalidToken = True), 200


# Pages
@app.route("/")
def index():
	return render_template("index.html")
@app.route('/find')
def find():
	return render_template("find.html")
@app.route('/create')
def create():
	return render_template("create.html", api=os.getenv('GOOGLE_MAP_API'))


## Google oauth
@app.route('/login')
def login():
    google = oauth.create_client('google')
    redirect_uri = url_for('authorize', _external=True)
    print(redirect_uri,'**')
    return google.authorize_redirect(redirect_uri)

@app.route('/authorize')
def authorize():
    google = oauth.create_client('google')
    token = google.authorize_access_token()
    resp = google.get('userinfo')
    user_info = resp.json()

    for u in user_info:
        print(u,":",user_info[u])
    #do something with the token and profile

    member = db.Members(user_info['email'], user_info['name'], user_info['picture']) #實例化
    data = member.login()
    if 'ok' in data:
        access_token = create_access_token(
            identity = {"email": user_info['email'],
                        "name": user_info['name'],
                        "picture": user_info['picture']
                        },expires_delta = timedelta(seconds = 7200))

        currentpage = request.cookies.get('currentpage')
        resp = make_response(redirect(currentpage))
        resp.set_cookie('access_token', access_token)
        return resp
    else:
        return 'db.Members.login error'


app.run(host='0.0.0.0',port=2000)

db.pool._remove_connections()