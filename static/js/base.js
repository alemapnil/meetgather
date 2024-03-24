var access_token,
  userName,
  userEmail,
  userPicture,
  anchortm,
  clickNoticeMsg = 0,
  language;
var notification = {},
  notice_nextPage,
  noticePage_record = [],
  notRead_num;
var current_url = window.location.href;
var english_i18n, chinese_i18n;

var days_en = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
var month_en = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
var days_cn = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
var month_cn = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

var tzOffset = new Date()
  .toString()
  .split(" ")[5]
  .replace("GMT", "")
  .replace("+", "%2b");

var ALLOWED_EXTENSIONS = ["image/png", "image/jpeg", "image/gif"];

var spaceOff = new RegExp("\\s", "g");
var nonSpacePat = new RegExp("\\S", "g");

//i18n
for (let i = 0; i < document.cookie.split(";").length; i++) {
  if (document.cookie.split(";")[i].includes("language")) {
    language = document.cookie
      .split(";")
      [i].replace("language=", "")
      .replace(spaceOff, "");
  }
}
if (language === undefined && navigator.language.slice(0, 2) !== "zh") {
  //瀏覽器不是中文一律轉英文
  langCookie("en");
  English();
} else if (language === undefined && navigator.language.slice(0, 2) === "zh") {
  langCookie("zh");
  Chinese();
} else if (language === "en") {
  English();
} else if (language === "zh") {
  Chinese();
}

load();
//點擊語言轉換
for (let l = 0; l < document.querySelectorAll(".earth").length; l++) {
  document.querySelectorAll(".earth")[l].addEventListener("click", function () {
    let nowLang = document.querySelectorAll(".earth span")[l].innerHTML;
    if (nowLang === "English") {
      langCookie("en");
    } else if (nowLang === "中文") {
      langCookie("zh");
    }
    window.location.reload();
  });
}
//set language cookie
function langCookie(para) {
  document.cookie = `language=${para};path=/; `;
  for (let i = 0; i < document.cookie.split(";").length; i++) {
    if (document.cookie.split(";")[i].includes("language")) {
      language = document.cookie
        .split(";")
        [i].replace("language=", "")
        .replace(spaceOff, "");
    }
  }
}
//轉英文
function English() {
  if (english_i18n === undefined) {
    fetch(`/lang/en`)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .then(function (dict) {
        english_i18n = dict;
        for (let l = 0; l < document.querySelectorAll(".lang").length; l++) {
          let langName = document
            .querySelectorAll(".lang")
            [l].getAttribute("key");
          document.querySelectorAll(".lang")[l].innerHTML =
            english_i18n[langName];
        }
      });
  } else {
    for (let l = 0; l < document.querySelectorAll(".lang").length; l++) {
      let langName = document.querySelectorAll(".lang")[l].getAttribute("key");
      document.querySelectorAll(".lang")[l].innerHTML = english_i18n[langName];
    }
  }
  for (let l = 0; l < document.querySelectorAll(".keyword").length; l++) {
    document
      .querySelectorAll(".keyword")
      [l].setAttribute("placeholder", "Search for keyword");
  }
}
//轉中文
function Chinese() {
  if (chinese_i18n === undefined) {
    fetch(`/lang/zh`)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .then(function (dict) {
        chinese_i18n = dict;
        for (let l = 0; l < document.querySelectorAll(".lang").length; l++) {
          let langName = document
            .querySelectorAll(".lang")
            [l].getAttribute("key");
          document.querySelectorAll(".lang")[l].innerHTML =
            chinese_i18n[langName];
        }
      });
  } else {
    for (let l = 0; l < document.querySelectorAll(".lang").length; l++) {
      let langName = document.querySelectorAll(".lang")[l].getAttribute("key");
      document.querySelectorAll(".lang")[l].innerHTML = chinese_i18n[langName];
    }
  }
  for (let l = 0; l < document.querySelectorAll(".keyword").length; l++) {
    document
      .querySelectorAll(".keyword")
      [l].setAttribute("placeholder", "輸入活動關鍵字");
  }
}

//畫面一載入先要做的事
async function load() {
  //clear all input values
  for (i = 0; i < document.getElementsByTagName("input").length; i++) {
    document.getElementsByTagName("input")[i].value = "";
  }
  for (i = 0; i < document.getElementsByTagName("textarea").length; i++) {
    document.getElementsByTagName("textarea")[i].value = "";
  }

  createYear();
  if (document.cookie.includes("access_token")) {
    const myArray = document.cookie.split(";");
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].includes("access_token")) {
        access_token = myArray[i]
          .replace("access_token=", "")
          .replace(spaceOff, "");
      }
    }
    await googleInfo(access_token);
  } else {
    notlogin_display();
  }
  if (current_url.includes("/create")) {
    await create();
  }
  if (current_url.includes("/evedit")) {
    await evedit();
  }
  if (current_url.includes("/event")) {
    await activity();
  }
  if (current_url.includes("/find")) {
    rederCalender();
    await find();
  }
  if (current_url.includes("/profile")) {
    await profile();
  }

  setTimeout(() => {
    document.querySelector(".overlay").style.display = "none";
  }, 0);
  fetch("/api/scrape", {
    method: "POST",
    body: JSON.stringify({ url: `${window.location.href}` }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
  })
    .then(function (response) {
      return response.json();
    })
    .catch((error) => console.error("Error:", error))
    .then(function (dict) {});
}

//登入者資料。已登入時，右上角要做相應變化，還有token過期時的調整
async function googleInfo(para) {
  await fetch("/api/user", { headers: { Authorization: `Bearer ${para}` } })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      }
    })
    .catch((error) => {
      console.error("GET /api/user 錯誤:", error);
    })
    .then(function (dict) {
      if (dict === undefined) {
        deleteAllCookies();
        notlogin_display();
      } else if ("invalidToken" in dict) {
        document.cookie =
          "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        notlogin_display();
      } else if ("ok" in dict) {
        userEmail = dict["email"];
        //登入後右上角圖示變化
        for (let i = 0; i < document.querySelectorAll(".frame1").length; i++) {
          document.querySelectorAll(".frame1")[i].style.display = "none";
          document.querySelectorAll(".frame2")[i].style.display = "flex";
          document.querySelector(".fr2").style.display = "block";
          document.querySelector(".fr3").style.display = "block";
        }
        for (
          let i = 0;
          i < document.querySelectorAll(".shot img").length;
          i++
        ) {
          let shot_img = document.querySelectorAll(".shot img")[i];
          shot_img.src = dict["picture"];
          document.querySelectorAll(".shot")[i].appendChild(shot_img);
          document
            .querySelectorAll(".shot")
            [i].setAttribute("member_id", dict["member_id"]);
          document
            .querySelectorAll(".myprofile a")
            [i].setAttribute("href", `/profile?member=${dict["member_id"]}`);
        }

        //通知數字變化
        notRead_num = dict["notRead"]["a"] + dict["notRead"]["b"];

        if (notRead_num > 99) {
          notRead_num = 99;
        }

        if (notRead_num > 0) {
          for (
            let n = 0;
            n < document.querySelectorAll(".frame2 .notice").length;
            n++
          ) {
            document.querySelectorAll(".frame2 .notice")[n].style.visibility =
              "visible";
            document.querySelectorAll(".frame2 .notice")[
              n
            ].innerHTML = `<span>${notRead_num}</span>`;
          }
        } else {
          for (
            let n = 0;
            n < document.querySelectorAll(".frame2 .notice").length;
            n++
          ) {
            document.querySelectorAll(".frame2 .notice")[
              n
            ].innerHTML = `<span>${notRead_num}</span>`;
            document.querySelectorAll(".frame2 .notice")[n].style.visibility =
              "hidden";
          }
        }
        //時間戳記
        anchortm = dict["anchortm"];
      } else {
        notlogin_display();
      }
    });
}

// 將未讀變已讀(紅色警示)
function turnToRead() {
  fetch("/api/user", {
    method: "PATCH",
    body: JSON.stringify({ anchortm: anchortm }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      }
    })
    .catch((error) => {
      console.error("PATCH /api/user 錯誤:", error);
    })
    .then(function (dict) {
      if ("invalidToken" in dict) {
        window.location.reload();
      } else if ("ok" in dict) {
        notRead_num = 0;
        for (
          let n = 0;
          n < document.querySelectorAll(".frame2 .notice").length;
          n++
        ) {
          document.querySelectorAll(".frame2 .notice")[
            n
          ].innerHTML = `<span>${notRead_num}</span>`;
          document.querySelectorAll(".frame2 .notice")[n].style.visibility =
            "hidden";
        }
      } else {
        console.log("unknown problem", dict);
      }
    });
}

// 載入通知訊息
function getNotice(page) {
  fetch("/api/user", {
    method: "POST",
    body: JSON.stringify({ anchortm: anchortm, page: page }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      }
    })
    .catch((error) => {
      console.error("POST /api/user 錯誤:", error);
    })
    .then(function (dict) {
      if ("invalidToken" in dict) {
        window.location.reload();
      } else if ("notice" in dict) {
        let notice = dict["notice"];
        notice_nextPage = dict["nextPage"];
        notice.sort(function (a, b) {
          return new Date(b["time"]) - new Date(a["time"]);
        });
        //製作一條條留言
        for (let n = 0; n < notice.length; n++) {
          if (notice[n]["name"] === "a") {
            let A1 = notice[n]["name"],
              A2 = notice[n]["content"]["board_PersonPhoto"];
            let A3 = notice[n]["content"]["board_PersonName"],
              A4 = notice[n]["content"]["board_floor"];
            let board_tm = new Date(notice[n]["time"]);
            let A5 = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1
            ).padStart(2, "0")}-${String(board_tm.getDate()).padStart(
              2,
              "0"
            )} ${String(board_tm.getHours()).padStart(2, "0")}:${String(
              board_tm.getMinutes()
            ).padStart(2, "0")}`;
            let A6 = notice[n]["content"]["board_name"];
            rowbox(A1, A2, A3, A4, A5, A6, notice[n]);
          } else if (notice[n]["name"] === "b") {
            let A1 = notice[n]["name"],
              A2 = notice[n]["content"]["reply_PersonPhoto"];
            let A3 = notice[n]["content"]["reply_PersonName"],
              A4 = notice[n]["content"]["reply_floor"];
            let board_tm = new Date(notice[n]["time"]);
            let A5 = `${board_tm.getFullYear()}-${String(
              board_tm.getMonth() + 1
            ).padStart(2, "0")}-${String(board_tm.getDate()).padStart(
              2,
              "0"
            )} ${String(board_tm.getHours()).padStart(2, "0")}:${String(
              board_tm.getMinutes()
            ).padStart(2, "0")}`;
            let A6 = notice[n]["content"]["board_name"];
            rowbox(A1, A2, A3, A4, A5, A6, notice[n]);
          }
        }
        //點擊通知的每一行row
        for (
          let r = 0;
          r < document.querySelectorAll(".rowbox .row").length;
          r++
        ) {
          document
            .querySelectorAll(".rowbox .row")
            [r].addEventListener("click", function (e) {
              let noticeid = this.getAttribute("noticeid");
              let name = notification[noticeid]["name"];
              if (name === "a") {
                let board_id = notification[noticeid]["content"]["board_id"];
                noticeMsg_A(board_id);
              } else if (name === "b") {
                let reply_id = notification[noticeid]["content"]["reply_id"];
                noticeMsg_B(reply_id);
              }
              e.stopPropagation();
            });
        }

        if (page === 0 && notice.length === 0) {
          let noDiv = document.createElement("div");
          noDiv.setAttribute("id", "emptyNotice");
          if (language === "en") {
            noDiv.appendChild(document.createTextNode("None notification"));
          } else if (language === "zh") {
            noDiv.appendChild(document.createTextNode("目前沒有任何通知"));
          }

          if (screen.width > 780) {
            document.querySelector(".noticeBlock .rowbox").appendChild(noDiv);
          } else {
            document.querySelector("._2tail .rowbox").appendChild(noDiv);
          }
        }

        //移除黃色loading圖示
        for (
          let r = 0;
          r < document.querySelectorAll(".rowbox .load").length;
          r++
        ) {
          document.querySelectorAll(".rowbox .load")[r].remove();
        }
        //加載畫面未超過螢幕
        if (
          (screen.width <= 780 &&
            document.querySelector(".modal11 .rowbox").offsetHeight <=
              screen.height) ||
          (screen.width > 780 &&
            document.querySelector(".floatRight .tail").offsetHeight <=
              document.querySelector(".floatRight .rowbox").offsetHeight)
        ) {
          if (notice_nextPage) {
            if (noticePage_record.includes(notice_nextPage)) {
            } else {
              noticePage_record.push(notice_nextPage);
              //載入留言
              noticeLoad();
              setTimeout("getNotice(notice_nextPage)", 500);
            }
          }
        }
      } else {
        console.log("unknown problem", dict);
      }
    });
}

// fetch 通知詳細留言內容
function noticeMsg_A(board_id) {
  clickNoticeMsg += 1;
  if (clickNoticeMsg === 1) {
    popup5Load();
    fetch(`/api/message/?boardid=${board_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
      })
      .catch((error) => {
        console.error("GET /api/message 錯誤:", error);
      })
      .then(function (dict) {
        if ("invalidToken" in dict) {
          document.cookie =
            "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.reload();
        } else if ("ok" in dict) {
          noticeMsg_A_window(dict["message"]);
        } else if ("error" in dict) {
          if (dict["message"] === "無此筆留言") {
            emptyMsg_window();
          }
        } else {
          console.log("unknown problem", dict);
        }
        clickNoticeMsg = 0;
      });
  }
}

// 點擊某樓通知訊息，等待通知訊息出現，loading...
function popup5Load() {
  document.querySelector(".modal5").style.display = "block";
  document.querySelector(".window5").style.display = "flex";
  document.querySelector(".popup5Load").style.display = "block";
  document.querySelector(".popup5").style.display = "none";
}

// 製作通知詳細留言視窗(已刪除)
function emptyMsg_window() {
  document.querySelector(".popup5Load").style.display = "none";
  document.querySelector(".popup5").style.display = "block";
  document.querySelector(".popup5").innerHTML = ""; //淨空

  let close5 = document.createElement("div");
  close5.className = "close5";
  let spanclose5 = document.createElement("span");
  spanclose5.appendChild(document.createTextNode("×"));
  close5.appendChild(spanclose5);
  document.querySelector(".popup5").appendChild(close5);

  let goto2 = document.createElement("div");
  goto2.className = "goto2";
  if (language === "en") {
    goto2.appendChild(document.createTextNode("Deleted message"));
  } else if (language === "zh") {
    goto2.appendChild(document.createTextNode("留言已刪除"));
  }
  document.querySelector(".popup5").appendChild(goto2);

  let no_line = document.createElement("div");
  no_line.className = "no_line";

  let img = document.createElement("img");
  img.src = "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/empty.png";
  no_line.appendChild(img);
  document.querySelector(".popup5").appendChild(no_line);

  //關閉通知留言視窗
  document
    .querySelector(".popup5 .close5 span")
    .addEventListener("click", function (e) {
      document.querySelector(".modal5").style.display = "none";
      document.querySelector(".window5").style.display = "none";
      e.stopPropagation();
    });
}

// 製作通知詳細留言視窗(boardid)
function noticeMsg_A_window(para) {
  document.querySelector(".popup5Load").style.display = "none";
  document.querySelector(".popup5").style.display = "block";
  document.querySelector(".popup5").innerHTML = ""; //淨空

  let close5 = document.createElement("div");
  close5.className = "close5";
  let spanclose5 = document.createElement("span");
  spanclose5.appendChild(document.createTextNode("×"));
  close5.appendChild(spanclose5);
  document.querySelector(".popup5").appendChild(close5);

  let goto = document.createElement("div");
  goto.className = "goto";
  if (language === "en") {
    goto.innerHTML = `Go to<a href="/event/${para[1]}">activity</a>page`;
  } else if (language === "zh") {
    goto.innerHTML = `去<a href="/event/${para[1]}">貼文</a>查看完整留言`;
  }
  //
  document.querySelector(".popup5").appendChild(goto);

  let line = document.createElement("div");
  line.className = "line";

  let message_photo = document.createElement("div");
  message_photo.className = "message_photo";

  let imgA = document.createElement("a");
  imgA.setAttribute("href", `/profile?member=${para[8]}`);

  let imgDiv = document.createElement("div");
  let img = document.createElement("img");
  if (para[14] === null) {
    img.src = para[11];
  } else {
    img.src = para[14];
  }
  img.setAttribute("referrerpolicy", "no-referrer");
  imgA.appendChild(img);
  imgDiv.appendChild(imgA);
  message_photo.appendChild(imgDiv);
  line.appendChild(message_photo);

  let message_middle = document.createElement("div");
  message_middle.className = "message_middle";

  let personName = document.createElement("div");
  let personNameSpan = document.createElement("span");
  let spanA = document.createElement("a");
  spanA.setAttribute("href", `/profile?member=${para[8]}`);
  personName.className = "personName";
  if (para[12] === null) {
    personNameSpan.appendChild(document.createTextNode(para[10]));
  } else {
    personNameSpan.appendChild(document.createTextNode(para[12]));
  }
  spanA.appendChild(personNameSpan);
  message_middle.appendChild(spanA);

  let personMsg = document.createElement("div");
  personMsg.className = "personMsg";
  personMsg.appendChild(document.createTextNode(para[3]));
  message_middle.appendChild(personMsg);

  let personBT = document.createElement("div");
  personBT.className = "personBT";

  let floor = document.createElement("span");
  floor.className = "floor";
  floor.appendChild(document.createTextNode(para[4] + " · "));

  let personTM = document.createElement("span");
  personTM.className = "personTM";
  let reply_time = new Date(para[5]);
  let strReplyTm = `${reply_time.getFullYear()}-${String(
    reply_time.getMonth() + 1
  ).padStart(2, "0")}-${String(reply_time.getDate()).padStart(2, "0")} ${String(
    reply_time.getHours()
  ).padStart(2, "0")}:${String(reply_time.getMinutes()).padStart(2, "0")}`;
  //
  personTM.appendChild(document.createTextNode(strReplyTm));
  personBT.appendChild(floor);
  personBT.appendChild(personTM);
  message_middle.appendChild(personBT);
  line.appendChild(message_middle);
  document.querySelector(".popup5").appendChild(line);

  //關閉通知留言視窗
  document
    .querySelector(".popup5 .close5 span")
    .addEventListener("click", function (e) {
      document.querySelector(".modal5").style.display = "none";
      document.querySelector(".window5").style.display = "none";
      e.stopPropagation();
    });
}

// fetch 通知詳細留言內容
function noticeMsg_B(reply_id) {
  clickNoticeMsg += 1;
  if (clickNoticeMsg === 1) {
    popup5Load();
    fetch(`/api/message/?replyid=${reply_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
      })
      .catch((error) => {
        console.error("GET /api/message 錯誤:", error);
      })
      .then(function (dict) {
        if ("invalidToken" in dict) {
          document.cookie =
            "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.reload();
        } else if ("ok" in dict) {
          noticeMsg_B_window(dict["message"]);
        } else if ("error" in dict) {
          if (dict["message"] === "無此筆留言") {
            emptyMsg_window();
          }
        } else {
          console.log("unknown problem", dict);
        }
        clickNoticeMsg = 0;
      });
  }
}

// 製作通知詳細留言視窗(reply_id)
function noticeMsg_B_window(para) {
  document.querySelector(".popup5Load").style.display = "none";
  document.querySelector(".popup5").style.display = "block";
  document.querySelector(".popup5").innerHTML = ""; //淨空

  let close5 = document.createElement("div");
  close5.className = "close5";
  let spanclose5 = document.createElement("span");
  spanclose5.appendChild(document.createTextNode("×"));
  close5.appendChild(spanclose5);
  document.querySelector(".popup5").appendChild(close5);

  let goto = document.createElement("div");
  goto.className = "goto";
  if (language === "en") {
    goto.innerHTML = `Go to<a href="/event/${para[1]}">activity</a>page`;
  } else if (language === "zh") {
    goto.innerHTML = `去<a href="/event/${para[1]}">貼文</a>查看完整留言`;
  }
  document.querySelector(".popup5").appendChild(goto);

  let line = document.createElement("div");
  line.className = "line";

  let message_photo = document.createElement("div");
  message_photo.className = "message_photo";

  let imgDiv = document.createElement("div");
  let imgA = document.createElement("a");
  imgA.setAttribute("href", `/profile?member=${para[8]}`);
  let img = document.createElement("img");
  if (para[14] === null) {
    img.src = para[11];
  } else {
    img.src = para[14];
  }
  img.setAttribute("referrerpolicy", "no-referrer");
  imgA.appendChild(img);
  imgDiv.appendChild(imgA);
  message_photo.appendChild(imgDiv);
  line.appendChild(message_photo);

  let message_middle = document.createElement("div");
  message_middle.className = "message_middle";

  let personName = document.createElement("div");
  let personName_A = document.createElement("a");
  personName_A.setAttribute("href", `/profile?member=${para[8]}`);
  let personName_span = document.createElement("span");
  personName.className = "personName";
  if (para[12] === null) {
    personName_span.appendChild(document.createTextNode(para[10]));
  } else {
    personName_span.appendChild(document.createTextNode(para[12]));
  }
  personName_A.appendChild(personName_span);
  personName.appendChild(personName_A);
  message_middle.appendChild(personName);

  let personMsg = document.createElement("div");
  personMsg.className = "personMsg";
  personMsg.appendChild(document.createTextNode(para[3]));
  message_middle.appendChild(personMsg);

  let personBT = document.createElement("div");
  personBT.className = "personBT";

  let floor = document.createElement("span");
  floor.className = "floor";
  floor.appendChild(document.createTextNode(para[4] + " · "));

  let personTM = document.createElement("span");
  personTM.className = "personTM";
  let reply_time = new Date(para[5]);
  let strReplyTm = `${reply_time.getFullYear()}-${String(
    reply_time.getMonth() + 1
  ).padStart(2, "0")}-${String(reply_time.getDate()).padStart(2, "0")} ${String(
    reply_time.getHours()
  ).padStart(2, "0")}:${String(reply_time.getMinutes()).padStart(2, "0")}`;
  personTM.appendChild(document.createTextNode(strReplyTm));
  personBT.appendChild(floor);
  personBT.appendChild(personTM);
  message_middle.appendChild(personBT);
  line.appendChild(message_middle);
  document.querySelector(".popup5").appendChild(line);
  //
  let _2line = document.createElement("div");
  _2line.className = "_2line";

  let leftDiv = document.createElement("div");
  _2line.appendChild(leftDiv);
  let rightDiv = document.createElement("div");
  rightDiv.className = "right";

  let _2message_photo = document.createElement("div");
  _2message_photo.className = "_2message_photo";
  let _2imgDiv = document.createElement("div");
  let _imgA = document.createElement("a");
  _imgA.setAttribute("href", `/profile?member=${para[23]}`);
  let _img = document.createElement("img");
  if (para[29] === null) {
    _img.src = para[26];
  } else {
    _img.src = para[29];
  }
  _img.setAttribute("referrerpolicy", "no-referrer");
  _imgA.appendChild(_img);
  _2imgDiv.appendChild(_imgA);
  _2message_photo.appendChild(_2imgDiv);
  rightDiv.appendChild(_2message_photo);

  let _2message_middle = document.createElement("div");
  _2message_middle.className = "_2message_middle";

  let _2personName = document.createElement("div");
  _2personName.className = "_2personName";
  let _2personNameA = document.createElement("a");
  _2personNameA.setAttribute("href", `/profile?member=${para[23]}`);
  let _2personNameSpan = document.createElement("span");

  if (para[27] === null) {
    _2personNameSpan.appendChild(document.createTextNode(para[25]));
  } else {
    _2personNameSpan.appendChild(document.createTextNode(para[27]));
  }
  _2personNameA.appendChild(_2personNameSpan);
  _2personName.appendChild(_2personNameA);
  _2message_middle.appendChild(_2personName);

  let _2personMsg = document.createElement("div");
  _2personMsg.className = "_2personMsg";
  _2personMsg.appendChild(document.createTextNode(para[18]));
  _2message_middle.appendChild(_2personMsg);

  let _2personBT = document.createElement("div");
  _2personBT.className = "_2personBT";

  let _2floor = document.createElement("span");
  _2floor.className = "_2floor";
  _2floor.appendChild(document.createTextNode(para[19] + " · "));

  let _2personTM = document.createElement("span");
  _2personTM.className = "_2personTM";
  let _reply_time = new Date(para[20]);
  let _strReplyTm = `${_reply_time.getFullYear()}-${String(
    _reply_time.getMonth() + 1
  ).padStart(2, "0")}-${String(_reply_time.getDate()).padStart(
    2,
    "0"
  )} ${String(_reply_time.getHours()).padStart(2, "0")}:${String(
    _reply_time.getMinutes()
  ).padStart(2, "0")}`;
  _2personTM.appendChild(document.createTextNode(_strReplyTm));
  _2personBT.appendChild(_2floor);
  _2personBT.appendChild(_2personTM);
  _2message_middle.appendChild(_2personBT);
  rightDiv.appendChild(_2message_middle);
  _2line.appendChild(rightDiv);
  document.querySelector(".popup5").appendChild(_2line);

  //關閉通知留言視窗
  document
    .querySelector(".popup5 .close5 span")
    .addEventListener("click", function (e) {
      document.querySelector(".modal5").style.display = "none";
      document.querySelector(".window5").style.display = "none";
      e.stopPropagation();
    });
}

//make rowbox Div
function rowbox(type, photo, name, floor, time, board_name, notice) {
  notification[Object.keys(notification).length + 1] = notice;

  let rowDiv = document.createElement("div");
  rowDiv.className = "row";
  rowDiv.setAttribute("noticeID", Object.keys(notification).length);
  let photoDiv = document.createElement("div");
  photoDiv.className = "photo";

  let imgDiv = document.createElement("div");
  let img = document.createElement("img");
  img.src = photo;
  img.setAttribute("referrerpolicy", "no-referrer");
  imgDiv.appendChild(img);
  photoDiv.appendChild(imgDiv);
  rowDiv.appendChild(photoDiv);

  let content = document.createElement("div");
  content.className = "content";
  let message = document.createElement("div");
  message.className = "message";

  if (type === "a") {
    if (language === "en") {
      message.innerHTML = `<span>${name}</span> writes a comment`;
    } else if (language === "zh") {
      message.innerHTML = `<span>${name}</span>在你的活動中留言`;
    }
  } else if (type === "b") {
    if (language === "en") {
      message.innerHTML = `<span>${name}</span> responds your comment`;
    } else if (language === "zh") {
      message.innerHTML = `<span>${name}</span>回覆了你的留言`;
    }
  }

  content.appendChild(message);
  let messagetime = document.createElement("div");
  messagetime.className = "messagetime";
  messagetime.appendChild(
    document.createTextNode(`${floor} · ${time.slice(0, 16)}`)
  );
  content.appendChild(messagetime);
  rowDiv.appendChild(content);

  if (screen.width > 780) {
    document.querySelector(".noticeBlock .rowbox .tail").appendChild(rowDiv);
  } else {
    document.querySelector(".modal11 ._2tail  .rowbox").appendChild(rowDiv);
  }
}

//桌機通知鈴鐺
document.querySelectorAll(".alarm")[0].addEventListener("click", function (e) {
  if (notRead_num > 0) {
    turnToRead();
  }
  if (document.querySelector(".floatRight").style.display !== "block") {
    document.querySelector(".floatRight").style.display = "block";
    if (
      document.querySelector(".rowbox img") === null &&
      document.getElementById("emptyNotice") === null
    ) {
      noticeLoad();
      setTimeout("getNotice(0)", 500);
    }
  } else if (document.querySelector(".floatRight").style.display === "block") {
    document.querySelector(".floatRight").style.display = "none";
  }

  //若頭像為開啟狀態須關閉
  for (i = 0; i < document.querySelectorAll(".myinfo").length; i++) {
    if (document.querySelectorAll(".myinfo")[i].style.display === "flex") {
      document.querySelectorAll(".myinfo")[i].style.display = "none";
      document.querySelector(".fr2").style.marginTop = "0px";
      document.querySelector(".fr3").style.marginTop = "0px";
    }
  }
  e.stopPropagation();
});

//手機通知鈴鐺
document.querySelectorAll(".alarm")[1].addEventListener("click", function (e) {
  if (notRead_num > 0) {
    turnToRead();
  }
  if (document.querySelector(".modal11").style.display !== "block") {
    document.querySelector(".modal11").style.display = "block";
    document.body.classList.add("noscroll");
    if (
      document.querySelector(".modal11 .rowbox img") === null &&
      document.getElementById("emptyNotice") === null
    ) {
      noticeLoad();
      setTimeout("getNotice(0)", 500);
    }
  } else if (document.querySelector(".modal11").style.display === "block") {
    document.querySelector(".modal11").style.display = "none";
  }

  //若頭像為開啟狀態須關閉
  for (i = 0; i < document.querySelectorAll(".myinfo").length; i++) {
    if (document.querySelectorAll(".myinfo")[i].style.display === "flex") {
      document.querySelectorAll(".myinfo")[i].style.display = "none";
      document.querySelector(".fr2").style.marginTop = "0px";
      document.querySelector(".fr3").style.marginTop = "0px";
    }
  }
  e.stopPropagation();
});

// delete all cookies
function deleteAllCookies() {
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

//顯示copyright西元年
function createYear() {
  let Today = new Date();
  document.querySelector(".year").innerHTML = Today.getFullYear();
}

//未登入時右上角的呈現畫面
function notlogin_display() {
  for (let i = 0; i < document.querySelectorAll(".frame1").length; i++) {
    document.querySelectorAll(".frame1")[i].style.display = "flex";
    document.querySelectorAll(".frame2")[i].style.display = "none";
    document.querySelector(".fr2").style.display = "none";
    document.querySelector(".fr3").style.display = "none";
  }
}

//點擊頭像後下方出現個人活動編輯
for (let i = 0; i < document.querySelectorAll(".shot").length; i++) {
  document.querySelectorAll(".shot")[i].addEventListener("click", function (e) {
    if (document.querySelectorAll(".myinfo")[i].style.display === "flex") {
      document.querySelectorAll(".myinfo")[i].style.display = "none";
      document.querySelector(".fr2").style.marginTop = "0px";
      document.querySelector(".fr3").style.marginTop = "0px";
    } else {
      document.querySelectorAll(".myinfo")[i].style.display = "flex";
      document.querySelector(".fr2").style.display = "block";
      document.querySelector(".fr2").style.marginTop = "118px";
      document.querySelector(".fr3").style.display = "block";
      document.querySelector(".fr3").style.marginTop = "118px";
    }

    //若通知留言為開啟狀態須關閉
    if (document.querySelector(".floatRight").style.display === "block") {
      document.querySelector(".floatRight").style.display = "none";
    }

    e.stopPropagation();
  });
}

//點擊任何一處都使個人活動編輯與通知內容消失
document
  .getElementsByTagName("body")[0]
  .addEventListener("click", function (e) {
    for (i = 0; i < document.querySelectorAll(".myinfo").length; i++) {
      if (document.querySelectorAll(".myinfo")[i].style.display === "flex") {
        document.querySelectorAll(".myinfo")[i].style.display = "none";
        document.querySelector(".fr2").style.marginTop = "0px";
        document.querySelector(".fr3").style.marginTop = "0px";
      }
    }

    //若通知留言為開啟狀態須關閉，除非mdal5是開啟的
    if (document.querySelector(".modal5").style.display === "block") {
    } else {
      if (document.querySelector(".floatRight").style.display === "block") {
        document.querySelector(".floatRight").style.display = "none";
      }
    }
  });

//點擊通知內容關閉
document
  .querySelector(".noticeBlock .rowbox .head span:nth-child(2)")
  .addEventListener("click", function () {
    if (document.querySelector(".floatRight").style.display === "block") {
      document.querySelector(".floatRight").style.display = "none";
    }
  });

//點擊登入
for (i = 0; i < document.querySelectorAll(".login").length; i++) {
  document.querySelectorAll(".login")[i].addEventListener("click", function () {
    document.cookie =
      "currentpage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; //清除之前設定的cookie
    document.cookie = `currentpage=${window.location.href};path=/ `;
    window.location.href = "/login";
  });
}

//點擊登出
function logout() {
  //重整畫面出現
  fetch("/api/user", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access_token}` },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      }
    })
    .catch((error) => {
      console.error("DELETE /api/user 錯誤:", error);
    })
    .then(function (dict) {
      if ("ok" in dict || "invalidToken" in dict) {
        document.cookie =
          "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        if (
          window.location.href.includes("/find") ||
          window.location.href.includes("/event")
        ) {
          window.location.reload();
        } else {
          window.location.href = "/";
        }
      } else {
        console.log("unknown problem", dict);
      }
    });
}
document.querySelector(".logoutA").addEventListener("click", logout);
document.querySelector(".logoutB").addEventListener("click", logout);

//搜尋欄hover
for (let k = 0; k < document.querySelectorAll(".keyword").length; k++) {
  document
    .querySelectorAll(".keyword")
    [k].addEventListener("focusin", function () {
      this.style.borderColor = "#f6d819";
    });
  document
    .querySelectorAll(".keyword")
    [k].addEventListener("focusout", function () {
      this.style.borderColor = "#BEBEBE";
    });
}

//關鍵字放大鏡
for (let k = 0; k < document.querySelectorAll(".keyword").length; k++) {
  document.querySelectorAll(".search button")[k].addEventListener(
    "focusin",
    function () {
      document.querySelectorAll(".keyword")[k].style.borderColor = "#f6d819";
    },
    false
  );
  document.querySelectorAll(".search button")[k].addEventListener(
    "focusout",
    function () {
      document.querySelectorAll(".keyword")[k].style.borderColor = "#BEBEBE";
    },
    false
  );
}

function keywordSearch(index) {
  let keyin = document.querySelectorAll(".keyword")[index].value.trim();
  if (!current_url.includes("/find")) {
    //不是在搜尋頁面
    let slash_i = current_url.indexOf("/");
    window.location.href =
      current_url.slice(0, slash_i) + `/find?&keyword=${keyin}`;
  } else {
    //在搜尋頁面
    if (current_url.includes("keyword=")) {
      //先前有輸入過關鍵字
      let arr = current_url.split("&");
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes("keyword=")) {
          //去掉URL頁碼
          let newUrl;
          newUrl = arr
            .slice(0, i)
            .concat([`keyword=${keyin}`])
            .concat(arr.slice(i + 1))
            .join("&");
          if (newUrl.includes("page=")) {
            let _2newUrl = newUrl.split("&");
            for (let n = 0; n < _2newUrl.length; n++) {
              if (_2newUrl[n].includes("page=")) {
                newUrl = _2newUrl
                  .slice(0, n)
                  .concat(_2newUrl.slice(n + 1))
                  .join("&");
              }
            }
          }
          window.location.href = newUrl;
        }
      }
    } else {
      //先前沒輸入過關鍵字

      //去掉URL頁碼
      let newUrl;
      newUrl = current_url + `&keyword=${keyin}`;
      if (newUrl.includes("page=")) {
        let _2newUrl = newUrl.split("&");
        for (let n = 0; n < _2newUrl.length; n++) {
          if (_2newUrl[n].includes("page=")) {
            newUrl = _2newUrl
              .slice(0, n)
              .concat(_2newUrl.slice(n + 1))
              .join("&");
          }
        }
      }
      window.location.href = newUrl;
    }
  }
}

//關鍵字搜尋
for (let k = 0; k < document.querySelectorAll(".search button").length; k++) {
  document
    .querySelectorAll(".search button")
    [k].addEventListener("click", function () {
      keywordSearch(k);
    });
  // Execute a function when the user presses a key on the keyboard
  document
    .querySelectorAll(".keyword")
    [k].addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        // If the user presses the "Enter" key on the keyboard
        event.preventDefault(); // Cancel the default action, if needed
        keywordSearch(k); // Trigger the button element with a click
      }
    });
}

//搜尋欄中出現輸入的關鍵字
if (current_url.includes("keyword=")) {
  //先前有輸入過關鍵字
  let arr = current_url.split("&");
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].includes("keyword=")) {
      for (let k = 0; k < document.querySelectorAll(".keyword").length; k++) {
        document.querySelectorAll(".keyword")[k].value = decodeURI(
          arr[i].replace("keyword=", "")
        );
      }
    }
  }
}

//通知鈴鐺scroll 桌機
document
  .querySelector(".noticeBlock .rowbox")
  .addEventListener("scroll", function () {
    let ajaxHeight = this.scrollHeight;
    let deviseHeight = this.offsetHeight;
    let scrollable = ajaxHeight - deviseHeight;
    let scrolled = this.scrollTop;
    if (scrolled + 10 >= scrollable) {
      if (notice_nextPage) {
        if (noticePage_record.includes(notice_nextPage)) {
        } else {
          noticePage_record.push(notice_nextPage);
          //載入留言
          noticeLoad();
          setTimeout("getNotice(notice_nextPage)", 500);
        }
      }
    }
  });

//通知鈴鐺scroll 手機
document.querySelector(".modal11").addEventListener("scroll", function () {
  let ajaxHeight = this.scrollHeight;
  let deviseHeight = screen.height;
  let scrollable = ajaxHeight - deviseHeight;
  let scrolled = this.scrollTop;
  if (scrolled + 10 >= scrollable) {
    if (notice_nextPage) {
      if (noticePage_record.includes(notice_nextPage)) {
      } else {
        noticePage_record.push(notice_nextPage);
        //載入留言
        noticeLoad();
        setTimeout("getNotice(notice_nextPage)", 500);
      }
    }
  }
});

//close modall11
document
  .querySelector(".modal11 span:nth-child(2)")
  .addEventListener("click", function () {
    document.querySelector(".modal11").style.display = "none";
    document.body.classList.remove("noscroll");
  });

// 通知留言等待載入圖示
function noticeLoad() {
  let noticeLoad = document.createElement("div");
  noticeLoad.className = "load";
  let imgDiv = document.createElement("div");

  let img = document.createElement("img");
  img.src =
    "https://d3i2i3wop7mzlm.cloudfront.net/meetgather/html/circleYellowLoader.gif";
  imgDiv.appendChild(img);
  noticeLoad.appendChild(imgDiv);
  if (screen.width > 780) {
    document
      .querySelector(".noticeBlock .rowbox .tail")
      .appendChild(noticeLoad);
  } else {
    document.querySelector(".modal11 ._2tail .rowbox").appendChild(noticeLoad);
  }
}

//點擊通知的每一行row
for (let r = 0; r < document.querySelectorAll(".rowbox row").length; r++) {
  document
    .querySelectorAll(".rowbox row")
    [r].addEventListener("click", function (e) {
      e.stopPropagation();
    });
}

function padZero(num) {
  let strnum = num.toString();
  if (strnum.length === 1) {
    strnum = "0" + strnum;
  }
  return strnum;
}

function toGmt8TmStr(tm) {
  let Gmt8TmStr = new Date(tm).toLocaleString("en-US", {
    timeZone: "Asia/Taipei",
  });

  let loY = Gmt8TmStr.split(",")[0].split("/")[2],
    loM = Gmt8TmStr.split(",")[0].split("/")[0],
    loD = Gmt8TmStr.split(",")[0].split("/")[1];
  let loH = parseInt(Gmt8TmStr.split(",")[1].split(":")[0]),
    lom = Gmt8TmStr.split(",")[1].split(":")[1];
  let _12hour = Gmt8TmStr.split(" ")[2];
  if (_12hour === "PM" && loH < 12) {
    loH += 12;
  } else if (_12hour === "AM" && loH === 12) {
    loH = "00";
  }
  return `${loY}-${padZero(loM)}-${padZero(loD)}T${padZero(loH)}:${padZero(
    lom
  )}:00`;
}

// 數字千分位
function numberComma(num) {
  // num is integer.
  return num
    .toLocaleString("ja-JP", {
      style: "currency",
      currency: "JPY",
    })
    .slice(1);
}
