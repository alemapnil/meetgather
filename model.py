import os, boto3, traceback,uuid
import mysql.connector.pooling
from dotenv import load_dotenv
load_dotenv()


dbconfig = {
"host":'dbfromaws.ckbctsif2sjr.us-east-1.rds.amazonaws.com',
"port":'3306',
"database":'meetgather_db',
"user": os.getenv('RDS_USER'),
"password": os.getenv('RDS_PASSWORD'),
}
pool = mysql.connector.pooling.MySQLConnectionPool(pool_name = "mypool", pool_size = 5, **dbconfig) #create a pool which connect with DB



ALLOWED_EXTENSIONS = {'png','jpg', 'jpeg', 'gif','tif'}

s3 = boto3.client('s3', aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
                      aws_secret_access_key = os.getenv('AWS_SECRET_KEY'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file(img_url):
	global data
	try:
		CN1 = pool.get_connection() #get a connection with pool.  
		print(CN1.connection_id,'RDS ID create')   
		cursor = CN1.cursor()

		insert = """ insert into `test` (`img_url`) values(%s);"""
		cursor.execute(insert, (img_url,))
	except Exception as e:
		data = {"error": True,"message": "資料庫內部錯誤"}
		print('資料庫內部錯誤',type(e),e)
		CN1.rollback()
	else:
		data = {"ok": True, 'img_url': img_url}
		print('upload_file commit')
		CN1.commit()

	finally:
		print(CN1.connection_id, 'upload_file close...', CN1.is_connected())
		cursor.close()
		CN1.close()