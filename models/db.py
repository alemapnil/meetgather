import os, boto3, traceback, uuid
import mysql.connector.pooling
from flask import *
from datetime import datetime,timezone,timedelta
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
    "host":'myrestoredb-3.ckbctsif2sjr.us-east-1.rds.amazonaws.com',
    "port":'3306',
    "database":'meetgather_db',
    "user": os.getenv('RDS_USER'),
    "password": os.getenv('RDS_PASSWORD')
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
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (self.email,))
            result = cursor.fetchone() #tuple or None
            if result is None: #沒註冊過
                command = "insert into `members` (`email`, `name`, `member_photo`) values(%s, %s, %s);"
                cursor.execute(command, (self.email, self.name,self.photo))
                crud += 1
            else:
                if result[2] != self.name:
                    command = """update `members` set `name` = %s where `email` = %s"""
                    cursor.execute(command, (self.name,self.email))
                    crud += 1
                elif result[3] != self.photo:
                    command = """update `members` set `member_photo` = %s where `email` = %s"""
                    cursor.execute(command, (self.photo,self.email))
                    crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Members.login > 發生錯誤', data)
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
    def __init__(self, id, host, title, descp, cate, limit, city, adr, lat, lng, st, ct, et, pic):
        self.id, self.host, self.title, self.descp= id, host, title, descp
        self.cate, self.limit= cate, limit
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
            cursor = CN1.cursor(buffered=True)

            cursor.execute("""select `id` from `members` where `email` = %s """, (self.host,))
            result = cursor.fetchone() #tuple or None

            if result is None:
                data = {'error':True, 'message': '找不到使用者編號'}
            else:
                self.id = self.id + str(result[0])
                command = "insert into `activity` values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
                insertValue = (self.id, self.host, self.title, self.descp, self.cate, self.limit,\
                    self.city, self.adr, self.lat, self.lng, self.st, self.ct, self.et, cdn_url)
                cursor.execute(command, insertValue)
                data = {"ok": True}
                crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Activity.create > 發生錯誤', data)
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
            cursor = CN1.cursor(buffered=True)

            insertTuple = tuple()

            cmd = """select *  from activity
                left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on `activity`.`id` =b.`attendee_eventID`
                join (SELECT * FROM `members`) as c on `activity`.`host` =c.`email` where"""
            if keyword is not None and keyword != '':
                trans_key = '%' + keyword + '%'
                s = """(`activity`.`title` LIKE %s or `activity`.`description` LIKE %s) and"""
                cmd += s
                insertTuple += (trans_key,trans_key)

            if datefrom is not None and datefrom != '':
                if datefrom == dateto:
                    s = """ `activity`.`starttime` >= %s and `activity`.`starttime` <= %s and `activity`.`starttime`> %s and"""
                    cmd += s
                    insertTuple += (f"{datefrom} 00:00:00", f"{datefrom} 23:59:59",self.nowTime)
                else:
                    trans_key_A ,trans_key_B = f"{datefrom} 00:00:00", f"{dateto} 23:59:59"
                    s = """ `activity`.`starttime` >= %s and `activity`.`starttime` <= %s and `activity`.`starttime`> %s and"""
                    cmd += s
                    insertTuple += (trans_key_A,trans_key_B,self.nowTime)
            else:
                s = """ `activity`.`starttime` > %s and"""
                cmd += s
                insertTuple += (self.nowTime,)

            if category is not None and category != '':
                s = """ `activity`.`category` = %s and"""
                cmd += s
                insertTuple += (category,)

            if location is not None and location != "":
                s = """ `activity`.`location` = %s and"""
                cmd += s
                insertTuple += (location,)
            
            if sortby is None: #按照時間排序
                cmd = cmd.rstrip('and')
                s = """  order by `activity`.`starttime`, b.`count(*)` DESC"""
                cmd += s
                
            elif sortby == '1': #按照參加者人數排序
                cmd = cmd.rstrip('and')
                s = """  order by b.`count(*)` DESC, `activity`.`starttime`"""
                cmd += s

            cursor.execute(cmd, insertTuple)
            wholeresult = cursor.fetchall() #list or empty
            
            count = len(wholeresult)
            print('mysql未來活動個數',count)

            quotient, remainder = count // 10, count % 10
            if remainder > 0:
                totalpage = quotient + 1
            else:
                totalpage = quotient
            print(quotient, remainder, '>>',totalpage)

            s=""" limit 10 offset %s;"""
            cmd += s
            insertTuple += (self.offset,)
            cursor.execute(cmd, insertTuple)
            result = cursor.fetchall() #list or empty
            print('當前頁面個數',len(result), self.offset)

            data = {"ok":True, "result": result, "totalpage": totalpage} #totalpage有可能是0

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Find.pick_orderbyTm > 發生錯誤', data)
        finally:
            print(CN1.connection_id, 'Find.pick_orderbyTm > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


class Event:
    def __init__(self, eventId):
        self.eventId = eventId

    def content(self):
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.content > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `activity` WHERE `id` = %s """
            cursor.execute(command, (self.eventId,))
            result = cursor.fetchone() #tuple or None
            if result is None: #找不到此活動
                data = {"error": True,"message": f"沒有活動 {self.eventId}"}

            else:
                #主辦方
                command = """SELECT * FROM `members` WHERE `email` = %s """
                cursor.execute(command, (result[1],))
                host = cursor.fetchone() #tuple or None

                ## 參加者名單
                command = """select * from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist = cursor.fetchall() 

                data = {"ok":True, "host": host,"result": result,"namelist":namelist}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.content > 發生錯誤',data)

        finally:
            print(CN1.connection_id, 'Event.content > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def attend(self, attendee): #點參加
        try:
            crud = 0 
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.attend > pool create')   
            cursor = CN1.cursor(buffered=True)
            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (attendee,))
            email = cursor.fetchone() #tuple or None

            if email is not None: #須為會員
                command = """SELECT * FROM `activity` WHERE `id` = %s """
                cursor.execute(command, (self.eventId,))
                event = cursor.fetchone()
                if event is not None:  #有此活動
                    command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
                    cursor.execute(command, (self.eventId, attendee))
                    player = cursor.fetchone()
                    if player is None: #不能重複參加
                        command ="""select `limit` from activity where `id`=%s for update;"""
                        cursor.execute(command, (self.eventId,))
                        limit = cursor.fetchone()

                        command ="""select count(*) from attendees where `attendee_eventID`=%s for update;"""
                        cursor.execute(command, (self.eventId,))
                        players = cursor.fetchone()

                        if limit[0] > players[0]:
                            ##新增
                            command = "insert into `attendees` (`attendee_eventID`, `attendee_email`) values(%s, %s);" #增加參加者名單
                            cursor.execute(command, (self.eventId, attendee))
                            crud += 1
                        else:
                            data = {"error": True, "message":"已滿額"}
                    else:
                        data = {"error": True, "message":"已參加活動"}
                else:
                    data = {"error": True, "message":"無此活動"}
            else:
                data = {"error": True, "message":"無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.attend > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.attend > commit')
                CN1.commit()
                command = """select * from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist = cursor.fetchall() 
                print(namelist,'namelist新增後')
                data ={'ok':True, 'allJoinNum': len(namelist), 'namelist': namelist}
        finally:
            print(CN1.connection_id, 'Event.attend > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def not_going(self,attendee): #取消參加
        try:
            crud = 0 
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.not_going > pool create')   
            cursor = CN1.cursor(buffered=True)
            command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
            cursor.execute(command, (self.eventId, attendee))
            player = cursor.fetchone()
            if player is not None:
                ##刪除
                command ="""delete from `attendees` where `attendee_eventID` =%s and `attendee_email` =%s""" #刪除參加者名單
                cursor.execute(command, (self.eventId, attendee))
                crud += 1
            else:
                data = {"error": True,"message": "無參加紀錄"}

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.not_going > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.not_going > commit')
                CN1.commit()
                ## 參加者名單 刪除後
                command = """select * from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist = cursor.fetchall() 
                print(namelist,'namelist刪除後')
                data = {'ok':True, 'allJoinNum':len(namelist), 'namelist': namelist}
        finally:
            print(CN1.connection_id, 'Event.not_going > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def mystatus_notLogin(self): #自己參與狀態(未登入)
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.mystatus_notLogin > pool create')   
            cursor = CN1.cursor(buffered=True)

            command ="""select `limit` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            limit = cursor.fetchone()

            command ="""select count(*) from attendees where `attendee_eventID`=%s;"""
            cursor.execute(command, (self.eventId,))
            players = cursor.fetchone()

            if limit[0] > players[0]:
                data = {"ok": True}
            else:
                data = {"error": True, "message":"已滿額"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.mystatus_notLogin > 發生錯誤', data)
        finally:
            print(CN1.connection_id, 'Event.mystatus_notLogin > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def mystatus_Login(self, attendee):  #自己參與狀態(已登入)    #先檢查有無額滿，再查是否參加過
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.mystatus_Login > pool create')   
            cursor = CN1.cursor(buffered=True)

            command ="""select `limit` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            limit = cursor.fetchone()

            command ="""select count(*) from attendees where `attendee_eventID`=%s;"""
            cursor.execute(command, (self.eventId,))
            players = cursor.fetchone()

            if limit[0] > players[0]:
                command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
                cursor.execute(command, (self.eventId, attendee))
                whetherJoined = cursor.fetchone()
                if whetherJoined is None: #沒參加過
                    data = {"ok": True}
                else:
                    data = {"ok": True,"msg":"取消參加"}
            else:
                data = {"error": True, "message":"已滿額"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.mystatus_Login > 發生錯誤',data)
        finally:
            print(CN1.connection_id, 'Event.mystatus_Login > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def allJoinNum(self):
        try:
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.allJoinNum > pool create')   
            cursor = CN1.cursor(buffered=True)

            command ="""select `limit` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            limit = cursor.fetchone()

            command ="""select count(*) from attendees where `attendee_eventID`=%s;"""
            cursor.execute(command, (self.eventId,))
            players = cursor.fetchone()

            data ={'ok':True, 'limit':limit[0], 'allJoinNum':players[0]}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.allJoinNum > 發生錯誤',data)
        finally:
            print(CN1.connection_id, 'Event.allJoinNum > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def boardPost(self, JWTemail, message, time):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.boardPost > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (JWTemail,))
            member = cursor.fetchone() #tuple or None


            if member is not None: #有此會員
                command = """SELECT * FROM `activity` WHERE `id` = %s """
                cursor.execute(command, (self.eventId,))
                event = cursor.fetchone()
                if event is not None:  #有此活動
                    command = """SELECT * FROM `boardlist` WHERE `board_name` = %s order by `board_time` DESC for update;"""
                    cursor.execute(command, (self.eventId,))
                    result = cursor.fetchone() #tuple or None

                    if result is None:  #此活動無留言
                        thisfloor ='B1'
                        if event[1] == JWTemail: #主辦人自己留言就標註已讀
                            board_satatus = 'read'
                        else:
                            board_satatus = 'not read'

                        command = "insert into `boardlist` (`board_name`, `board_email`, `board_msg`, `board_floor`,`board_time`,`board_satatus`) \
                            values(%s, %s, %s, %s, %s, %s);"

                        inserttuple = (self.eventId, JWTemail, message, thisfloor, time, board_satatus)
                        cursor.execute(command, inserttuple)
                    else: #此活動有留言
                        thisfloor = f"B{int(result[4].lstrip('B')) + 1}"
                        if event[1] == JWTemail: #主辦人自己留言就標註已讀
                            board_satatus = 'read'
                        else:
                            board_satatus = 'not read'

                        command = "insert into `boardlist` (`board_name`, `board_email`, `board_msg`, `board_floor`,`board_time`,`board_satatus`) \
                            values(%s, %s, %s, %s, %s, %s);"
                        
                        inserttuple = (self.eventId, JWTemail, message, thisfloor, time, board_satatus)
                        cursor.execute(command, inserttuple)

                    inserttuple += (member[2],member[3])
                    crud += 1
                else:
                    data = {"error": True, "message":"無此活動"}
            else:
                data = {"error": True, "message":"無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.boardPost > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.boardPost > commit')
                CN1.commit()
                command = """SELECT `board_id` FROM `boardlist` WHERE `board_floor` = %s and `board_name` = %s;"""
                cursor.execute(command, (thisfloor,self.eventId))
                board_id = cursor.fetchone()
                data = {"ok": True,"inserttuple":inserttuple,"logger":member[0],"board_id":board_id[0]}

        finally:
            print(CN1.connection_id, 'Event.boardPost > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def boardDelete(self, JWTemail,board_id):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.boardDelete > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardlist` WHERE `board_id` = %s;"""
            cursor.execute(command, (board_id,))
            result = cursor.fetchone() #tuple or None

            if result is not None:  #有此留言ID
                print(JWTemail, result,'*****')
                if JWTemail == result[2]:
                    ##刪除
                    command ="""delete from `boardlist` where `board_id` =%s ;"""
                    cursor.execute(command, (board_id,))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message":"非本人無法刪除留言"}
            else:
                data = {"error": True, "message":"無此留言ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.boardDelete > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.boardDelete > commit')
                CN1.commit()
        finally:
            print(CN1.connection_id, 'Event.boardDelete > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def boardPatch(self, JWTemail,board_id, message):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.boardPatch > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardlist` WHERE `board_id` = %s;"""
            cursor.execute(command, (board_id,))
            result = cursor.fetchone() #tuple or None

            if result is not None:  #有此留言ID
                if JWTemail == result[2]: #確實為本人
                    # 更新
                    command ="""update `boardlist` set `board_msg` =%s where `board_id` =%s ;"""
                    cursor.execute(command, (message,board_id))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message":"非本人無法編輯留言"}
            else:
                data = {"error": True, "message":"無此留言ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.boardPatch > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.boardPatch > commit')
                CN1.commit()
        finally:
            print(CN1.connection_id, 'Event.boardPatch > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def boardGet(self, page, JWTemail):
        try:
            CN1 = pool.get_connection() #get a connection with pool.
            print(CN1.connection_id,'Event.boardGet > pool create') 
            cursor = CN1.cursor(buffered=True)


            if JWTemail is not None:
                sql = """SELECT `member_id` FROM `members` where `email`=%s;"""
                cursor.execute(sql, (JWTemail,))
                member_id = cursor.fetchone() 
                member_id = member_id[0]
            else:
                member_id = 0


            if page > 0:
                index = page * 5
            else:
                index = page

            sql = """SELECT * FROM `boardlist` left join `members` on `boardlist`.`board_email`=`members`.`email` where \
                `boardlist`.`board_name` =%s order by `boardlist`.`board_time`DESC limit 5 offset %s;"""
            cursor.execute(sql, (self.eventId,index))
            _10message = cursor.fetchall() 

            datalist = []
            for one in _10message:
                sql = """SELECT * FROM `boardreply` left join `members` on`boardreply`.`reply_email` =`members`.`email`where\
                    `boardreply`.`reply_boardID` =%s order by `reply_time` DESC;"""
                cursor.execute(sql, (one[0],))
                reply = cursor.fetchall() 

                data={
                    'board_id' : one[0],
                    'board_name' : one[1],
                    'board_email' : one[2],
                    'board_msg': one[3],
                    'board_floor' : one[4],
                    'board_time' : one[5],
                    'member_id': one[7],
                    'person' :one[9],
                    'photo': one[10],
                    'reply': reply
                }
                datalist.append(data)

            sql = """select count(*) from `boardlist` where `board_name` = %s ;"""
            cursor.execute(sql, (self.eventId,))
            total = cursor.fetchone()[0]

            if _10message == []: #若為空，表示已無留言
                nextpage = None
            else:
                nextpage = page + 1

            data = {'nextPage' : nextpage,'data' :datalist,'logger':member_id}       
        except:
            print(traceback.format_exc())
            data = {'error' : True, 'message': "自訂的錯誤訊息"}
            print('Event.boardGet > 發生錯誤', data)
        finally:
            print(CN1.connection_id, 'Event.boardGet > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def replyPost(self,JWTemail, message, time, boardID):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.replyPost > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (JWTemail,))
            member = cursor.fetchone() #tuple or None

            if member is not None: #有此會員
                command = """SELECT * FROM `boardlist` WHERE `board_id` = %s """
                cursor.execute(command, (boardID,))
                line = cursor.fetchone()
                if line is not None:  #有此樓
                    command = """SELECT * FROM `boardreply` WHERE `reply_boardID` = %s order by `reply_time` DESC for update;"""
                    cursor.execute(command, (boardID,))
                    result = cursor.fetchone() 

                    if result is None:  #此樓無回覆
                        thisfloor = f'{line[4]}_1'
                        if line[2] == JWTemail: #樓主自己留言就標註已讀
                            board_satatus = 'read'
                        else:
                            board_satatus = 'not read'

                        command = "insert into `boardreply` (`reply_boardID`, `reply_email`, `reply_msg`, `reply_floor`,`reply_time`,`reply_status`) \
                            values(%s, %s, %s, %s, %s, %s);"

                        inserttuple = (boardID, JWTemail, message, thisfloor, time, board_satatus)
                        cursor.execute(command, inserttuple)
                    else: ##此樓有回覆
                        a, b = result[4].split('_')[0],int(result[4].split('_')[1])
                        thisfloor = f'{a}_{b+1}'
                        if line[2] == JWTemail: #樓主自己留言就標註已讀
                            board_satatus = 'read'
                        else:
                            board_satatus = 'not read'

                        command = "insert into `boardreply` (`reply_boardID`, `reply_email`, `reply_msg`, `reply_floor`,`reply_time`,`reply_status`) \
                            values(%s, %s, %s, %s, %s, %s);"
                        
                        inserttuple = (boardID, JWTemail, message, thisfloor, time, board_satatus)
                        cursor.execute(command, inserttuple)

                    inserttuple += (member[2],member[3])
                    crud += 1
                else:
                    data = {"error": True, "message":"無此樓"}
            else:
                data = {"error": True, "message":"無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.replyPost > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.replyPost > commit')
                CN1.commit()
                command = """SELECT * FROM `boardreply` WHERE `reply_floor` = %s and `reply_boardID` = %s;"""
                cursor.execute(command, (thisfloor,boardID))
                reply = cursor.fetchone()
                data = {"ok": True,"inserttuple":inserttuple,"logger":member[0],"reply_id":reply[0]}

        finally:
            print(CN1.connection_id, 'Event.replyPost > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def replyDelete(self, JWTemail,reply_id):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.replyDelete > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardreply` WHERE `reply_id` = %s;"""
            cursor.execute(command, (reply_id,))
            result = cursor.fetchone() #tuple or None

            if result is not None:  #有此回覆ID
                if JWTemail == result[2]:
                    ##刪除
                    command ="""delete from `boardreply` where `reply_id` =%s ;"""
                    cursor.execute(command, (reply_id,))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message":"非本人無法刪除回覆"}
            else:
                data = {"error": True, "message":"無此回覆ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.replyDelete > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.replyDelete > commit')
                CN1.commit()
        finally:
            print(CN1.connection_id, 'Event.replyDelete > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data


    def replyPatch(self, JWTemail,reply_id, message):
        try:
            crud = 0
            CN1 = pool.get_connection() #get a connection with pool.  
            print(CN1.connection_id,'Event.replyPatch > pool create')   
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardreply` WHERE `reply_id` = %s;"""
            cursor.execute(command, (reply_id,))
            result = cursor.fetchone() #tuple or None

            if result is not None:  #有此回覆ID
                if JWTemail == result[2]: #確實為本人
                    # 更新
                    command ="""update `boardreply` set `reply_msg` =%s where `reply_id` =%s ;"""
                    cursor.execute(command, (message,reply_id))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message":"非本人無法編輯回覆"}
            else:
                data = {"error": True, "message":"無此回覆ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True,"message": "伺服器內部錯誤"}
            print('Event.replyPatch > 發生錯誤', data)
            CN1.rollback()
        else:
            if crud > 0:
                print('Event.replyPatch > commit')
                CN1.commit()
        finally:
            print(CN1.connection_id, 'Event.replyPatch > pool close, ', CN1.is_connected())
            cursor.close()
            CN1.close()
            return data
