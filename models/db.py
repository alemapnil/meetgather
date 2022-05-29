import os, boto3, traceback, uuid
import mysql.connector.pooling
from flask import *
from dotenv import load_dotenv
load_dotenv()


ALLOWED_EXTENSIONS = {'png','jpg', 'jpeg', 'gif','tif'}

s3 = boto3.client('s3', aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
                      aws_secret_access_key = os.getenv('AWS_SECRET_KEY'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_pic_s3(picname, blob):
    global cdn_url

    if allowed_file(picname):
        s3_object = 'meetgather/activity/' + uuid.uuid1().hex +'.' + picname.rsplit('.', 1)[1].lower()
        cdn_url = 'https://d3i2i3wop7mzlm.cloudfront.net/' + s3_object
        s3.upload_fileobj(blob, 'bucketfromaws', s3_object)	

        if 'Contents' in s3.list_objects_v2(Bucket = 'bucketfromaws', Prefix = s3_object):
            data = {"ok": True, 'message':s3_object}
        else:
            data = {"error": True, 'message':'伺服器上傳圖片失敗'}
        return data

    else:
        data = {"error": True,"message": "非圖片檔"}
        return data


def delete_pic_s3(s3_object):
	s3.delete_object(Bucket='bucketfromaws', Key=s3_object) #delete s3 photo command.



dbconfig = {
    "host":'dbfromaws.ckbctsif2sjr.us-east-1.rds.amazonaws.com',
    "port":'3306',
    "database":'meetgather_db',
    "user": os.getenv('RDS_USER'),
    "password": os.getenv('RDS_PASSWORD'),
}
pool = mysql.connector.pooling.MySQLConnectionPool(pool_name = "mypool", pool_size = 5, **dbconfig) #create a pool which connect with DB



class Members:
    def __init__(self,email, name, photo):
        self.email = email
        self.name = name
        self.photo = photo
    def login(self):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Members.login > pool create')   
            cursor = CN1.cursor()

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (self.email,))
            result = cursor.fetchone() #tuple or None
            if result is None: #沒註冊過
                command = "insert into `members` (`email`, `name`, `photo`) values(%s, %s, %s);"
                cursor.execute(command, (self.email, self.name,self.photo))
                crud += 1
            else:
                if result[2] != self.name:
                    command = """update `members` set `name` = %s where `email` = %s"""
                    cursor.execute(command, (self.name,self.email))
                    crud += 1
                elif result[3] != self.photo:
                    command = """update `members` set `photo` = %s where `email` = %s"""
                    cursor.execute(command, (self.photo,self.email))
                    crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Members.login > 發生錯誤')
            CN1.rollback()
        else:
            if crud > 0:
                print('Members.login > commit')
                CN1.commit()
            data = {"ok": True}
        finally:
            print(CN1.connection_id, 'Members.login > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data
    def id(self):
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Members.id > pool create')   
            cursor = CN1.cursor()
            command = """select `id` from `members` where `email` = %s """
            cursor.execute(command, (self.email,))
            result = cursor.fetchone() #tuple or None
            data ={'ok':True, 'message': result[0]}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Members.id > 發生錯誤')
        finally:
            print(CN1.connection_id, 'Members.id > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data
        


        
class Activity:
    def __init__(self, id, host, title, descp, cate, limit, attend, city, adr, lat, lng, st, ct, et, pic):
        self.id, self.host, self.title, self.descp= id, host, title, descp
        self.cate, self.limit, self.attend= cate, limit, attend
        self.city, self.adr, self.lat, self.lng = city, adr, lat, lng
        self.st, self.ct, self.et, self.pic = st, ct, et, pic
    def create(self):
        uploadResult = upload_pic_s3(self.pic.filename, self.pic)
        if 'ok' in uploadResult:
            pic_s3Object = uploadResult['message']
        else:
            return uploadResult

        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Activity.create > pool create')   
            cursor = CN1.cursor()
            command = "insert into `activity` values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
            insertValue = (self.id, self.host, self.title, self.descp, self.cate, self.limit, self.attend,\
                self.city, self.adr, self.lat, self.lng, self.st, self.ct, self.et, cdn_url)
            cursor.execute(command, insertValue)
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Activity.create > 發生錯誤')
            CN1.rollback()
            delete_pic_s3(pic_s3Object) 
        else:
            print('Activity.create > commit')
            CN1.commit()
            data = {"ok": True}
        finally:
            print(CN1.connection_id, 'Activity.create > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data








