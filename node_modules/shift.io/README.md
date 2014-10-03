# uxFramework

uxFramework 가이드

1. 설치
 
  1.1. 의존성
    본 모듈은 다음 모듈에 대한 의존성을 갖습니다:
    - socket.io (0.9.14)
    - socket.io-client (0.9.11)
    - express (3.1.0)
    - connect (2.7.4)
    - cookie (0.0.6)
    - jQuery (1.7 이상)

  1.2. 설치
    - node.js 프로젝트 내 node_modules 디렉토리 아래 본 uxFramework 를 복사(npm 설치는 추후 지원)
      ex) /path/of/your/project/node_modules/uxFramework


2. 사용
  2.1. 서버
    2.2.1. 필수 사항
       sessionStore, sessionKey를 반드시 선언해야합니다.
       express의 미들웨어로 cookieParser와 세션을 사용해야합니다.
       자세한 사항은 2.2.3 기본 예제를 참고하십시오.

    2.2.2. 사용
       require('uxFramework').listen() 함수로 서버를 구동시킵니다. 파라미터로는 express app, 서비스 포트 번호, 세션스토어, 세션키가 필요합니다.
       자세한 사항은 2.2.3 기본 예제를 참고하십시오.       
       ex) require('uxFramework').listen(app, 9999, sessionStore, sessionKey);

    2.2.3. server.js 기본 예제
---------------------------------------------
     var 
	port = +process.argv[2] || 8080,
	express = require('express'),
	sessionStore = new express.session.MemoryStore(),
	secrets = "secret",
	sessionKey = 'express.sid',
	app = express()
    ;

    app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ key: sessionKey, store:sessionStore, secret:secrets}));

    });

    app.get(/(^\/.*$)/, function(request, response) {
        var fileName = request.params[0];
        if (fileName == '/')
            fileName = '/index.html';
        response.sendfile(__dirname + '/client' + fileName);
    });
	 	
var io = require('uxFramework').listen(app, 9999, sessionStore, sessionKey);
---------------------------------------------------

  2.2. 클라이언트
    2.2.1. import
      다음 모듈은 html 문서 내에 반드시 포함되어야 합니다:
      - socket.io.js
      - jquery.js
      - jquery-ui.js  
      ex) <script type="text/javascript" src="socket.io/socket.io.js"></script>
          <script type="text/javascript" src="jquery/jquery.js"></script>
          <script type="text/javascript" src="jquery/jquery-ui/jquery-ui.js"></script>

     uxFramework/lib 디렉토리 안의 uxFramework.js 파일을 client 측에 복사한 후, import 합니다.
     ex) <script type="text/javascript" src="uxframework.js" ></script>

    2.2.1.1 모바일 클라이언트
      모바일 클라이언트는 다음 모듈을 추가적으로 더 포함시켜야 합니다:
      - jquery.mobile.js
      - jquery.ui.touch-punch.js  => 터치를 통한 드래그
      ex) 모바일 클라이언트의 모듈 포함 구문
         <script type="text/javascript" src="../socket.io/socket.io.js"></script>
         <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
         <script src="http://code.jquery.com/ui/1.10.2/jquery-ui.js"></script>
         <script type="text/javascript" src="jquery.ui.touch-punch.min.js"></script>
         <script src="http://code.jquery.com/mobile/1.3.1/jquery.mobile-1.3.1.min.js"></script>
  	 <script type="text/javascript" src="../uxframework.js"></script>

       *주의 : jquery.ui.touch-punch.js 모듈을 포함시키면 모바일 장치에서 터치를 이용한 스크롤링이 불가능해집니다!
 

    2.2.2. 이동시킬 객체
      이동시킬 객체에는 class로 "transferrable"을 주며, 반드시 중복되지 않은 ID를 부여해야합니다.
      객체 내 태그에는 id 또는 class를 주지 않아도 됩니다.
      ex) <div id="movable_contents1" class="transferrable">
	  	<canvas id="board" width="600px" height="300px"></canvas>
          </div>

    2.2.3. 사용자 대시보드
      사용자 대시보드로 쓸 객체(div 추천)은 ID로 "user_list"를 주어야합니다.
      ex) <div id="user_list"> </div>

    2.2.4. 송신자 전송 후처리 이벤트 리스너
       이동시킬 객체("transferrable" class)의 sender_event 속성에 원하는 함수를 기술하면, 이벤트 후 해당 함수를 실행합니다.
       
       ex) 전송 후 전송한 객체(movable_contents2)를 삭제하는 함수
       //함수
       <script type="text/javascript">
					
 	var senderfunc = function(){
		$("#movable_contents2").remove();
	}
					
	</script>

        //객체 서술
        <iframe width="560" height="315" id="movable_contents2" class="transferrable" sender_event="senderfunc()" src="http://www.youtube.com/embed/9bZkp7q19f0" frameborder="0" allowfullscreen></iframe> 

    2.2.5. 수신자 수신 후처리 이벤트 리스너
       이동시킬 객체("transferrable" class)의 receiver_event 속성에 원하는 함수를 기술하면, 수신자가 해당 함수를 전달받아 실행하게 됩니다.
       수신자 함수는 obj 변수를 통해 해당 객체에 접근할 수 있습니다. 수신자 함수에는 이동시키는 객체에 대해서만 다루어야합니다.(보안 이슈)
       
       ex) 수신한 객체(Youtube)를 자동 재생하는 함수
	<script type="text/javascript">
		var receiverfunc = function(obj){
						
		youtube_videos[obj["id"]].addEventListener('onReady', function(){
                	youtube_videos[obj["id"]].playVideo();		                 
			});
		}				
	</script>

       <iframe width="560" height="315" id="movable_contents2" class="transferrable" receiver_event="receiverfunc" src="http://www.youtube.com/embed/9bZkp7q19f0" frameborder="0" allowfullscreen></iframe>


    2.2.6 YouTube 객체
	수신자 함수에서 전달받은 Youtube 객체에 접근하기 위해서는, uxFramework 내부 배열인 youtube_videos를 통해 접근할 수 있습니다.
        전달받은 객체 자체에 접근하기 위해서는 youtube_videos[obj["id"]] 와 같은 방식으로 접근합니다.
        uxFramework는 기본적으로 YouTube API를 포함하므로, 위의 접근을 통해 YouTube 객체를 제어할 수 있습니다.

			
3. Contact
 - 안상홍(ancom21c@kaist.ac.kr)

4. 수정 내역
 v0.2.0
 - Added: 송신자 전송 후처리 이벤트, 수신자 수신 후처리 이벤트 리스너
 - Added: 세션 유지
 - Added: 모바일 클라이언트 구현 시 가이드라인
 - Fixed: jQuery 1.9 이상에서 객체 수신 시 오류


Created with [Nodeclipse v0.3](https://github.com/Nodeclipse/nodeclipse-1)   
