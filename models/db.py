import os, boto3, traceback, uuid

from numpy import insert
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
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Activity.create > pool create')   
            cursor = CN1.cursor()

            cursor.execute("""select `id` from `members` where `email` = %s """, (self.host,))
            result = cursor.fetchone() #tuple or None

            if result is None:
                data = {'error':True, 'message': '找不到使用者編號'}
            else:
                self.id = self.id + str(result[0])
                command = "insert into `activity` values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
                insertValue = (self.id, self.host, self.title, self.descp, self.cate, self.limit, self.attend,\
                    self.city, self.adr, self.lat, self.lng, self.st, self.ct, self.et, cdn_url)
                cursor.execute(command, insertValue)
                data = {"ok": True}
                crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Activity.create > 發生錯誤')
            CN1.rollback()
            delete_pic_s3(pic_s3Object) 
        else:
            if crud > 0:
                print('Activity.create > commit')
                CN1.commit()
        finally:
            print(CN1.connection_id, 'Activity.create > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


class Find:
    def __init__(self, nowTime, page):
        self.nowTime = nowTime
        if page == 1:
            self.offset = 0
        else:
            self.offset = (page - 1)*10

    def pick_orderbyTm(self,keyword, datefrom, dateto, category, location, sortby):
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Find.all_orderbyTm > pool create')   
            cursor = CN1.cursor()

            insertTuple = tuple()

            cmd1 = """SELECT * FROM `members`right JOIN `activity`ON `members`.`email` = `activity`.`host` where"""
            cmd2 = """SELECT COUNT(*) FROM `activity` where"""
            if keyword is not None:
                trans_key = '%' + keyword + '%'
                s = """`title` LIKE %s and"""
                cmd1 += s
                cmd2 += s
                insertTuple += (trans_key,)

            if datefrom is not None:
                if datefrom == dateto:
                    s = """`starttime` >= %s and `starttime` <= %s and `starttime`> %s and"""
                    cmd1 += s
                    cmd2 += s
                    insertTuple += (f"{datefrom} 00:00:00", f"{datefrom} 23:59:59",self.nowTime)
                else:
                    trans_key_A ,trans_key_B = f"{datefrom} 00:00:00", f"{dateto} 23:59:59"
                    s = """`starttime` >= %s and `starttime` <= %s and `starttime`> %s and"""
                    cmd1 += s
                    cmd2 += s
                    insertTuple += (trans_key_A,trans_key_B,self.nowTime)
            else:
                s = """`starttime` > %s and"""
                cmd1 += s
                cmd2 += s
                insertTuple += (self.nowTime,)

            if category is not None:
                s = """`category` = %s and"""
                cmd1 += s
                cmd2 += s
                insertTuple += (category,)

            if location is not None:
                s = """`location` = %s and"""
                cmd1 += s
                cmd2 += s
                insertTuple += (location,)
            
            if sortby is None: #按照時間排序
                cmd1, cmd2 = cmd1.rstrip('and'), cmd2.rstrip('and')
                s = """order by starttime, attendees DESC limit 10 offset %s;"""
                cmd1 += s
                insertTuple += (self.offset,)
            else:
                cmd1, cmd2 = cmd1.rstrip('and'), cmd2.rstrip('and')
                s = """order by attendees DESC, starttime limit 10 offset %s;"""
                cmd1 += s
                insertTuple += (self.offset,)


            cursor.execute(cmd1, insertTuple)
            result = cursor.fetchall() #tuple or None

            print(cmd2)
            print(insertTuple[:-1])
            print('---------')
            cursor.execute(cmd2, insertTuple[:-1])
            count = cursor.fetchone() #tuple or None
            print('count',count)
            count = count[0]
            print('mysql未來活動個數',count)

            quotient, remainder = count // 10, count % 10
            if remainder > 0:
                totalpage = quotient + 1
            else:
                totalpage = quotient

            print(quotient, remainder, '>>',totalpage)
            data = {"ok":True, "result": result, "totalpage": totalpage} #totalpage有可能是0

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Find.pick_orderbyTm > 發生錯誤')
        finally:
            print(CN1.connection_id, 'Find.pick_orderbyTm > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data





