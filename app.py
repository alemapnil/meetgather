from flask import *
import os

app = Flask (__name__) 
app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['JSON_SORT_KEYS'] = False
app.secret_key = os.urandom(24)




# Pages
@app.route("/")
def index():
	return render_template("index.html")


@app.route('/find')
def find():
	return render_template("find.html")



app.run(host='0.0.0.0',port=2000)