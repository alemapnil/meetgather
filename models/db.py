import os
import boto3
import traceback
import uuid
import email.message
import smtplib
import redis
import json
import mysql.connector.pooling
from http import server
from flask import *
from datetime import datetime, timezone, timedelta, date
from dotenv import load_dotenv

load_dotenv()


ALLOWED_EXTENSIONS = ["image/png", "image/jpeg", "image/gif", "image/tiff"]

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
)


def allowed_file(contentType):
    if contentType in ALLOWED_EXTENSIONS:
        return 1


def upload_pic_s3(folder, picname, blob, contentType):
    if allowed_file(contentType):
        s3_object = (
            f"meetgather/{folder}/"
            + uuid.uuid1().hex
            + "."
            + contentType.rsplit("/")[1].lower()
        )
        cdn_url = "https://d3i2i3wop7mzlm.cloudfront.net/" + s3_object
        s3.upload_fileobj(
            blob,
            "bucketfromaws",
            s3_object,
            ExtraArgs={"ContentType": f"{contentType}"},
        )

        if "Contents" in s3.list_objects_v2(Bucket="bucketfromaws", Prefix=s3_object):
            data = {"ok": True, "message": s3_object, "cdn_url": cdn_url}
        else:
            data = {"error": True, "message": "伺服器上傳圖片失敗"}
        return data

    else:
        data = {"error": True, "message": "非圖片檔"}
        return data


def delete_pic_s3(s3_object):
    # delete s3 photo command.
    s3.delete_object(Bucket="bucketfromaws", Key=s3_object)


def email_inform_delete(title, bcc, lang):
    print(bcc, "BCC delete")
    print("============")
    msg = email.message.EmailMessage()
    SMTP_ACCOUNT, SMTP_PASSWORD = os.getenv(
        "SMTP_ACCOUNT"), os.getenv("SMTP_PASSWORD")
    year = date.today().year

    if lang == "zh":
        msg["From"] = f"Meetgather <{SMTP_ACCOUNT}>"
        msg["Bcc"] = bcc
        msg["Subject"] = f"您參與的活動已刪除—【{title}】"
        msg.add_alternative(
            """\
        <html>
        <head></head>
        <body>
            <p style='color:rgb(0,0,0,0.75)'>參與者您好</p>
            <div style='color:rgb(0,0,0,0.75)'>主辦人已刪除您參與的活動:  <b>{title}</b></div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'>敬請留意</div>
            <br/>
            <div style='color:#BEBEBE'>*本郵件由系統自動發出，請勿直接回覆此信件</div>
            <div style='color:#BEBEBE'>© COPYRIGHT {year} PamelaLin</div>
            <div style='color:#f6d819; font-weight:bold;'>Meetgather</div>
        </body>
        </html>
        """.format(
                title=title, year=year
            ),
            subtype="html",
        )
    else:
        msg["From"] = f"Meetgather <{SMTP_ACCOUNT}>"
        msg["Bcc"] = bcc
        msg["Subject"] = f"Event you attend is deleted—【{title}】"
        msg.add_alternative(
            """\
        <html>
        <head></head>
        <body>
            <p style='color:rgb(0,0,0,0.75)'>Dear attendee</p>
            <div style='color:rgb(0,0,0,0.75)'>Host has deleted the event you attend:  <b>{title}</b></div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'>Please note it.</div>
            <br/>
            <div style='color:#BEBEBE'>*This mail is sent automatically, so do not give any reply.</div>
            <div style='color:#BEBEBE'>© COPYRIGHT {year} PamelaLin</div>
            <div style='color:#f6d819; font-weight:bold;'>Meetgather</div>
        </body>
        </html>
        """.format(
                title=title, year=year
            ),
            subtype="html",
        )

    server = smtplib.SMTP_SSL("smtppro.zoho.com", 465)
    server.login(SMTP_ACCOUNT, SMTP_PASSWORD)
    server.send_message(msg)
    server.close()


def html_inform(title, bcc, inform, url, lang):
    print(bcc, "BCC", inform)
    print("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    msg = email.message.EmailMessage()
    SMTP_ACCOUNT, SMTP_PASSWORD = os.getenv(
        "SMTP_ACCOUNT"), os.getenv("SMTP_PASSWORD")
    year = date.today().year
    if lang == "zh":
        msg["From"] = f"Meetgather <{SMTP_ACCOUNT}>"
        msg["Bcc"] = bcc
        msg["Subject"] = f"主辦人傳達訊息—【{title}】"
        msg.add_alternative(
            """\
        <html>
        <head></head>
        <body>
            <p style='color:rgb(0,0,0,0.75)'>哈囉! 參與者</p>
            <div style='color:rgb(0,0,0,0.75)'>主辦人有話要說:</div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'><b>{inform}</b></div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'><a href="{url}">留意活動資訊</a></div>
            <br/>
            <div style='color:#BEBEBE'>*本郵件由系統自動發出，請勿直接回覆此信件</div>
            <div style='color:#BEBEBE'>© COPYRIGHT {year} PamelaLin</div>
            <div style='color:#f6d819; font-weight:bold;'>Meetgather</div>
        </body>
        </html>
        """.format(
                inform=inform, url=url, year=year
            ),
            subtype="html",
        )
    else:
        msg["From"] = f"Meetgather <{SMTP_ACCOUNT}>"
        msg["Bcc"] = bcc
        msg["Subject"] = f"Host sends words —【{title}】"
        msg.add_alternative(
            """\
        <html>
        <head></head>
        <body>
            <p style='color:rgb(0,0,0,0.75)'>Dear attendee</p>
            <div style='color:rgb(0,0,0,0.75)'>Host has words to convey:</div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'><b>{inform}</b></div>
            <br/>
            <div style='color:rgb(0,0,0,0.75)'><a href="{url}">Mind information of activity</a></div>
            <br/>
            <div style='color:#BEBEBE'>*This mail is sent automatically, so do not give any reply.</div>
            <div style='color:#BEBEBE'>© COPYRIGHT {year} PamelaLin</div>
            <div style='color:#f6d819; font-weight:bold;'>Meetgather</div>
        </body>
        </html>
        """.format(
                inform=inform, url=url, year=year
            ),
            subtype="html",
        )

    server = smtplib.SMTP_SSL("smtppro.zoho.com", 465)
    server.login(SMTP_ACCOUNT, SMTP_PASSWORD)
    server.send_message(msg)
    server.close()


def localToUTC(t, tz):  # 原時區改為UTC
    browser = datetime.strptime(
        t + f"{tz}", "%Y-%m-%d %H:%M%z")  # 將時間字串設為瀏覽器時區時間
    utc = browser.astimezone(timezone(timedelta(hours=0)))  # 將瀏覽器時區時間改為UTC
    return utc.strftime("%Y-%m-%d %H:%M")


dbconfig = {
    "host": os.getenv("DB_HOST"),
    "port": "3306",
    "database": "meetgather_db",
    "user": os.getenv("DB_USERNAME"),
    "password": os.getenv("DB_PASSWORD"),
}
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=5, **dbconfig
)  # create a pool which connect with DB
redis_pool = redis.connection.ConnectionPool(
    host=os.getenv("REDISHOST"), port=6379, max_connections=100
)  # create a pool which connect with redis


class Redis_link:
    def __init__(self):
        self.conn = redis.Redis(connection_pool=redis_pool)
        self.conn.ping()

    def del_memberID(self, query_member_id):
        if self.conn.exists(query_member_id):
            self.conn.delete(query_member_id)
        self.conn.close()

    def getData(self, query_member_id): # query_member_id 資料型態為int
        if self.conn.exists(query_member_id):  #
            decode_list = [
                i.decode("utf-8") for i in self.conn.lrange(query_member_id, 0, -1)
            ]
            correct_decode = []
            for d in decode_list:
                if d == "null":
                    correct_decode.append(None)
                else:
                    correct_decode.append(d)

            data = {"ok": True, "message": correct_decode}

        else:
            data = {"error": True, "message": "Redis沒此會員ID"}
        self.conn.close()
        return data

    def createData(
        self, query_member_id, email, name, member_photo, altername, aboutme, alterphoto
    ):
        if altername is None:
            altername = json.dumps(None)
        if aboutme is None:
            aboutme = json.dumps(None)
        if alterphoto is None:
            alterphoto = json.dumps(None)

        self.conn.rpush(
            query_member_id,
            query_member_id,
            email,
            name,
            member_photo,
            altername,
            aboutme,
            alterphoto,
        )
        self.conn.expire(query_member_id, 600) # 生存時間十分鐘
        self.conn.close()

class Members:
    def __init__(self, email, name, photo):
        self.email = email
        self.name = name
        self.photo = photo

    def login(self):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Members.login > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (self.email,))
            result = cursor.fetchone()  # tuple or None
            if result is None:  # 沒註冊過
                command = "insert into `members` (`email`, `name`, `member_photo`) values(%s, %s, %s);"
                cursor.execute(command, (self.email, self.name, self.photo))
                crud += 1
            else:
                if result[2] != self.name:
                    command = """update `members` set `name` = %s where `email` = %s"""
                    cursor.execute(command, (self.name, self.email))
                    crud += 1
                elif result[3] != self.photo:
                    command = """update `members` set `member_photo` = %s where `email` = %s"""
                    cursor.execute(command, (self.photo, self.email))
                    crud += 1

                if result[2] != self.name or result[3] != self.photo:
                    r = Redis_link()
                    r.del_memberID(result[0])
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Members.login > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Members.login > commit")
                CN1.commit()
            data = {"ok": True}
        finally:
            print(CN1.connection_id, "Members.login > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def profile(self, query_member_id):
        r = Redis_link()
        redisData = r.getData(query_member_id)
        if "ok" in redisData:
            return redisData

        try:  # DATABASE
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Members.profile > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `member_id` = %s """
            cursor.execute(command, (query_member_id,))
            result = cursor.fetchone()  # tuple or None

            if result is None:  # 沒此會員ID
                data = {"error": True, "message": "沒此會員ID"}
            else:
                data = {"ok": True, "message": result}
                r.createData(
                    query_member_id,
                    result[1],
                    result[2],
                    result[3],
                    result[4],
                    result[5],
                    result[6],
                )
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Members.profile > 發生錯誤", data)
            CN1.rollback()

        finally:
            print(
                CN1.connection_id, "Members.profile > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def edit(self, newname, newaboutme, newphoto, background):
        try:
            crud, pic_s3Object = 0, ""
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Members.edit > pool create")
            cursor = CN1.cursor(buffered=True)

            cursor.execute(
                """select * from `members` where `email` = %s """, (self.email,)
            )
            result = cursor.fetchone()  # tuple or None

            if result is None:
                data = {"error": True, "message": "無此會員"}
            else:
                r = Redis_link()  # redis
                r.del_memberID(result[0])

                if result[4] != newname:
                    command = (
                        """update `members` set `altername` =%s where `email` =%s ;"""
                    )
                    cursor.execute(command, (newname, self.email))
                    crud += 1

                if result[5] != newaboutme:
                    command = (
                        """update `members` set `aboutme` =%s where `email` =%s ;"""
                    )
                    cursor.execute(command, (newaboutme, self.email))
                    crud += 1

                if newphoto is not None:  # 更改圖片
                    # 上傳新圖片
                    uploadResult = upload_pic_s3(
                        "members", newphoto.filename, newphoto, newphoto.content_type
                    )
                    if "ok" in uploadResult:
                        pic_s3Object, cdn_url = (
                            uploadResult["message"],
                            uploadResult["cdn_url"],
                        )
                    else:
                        return uploadResult
                    command = (
                        """update `members` set `alterphoto` =%s where `email` =%s ;"""
                    )
                    cursor.execute(command, (cdn_url, self.email))
                    crud += 1
                else:  # 未更改圖片, 偵測背景圖是google肖像抑或上次上傳的圖片
                    if result[3] != background:  # alterphoto 依舊儲存上次上傳的圖片
                        pass
                    else:
                        command = """update `members` set `alterphoto` =%s where `email` =%s ;"""  # alterphoto 儲存空值
                        cursor.execute(command, (newphoto, self.email))
                        crud += 1

                data = {"ok": True}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Members.edit > 發生錯誤", data)
            CN1.rollback()
            if pic_s3Object != "":  # 刪除剛上傳圖片
                delete_pic_s3(pic_s3Object)
        else:
            if crud > 0:
                print("Members.edit > commit")
                CN1.commit()
            # 刪除舊有alterphoto 於S3儲存的圖片
            if (
                pic_s3Object != ""
                and result[6] != None
                or result[3] == background
                and result[6] != None
            ):  # 上傳新圖片且alterphoto已有網址/未上傳新圖片且alterphoto已有網址
                delete_pic_s3("/".join(result[6].split("/")[-3:]))
        finally:
            print(CN1.connection_id, "Members.edit > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

class Activity:
    def __init__(
        self, id, host, title, descp, cate, limit, city, adr, lat, lng, st, ct, et, pic
    ):
        self.id, self.host, self.title, self.descp = id, host, title, descp
        self.cate, self.limit = cate, limit
        self.city, self.adr, self.lat, self.lng = city, adr, lat, lng
        self.st, self.ct, self.et, self.pic = st, ct, et, pic

    def create(self):
        try:
            # S3
            pic_s3Object = ""
            uploadResult = upload_pic_s3(
                "activity", self.pic.filename, self.pic, self.pic.content_type
            )
            if "ok" in uploadResult:
                pic_s3Object, cdn_url = uploadResult["message"], uploadResult["cdn_url"]
            else:
                return uploadResult
            # RDS
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Activity.create > pool create")
            cursor = CN1.cursor(buffered=True)

            cursor.execute(
                """select `member_id` from `members` where `email` = %s """,
                (self.host,),
            )
            result = cursor.fetchone()  # tuple or None

            if result is None:
                data = {"error": True, "message": "找不到使用者編號"}
            else:
                self.id = self.id + str(result[0])
                command = "insert into `activity` values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
                insertValue = (
                    self.id,
                    self.host,
                    self.title,
                    self.descp,
                    self.cate,
                    self.limit,
                    self.city,
                    self.adr,
                    self.lat,
                    self.lng,
                    self.st,
                    self.ct,
                    self.et,
                    cdn_url,
                )
                cursor.execute(command, insertValue)
                data = {"ok": True}
                crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Activity.create > 發生錯誤", data)
            CN1.rollback()
            if pic_s3Object != "":
                delete_pic_s3(pic_s3Object)
        else:
            if crud > 0:
                print("Activity.create > commit")
                CN1.commit()
        finally:
            print(
                CN1.connection_id, "Activity.create > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def edit(self):
        try:
            crud, error, pic_s3Object = 0, 0, ""
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Activity.edit > pool create")
            cursor = CN1.cursor(buffered=True)
            ###

            cursor.execute(
                """select * from `activity` where `id` = %s """, (self.id,))
            result = cursor.fetchone()  # tuple or None

            if result is None:
                data = {"error": True, "message": "無此活動"}
            else:
                if result[1] != self.host:
                    data = {"error": True, "message": "無權限編輯此活動"}
                else:
                    if result[2] != self.title:
                        command = (
                            """update `activity` set `title` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.title, self.id))
                        crud += 1

                    if result[3] != self.descp:
                        command = """update `activity` set `description` =%s where `id` =%s ;"""
                        cursor.execute(command, (self.descp, self.id))
                        crud += 1

                    if result[4] != self.cate:
                        command = (
                            """update `activity` set `category` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.cate, self.id))
                        crud += 1

                    if result[5] != self.limit:
                        command = """select count(*) from attendees where `attendee_eventID`=%s for update;"""
                        cursor.execute(command, (self.id,))
                        players = cursor.fetchone()

                        if players[0] > self.limit:
                            data = {"error": True, "message": "不可低於目前參與人數"}
                            error = 1
                        else:
                            command = (
                                """update `activity` set `limit` =%s where `id` =%s ;"""
                            )
                            cursor.execute(command, (self.limit, self.id))
                            crud += 1

                    if result[6] != self.city:
                        command = (
                            """update `activity` set `location` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.city, self.id))
                        crud += 1

                    if result[7] != self.adr:
                        command = (
                            """update `activity` set `address` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.adr, self.id))
                        crud += 1

                    if result[8] != self.lat:
                        command = (
                            """update `activity` set `latitude` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.lat, self.id))
                        crud += 1

                    if result[9] != self.lng:
                        command = (
                            """update `activity` set `longitude` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.lng, self.id))
                        crud += 1

                    if result[10] != datetime.strptime(
                        self.st + ":00", "%Y-%m-%d %H:%M:%S"
                    ):
                        command = (
                            """update `activity` set `starttime` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.st, self.id))
                        crud += 1

                    if result[12] != self.et:
                        command = (
                            """update `activity` set `edittime` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (self.et, self.id))
                        crud += 1

                    if self.pic is not None:  # 更改圖片
                        # 上傳新圖片
                        uploadResult = upload_pic_s3(
                            "activity",
                            self.pic.filename,
                            self.pic,
                            self.pic.content_type,
                        )
                        print(uploadResult)
                        if "ok" in uploadResult:
                            pic_s3Object, cdn_url = (
                                uploadResult["message"],
                                uploadResult["cdn_url"],
                            )
                        else:
                            return uploadResult

                        command = (
                            """update `activity` set `photo` =%s where `id` =%s ;"""
                        )
                        cursor.execute(command, (cdn_url, self.id))
                        crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Activity.edit > 發生錯誤", data)
            CN1.rollback()
            if pic_s3Object != "":  # 刪除剛上傳圖片
                delete_pic_s3(pic_s3Object)
        else:
            if crud > 0 and error == 0:
                data = {"ok": True}
                print("Activity.edit > commit")
                CN1.commit()
            if pic_s3Object != "":  # 刪除原圖片
                delete_pic_s3("/".join(result[13].split("/")[-3:]))
        finally:
            print(CN1.connection_id, "Activity.edit > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def delete(self, lang):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Activity.delete > pool create")
            cursor = CN1.cursor(buffered=True)

            cursor.execute(
                """select * from `activity` where `id` = %s """, (self.id,))
            result = cursor.fetchone()  # tuple or None

            if result is None:
                data = {"error": True, "message": "無此活動"}
            else:
                if result[1] != self.host:
                    data = {"error": True, "message": "無權限刪除活動"}
                else:
                    cursor.execute(
                        """select `attendee_email` from attendees where `attendee_eventID` = %s;""",
                        (self.id,),
                    )
                    attendee_tuple_list = cursor.fetchall()  # tuple or None
                    attendee_list = [a[0] for a in attendee_tuple_list]
                    if self.host not in attendee_list:  # 版主也要收到信
                        attendee_list.append(self.host)

                    # email to notify deleting
                    email_inform_delete(
                        result[2], ",".join(attendee_list), lang)

                    # mysql
                    command = """delete from `activity` where `id` = %s;"""
                    cursor.execute(command, (self.id,))
                    crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Activity.delete > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                data = {"ok": True}
                print("Activity.delete > commit")
                CN1.commit()
                delete_pic_s3("/".join(result[13].split("/")[-3:]))
        finally:
            print(
                CN1.connection_id, "Activity.delete > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

class Find:
    def __init__(self, nowTime, page, web):
        self.nowTime = nowTime
        self.page = page

        if web == "find":
            if page == 1:
                self.offset = 0
            else:
                self.offset = (page - 1) * 12
        else:
            if page > 0:
                self.offset = page * 12
            else:
                self.offset = page

    def pick_orderbyTm(
        self, keyword, datefrom, dateto, tzOffset, category, location, sortby
    ):
        try:
            print(tzOffset, type(tzOffset))
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Find.all_orderbyTm > pool create")
            cursor = CN1.cursor(buffered=True)
            insertTuple = tuple()
            cmd = """select *  from activity
                left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on `activity`.`id` =b.`attendee_eventID`
                join (SELECT * FROM `members`) as c on `activity`.`host` =c.`email` where"""
            if keyword is not None and keyword != "":
                trans_key = "%" + keyword + "%"
                s = """(`activity`.`title` LIKE %s or `activity`.`description` LIKE %s) and"""
                cmd += s
                insertTuple += (trans_key, trans_key)

            if datefrom is not None and datefrom != "":
                if datefrom == dateto:

                    s = """ `activity`.`starttime` >= %s and `activity`.`starttime` <= %s and `activity`.`starttime`> %s and"""
                    cmd += s

                    insertTuple += (
                        localToUTC(datefrom + " 00:00", tzOffset),
                        localToUTC(datefrom + " 23:59", tzOffset),
                        self.nowTime,
                    )
                else:
                    trans_key_A, trans_key_B = localToUTC(
                        datefrom + " 00:00", tzOffset
                    ), localToUTC(dateto + " 23:59", tzOffset)
                    s = """ `activity`.`starttime` >= %s and `activity`.`starttime` <= %s and `activity`.`starttime`> %s and"""
                    cmd += s
                    insertTuple += (trans_key_A, trans_key_B, self.nowTime)

                print(insertTuple, "time insertTuple")
            else:
                s = """ `activity`.`starttime` > %s and"""
                cmd += s
                insertTuple += (self.nowTime,)

            if category is not None and category != "":
                s = """ `activity`.`category` = %s and"""
                cmd += s
                insertTuple += (category,)

            if location is not None and location != "":
                s = """ `activity`.`location` = %s and"""
                cmd += s
                insertTuple += (location,)

            s = """ `activity`.`createtime` < %s and"""
            cmd += s
            insertTuple += (self.nowTime,)

            if sortby is None:  # 按照時間排序
                cmd = cmd.rstrip("and")
                s = """  order by `activity`.`starttime`, b.`count(*)` DESC"""
                cmd += s

            elif sortby == "1":  # 按照參加者人數排序
                cmd = cmd.rstrip("and")
                s = """  order by b.`count(*)` DESC, `activity`.`starttime`"""
                cmd += s

            cursor.execute(cmd, insertTuple)
            wholeresult = cursor.fetchall()  # list or empty

            count = len(wholeresult)
            print("mysql未來活動個數", count)

            quotient, remainder = count // 12, count % 12
            if remainder > 0:
                totalpage = quotient + 1
            else:
                totalpage = quotient
            print(quotient, remainder, ">>", totalpage)

            s = """ limit 12 offset %s;"""
            cmd += s
            insertTuple += (self.offset,)
            cursor.execute(cmd, insertTuple)
            result = cursor.fetchall()  # list or empty
            print("當前頁面個數", len(result), self.offset)

            data = {
                "ok": True,
                "result": result,
                "totalpage": totalpage,
            }  # totalpage有可能是0

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Find.pick_orderbyTm > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id,
                "Find.pick_orderbyTm > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def host_record(self, member):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Find.host_record > pool create")
            cursor = CN1.cursor(buffered=True)

            sql = """select *  from activity
            left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on `activity`.`id` =b.`attendee_eventID`
            join (SELECT * FROM `members`) as c on `activity`.`host` =c.`email` where c.member_id= %s and `activity`.`createtime` < %s order by `activity`.`starttime` DESC limit 12 offset %s;"""
            cursor.execute(sql, (member, self.nowTime, self.offset))
            _12event = cursor.fetchall()

            sql = """select *  from activity
            left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on `activity`.`id` =b.`attendee_eventID`
            join (SELECT * FROM `members`) as c on `activity`.`host` =c.`email` where c.member_id= %s and `activity`.`createtime` < %s order by `activity`.`starttime` DESC limit 12 offset %s;"""
            cursor.execute(sql, (member, self.nowTime, self.offset + 12))
            _12event_next = cursor.fetchall()

            if _12event_next == []:
                nextPage = None
            else:
                nextPage = self.page + 1

            data = {"nextPage": nextPage, "_12event": _12event}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Find.host_record > 發生錯誤", data)

        finally:
            print(
                CN1.connection_id, "Find.host_record > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def join_record(self, member):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Find.join_record > pool create")
            cursor = CN1.cursor(buffered=True)

            sql = """select * from members where member_id = %s ;"""
            cursor.execute(sql, (member,))
            member_result = cursor.fetchone()
            member_email = member_result[1]

            sql = """select *  from attendees left join activity as a on attendee_eventID=a.id left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on a.id =b.`attendee_eventID`
            join (SELECT * FROM `members`)as c on a.host =c.`email` where attendee_email= %s and a.createtime < %s order by a.starttime DESC limit 12 offset %s;"""
            cursor.execute(sql, (member_email, self.nowTime, self.offset))
            _12event = cursor.fetchall()

            sql = """select *  from attendees left join activity as a on attendee_eventID=a.id left join (SELECT attendee_eventID,count(*) FROM attendees GROUP BY attendee_eventID) as b on a.id =b.`attendee_eventID`
            join (SELECT * FROM `members`)as c on a.host =c.`email` where attendee_email= %s and a.createtime < %s order by a.starttime DESC limit 12 offset %s;"""
            cursor.execute(sql, (member_email, self.nowTime, self.offset + 12))
            _12event_next = cursor.fetchall()

            if _12event_next == []:
                nextPage = None
            else:
                nextPage = self.page + 1

            data = {"nextPage": nextPage, "_12event": _12event}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Find.join_record > 發生錯誤", data)

        finally:
            print(
                CN1.connection_id, "Find.join_record > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

class Event:
    def __init__(self, eventId):
        self.eventId = eventId

    def content(self):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.content > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `activity` WHERE `id` = %s """
            cursor.execute(command, (self.eventId,))
            result = cursor.fetchone()  # tuple or None
            if result is None:  # 找不到此活動
                data = {"error": True, "message": f"沒有活動 {self.eventId}"}
            else:
                # 主辦方
                command = """SELECT * FROM `members` WHERE `email` = %s """
                cursor.execute(command, (result[1],))
                host = cursor.fetchone()  # tuple or None

                command = """select count(*) from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist_num = cursor.fetchone()

                data = {
                    "ok": True,
                    "host": host,
                    "activity": result,
                    "namelist_num": namelist_num[0],
                }
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.content > 發生錯誤", data)
        finally:
            print(CN1.connection_id, "Event.content > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def attend(self, attendee, clickTime):  # 點參加
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.attend > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (attendee,))
            email = cursor.fetchone()  # tuple or None

            if email is not None:  # 須為會員
                command = """SELECT * FROM `activity` WHERE `id` = %s """
                cursor.execute(command, (self.eventId,))
                event = cursor.fetchone()
                if event is not None:  # 有此活動
                    command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
                    cursor.execute(command, (self.eventId, attendee))
                    player = cursor.fetchone()
                    if player is None:  # 不能重複參加
                        command = """select `starttime` from activity where `id`=%s;"""
                        cursor.execute(command, (self.eventId,))
                        starttime = cursor.fetchone()
                        clickTime_tm = datetime.strptime(
                            clickTime, "%Y-%m-%d %H:%M:%S")

                        if clickTime_tm < starttime[0]:
                            command = """select `limit` from activity where `id`=%s for update;"""
                            cursor.execute(command, (self.eventId,))
                            limit = cursor.fetchone()

                            command = """select count(*) from attendees where `attendee_eventID`=%s for update;"""
                            cursor.execute(command, (self.eventId,))
                            players = cursor.fetchone()

                            if limit[0] > players[0]:
                                # 新增
                                # 增加參加者名單
                                command = "insert into `attendees` (`attendee_eventID`, `attendee_email`) values(%s, %s);"
                                cursor.execute(
                                    command, (self.eventId, attendee))
                                crud += 1
                            else:
                                data = {"error": True, "message": "已滿額"}
                        else:
                            data = {"error": True, "message": "已過活動時間"}
                    else:
                        data = {"error": True, "message": "已參加活動"}
                else:
                    data = {"error": True, "message": "無此活動"}
            else:
                data = {"error": True, "message": "無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.attend > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.attend > commit")
                CN1.commit()
                command = """select * from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist = cursor.fetchall()
                print(namelist, "namelist新增後")
                data = {"ok": True, "allJoinNum": len(
                    namelist), "namelist": namelist}
        finally:
            print(CN1.connection_id, "Event.attend > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def not_going(self, attendee):  # 取消參加
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.not_going > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
            cursor.execute(command, (self.eventId, attendee))
            player = cursor.fetchone()
            if player is not None:
                # 刪除
                command = """delete from `attendees` where `attendee_eventID` =%s and `attendee_email` =%s"""  # 刪除參加者名單
                cursor.execute(command, (self.eventId, attendee))
                crud += 1
            else:
                data = {"error": True, "message": "無參加紀錄"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.not_going > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.not_going > commit")
                CN1.commit()
                # 參加者名單 刪除後
                command = """select * from `attendees`
                            join `members` on `attendees`.`attendee_email` =`members`.`email` where `attendee_eventID` = %s;"""
                cursor.execute(command, (self.eventId,))
                namelist = cursor.fetchall()
                print(namelist, "namelist刪除後")
                data = {"ok": True, "allJoinNum": len(
                    namelist), "namelist": namelist}
        finally:
            print(
                CN1.connection_id, "Event.not_going > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def mystatus_notLogin(self, clickTime):  # 自己參與狀態(未登入)
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.mystatus_notLogin > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """select `starttime` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            starttime = cursor.fetchone()
            clickTime_tm = datetime.strptime(clickTime, "%Y-%m-%d %H:%M:%S")

            if clickTime_tm < starttime[0]:
                command = """select `limit` from activity where `id`=%s;"""
                cursor.execute(command, (self.eventId,))
                limit = cursor.fetchone()

                command = (
                    """select count(*) from attendees where `attendee_eventID`=%s;"""
                )
                cursor.execute(command, (self.eventId,))
                players = cursor.fetchone()

                if limit[0] > players[0]:
                    data = {"ok": True}
                else:
                    data = {"error": True, "message": "已滿額"}
            else:
                data = {"error": True, "message": "已過活動時間"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.mystatus_notLogin > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id,
                "Event.mystatus_notLogin > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def mystatus_Login(self, attendee, clickTime):  # 自己參與狀態(已登入)    #先檢查有無額滿，再查是否參加過
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.mystatus_Login > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """select `starttime` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            starttime = cursor.fetchone()
            clickTime_tm = datetime.strptime(clickTime, "%Y-%m-%d %H:%M:%S")

            print(
                attendee,
                clickTime,
                clickTime_tm,
                type(clickTime_tm),
                starttime,
                self.eventId,
                "^^^",
            )

            if clickTime_tm < starttime[0]:
                command = """select `limit` from activity where `id`=%s;"""
                cursor.execute(command, (self.eventId,))
                limit = cursor.fetchone()

                command = (
                    """select count(*) from attendees where `attendee_eventID`=%s;"""
                )
                cursor.execute(command, (self.eventId,))
                players = cursor.fetchone()

                if limit[0] > players[0]:
                    command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
                    cursor.execute(command, (self.eventId, attendee))
                    whetherJoined = cursor.fetchone()
                    if whetherJoined is None:  # 沒參加過
                        data = {"ok": True}
                    else:
                        data = {"ok": True, "msg": "取消參加"}
                else:
                    command = """select * from `attendees` where `attendee_eventID` = %s and `attendee_email` = %s;"""
                    cursor.execute(command, (self.eventId, attendee))
                    whetherJoined = cursor.fetchone()
                    if whetherJoined is None:  # 沒參加過
                        data = {"error": True, "message": "已滿額"}
                    else:
                        data = {"ok": True, "msg": "取消參加"}
            else:
                data = {"error": True, "message": "已過活動時間"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.mystatus_Login > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id,
                "Event.mystatus_Login > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def allJoinNum(self):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.allJoinNum > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """select `limit` from activity where `id`=%s;"""
            cursor.execute(command, (self.eventId,))
            limit = cursor.fetchone()

            command = """select count(*) from attendees where `attendee_eventID`=%s;"""
            cursor.execute(command, (self.eventId,))
            players = cursor.fetchone()

            data = {
                "ok": True,
                "limit": limit[0],
                "allJoinNum": players[0],
            }
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.allJoinNum > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id, "Event.allJoinNum > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def namelist(self, num):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.namelist > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """select *from attendees left join  `members` on `attendee_email`=`members`.`email` where `attendee_eventID`=%s  limit %s;"""
            cursor.execute(command, (self.eventId, num))
            result = cursor.fetchall()

            data = {"ok": True, "namelist": result}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.namelist > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id, "Event.namelist > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def boardPost(self, JWTemail, message, time):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.boardPost > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (JWTemail,))
            member = cursor.fetchone()  # tuple or None

            if member is not None:  # 有此會員
                command = """SELECT * FROM `activity` WHERE `id` = %s """
                cursor.execute(command, (self.eventId,))
                event = cursor.fetchone()
                if event is not None:  # 有此活動
                    command = """SELECT * FROM `boardlist` WHERE `board_name` = %s order by `board_time` DESC for update;"""
                    cursor.execute(command, (self.eventId,))
                    result = cursor.fetchone()  # tuple or None

                    if result is None:  # 此活動無留言
                        thisfloor = "B1"
                        if event[1] == JWTemail:  # 主辦人自己留言就標註已讀
                            board_status = "read"  #  read 表示紅點消失
                            board_link = "linked"  # linked 似乎是留待之後開發的欄位
                        else:
                            board_status = "not read" # 紅點出現，通知你的活動頁面上有未讀留言
                            board_link = "not link" 

                        command = "insert into `boardlist` (`board_name`, `board_email`, `board_msg`, `board_floor`,`board_time`,`board_status`, `board_link`) \
                            values(%s, %s, %s, %s, %s, %s,%s);"

                        inserttuple = (
                            self.eventId,
                            JWTemail,
                            message,
                            thisfloor,
                            time,
                            board_status,
                            board_link,
                        )
                        cursor.execute(command, inserttuple)
                    else:  # 此活動有留言
                        thisfloor = f"B{int(result[4].lstrip('B')) + 1}"
                        if event[1] == JWTemail:  # 主辦人自己留言就標註已讀
                            board_status = "read"
                            board_link = "linked"

                        else:
                            board_status = "not read"
                            board_link = "not link"

                        command = "insert into `boardlist` (`board_name`, `board_email`, `board_msg`, `board_floor`,`board_time`,`board_status`,`board_link`) \
                            values(%s, %s, %s, %s, %s, %s, %s);"

                        inserttuple = (
                            self.eventId,
                            JWTemail,
                            message,
                            thisfloor,
                            time,
                            board_status,
                            board_link,
                        )
                        cursor.execute(command, inserttuple)
                    # 加入姓名與人像
                    if member[4] is None:
                        name = member[2]
                    else:
                        name = member[4]
                    if member[6] is None:
                        photo = member[3]
                    else:
                        photo = member[6]

                    inserttuple += (name, photo)
                    crud += 1
                else:
                    data = {"error": True, "message": "無此活動"}
            else:
                data = {"error": True, "message": "無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.boardPost > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.boardPost > commit")
                CN1.commit()
                command = """SELECT `board_id` FROM `boardlist` WHERE `board_floor` = %s and `board_name` = %s;"""
                cursor.execute(command, (thisfloor, self.eventId))
                board_id = cursor.fetchone()
                inserttuple = list(inserttuple)
                inserttuple[4] = datetime.strptime(
                    inserttuple[4], "%Y-%m-%d %H:%M:%S")
                data = {
                    "ok": True,
                    "inserttuple": inserttuple,
                    "logger": member[0],
                    "board_id": board_id[0],
                }

        finally:
            print(
                CN1.connection_id, "Event.boardPost > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def boardDelete(self, JWTemail, board_id):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.boardDelete > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardlist` WHERE `board_id` = %s;"""
            cursor.execute(command, (board_id,))
            result = cursor.fetchone()  # tuple or None

            if result is not None:  # 有此留言ID
                print(JWTemail, result, "*****")
                if JWTemail == result[2]:
                    # 刪除
                    command = """delete from `boardlist` where `board_id` =%s ;"""
                    cursor.execute(command, (board_id,))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message": "非本人無法刪除留言"}
            else:
                data = {"error": True, "message": "無此留言ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.boardDelete > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.boardDelete > commit")
                CN1.commit()
        finally:
            print(
                CN1.connection_id,
                "Event.boardDelete > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def boardPatch(self, JWTemail, board_id, message):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.boardPatch > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardlist` WHERE `board_id` = %s;"""
            cursor.execute(command, (board_id,))
            result = cursor.fetchone()  # tuple or None

            if result is not None:  # 有此留言ID
                if JWTemail == result[2]:  # 確實為本人
                    # 更新
                    command = """update `boardlist` set `board_msg` =%s where `board_id` =%s ;"""
                    cursor.execute(command, (message, board_id))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message": "非本人無法編輯留言"}
            else:
                data = {"error": True, "message": "無此留言ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.boardPatch > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.boardPatch > commit")
                CN1.commit()
        finally:
            print(
                CN1.connection_id, "Event.boardPatch > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def boardGet(self, page, JWTemail, time):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.boardGet > pool create")
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
                `boardlist`.`board_name` =%s and `boardlist`.`board_time`< %s order by `boardlist`.`board_time`DESC limit 5 offset %s;"""
            cursor.execute(sql, (self.eventId, time, index))
            _10message = cursor.fetchall()

            sql = """SELECT * FROM `boardlist` left join `members` on `boardlist`.`board_email`=`members`.`email` where \
                `boardlist`.`board_name` =%s and `boardlist`.`board_time`< %s order by `boardlist`.`board_time`DESC limit 5 offset %s;"""
            cursor.execute(sql, (self.eventId, time, index + 5))
            _10message_next = cursor.fetchall()

            datalist = []
            for one in _10message:
                sql = """SELECT * FROM `boardreply` left join `members` on `boardreply`.`reply_email` =`members`.`email`where\
                    `boardreply`.`reply_boardID` =%s and `boardreply`.`reply_time`< %s order by `reply_time` DESC;"""
                cursor.execute(sql, (one[0], time))
                reply = cursor.fetchall()

                if one[12] is None:
                    person = one[10]
                else:
                    person = one[12]

                if one[14] is None:
                    photo = one[11]
                else:
                    photo = one[14]

                data = {
                    "board_id": one[0],
                    "board_name": one[1],
                    "board_email": one[2],
                    "board_msg": one[3],
                    "board_floor": one[4],
                    "board_time": one[5],
                    "member_id": one[8],
                    "person": person,
                    "photo": photo,
                    "reply": reply,
                }
                datalist.append(data)

            sql = """select count(*) from `boardlist` where `board_name` = %s ;"""
            cursor.execute(sql, (self.eventId,))
            total = cursor.fetchone()[0]

            if _10message_next == []:  # 若為空，表示已無留言
                nextpage = None
            else:
                nextpage = page + 1

            data = {"nextPage": nextpage,
                    "data": datalist, "logger": member_id}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "自訂的錯誤訊息"}
            print("Event.boardGet > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id, "Event.boardGet > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def replyPost(self, JWTemail, message, time, boardID):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.replyPost > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `members` WHERE `email` = %s """
            cursor.execute(command, (JWTemail,))
            member = cursor.fetchone()  # tuple or None

            if member is not None:  # 有此會員
                command = """SELECT * FROM `boardlist` WHERE `board_id` = %s """
                cursor.execute(command, (boardID,))
                line = cursor.fetchone()
                if line is not None:  # 有此樓
                    command = """SELECT * FROM `boardreply` WHERE `reply_boardID` = %s order by `reply_time` DESC for update;"""
                    cursor.execute(command, (boardID,))
                    result = cursor.fetchone()

                    if result is None:  # 此樓無回覆
                        thisfloor = f"{line[4]}-1"
                        if line[2] == JWTemail:  # 樓主自己留言就標註已讀
                            reply_status = "read"
                            reply_link = "linked"
                        else:
                            reply_status = "not read"
                            reply_link = " not link"

                        command = "insert into `boardreply` (`reply_boardID`, `reply_email`, `reply_msg`, `reply_floor`,`reply_time`,`reply_status`,`reply_link`) \
                            values(%s, %s, %s, %s, %s, %s, %s);"

                        inserttuple = (
                            boardID,
                            JWTemail,
                            message,
                            thisfloor,
                            time,
                            reply_status,
                            reply_link,
                        )
                        cursor.execute(command, inserttuple)
                    else:  # 此樓有回覆
                        a, b = result[4].split(
                            "-")[0], int(result[4].split("-")[1])
                        thisfloor = f"{a}-{b+1}"
                        if line[2] == JWTemail:  # 樓主自己留言就標註已讀
                            reply_status = "read"
                            reply_link = "linked"
                        else:
                            reply_status = "not read"
                            reply_link = " not link"

                        command = "insert into `boardreply` (`reply_boardID`, `reply_email`, `reply_msg`, `reply_floor`,`reply_time`,`reply_status`,`reply_link`) \
                            values(%s, %s, %s, %s, %s, %s, %s);"

                        inserttuple = (
                            boardID,
                            JWTemail,
                            message,
                            thisfloor,
                            time,
                            reply_status,
                            reply_link,
                        )
                        cursor.execute(command, inserttuple)

                    # 加入姓名與人像
                    if member[4] is None:
                        name = member[2]
                    else:
                        name = member[4]
                    if member[6] is None:
                        photo = member[3]
                    else:
                        photo = member[6]
                    inserttuple += (name, photo)
                    crud += 1
                else:
                    data = {"error": True, "message": "無此樓"}
            else:
                data = {"error": True, "message": "無此會員"}

        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.replyPost > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.replyPost > commit")
                CN1.commit()
                command = """SELECT * FROM `boardreply` WHERE `reply_floor` = %s and `reply_boardID` = %s;"""
                cursor.execute(command, (thisfloor, boardID))
                reply = cursor.fetchone()
                inserttuple = list(inserttuple)
                inserttuple[4] = datetime.strptime(
                    inserttuple[4], "%Y-%m-%d %H:%M:%S")
                data = {
                    "ok": True,
                    "inserttuple": inserttuple,
                    "logger": member[0],
                    "reply_id": reply[0],
                }

        finally:
            print(
                CN1.connection_id, "Event.replyPost > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def replyDelete(self, JWTemail, reply_id):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.replyDelete > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardreply` WHERE `reply_id` = %s;"""
            cursor.execute(command, (reply_id,))
            result = cursor.fetchone()  # tuple or None

            if result is not None:  # 有此回覆ID
                if JWTemail == result[2]:
                    # 刪除
                    command = """delete from `boardreply` where `reply_id` =%s ;"""
                    cursor.execute(command, (reply_id,))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message": "非本人無法刪除回覆"}
            else:
                data = {"error": True, "message": "無此回覆ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.replyDelete > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.replyDelete > commit")
                CN1.commit()
        finally:
            print(
                CN1.connection_id,
                "Event.replyDelete > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def replyPatch(self, JWTemail, reply_id, message):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Event.replyPatch > pool create")
            cursor = CN1.cursor(buffered=True)

            command = """SELECT * FROM `boardreply` WHERE `reply_id` = %s;"""
            cursor.execute(command, (reply_id,))
            result = cursor.fetchone()  # tuple or None

            if result is not None:  # 有此回覆ID
                if JWTemail == result[2]:  # 確實為本人
                    # 更新
                    command = """update `boardreply` set `reply_msg` =%s where `reply_id` =%s ;"""
                    cursor.execute(command, (message, reply_id))
                    data = {"ok": True}
                    crud += 1
                else:
                    data = {"error": True, "message": "非本人無法編輯回覆"}
            else:
                data = {"error": True, "message": "無此回覆ID"}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Event.replyPatch > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Event.replyPatch > commit")
                CN1.commit()
        finally:
            print(
                CN1.connection_id, "Event.replyPatch > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

class Notify:
    def __init__(self, JWTemail):
        self.email = JWTemail

    def notRead(self, time):
        try:
            notRead = {"a": 0, "b": 0}
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.notRead > pool create")
            cursor = CN1.cursor(buffered=True)

            # aList is 找出自己建的活動頁面上，他人的留言。時間在現在之前
            command = """select count(*) from (select boardlist.*from boardlist join members on boardlist.board_email=members.email left join activity on \
                boardlist.board_name = activity.id where activity.`host` = %s and boardlist.board_email <> %s and `boardlist`.`board_status`='not read'\
                and `boardlist`.`board_time`< %s) as a;"""
            cursor.execute(command, (self.email, self.email, time))
            aList_notRead = cursor.fetchone()
            notRead["a"] = aList_notRead[0]

            # bList is 找出自己留言上，他人對我的回覆。時間在現在之前
            command = """select count(*) from  (select boardlist.*from boardlist join (select *from  members) as a on boardlist.board_email=a.email right join\
                 (select * from boardreply) as b join (select *from  members) as c on b.reply_email=c.email on boardlist.board_id=b.reply_boardID where \
                    boardlist.board_email =%s and b.reply_email <> %s and b.reply_status='not read' and b.reply_time< %s) as d;
                """
            cursor.execute(command, (self.email, self.email, time))
            bList_notRead = cursor.fetchone()
            notRead["b"] = bList_notRead[0]

            ##
            command = """select * from members where email = %s;"""
            cursor.execute(command, (self.email,))
            member = cursor.fetchone()
            member_id = member[0]

            if member[4] is None:
                name = member[2]
            else:
                name = member[4]

            if member[6] is None:
                picture = member[3]
            else:
                picture = member[6]

            data = {
                "notRead": notRead,
                "member_id": member_id,
                "name": name,
                "picture": picture,
            }
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.notRead > 發生錯誤", data)

        finally:
            print(
                CN1.connection_id, "Notify.notRead > pool close, ", CN1.is_connected()
            )
            cursor.close()
            CN1.close()
            return data

    def read(self, time):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.read > pool create")
            cursor = CN1.cursor(buffered=True)

            # aList is 找出自己建的活動頁面上，他人的留言。時間在現在之前
            command = """select `board_id` from boardlist join members on boardlist.board_email=members.email left join activity on \
                boardlist.board_name = activity.id where activity.`host` = %s and boardlist.board_email <> %s and \
                    `boardlist`.`board_status`='not read' and `boardlist`.`board_time`< %s;"""
            cursor.execute(command, (self.email, self.email, time))
            a_notRead_idTuple = cursor.fetchall()
            a_notRead_idList = [a[0] for a in a_notRead_idTuple]
            a_notRead_idTuple = tuple(a_notRead_idList)
            a_idLen = len(a_notRead_idList)

            if a_idLen > 0:
                # update  boardlists board_status
                command = """update boardlist  set `board_status` = 'read' where `board_id` in"""
                parastr = " (" + \
                    ",".join(["%s" for i in range(a_idLen)]) + ");"
                command += parastr
                cursor.execute(command, a_notRead_idTuple)
                crud += 1

            # bList is 找出自己留言上，他人對我的回覆。時間在現在之前
            command = """select `reply_id` from boardlist join (select *from  members) as a on boardlist.board_email=a.email right join \
                (select * from boardreply) as b join (select *from  members) as c on b.reply_email=c.email on boardlist.board_id=b.reply_boardID where \
                    boardlist.board_email =%s and b.reply_email <> %s and \
                    b.reply_status='not read' and b.reply_time< %s;"""
            cursor.execute(command, (self.email, self.email, time))
            b_notRead_idTuple = cursor.fetchall()
            b_notRead_idList = [b[0] for b in b_notRead_idTuple]
            b_notRead_idTuple = tuple(b_notRead_idList)
            b_idLen = len(b_notRead_idList)

            if b_idLen > 0:
                command = """update boardreply set `reply_status` = 'read' where `reply_id` in"""
                parastr = " (" + \
                    ",".join(["%s" for i in range(b_idLen)]) + ");"
                command += parastr
                cursor.execute(command, b_notRead_idTuple)
                crud += 1
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.read > 發生錯誤", data)
            CN1.rollback()
        else:
            if crud > 0:
                print("Members.read > commit")
                CN1.commit()
            data = {"ok": True}

        finally:
            print(CN1.connection_id, "Notify.read > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def msg_boardid(self, boardid):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.msg_boardid > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """select * from boardlist join members on boardlist.board_email=members.email where `board_id` =%s;"""
            cursor.execute(command, (boardid,))
            result = cursor.fetchone()
            if result is None:
                data = {"error": True, "message": "無此筆留言"}
            else:
                data = {"ok": True, "message": result}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.msg_boardid > 發生錯誤", data)
        finally:
            print(
                CN1.connection_id,
                "Notify.msg_boardid > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def msg_replyid(self, replyid):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.msg_replyid > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """select *from boardlist join (select *from  members) as a on boardlist.board_email=a.email right join \
                (select * from boardreply) as b join (select *from  members) as c on b.reply_email=c.email on \
                boardlist.board_id=b.reply_boardID where b.reply_id =%s;"""
            cursor.execute(command, (replyid,))
            result = cursor.fetchone()
            if result is None:
                data = {"error": True, "message": "無此筆留言"}
            else:
                data = {"ok": True, "message": result}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.msg_replyid > 發生錯誤", data)

        finally:
            print(
                CN1.connection_id,
                "Notify.msg_replyid > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def notice(self, time, page):
        try:
            notification = []
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.notice > pool create")
            cursor = CN1.cursor(buffered=True)

            # 輸出通知留言
            if page > 0:
                index = page * 12
            else:
                index = page

            # aList is 找出自己建的活動頁面上，他人的留言
            command = """select *from boardlist join members on boardlist.board_email=members.email  left join activity on boardlist.board_name = activity.id where\
                activity.`host` = %s and boardlist.board_email <> %s and `boardlist`.`board_time`< %s order by `boardlist`.`board_time`DESC limit 12 offset %s ;"""
            cursor.execute(command, (self.email, self.email, time, index))
            aList = cursor.fetchall()
            for A in aList:
                if A[12] is None:
                    name = A[10]
                else:
                    name = A[12]
                if A[14] is None:
                    photo = A[11]
                else:
                    photo = A[14]

                board_time = A[5]  # UTC
                a_content = {
                    "board_id": A[0],
                    "board_name": A[1],
                    "board_PersonName": name,
                    "board_PersonPhoto": photo,
                    "board_msg": A[3],
                    "board_floor": A[4],
                    "board_time": board_time,
                    "board_status": A[6],
                    "board_link": A[7],
                }

                row = {"name": "a", "content": a_content, "time": board_time}
                notification.append(row)

            # 查詢aList index後面是否也有留言
            command = """select count(*) from  (select boardlist.*from boardlist join members on boardlist.board_email=members.email left join activity \
                on boardlist.board_name = activity.id where activity.`host` = %s and boardlist.board_email <> %s and `boardlist`.`board_time`< %s \
                    order by `boardlist`.`board_time`DESC limit 12 offset %s )as a;"""
            cursor.execute(command, (self.email, self.email, time, index + 12))
            aList_future_num = cursor.fetchone()

            # bList is 找出自己留言上，他人對我的回覆
            command = """select *from boardlist join (select *from  members) as a on boardlist.board_email=a.email right join (select * from boardreply) as b \
                join (select *from  members) as c on b.reply_email=c.email on boardlist.board_id=b.reply_boardID where\
                    boardlist.board_email =%s and b.reply_email <> %s and b.reply_time< %s order by b.`reply_time` DESC limit 12 offset %s ;"""
            cursor.execute(command, (self.email, self.email, time, index))
            bList = cursor.fetchall()

            for B in bList:
                if B[12] is None:
                    board_PersonName = B[10]
                else:
                    board_PersonName = B[12]
                if B[14] is None:
                    board_PersonPhoto = B[11]
                else:
                    board_PersonPhoto = B[14]
                if B[27] is None:
                    reply_PersonName = B[25]
                else:
                    reply_PersonName = B[27]
                if B[29] is None:
                    reply_PersonPhoto = B[26]
                else:
                    reply_PersonPhoto = B[29]
                reply_time = B[20]  # UTC
                b_content = {
                    "board_id": B[0],
                    "board_name": B[1],
                    "board_PersonName": board_PersonName,
                    "board_PersonPhoto": board_PersonPhoto,
                    "board_msg": B[3],
                    "board_floor": B[4],
                    "board_time": B[5],
                    "board_status": B[6],
                    "board_link": B[7],
                    "reply_id": B[15],
                    "reply_PersonName": reply_PersonName,
                    "reply_PersonPhoto": reply_PersonPhoto,
                    "reply_msg": B[18],
                    "reply_floor": B[19],
                    "reply_time": reply_time,
                    "reply_status": B[21],
                    "reply_link": B[22],
                }
                row = {"name": "b", "content": b_content, "time": reply_time}
                notification.append(row)

            # 查詢bList 之後有無回覆留言
            command = """select count(*) from  (select boardlist.*from boardlist join (select *from  members) as a on \
                boardlist.board_email=a.email right join (select * from boardreply) as b join (select *from  members) as c on \
                    b.reply_email=c.email on boardlist.board_id=b.reply_boardID where boardlist.board_email = %s and b.reply_email <> %s and b.reply_time< %s\
                        order by b.`reply_time` DESC limit 12 offset %s) as d;"""
            cursor.execute(command, (self.email, self.email, time, index + 12))
            bList_future_num = cursor.fetchone()

            if aList_future_num[0] == 0 and bList_future_num[0] == 0:
                nextPage = None
            else:
                nextPage = page + 1

            data = {"nextPage": nextPage, "notice": notification}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.notice > 發生錯誤", data)

        finally:
            print(CN1.connection_id, "Notify.notice > pool close, ",
                  CN1.is_connected())
            cursor.close()
            CN1.close()
            return data

    def email_inform(self, url, inform, id, lang):
        try:
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.email_inform > pool create")
            cursor = CN1.cursor(buffered=True)
            command = """ select * from activity where `id` = %s;"""
            cursor.execute(command, (id,))
            result = cursor.fetchone()
            if result is None:
                data = {"error": True, "message": "無此活動"}
            else:
                if result[1] == self.email:  # 確實為主辦人寄信
                    cursor.execute(
                        """select `attendee_email` from attendees where `attendee_eventID` = %s;""",
                        (id,),
                    )
                    attendee_tuple_list = cursor.fetchall()  # tuple or None
                    attendee_list = [a[0] for a in attendee_tuple_list]
                    if self.email not in attendee_list:  # 版主也要收到信
                        attendee_list.append(self.email)
                    html_inform(result[2], ",".join(
                        attendee_list), inform, url, lang)

                    data = {"ok": True, "email": self.email}
                else:
                    data = {"error": True, "message": "非主辦人不能寄信"}
        except:
            print(traceback.format_exc())
            data = {"error": True, "message": "伺服器內部錯誤"}
            print("Notify.email_inform > 發生錯誤", data)

        finally:
            print(
                CN1.connection_id,
                "Notify.email_inform > pool close, ",
                CN1.is_connected(),
            )
            cursor.close()
            CN1.close()
            return data

    def linked(self, main_or_reply, msgID):
        try:
            crud = 0
            CN1 = pool.get_connection()  # get a connection with pool.
            print(CN1.connection_id, "Notify.linked > pool create")
            cursor = CN1.cursor()
            if main_or_reply == 'a': # 更改主要/主樓留言之link狀態
                command = "select c.host, c.board_link from (select *from boardlist as b left join activity as a on  b.`board_name`=a.`id` where b.`board_id`=%s) as c;"
                cursor.execute(command, (msgID,))
                fetchback = cursor.fetchall() # list contains one tuple, tuple第一個元素是活動版主,第二個元素是否讀了留言

                if len(fetchback) == 0: # 沒有此筆留言
                    data = {"error": True, "message": "no result from boardlist"}
                elif self.email != fetchback[0][0]: # 確認是否為活動主已讀留言
                    data = {"error": True, "message": "no authorization to see board msg"}
                elif 'linked' == fetchback[0][1]: # 被讀取過的留言就不必再讀
                    data = {"error": True, "message": "repeat linked board msg"}
                else:
                    command = """update `boardlist` set `board_link` = %s where `board_id` = %s"""
                    cursor.execute(command, ('linked', msgID))
                    crud += 1
            elif main_or_reply == 'b': # 更改回覆留言之link狀態
                command = "select c.board_email, c.reply_link from (select *from boardreply as r left join boardlist as b on r.`reply_boardID`=b.`board_id` where r.`reply_id`=%s) as c;"
                cursor.execute(command, (msgID,))
                fetchback = cursor.fetchall() # list contains one tuple, tuple第一個元素是主留言者,第二個元素是否讀了回覆留言
                
                if len(fetchback) == 0: # 沒有此筆留言
                    data = {"error": True, "message": "no result from boardreply"}
                elif self.email != fetchback[0][0]: # 確認是否為留言主人已讀其回覆留言
                    data = {"error": True, "message": "no authorization to see reply msg"}
                elif 'linked' == fetchback[0][1]: # 被讀取過的留言就不必再讀
                    data = {"error": True, "message": "repeat linked reply msg"}
                else:
                    command = """update `boardreply` set `reply_link` = %s where `reply_id` = %s"""
                    cursor.execute(command, ('linked', msgID))
                    crud += 1
        except:
            CN1.rollback()
            print(traceback.format_exc())
            print("Notify.linked > 發生錯誤")
            data = {"error": True, "message": "伺服器內部錯誤"}
        else:
            if crud > 0:
                print("Notify.linked  > commit")
                CN1.commit()
                data = {"ok": True}
        finally:
            print(CN1.connection_id, "Notify.linked > pool close, ",CN1.is_connected())
            cursor.close()
            CN1.close()
            return data