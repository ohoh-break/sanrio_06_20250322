/* game.js */

(function() {
  "use strict";

  // -----------------------------
  // 전역 DOM 요소 및 기본 설정
  // -----------------------------
  const startScreen = document.getElementById("startScreen");
  const startButton = document.getElementById("startButton");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const gameOverText = document.getElementById("gameOverText");
  const scoreText = document.getElementById("scoreText");

  // 화면 크기를 기기 창 크기에 맞춤
  let SCREEN_WIDTH = window.innerWidth;
  let SCREEN_HEIGHT = window.innerHeight;
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  // 바닥 높이/위치
  const FLOOR_HEIGHT = 80;
  let FLOOR_TOP = SCREEN_HEIGHT - FLOOR_HEIGHT;

  // -----------------------------
  // 게임 상태 관련 변수
  // -----------------------------
  let isGameRunning = false;  // START 버튼 누른 후에만 게임 진행
  let gameOver = false;
  let gameWon = false;        // 점수 100 달성 시 true

  // -----------------------------
  // 캐릭터: 시나몬롤
  // -----------------------------
  const cinnamorollImg = new Image();
  cinnamorollImg.src = "cinnamoroll.png";

  let cinnamorollWidth = 64;
  let cinnamorollHeight = 64;
  let cinnamorollX = 50;
  let cinnamorollY = FLOOR_TOP - cinnamorollHeight;

  // 점프 관련
  let isJumping = false;
  let jumpPower = 15;
  let gravity = 0.8;
  let velocityY = 0;

  // -----------------------------
  // 점수: 괴물을 '넘어갔을' 때 획득
  // -----------------------------
  let score = 0;

  // -----------------------------
  // 괴물(장애물) 2종: mushroom / wing
  // -----------------------------
  const monsterImg1 = new Image();
  monsterImg1.src = "mushroom.png";
  const monsterImg2 = new Image();
  monsterImg2.src = "wing.png";

  // 괴물 목록 (mushroom, wing) 중 랜덤 출현
  const monsterImages = [monsterImg1, monsterImg2];

  let monsters = [];
  let monsterWidth = 32;
  let monsterHeight = 32;
  let monsterSpeed = 6;

  // 스폰(등장) 관련
  let spawnTimer = 0;
  let nextSpawnInterval = 90;    // 최초 일정값
  const minSpawnInterval = 60;
  const maxSpawnInterval = 120;

  // -----------------------------
  // 구름(장식용)
  // -----------------------------
  let clouds = [];
  let cloudTimer = 0;
  let cloudSpawnInterval = 120;

  // -----------------------------
  // 게임 메인 루프
  // -----------------------------
  function gameLoop() {
    if (!isGameRunning) return; // START 전이면 진행 X

    // 승리(100점)나 게임오버면 더 이상 업데이트 안 함
    if (!gameOver && !gameWon) {
      update();
    }
    draw();

    if (!gameOver && !gameWon) {
      requestAnimationFrame(gameLoop);
    }
  }

  // -----------------------------
  // 게임 업데이트 로직
  // -----------------------------
  function update() {
    // 점프 처리
    if (isJumping) {
      cinnamorollY += velocityY;
      velocityY += gravity;
      if (cinnamorollY >= FLOOR_TOP - cinnamorollHeight) {
        cinnamorollY = FLOOR_TOP - cinnamorollHeight;
        isJumping = false;
      }
    }

    // 괴물 스폰 (랜덤 간격)
    spawnTimer++;
    if (spawnTimer >= nextSpawnInterval) {
      spawnTimer = 0;
      nextSpawnInterval = getRandomInt(minSpawnInterval, maxSpawnInterval);

      // 랜덤으로 mushroom / wing 중 하나 택
      let randIndex = getRandomInt(0, monsterImages.length - 1);
      monsters.push({
        x: SCREEN_WIDTH,
        y: FLOOR_TOP - monsterHeight,
        width: monsterWidth,
        height: monsterHeight,
        image: monsterImages[randIndex],
        scored: false  // 점수 획득 여부 (중복 방지)
      });
    }

    // 괴물 이동 + 충돌 + 점수 처리
    monsters.forEach((monster) => {
      monster.x -= monsterSpeed;

      // (1) 충돌 판정
      if (checkCollision(
          cinnamorollX, cinnamorollY, cinnamorollWidth, cinnamorollHeight,
          monster.x, monster.y, monster.width, monster.height
        )) {
        gameOver = true;
      }

      // (2) 괴물 뒤로 지나감 => 점수 +1
      //     "점수를 괴물 넘었을 때만" => 괴물이 캐릭터보다 왼쪽으로 완전히 지나간 경우
      if (!monster.scored && (monster.x + monster.width < cinnamorollX)) {
        monster.scored = true;
        score++;
        updateScore();
      }
    });

    // 화면 밖으로 벗어난 괴물 제거
    monsters = monsters.filter(m => m.x > -m.width);

    // 구름 스폰
    cloudTimer++;
    if (cloudTimer >= cloudSpawnInterval) {
      cloudTimer = 0;
      let cloudY = 20 + Math.random() * (SCREEN_HEIGHT / 3);
      let cloudSize = 20 + Math.random() * 30; 
      let cloudSpeed = 1 + Math.random() * 1.5;
      clouds.push({
        x: SCREEN_WIDTH,
        y: cloudY,
        size: cloudSize,
        speed: cloudSpeed
      });
    }
    // 구름 이동 + 화면 밖 제거
    clouds.forEach(c => c.x -= c.speed);
    clouds = clouds.filter(c => c.x > -200);

    // 100점 달성 시 게임 승리 -> 흰 화면에 축하 메시지
    if (score >= 100) {
      gameWon = true;
    }
  }

  // -----------------------------
  // 점수 업데이트 표시
  // -----------------------------
  function updateScore() {
    scoreText.textContent = "점수: " + score;
  }

  // -----------------------------
  // 그림(렌더링)
  // -----------------------------
  function draw() {
    // 우선 매 프레임 캔버스 지움
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 만약 승리했다면(점수 100 이상)
    if (gameWon) {
      // 흰 화면 전환 + 문구
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      ctx.fillStyle = "#000000";
      ctx.font = "48px sans-serif";
      ctx.fillText("축하해요! 100달성", SCREEN_WIDTH/2 - 150, SCREEN_HEIGHT/2);
      return; // 여기서 그리기 종료 (게임 끝)
    }

    // 바닥(갈색)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, FLOOR_TOP, SCREEN_WIDTH, FLOOR_HEIGHT);

    // 구름 그리기
    clouds.forEach(drawCloud);

    // 캐릭터(시나몬롤)
    ctx.drawImage(cinnamorollImg, cinnamorollX, cinnamorollY, cinnamorollWidth, cinnamorollHeight);

    // 괴물
    monsters.forEach(mon => {
      ctx.drawImage(mon.image, mon.x, mon.y, mon.width, mon.height);
    });

    // 게임 오버 상태면 문구 표시
    if (gameOver) {
      gameOverText.style.display = "block";
    }
  }

  // -----------------------------
  // 구름 그리기 (조금 더 사실적인 모양)
  // -----------------------------
  function drawCloud(cloudObj) {
    ctx.fillStyle = "#FFFFFF";
    let cx = cloudObj.x;
    let cy = cloudObj.y;
    let size = cloudObj.size;

    // 여러 겹의 원을 겹쳐 구름 모양 표현
    // 중앙
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    // 왼쪽
    ctx.beginPath();
    ctx.arc(cx - size * 0.6, cy + size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 오른쪽
    ctx.beginPath();
    ctx.arc(cx + size * 0.6, cy + size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 위쪽(작게)
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.4, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // -----------------------------
  // 충돌 판정 (사각형)
  // -----------------------------
  function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  // -----------------------------
  // 유틸: 랜덤 정수 (min ~ max)
  // -----------------------------
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // -----------------------------
  // 점프 로직
  // -----------------------------
  function doJump() {
    if (!isJumping) {
      isJumping = true;
      velocityY = -jumpPower;
    }
  }

  // -----------------------------
  // 이벤트 핸들러(키, 마우스, 터치)
  // -----------------------------
  document.addEventListener("keydown", function(e) {
    if (e.code === "Space" && !gameOver && !gameWon && isGameRunning) {
      doJump();
    }
  });

  document.addEventListener("mousedown", function() {
    if (!gameOver && !gameWon && isGameRunning) {
      doJump();
    }
  });

  document.addEventListener("touchstart", function() {
    if (!gameOver && !gameWon && isGameRunning) {
      doJump();
    }
  });

  // -----------------------------
  // 창 크기 변경 -> 캔버스 재설정
  // -----------------------------
  window.addEventListener("resize", onResize);
  function onResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    FLOOR_TOP = SCREEN_HEIGHT - FLOOR_HEIGHT;

    if (!isJumping) {
      cinnamorollY = FLOOR_TOP - cinnamorollHeight;
    }
  }

  // -----------------------------
  // START 버튼 -> 게임 시작
  // -----------------------------
  startButton.addEventListener("click", function() {
    startScreen.style.display = "none";  // 시작 화면 숨김
    isGameRunning = true;               // 게임 실행 상태
    gameLoop();                         // 메인 루프 시작
  });

})();
