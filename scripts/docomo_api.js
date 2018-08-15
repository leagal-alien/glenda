require('date-utils');

var DOCOMO_API_KEY = '49464d53764c5374546b70634d64383645612e665244376b79462e4d4e32674b446a6e6f574a394f6e6433';
var registUserUrl = "https://api.apigw.smt.docomo.ne.jp/naturalChatting/v1/registration?APIKEY=" + DOCOMO_API_KEY;
var appRecvTime;

var getTimeDiffAsMinutes;
getTimeDiffAsMinutes = function(old_msec) {
  var diff_minutes, diff_msec, now, old;
  now = new Date();
  old = new Date(old_msec);
  diff_msec = now.getTime() - old.getTime();
  diff_minutes = parseInt(diff_msec / (60 * 1000), 10);
  return diff_minutes;
};

var appId;

var userAppId;
userAppId = function () {
  var request = require('sync-request');
  var res = request('POST', registUserUrl, {
    headers: {
      "Content-type": "application/json",
    },
    json: {
      botId: "Chatting",
      appKind: "slack-glenda"
    }
  });
  ret_json = JSON.parse(res.getBody('utf8'));
  return ret_json.appId;
};

module.exports = function(robot) {
  return robot.respond(/(\S+)/i, function(msg) {
    var KEY_DOCOMO_CONTEXT, KEY_DOCOMO_CONTEXT_TTL, TTL_MINUTES, context, diff_minutes, message, old_msec, request, url, url_1, url_2, user_name;
    //message = msg.match[1];
    message = msg.message.rawText;

    if (!(DOCOMO_API_KEY && message)) {
      return;
    }
    KEY_DOCOMO_CONTEXT = 'docomo-talk-context';
    context = robot.brain.get(KEY_DOCOMO_CONTEXT || '');
    KEY_DOCOMO_CONTEXT_TTL = 'docomo-talk-context-ttl';
    TTL_MINUTES = 20;
    old_msec = robot.brain.get(KEY_DOCOMO_CONTEXT_TTL);
    diff_minutes = getTimeDiffAsMinutes(old_msec);
    if (diff_minutes > TTL_MINUTES) {
      context = '';
    }
    // 雑談
    url_1 = 'https://api.apigw.smt.docomo.ne.jp/naturalChatting/v1/dialogue?APIKEY=';
    // 
    // TODO input が検索： だったら、URL を変えて知識検索へ
    url_2 = 'https://api.apigw.smt.docomo.ne.jp/naturalKnowledge/v1/dialogue?APIKEY=' + DOCOMO_API_KEY;

//console.log(msg);
//console.log(message);
//console.log(robot.name);

    var dt = new Date();
    dt.setHours(dt.getHours() + 9);
    if (!appId) {
      appId = userAppId();
    }
    if (!appRecvTime) {
      appRecvTime = new Date(dt).toFormat('YYYY-MM-DD HH24:MI:SS');
    }
//console.log(dt);
    request = require('request');
      url = url_1 + DOCOMO_API_KEY;
      user_name = msg.message.user.name;
//console.log(msg.message.rawText);
//console.log(message);
// TODO mode でsrtr を指定すると、しりとりができるらしい。 
      return request.post({
        url: url,
        headers: {
          "Content-type": "application/json",
        },
        json: {
          language: 'ja-JP',
          botId: 'Chatting',
          appId: appId,
          voiceText: message,
          clientData: {
            option: {
              nickname: 'hiro',
              nicknameY: 'ヒロ',
              t: 'kansai',
              age: '31',
              sex: '女',
              place: '東京',
              mode: 'dialog'
            }
          },
          appRecvTime: appRecvTime,
          appSendTime: new Date(dt).toFormat('YYYY-MM-DD HH24:MI:SS')
        }
      }, function(err, response, body) {
//console.log(body);
//console.log(err);
//console.log(response);
        var now_msec;
        robot.brain.set(KEY_DOCOMO_CONTEXT, body.context);
        now_msec = new Date().getTime();
        robot.brain.set(KEY_DOCOMO_CONTEXT_TTL, now_msec);
        appRecvTime = body.serverSendTime;
        return msg.send(body.systemText.utterance);
      });
  });
};

// ---

